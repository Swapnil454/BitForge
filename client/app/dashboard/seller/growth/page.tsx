"use client";

import { useEffect, useState } from "react";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  IndianRupee,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import PageHeader from "../../buyer/transactions/components/PageHeader";

/* ================= TYPES ================= */

interface MonthlyData {
  month: string;
  revenue: number;
  sales: number;
  growth: number;
}

interface GrowthStats {
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  currentMonthSales: number;
  lastMonthSales: number;
  salesGrowth: number;
  averageOrderValue: number;
  averageOrderValueGrowth: number;
  monthlyData: MonthlyData[];
}

/* ================= HELPERS ================= */

const growthColor = (v: number) =>
  v > 0 ? "text-emerald-400" : v < 0 ? "text-red-400" : "text-white/40";

const growthBg = (v: number) =>
  v > 0
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : v < 0
      ? "bg-red-500/10 border-red-500/20 text-red-400"
      : "bg-white/5 border-white/10 text-white/40";

const GrowthIcon = ({ v }: { v: number }) =>
  v > 0 ? (
    <TrendingUp className="w-3 h-3" />
  ) : v < 0 ? (
    <TrendingDown className="w-3 h-3" />
  ) : (
    <Minus className="w-3 h-3" />
  );

const fmt = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

/* ================= PAGE ================= */

export default function RevenueGrowthPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GrowthStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await sellerAPI.getGrowthAnalytics();
        setData(res);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ─── SKELETON ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white">
        <PageHeader
          backHref="/dashboard/seller"
          backLabel="Dashboard"
          title="Revenue Growth"
          subtitle="Monthly performance, trends & insights"
        />
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-white/5 border border-white/5" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/5" />)}
          </div>
          <div className="h-64 rounded-2xl bg-white/5 border border-white/5" />
          <div className="h-64 rounded-2xl bg-white/5 border border-white/5" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center text-white/40">
        No analytics available
      </div>
    );
  }

  /* ─── INSIGHT banner ─── */
  const insight = (() => {
    if (data.revenueGrowth > 20) return { emoji: "🎉", label: "Excellent Growth", msg: "Revenue increased significantly this month.", border: "border-emerald-500/20", bg: "bg-emerald-500/8" };
    if (data.revenueGrowth > 0) return { emoji: "", label: "Positive Growth", msg: "Revenue is trending upward.", border: "border-cyan-500/20", bg: "bg-cyan-500/8" };
    if (data.revenueGrowth < 0) return { emoji: "", label: "Revenue Decline", msg: "Review pricing or marketing strategy.", border: "border-red-500/20", bg: "bg-red-500/8" };
    return { emoji: "➖", label: "No Change", msg: "No completed sales found for comparison.", border: "border-white/10", bg: "bg-white/5" };
  })();

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* ── HEADER ── */}
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Revenue Growth"
        subtitle="Monthly performance, trends & insights"
      />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* ── HERO KPI ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/8 bg-[#12141c] overflow-hidden shadow-lg"
        >
          {/* Top row: Revenue Growth % + This Month revenue */}
          <div className="flex items-stretch divide-x divide-white/8">
            {/* Left: main KPI */}
            <div className="flex-1 px-5 py-4">
              <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mb-1">Revenue Growth</p>
              <p className={`text-4xl font-black tracking-tight ${growthColor(data.revenueGrowth)}`}>
                {fmt(data.revenueGrowth)}
              </p>
              <p className="text-xs text-white/30 mt-1">vs last month</p>
            </div>
            {/* Right: This month */}
            <div className="px-5 py-4 text-right flex flex-col justify-center min-w-[130px]">
              <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mb-1">This Month</p>
              <p className="text-2xl font-bold text-cyan-300">₹{data.currentMonthRevenue.toLocaleString()}</p>
              <p className="text-xs text-white/30 mt-1">Last: ₹{data.lastMonthRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Bottom row: 3 inline secondary stats */}
          <div className="grid grid-cols-3 divide-x divide-white/8 border-t border-white/8">
            {[
              { label: "Sales Growth", value: fmt(data.salesGrowth), v: data.salesGrowth, icon: ShoppingCart },
              { label: "Avg Order Value", value: `₹${data.averageOrderValue}`, v: 0, icon: IndianRupee, neutral: true },
              { label: "AOV Growth", value: fmt(data.averageOrderValueGrowth), v: data.averageOrderValueGrowth, icon: BarChart3 },
            ].map(({ label, value, v, icon: Icon, neutral }) => (
              <div key={label} className="px-4 py-3 flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-wider text-white/35 font-semibold">{label}</p>
                <div className="flex items-center gap-1.5">
                  {!neutral && (
                    <span className={`inline-flex items-center ${growthColor(v)}`}>
                      <GrowthIcon v={v} />
                    </span>
                  )}
                  <p className={`text-base font-bold ${neutral ? "text-white" : growthColor(v)}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── INSIGHT BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className={`flex items-center gap-3 rounded-xl border ${insight.border} ${insight.bg} px-4 py-3 text-sm`}
        >
          <span className="text-lg leading-none">{insight.emoji}</span>
          <div>
            <span className="font-semibold text-white">{insight.label}:&nbsp;</span>
            <span className="text-white/55">{insight.msg}</span>
          </div>
        </motion.div>

        {/* ── CHARTS: Revenue Trend + Sales Volume ── */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 bg-[#12141c] p-5 shadow-lg"
          >
            <p className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-4">Revenue Trend</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} width={40} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <Tooltip
                  contentStyle={{ background: "#0d0f18", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 12 }}
                  formatter={(v: any) => [`₹${v}`, "Revenue"]}
                />
                <Area dataKey="revenue" stroke="#22d3ee" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="rounded-2xl border border-white/8 bg-[#12141c] p-5 shadow-lg"
          >
            <p className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-4">Sales Volume</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthlyData}>
                <XAxis dataKey="month" stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} width={30} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <Tooltip
                  contentStyle={{ background: "#0d0f18", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 12 }}
                  formatter={(v: any) => [v, "Sales"]}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* ── MONTHLY GROWTH % LINE ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-2xl border border-white/8 bg-[#12141c] p-5 shadow-lg"
        >
          <p className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-4">Monthly Growth %</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthlyData}>
              <XAxis dataKey="month" stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} width={40} />
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <Tooltip
                contentStyle={{ background: "#0d0f18", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 12 }}
                formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "Growth"]}
              />
              <Line dataKey="growth" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ── MONTHLY BREAKDOWN TABLE ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-2xl border border-white/8 bg-[#12141c] overflow-hidden shadow-lg"
        >
          <div className="px-5 py-3.5 border-b border-white/8">
            <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Monthly Breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  {["Month", "Revenue", "Sales", "Avg Order", "Growth"].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 px-4 text-[11px] uppercase tracking-wider font-semibold text-white/35 ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.monthlyData.map((m, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-white/80">{m.month}</td>
                    <td className="py-2.5 px-4 text-right text-white/70">₹{m.revenue.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-white/70">{m.sales}</td>
                    <td className="py-2.5 px-4 text-right text-white/70">₹{m.sales ? Math.round(m.revenue / m.sales).toLocaleString() : 0}</td>
                    <td className={`py-2.5 px-4 text-right font-semibold ${growthColor(m.growth)}`}>
                      {m.growth > 0 ? "+" : ""}{m.growth.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
