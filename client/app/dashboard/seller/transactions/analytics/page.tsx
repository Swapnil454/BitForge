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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_48%,#eef2f7_100%)] dark:bg-[linear-gradient(180deg,#05070c_0%,#0a1220_48%,#05070c_100%)] text-slate-900 dark:text-white pb-20">
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
              className="rounded-3xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] dark:bg-[linear-gradient(135deg,#3730a3_0%,#5b21b6_100%)] p-6 sm:p-10 shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-900/20 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl z-0" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-2xl bg-white/20 text-white shadow-inner backdrop-blur-md">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-sm uppercase tracking-widest text-indigo-100 font-bold">Total Net Earned</p>
                </div>
                <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight drop-shadow-md mt-2">
                  ₹{stats.earned.toLocaleString()}
                </h1>
                <p className="text-indigo-100 mt-4 text-sm max-w-sm leading-relaxed opacity-90">
                  Your total take-home revenue after deducting all platform fees and applicable taxes.
                </p>
              </div>
            </motion.div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl sm:rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group hover:bg-white dark:hover:bg-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-3 sm:mb-4 relative z-10 shrink-0">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 font-bold relative z-10">Total Sales</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors relative z-10">{stats.total}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl sm:rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group hover:bg-white dark:hover:bg-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 sm:mb-4 relative z-10 shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 font-bold relative z-10">Gross Rev</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors relative z-10 truncate">₹{stats.revenue.toLocaleString()}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl sm:rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group hover:bg-white dark:hover:bg-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3 sm:mb-4 relative z-10 shrink-0">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 font-bold relative z-10">Platform Fee</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors relative z-10 truncate">₹{stats.fee.toLocaleString()}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl sm:rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group hover:bg-white dark:hover:bg-white/5 hover:border-rose-500/30 transition-all flex flex-col justify-between"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-3 sm:mb-4 relative z-10 shrink-0">
                  <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 font-bold relative z-10">GST on Fee</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors relative z-10 truncate">₹{stats.gst.toLocaleString()}</p>
                </div>
              </motion.div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
