"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { buyerAPI } from "@/lib/api";
import PageHeader from "../../transactions/components/PageHeader";

export default function AllOrdersAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalSpent: 0, total: 0, successful: 0 });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await buyerAPI.getAllTransactions({
          page: 1,
          limit: 1,
        });
        if (data?.summary) {
          setSummary(data.summary);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/buyer/orders"
        backLabel="All Orders"
        title="Order Analytics"
        subtitle="Insights and summaries for your purchases"
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 animate-pulse shadow-sm">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded-lg mb-2" />
                  <div className="h-8 w-32 bg-slate-200 dark:bg-white/10 rounded-lg" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-500/30 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow">
                <p className="text-slate-500 dark:text-white/60 text-sm font-medium">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {summary.total || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow">
                <p className="text-slate-500 dark:text-white/60 text-sm font-medium">Total Spent</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  ₹{summary.totalSpent ? summary.totalSpent.toLocaleString() : 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow">
                <p className="text-slate-500 dark:text-white/60 text-sm font-medium">Avg Order</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  ₹{summary.total && summary.totalSpent ? Math.round(summary.totalSpent / summary.total).toLocaleString() : 0}
                </p>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
