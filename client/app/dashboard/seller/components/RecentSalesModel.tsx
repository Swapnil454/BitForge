
"use client";

import { motion } from "framer-motion";

interface RecentSale {
  id: string;
  productName: string;
  amount: number;
  createdAt: string;
}

export default function RecentSalesModal({ sales, onClose, onViewAll }: { sales: RecentSale[]; onClose: () => void; onViewAll: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-linear-to-br from-slate-900 to-slate-800 rounded-lg max-w-2xl w-full p-8 shadow-xl border border-white/10"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span>📊</span> Recent Transactions
        </h2>

        {sales.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-white/60 text-lg">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {sales.slice(0, 2).map((sale, index) => (
              <div
                key={sale.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">
                      <span className="text-purple-400">#{index + 1}.</span> {sale.productName}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {new Date(sale.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">₹{sale.amount.toLocaleString()}</p>
                    <p className="text-xs text-white/60 mt-1">Amount Received</p>
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
            View All Transactions
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

