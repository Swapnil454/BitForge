"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, BarChart3, Wallet } from "lucide-react";

type AdminSummary = {
  total: number;
  buyerPayments: number;
  sellerPayouts: number;
  totalAmount: number;
};

type AdminAnalyticsStatsGridProps = {
  summary: AdminSummary;
  loading: boolean;
};

export default function AdminAnalyticsStatsGrid({ summary, loading }: AdminAnalyticsStatsGridProps) {

  const cards = [
    {
      title: "Total Transactions",
      value: summary.total.toLocaleString(),
      icon: <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-200" />,
      className: "from-indigo-500/20 to-blue-500/20 border-indigo-400/30",
      valueClass: "text-slate-900 dark:text-white",
    },
    {
      title: "Buyer Payments",
      value: summary.buyerPayments.toLocaleString(),
      icon: <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-200" />,
      className: "from-emerald-500/20 to-green-500/20 border-emerald-400/30",
      valueClass: "text-emerald-700 dark:text-emerald-300",
    },
    {
      title: "Seller Payouts",
      value: summary.sellerPayouts.toLocaleString(),
      icon: <ArrowUpRight className="h-5 w-5 text-amber-600 dark:text-amber-200" />,
      className: "from-amber-500/20 to-yellow-500/20 border-amber-400/30",
      valueClass: "text-amber-700 dark:text-amber-300",
    },
    {
      title: "Total Volume",
      value: `₹${summary.totalAmount.toLocaleString()}`,
      icon: <Wallet className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-200" />,
      className: "from-fuchsia-500/20 to-purple-500/20 border-fuchsia-400/30",
      valueClass: "text-slate-900 dark:text-white",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-900/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`rounded-2xl border bg-linear-to-br p-4 sm:p-5 ${card.className}`}
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-white/10 border border-slate-300 dark:border-white/15">
            {card.icon}
          </div>
          <p className="text-slate-600 dark:text-white/65 text-[11px] sm:text-xs uppercase tracking-wider font-semibold mt-3">{card.title}</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 ${card.valueClass}`}>{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
