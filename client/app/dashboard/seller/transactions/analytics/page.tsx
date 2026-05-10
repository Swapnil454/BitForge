"use client";

import { useEffect, useState, useMemo } from "react";
import { BarChart3, TrendingUp, Activity, Percent, Briefcase, Wallet } from "lucide-react";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";

import PageHeader from "../../../buyer/transactions/components/PageHeader";
import { motion } from "framer-motion";

interface SellerTransaction {
  saleAmount: number;
  platformFee: number;
  gstOnFee: number;
  netAmount: number;
  status: "completed" | "pending" | "cancelled";
}

export default function TransactionAnalyticsPage() {
  const [transactions, setTransactions] = useState<SellerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await sellerAPI.getTransactions();
        setTransactions(data.transactions || []);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const stats = useMemo(() => {
    const completed = transactions.filter(t => t.status === "completed");
    return {
      total: transactions.length,
      revenue: completed.reduce((s, t) => s + t.saleAmount, 0),
      fee: completed.reduce((s, t) => s + t.platformFee, 0),
      gst: completed.reduce((s, t) => s + t.gstOnFee, 0),
      earned: completed.reduce((s, t) => s + t.netAmount, 0),
    };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/seller/transactions"
        backLabel="Transactions"
        title="Analytics Overview"
        subtitle="Your complete sales and revenue breakdown"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6 text-slate-700 dark:text-white/80">
          <BarChart3 className="h-5 w-5 text-cyan-300" />
          <span className="text-sm font-medium">Performance summary</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse border border-slate-200 dark:border-white/5" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Hero Card: Net Earned */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="rounded-3xl border border-indigo-500/20 bg-white dark:bg-[#12141c] p-6 sm:p-10 shadow-2xl relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-inner">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-sm uppercase tracking-widest text-indigo-600 dark:text-indigo-200/90 font-bold">Total Net Earned</p>
                </div>
                <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 dark:from-white dark:via-indigo-100 dark:to-indigo-300 tracking-tight">
                  ₹{stats.earned.toLocaleString()}
                </h1>
                <p className="text-slate-500 dark:text-indigo-200/60 mt-4 text-sm max-w-sm leading-relaxed">
                  Your total take-home revenue after deducting all platform fees and applicable taxes.
                </p>
              </div>
            </motion.div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#12141c] p-6 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 relative z-10">
                  <Briefcase className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/50 mb-1 font-semibold relative z-10">Total Transactions</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-50 transition-colors relative z-10">{stats.total}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#12141c] p-6 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 relative z-10">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/50 mb-1 font-semibold relative z-10">Gross Revenue</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-50 transition-colors relative z-10">₹{stats.revenue.toLocaleString()}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#12141c] p-6 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 relative z-10">
                  <Activity className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/50 mb-1 font-semibold relative z-10">Platform Fees</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-50 transition-colors relative z-10">₹{stats.fee.toLocaleString()}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#12141c] p-6 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 relative z-10">
                  <Percent className="w-5 h-5 text-rose-400" />
                </div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/50 mb-1 font-semibold relative z-10">GST on Fees</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-50 transition-colors relative z-10">₹{stats.gst.toLocaleString()}</p>
              </motion.div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
