'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buyerAPI } from '@/lib/api';
import { Loader } from 'lucide-react';

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

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await buyerAPI.getAllTransactions();
      // Handle both array and object responses
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

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-slate-900 to-slate-800 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">📋</span>
          <div>
            <h1 className="text-4xl font-bold text-white">All Orders</h1>
            <p className="text-white/60">View and manage all your purchases</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <span className="text-white/60">Sort by:</span>
          <div className="flex gap-2">
            {(['newest', 'oldest', 'highest', 'lowest'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  sortBy === option
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {option === 'newest'
                  ? '🕐 Newest'
                  : option === 'oldest'
                  ? '📅 Oldest'
                  : option === 'highest'
                  ? '📈 Highest'
                  : '📉 Lowest'}
              </button>
            ))}
          </div>
        </div>
        <Link
          href="/dashboard/buyer"
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition border border-white/20"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mb-4" />
          <p className="text-white/60 text-lg">Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <p className="text-red-400 text-lg">{error}</p>
          <button
            onClick={fetchAllOrders}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
          >
            Try Again
          </button>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
          <p className="text-white/60 text-lg mb-2">No orders found</p>
          <p className="text-white/40">Start shopping to see your orders here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Header - Desktop */}
          <div className="hidden md:grid md:grid-cols-6 gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm font-semibold sticky top-0 z-10">
            <div>Product</div>
            <div>Amount</div>
            <div>Date</div>
            <div>Status</div>
            <div>Seller</div>
            <div>Action</div>
          </div>

          {/* Orders List */}
          {sortedOrders.map((order) => (
            <div
              key={order._id || order.id}
              className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg p-6 transition"
            >
              {/* Mobile View */}
              <div className="md:hidden space-y-3 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-semibold text-lg">{order.product}</p>
                    <p className="text-white/60 text-sm mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-400">₹{order.amount.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <div className="text-sm">
                    <p className="text-white/60">Seller</p>
                    <p className="text-white">{order.sellerName || 'Unknown'}</p>
                  </div>
                  <Link
                    href={`/dashboard/buyer/transactions/${order._id || order.id}`}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm"
                  >
                    View
                  </Link>
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden md:grid md:grid-cols-6 gap-4 items-center">
                <div>
                  <p className="text-white font-semibold">{order.product}</p>
                  <p className="text-white/40 text-xs mt-1">ID: {order._id || order.id}</p>
                </div>
                <div className="text-lg font-bold text-green-400">₹{order.amount.toLocaleString()}</div>
                <div className="text-white/70 text-sm">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                    ✅ Completed
                  </span>
                </div>
                <div className="text-white/70">{order.sellerName || 'Unknown'}</div>
                <Link
                  href={`/dashboard/buyer/transactions/${order._id || order.id}`}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-white/60 mb-2">Total Orders</p>
              <p className="text-4xl font-bold text-purple-400">{sortedOrders.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-white/60 mb-2">Total Spent</p>
              <p className="text-4xl font-bold text-green-400">
                ₹{sortedOrders.reduce((sum, order) => sum + order.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-white/60 mb-2">Average Order</p>
              <p className="text-4xl font-bold text-blue-400">
                ₹{Math.round(
                  sortedOrders.reduce((sum, order) => sum + order.amount, 0) / sortedOrders.length
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
