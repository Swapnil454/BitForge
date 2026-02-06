"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";
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

/* ================= PAGE ================= */

export default function RevenueGrowthPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GrowthStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchGrowth();
  }, []);

  const fetchGrowth = async () => {
    try {
      const res = await sellerAPI.getGrowthAnalytics();
      setData(res);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const color = (v: number) =>
    v > 0 ? "text-emerald-400" : v < 0 ? "text-red-400" : "text-gray-400";

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black p-6">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse-soft">

          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-8 w-80 bg-white/10 rounded" />
            <div className="h-4 w-56 bg-white/5 rounded" />
          </div>

          {/* Main KPI */}
          <div className="glass p-6 flex justify-between gap-6">
            <div className="space-y-3">
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-12 w-40 bg-white/10 rounded" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
            <div className="space-y-3 text-right">
              <div className="h-4 w-24 bg-white/10 rounded ml-auto" />
              <div className="h-10 w-32 bg-white/10 rounded ml-auto" />
              <div className="h-3 w-28 bg-white/5 rounded ml-auto" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-4 space-y-3">
                <div className="h-3 w-24 bg-white/10 rounded" />
                <div className="h-8 w-28 bg-white/10 rounded" />
              </div>
            ))}
          </div>

          {/* Insights */}
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="glass p-4 h-14" />
            ))}
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="glass p-6 h-[300px]" />
            ))}
          </div>

          {/* Growth line */}
          <div className="glass p-6 h-[300px]" />

          {/* Monthly table */}
          <div className="glass p-6 space-y-4">
            <div className="h-5 w-40 bg-white/10 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-full bg-white/5 rounded" />
            ))}
          </div>

        </div>

        <style jsx>{`
          @keyframes softPulse {
            0% { opacity: 0.55; }
            50% { opacity: 0.8; }
            100% { opacity: 0.55; }
          }
          .animate-pulse-soft {
            animation: softPulse 1.6s ease-in-out infinite;
          }
        `}</style>
      </div>
      
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        No analytics available
      </div>
    );
  }


  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <button
            onClick={() => router.push("/dashboard/seller")}
            className="text-cyan-400 text-sm hover:text-cyan-300"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold mt-2">Revenue Growth Analytics</h1>
          <p className="text-gray-400">
            Monthly performance, trends & insights
          </p>
        </div>

        {/* MAIN KPI */}
        <div className="glass p-6 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-sm text-gray-400">Revenue Growth</p>
            <p className={`text-5xl font-bold ${color(data.revenueGrowth)}`}>
              {data.revenueGrowth > 0 ? "+" : ""}
              {data.revenueGrowth.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">vs last month</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400">This Month</p>
            <p className="text-3xl font-bold text-cyan-400">
              ₹{data.currentMonthRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              Last: ₹{data.lastMonthRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            ["Sales Growth", `${data.salesGrowth.toFixed(1)}%`],
            ["Avg Order Value", `₹${data.averageOrderValue}`],
            ["AOV Growth", `${data.averageOrderValueGrowth.toFixed(1)}%`],
          ].map(([label, value], i) => (
            <div key={i} className="glass p-4">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* ================= INSIGHTS / WARNINGS ================= */}
        <div className="space-y-3">
          {data.revenueGrowth > 20 && (
            <div className="glass border border-emerald-400/40 p-4">
              🎉 <b>Excellent Growth:</b> Revenue increased significantly.
            </div>
          )}

          {data.revenueGrowth > 0 && data.revenueGrowth <= 20 && (
            <div className="glass border border-cyan-400/40 p-4">
              📈 <b>Positive Growth:</b> Revenue is trending upward.
            </div>
          )}

          {data.revenueGrowth < 0 && (
            <div className="glass border border-red-400/40 p-4">
              ⚠️ <b>Revenue Decline:</b> Review pricing or marketing strategy.
            </div>
          )}

          {data.salesGrowth > 0 && data.averageOrderValueGrowth < 0 && (
            <div className="glass border border-yellow-400/40 p-4">
              💡 <b>Insight:</b> Sales increased but order value dropped.
            </div>
          )}

          {data.salesGrowth < 0 && data.averageOrderValueGrowth > 0 && (
            <div className="glass border border-orange-400/40 p-4">
              💡 <b>Insight:</b> Order value improved but sales volume declined.
            </div>
          )}

          {/* ✅ FALLBACK (THIS IS WHAT YOU WERE MISSING) */}
          {data.revenueGrowth === 0 &&
          data.salesGrowth === 0 &&
          data.averageOrderValueGrowth === 0 && (
            <div className="glass border border-gray-500/30 p-4">
              ➖ <b>No Growth Data:</b> No completed sales found for comparison.
            </div>
          )}
        </div>


        {/* ================= CHARTS ================= */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass p-6">
            <h3 className="font-semibold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.monthlyData}>
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <Tooltip contentStyle={{ background: "#020617" }} />
                <Area
                  dataKey="revenue"
                  stroke="#22d3ee"
                  fill="#22d3ee33"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass p-6">
            <h3 className="font-semibold mb-4">Sales Volume</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthlyData}>
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <Tooltip contentStyle={{ background: "#020617" }} />
                <Bar dataKey="sales" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= GROWTH % ================= */}
        <div className="glass p-6">
          <h3 className="font-semibold mb-4">Monthly Growth %</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.monthlyData}>
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <Tooltip contentStyle={{ background: "#020617" }} />
              <Line dataKey="growth" stroke="#f59e0b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ================= MONTHLY BREAKDOWN ================= */}
        <div className="glass p-6 overflow-x-auto">
          <h3 className="font-semibold mb-4">Monthly Breakdown</h3>
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="text-left py-2">Month</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Sales</th>
                <th className="text-right">Avg Order</th>
                <th className="text-right">Growth</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyData.map((m, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-2">{m.month}</td>
                  <td className="text-right">₹{m.revenue}</td>
                  <td className="text-right">{m.sales}</td>
                  <td className="text-right">
                    ₹{m.sales ? Math.round(m.revenue / m.sales) : 0}
                  </td>
                  <td className={`text-right font-semibold ${color(m.growth)}`}>
                    {m.growth > 0 ? "+" : ""}
                    {m.growth.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* GLASS STYLE */}
      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 1rem;
        }
      `}</style>
    </div>
  );
}
