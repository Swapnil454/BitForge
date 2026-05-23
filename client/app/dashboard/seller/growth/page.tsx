"use client";

import { useTheme } from "next-themes";
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
  v > 0 ? "text-emerald-400" : v < 0 ? "text-red-400" : "text-slate-400 dark:text-white/40";

const growthBg = (v: number) =>
  v > 0
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : v < 0
      ? "bg-red-500/10 border-red-500/20 text-red-400"
      : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40";

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

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

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
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
        <PageHeader
          backHref="/dashboard/seller"
          backLabel="Dashboard"
          title="Revenue Growth"
          subtitle="Monthly trends & insights"
        />
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5" />)}
          </div>
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5" />
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center text-slate-400 dark:text-white/40">
        No analytics available
      </div>
    );
  }

  /* ─── INSIGHT banner ─── */
  const insight = (() => {
    if (data.revenueGrowth > 20) return { emoji: "🎉", label: "Excellent Growth", msg: "Revenue increased significantly this month.", border: "border-emerald-500/20", bg: "bg-emerald-500/8" };
    if (data.revenueGrowth > 0) return { emoji: "", label: "Positive Growth", msg: "Revenue is trending upward.", border: "border-cyan-500/20", bg: "bg-cyan-500/8" };
    if (data.revenueGrowth < 0) return { emoji: "", label: "Revenue Decline", msg: "Review pricing or marketing strategy.", border: "border-red-500/20", bg: "bg-red-500/8" };
    return { emoji: "➖", label: "No Change", msg: "No completed sales found for comparison.", border: "border-slate-200 dark:border-white/10", bg: "bg-slate-100 dark:bg-white/5" };
  })();

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      {/* ── HEADER ── */}
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Revenue Growth"
        subtitle="Monthly trends & insights"
      />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* ── HERO KPI ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/8 bg-white dark:bg-[#12141c] overflow-hidden shadow-lg"
        >
          {/* Top row: Revenue Growth % + This Month revenue */}
          <div className="flex items-stretch divide-x divide-white/8">
            {/* Left: main KPI */}
            <div className="flex-1 px-5 py-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-white/40 font-semibold mb-1">Revenue Growth</p>
              <p className={`text-4xl font-black tracking-tight ${growthColor(data.revenueGrowth)}`}>
                {fmt(data.revenueGrowth)}
              </p>
              <p className="text-xs text-slate-300 dark:text-white/30 mt-1">vs last month</p>
            </div>
            {/* Right: This month */}
            <div className="px-5 py-4 text-right flex flex-col justify-center min-w-[130px]">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-white/40 font-semibold mb-1">This Month</p>
              <p className="text-2xl font-bold text-cyan-300">₹{data.currentMonthRevenue.toLocaleString()}</p>
              <p className="text-xs text-slate-300 dark:text-white/30 mt-1">Last: ₹{data.lastMonthRevenue.toLocaleString()}</p>
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
                <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-white/35 font-semibold">{label}</p>
                <div className="flex items-center gap-1.5">
                  {!neutral && (
                    <span className={`inline-flex items-center ${growthColor(v)}`}>
                      <GrowthIcon v={v} />
                    </span>
                  )}
                  <p className={`text-base font-bold ${neutral ? "text-slate-900 dark:text-white" : growthColor(v)}`}>{value}</p>
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
            <span className="font-semibold text-slate-900 dark:text-white">{insight.label}:&nbsp;</span>
            <span className="text-slate-600 dark:text-white/55">{insight.msg}</span>
          </div>
        </motion.div>

        {/* ── CHARTS: Revenue Trend + Sales Volume ── */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-2.5"
          >
            <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-bold px-1">Revenue Trend</h3>
            <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#12141c] p-5 shadow-sm dark:shadow-lg">
            <ResponsiveContainer width="100%" height={200} className="focus:outline-none [&_*]:focus:outline-none">
              <AreaChart data={data.monthlyData} className="focus:outline-none">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke={isDark ? "#334155" : "#cbd5e1"} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis stroke={isDark ? "#334155" : "#cbd5e1"} tick={{ fill: "#64748b", fontSize: 11 }} width={40} />
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e2433" : "#f1f5f9"} />
                <Tooltip
                  contentStyle={{ background: isDark ? "#0d0f18" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 10, color: isDark ? "#fff" : "#0f172a", fontSize: 12, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  formatter={(v: any) => [`₹${v}`, "Revenue"]}
                />
                <Area dataKey="revenue" stroke="#22d3ee" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#22d3ee", stroke: isDark ? "#0d0f18" : "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="flex flex-col gap-2.5"
          >
            <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-bold px-1">Sales Volume</h3>
            <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#12141c] p-5 shadow-sm dark:shadow-lg">
            <ResponsiveContainer width="100%" height={200} className="focus:outline-none [&_*]:focus:outline-none">
              <BarChart data={data.monthlyData} className="focus:outline-none">
                <XAxis dataKey="month" stroke={isDark ? "#334155" : "#cbd5e1"} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis stroke={isDark ? "#334155" : "#cbd5e1"} tick={{ fill: "#64748b", fontSize: 11 }} width={30} />
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e2433" : "#f1f5f9"} />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', stroke: 'transparent', strokeWidth: 0 }}
                  contentStyle={{ background: isDark ? "#0d0f18" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 10, color: isDark ? "#fff" : "#0f172a", fontSize: 12, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  formatter={(v: any) => [v, "Sales"]}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* ── MONTHLY GROWTH % LINE ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="flex flex-col gap-2.5 mt-2"
        >
          <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-bold px-1">Monthly Growth %</h3>
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#12141c] p-5 shadow-sm dark:shadow-lg">
          <ResponsiveContainer width="100%" height={200} className="focus:outline-none [&_*]:focus:outline-none">
            <LineChart data={data.monthlyData} className="focus:outline-none">
              <XAxis dataKey="month" stroke={isDark ? "#334155" : "#cbd5e1"} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis stroke={isDark ? "#334155" : "#cbd5e1"} tick={{ fill: "#64748b", fontSize: 11 }} width={40} />
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e2433" : "#f1f5f9"} />
              <Tooltip
                contentStyle={{ background: isDark ? "#0d0f18" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 10, color: isDark ? "#fff" : "#0f172a", fontSize: 12, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "Growth"]}
              />
              <Line dataKey="growth" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#f59e0b", stroke: isDark ? "#0d0f18" : "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── MONTHLY BREAKDOWN TABLE ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="flex flex-col gap-2.5 mt-2"
        >
          <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-bold px-1">Monthly Breakdown</h3>
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#12141c] overflow-hidden shadow-sm dark:shadow-lg">
            <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-white/[0.02]">
                <tr className="border-b border-slate-200 dark:border-white/10">
                  {["Month", "Revenue", "Sales", "Avg Order", "Growth"].map((h, i) => (
                    <th
                      key={h}
                      className={`py-3.5 px-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-white/40 ${
                        i === 0 
                          ? "text-left sticky left-0 z-20 bg-slate-50 dark:bg-[#151720] border-r border-slate-200 dark:border-white/10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" 
                          : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {data.monthlyData.map((m, i) => (
                  <tr key={i} className="group hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white/90 sticky left-0 z-10 bg-white dark:bg-[#12141c] group-hover:bg-slate-50/80 dark:group-hover:bg-[#161822] transition-colors border-r border-slate-200 dark:border-white/10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      {m.month}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-white/70">₹{m.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-white/70">{m.sales}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-white/70">₹{m.sales ? Math.round(m.revenue / m.sales).toLocaleString() : 0}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center justify-end gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${growthBg(m.growth)}`}>
                        <GrowthIcon v={m.growth} />
                        {Math.abs(m.growth).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
