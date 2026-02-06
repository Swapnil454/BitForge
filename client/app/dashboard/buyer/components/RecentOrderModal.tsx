
"use client";

import { motion } from "framer-motion";

export default function RecentOrdersModal({ 
  orders, 
  onClose, 
  onViewAll 
}: { 
  orders: any[]; 
  onClose: () => void; 
  onViewAll: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-linear-to-br from-slate-900 to-slate-800 rounded-lg max-w-2xl w-full shadow-xl border border-white/10 p-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <span>📋</span> Recent Orders
        </h2>
        <p className="text-white/60 mb-6">Your latest order activity</p>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {orders.slice(0, 2).map((order, index) => (
              <div
                key={order.id}
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      <span className="text-purple-400">Order #{index + 1}.</span> {order.product}
                    </p>
                    <p className="text-sm text-white/60 mt-2">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Date unknown"}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-green-400">₹{order.amount.toLocaleString()}</p>
                    <p className="text-xs text-white/60 mt-1">Order ID: {order.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onViewAll}
            className="flex-1 px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
          >
            View All Orders
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition border border-white/20"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

