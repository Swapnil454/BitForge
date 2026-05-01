"use client";

import { motion } from "framer-motion";
import { CircleCheck, CircleX, Clock3, Wallet } from "lucide-react";

type Summary = {
  total: number;
  successful: number;
  pending: number;
  failed: number;
  totalSpent: number;
};

type AnalyticsStatsGridProps = {
  summary: Summary;
  loading: boolean;
};

export default function AnalyticsStatsGrid({ summary, loading }: AnalyticsStatsGridProps) {

  const cards = [
    {
      title: "Total Spent",
      value: `₹${summary.totalSpent.toLocaleString()}`,
      icon: <Wallet className="h-5 w-5 text-violet-200" />,
      className: "from-violet-500/20 to-indigo-500/20 border-violet-400/30",
      valueClass: "text-white",
    },
    {
      title: "Successful",
      value: summary.successful.toString(),
      icon: <CircleCheck className="h-5 w-5 text-emerald-200" />,
      className: "from-emerald-500/20 to-green-500/20 border-emerald-400/30",
      valueClass: "text-emerald-300",
    },
    {
      title: "Pending",
      value: summary.pending.toString(),
      icon: <Clock3 className="h-5 w-5 text-amber-200" />,
      className: "from-amber-500/20 to-yellow-500/20 border-amber-400/30",
      valueClass: "text-amber-300",
    },
    {
      title: "Failed",
      value: summary.failed.toString(),
      icon: <CircleX className="h-5 w-5 text-rose-200" />,
      className: "from-rose-500/20 to-red-500/20 border-rose-400/30",
      valueClass: "text-rose-300",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/10 bg-slate-900/50 animate-pulse" />
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
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 border border-white/15">
            {card.icon}
          </div>
          <p className="text-white/65 text-xs sm:text-sm font-medium mt-3">{card.title}</p>
          <p className={`text-2xl sm:text-3xl font-bold mt-1 ${card.valueClass}`}>{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
