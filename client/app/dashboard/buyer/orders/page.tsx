'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buyerAPI } from '@/lib/api';
import PageHeader from '../transactions/components/PageHeader';

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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [summary, setSummary] = useState({ totalSpent: 0, total: 0, successful: 0 });
  const router = useRouter();

  useEffect(() => {
    fetchAllOrders();
  }, [page, sortBy]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await buyerAPI.getAllTransactions({
        page,
        limit: 10,
        sortBy: sortBy as any,
      });
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
      if (data?.pagination) setPagination(data.pagination);
      if (data?.summary) setSummary(data.summary);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Completed',
          bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          borderColor: 'border-emerald-200 dark:border-emerald-500/30',
          dotColor: 'bg-emerald-500 dark:bg-emerald-400',
        };
      case 'failed':
        return {
          label: 'Failed',
          bgColor: 'bg-red-100 dark:bg-red-500/20',
          textColor: 'text-red-700 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-500/30',
          dotColor: 'bg-red-500 dark:bg-red-400',
        };
      case 'created':
        return {
          label: 'Pending',
          bgColor: 'bg-amber-100 dark:bg-amber-500/20',
          textColor: 'text-amber-700 dark:text-amber-400',
          borderColor: 'border-amber-200 dark:border-amber-500/30',
          dotColor: 'bg-amber-500 dark:bg-amber-400',
        };
      default:
        return {
          label: 'Completed',
          bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          borderColor: 'border-emerald-200 dark:border-emerald-500/30',
          dotColor: 'bg-emerald-500 dark:bg-emerald-400',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/buyer"
        title="All Orders"
        subtitle="View and manage all your purchases"
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 sm:gap-4"
        >
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-500/30 rounded-2xl p-4 sm:p-5">
            <p className="text-slate-500 dark:text-white/60 text-xs sm:text-sm font-medium">Total Orders</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {summary.total || 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 sm:p-5">
            <p className="text-slate-500 dark:text-white/60 text-xs sm:text-sm font-medium">Total Spent</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{summary.totalSpent ? summary.totalSpent.toLocaleString() : 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 sm:p-5">
            <p className="text-slate-500 dark:text-white/60 text-xs sm:text-sm font-medium">Avg Order</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              ₹{summary.total && summary.totalSpent ? Math.round(summary.totalSpent / summary.total).toLocaleString() : 0}
            </p>
          </div>
        </motion.div>

        {/* Sort Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-slate-500 dark:text-white/60 text-sm font-medium">Sort by:</span>
            <div className="flex flex-wrap gap-2">
              {(['newest', 'oldest', 'highest', 'lowest'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => { setSortBy(option); setPage(1); }}
                  className={`px-3 sm:px-4 py-2 rounded-xl font-medium text-sm transition-all ${sortBy === option
                    ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
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
                  className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-5 animate-pulse shadow-sm dark:shadow-none"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-48 bg-slate-200 dark:bg-white/10 rounded-lg" />
                      <div className="h-4 w-32 bg-slate-100 dark:bg-white/5 rounded-lg" />
                    </div>
                    <div className="h-7 w-20 bg-slate-200 dark:bg-white/10 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-8 text-center"
            >
              <div className="text-5xl mb-4"></div>
              <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">{error}</p>
              <button
                onClick={fetchAllOrders}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-semibold transition-all hover:scale-105"
              >
                Try Again
              </button>
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm dark:shadow-none"
            >
              <div className="text-6xl mb-4"></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Orders Yet</h3>
              <p className="text-slate-500 dark:text-white/60 mb-6 max-w-md mx-auto">
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
              {orders.map((order, index) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <motion.button
                    key={order._id || order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/dashboard/buyer/transactions/${order._id || order.id}`)}
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 text-left transition-all hover:shadow-md hover:shadow-purple-500/10 dark:hover:shadow-purple-500/10 group shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Product & Status */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors truncate max-w-[200px] sm:max-w-none">
                            {order.product}
                          </h3>
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Seller */}
                        <p className="text-slate-400 dark:text-white/50 text-sm mb-1">
                          Sold by <span className="text-slate-700 dark:text-white/80 font-medium">{order.sellerName || 'Unknown'}</span>
                        </p>

                        {/* Date */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-white/40">
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
                        <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{order.amount.toLocaleString()}
                        </p>
                        <span className="text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform text-sm">
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

        {/* Pagination & Results Count */}
        {!loading && orders.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 dark:text-white/50 text-sm">
              Showing {orders.length} of {pagination.totalRecords} order{pagination.totalRecords !== 1 ? 's' : ''}
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium text-sm min-w-[80px] text-center">
                Page {pagination.page} / {pagination.totalPages}
              </div>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNextPage}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
