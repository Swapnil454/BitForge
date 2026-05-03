'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { buyerAPI } from '@/lib/api';

interface Order {
  _id: string;
  id: string;
  product: string;
  amount: number;
  createdAt: string;
  status?: string;
  sellerName?: string;
  productId?: string;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const router = useRouter();

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await buyerAPI.getAllTransactions();
      const ordersList = Array.isArray(data) ? data : (data?.transactions || []);
      setOrders(ordersList.map((order: any) => ({
        _id: order._id || order.id,
        id: order._id || order.id,
        product: order.productName || order.product,
        amount: order.amount,
        createdAt: order.date || order.createdAt,
        status: order.status,
        sellerName: order.sellerName,
        productId: order.productId
      })));
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.amount - a.amount;
      case 'lowest':
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Completed',
          bgColor: 'bg-emerald-500/20',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
          dotColor: 'bg-emerald-400',
        };
      case 'failed':
        return {
          label: 'Failed',
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/30',
          dotColor: 'bg-red-400',
        };
      case 'created':
        return {
          label: 'Pending',
          bgColor: 'bg-amber-500/20',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/30',
          dotColor: 'bg-amber-400',
        };
      default:
        return {
          label: 'Completed',
          bgColor: 'bg-emerald-500/20',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
          dotColor: 'bg-emerald-400',
        };
    }
  };

  const totalSpent = sortedOrders.reduce((sum, order) => sum + order.amount, 0);
  const avgOrder = sortedOrders.length > 0
    ? Math.round(totalSpent / sortedOrders.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-black via-slate-900 to-black backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard/buyer")}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
              >
                <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
              </button>
              <div className="h-6 w-px bg-white/20 hidden sm:block" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  All Orders
                </h1>
                <p className="text-white/50 text-xs sm:text-sm mt-0.5">
                  View and manage all your purchases
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 sm:gap-4"
        >
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-2xl p-4 sm:p-5">
            <p className="text-white/60 text-xs sm:text-sm font-medium">Total Orders</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-400 mt-1">
              {sortedOrders.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
            <p className="text-white/60 text-xs sm:text-sm font-medium">Total Spent</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400 mt-1">
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-4 sm:p-5">
            <p className="text-white/60 text-xs sm:text-sm font-medium">Avg Order</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400 mt-1">
              ₹{avgOrder.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Sort Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-white/60 text-sm font-medium">Sort by:</span>
            <div className="flex flex-wrap gap-2">
              {(['newest', 'oldest', 'highest', 'lowest'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 sm:px-4 py-2 rounded-xl font-medium text-sm transition-all ${sortBy === option
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {option === 'newest'
                    ? 'Newest'
                    : option === 'oldest'
                      ? 'Oldest'
                      : option === 'highest'
                        ? 'Highest ₹'
                        : 'Lowest ₹'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-5 animate-pulse"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-48 bg-white/10 rounded-lg" />
                      <div className="h-4 w-32 bg-white/5 rounded-lg" />
                    </div>
                    <div className="h-7 w-20 bg-white/10 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center"
            >
              <div className="text-5xl mb-4"></div>
              <p className="text-red-400 text-lg font-semibold mb-2">{error}</p>
              <button
                onClick={fetchAllOrders}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-semibold transition-all hover:scale-105"
              >
                Try Again
              </button>
            </motion.div>
          ) : sortedOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-12 text-center"
            >
              <div className="text-6xl mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">No Orders Yet</h3>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                Start shopping to see your orders here. Browse our marketplace for amazing digital products!
              </p>
              <button
                onClick={() => router.push("/marketplace")}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                Browse Marketplace
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sortedOrders.map((order, index) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <motion.button
                    key={order._id || order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/dashboard/buyer/transactions/${order._id || order.id}`)}
                    className="w-full bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 text-left transition-all hover:shadow-lg hover:shadow-purple-500/10 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Product & Status */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate max-w-[200px] sm:max-w-none">
                            {order.product}
                          </h3>
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Seller */}
                        <p className="text-white/50 text-sm mb-1">
                          Sold by <span className="text-white/80 font-medium">{order.sellerName || 'Unknown'}</span>
                        </p>

                        {/* Date */}
                        <div className="flex items-center gap-3 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline font-mono">ID: {(order._id || order.id).slice(-8)}</span>
                        </div>
                      </div>

                      {/* Amount & Arrow */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                        <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                          ₹{order.amount.toLocaleString()}
                        </p>
                        <span className="text-purple-400 group-hover:translate-x-1 transition-transform text-sm">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Results Count */}
        {!loading && sortedOrders.length > 0 && (
          <p className="text-center text-white/40 text-sm">
            Showing {sortedOrders.length} order{sortedOrders.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>
    </div>
  );
}
