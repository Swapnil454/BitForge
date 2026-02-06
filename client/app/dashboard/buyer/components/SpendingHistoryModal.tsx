"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { buyerAPI, } from "@/lib/api";
import toast from "react-hot-toast";

export default function SpendingHistoryModal({ onClose }: { onClose: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await buyerAPI.getAllTransactions();
      setTransactions(data.transactions || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (orderId: string) => {
    onClose();
    router.push(`/dashboard/buyer/transactions/${orderId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700 border-green-300";
      case "failed":
        return "bg-red-100 text-red-700 border-red-300";
      case "created":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return "✅";
      case "failed":
        return "❌";
      case "created":
        return "⏳";
      default:
        return "📦";
    }
  };

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
        className="bg-linear-to-br from-slate-900 to-slate-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-xl border border-white/10 p-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <span>💳</span> Transaction History
        </h2>
        <p className="text-white/60 mb-6">Click on any transaction to view full details</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">No transactions yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {transactions.map((transaction) => (
              <button
                key={transaction._id}
                onClick={() => handleViewDetails(transaction._id)}
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-white/20 transition text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getStatusIcon(transaction.status)}</span>
                      <h3 className="text-xl font-bold text-white">{transaction.productName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(transaction.status)}`}>
                        {transaction.status === "paid" ? "Success" : transaction.status === "failed" ? "Failed" : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-2">
                      Seller: <span className="text-white font-medium">{transaction.sellerName}</span>
                    </p>
                    <p className="text-sm text-white/60">
                      Date: {new Date(transaction.date).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-3xl font-bold text-white">₹{transaction.amount.toLocaleString()}</p>
                    <p className="text-xs text-white/60 mt-2">Order ID: {transaction.orderId}</p>
                    <p className="text-xs text-purple-400 mt-4 hover:text-purple-300">View Details →</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition border border-white/20"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}