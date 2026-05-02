"use client";

import { useEffect, useState, useMemo } from "react";
import { BarChart3, TrendingUp, ShoppingBag, XCircle, Clock, Wallet, ArrowUpRight } from "lucide-react";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import PageHeader from "../../../buyer/transactions/components/PageHeader";

interface Sale {
  amount: number;
  platformFee: number;
  sellerAmount: number;
  status: "paid" | "created" | "failed";
}

export default function SalesAnalyticsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await sellerAPI.getAllSales({ limit: 9999 });
        setSales(data.sales || []);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    const paid = sales.filter((s) => s.status === "paid");
    const revenue = paid.reduce((s, t) => s + t.amount, 0);
    const earned = paid.reduce((s, t) => s + t.sellerAmount, 0);
    const fee = paid.reduce((s, t) => s + t.platformFee, 0);
    const successRate = sales.length ? Math.round((paid.length / sales.length) * 100) : 0;
    return {
      total: sales.length,
      paid: paid.length,
      failed: sales.filter((s) => s.status === "failed").length,
      pending: sales.filter((s) => s.status === "created").length,
      revenue,
      earned,
      fee,
      successRate,
    };
  }, [sales]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white">
        <PageHeader
          backHref="/dashboard/seller/sales"
          backLabel="Sales"
          title="Sales Analytics"
          subtitle="Your complete sales performance breakdown"
        />
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <div className="h-52 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
          <div className="h-36 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <PageHeader
        backHref="/dashboard/seller/sales"
        backLabel="Sales"
        title="Sales Analytics"
        subtitle="Your complete sales performance breakdown"
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── HERO: Total Earned ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/8 bg-[#12141c] p-7 shadow-2xl overflow-hidden relative"
        >
          {/* Subtle glow blob */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300">
                  <Wallet className="w-4 h-4" />
                </div>
                <p className="text-xs uppercase tracking-widest text-white/50 font-semibold">Total Earned</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                <ArrowUpRight className="w-3 h-3" /> {stats.successRate}% success
              </span>
            </div>

            <p className="text-6xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-indigo-200">
              ₹{stats.earned.toLocaleString()}
            </p>
            <p className="text-white/40 text-sm mt-3 leading-relaxed">
              After deducting ₹{stats.fee.toLocaleString()} platform fees from ₹{stats.revenue.toLocaleString()} gross revenue
            </p>
          </div>
        </motion.div>

        {/* ── SALES BREAKDOWN (unified card) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="rounded-2xl border border-white/8 bg-[#12141c] overflow-hidden shadow-lg"
        >
          <div className="px-5 py-4 border-b border-white/6">
            <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Sales Breakdown</p>
          </div>

          <div className="grid grid-cols-2 divide-x divide-white/6">
            {[
              { label: "Total Sales", value: stats.total, icon: ShoppingBag, color: "text-white" },
              { label: "Paid", value: stats.paid, icon: TrendingUp, color: "text-emerald-400" },
              { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-400" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400" },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div
                key={label}
                className={`px-5 py-4 ${i >= 2 ? "border-t border-white/6" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${color} opacity-70`} />
                  <p className="text-[11px] text-white/45 uppercase tracking-wider font-medium">{label}</p>
                </div>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── REVENUE BREAKDOWN (unified card) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="rounded-2xl border border-white/8 bg-[#12141c] overflow-hidden shadow-lg"
        >
          <div className="px-5 py-4 border-b border-white/6">
            <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Revenue Breakdown</p>
          </div>

          <div className="px-5 py-2 divide-y divide-white/5">
            <Row label="Gross Revenue" value={`₹${stats.revenue.toLocaleString()}`} valueColor="text-white" />
            <Row label="Platform Fees" value={`−₹${stats.fee.toLocaleString()}`} valueColor="text-red-400/80" />
            <Row label="GST on Fees" value={`−₹${Math.round(stats.fee * 0.18).toLocaleString()}`} valueColor="text-orange-400/80" />
            <Row label="Net Earned" value={`₹${stats.earned.toLocaleString()}`} valueColor="text-emerald-400" bold />
          </div>
        </motion.div>

        {/* ── PERFORMANCE BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          className="rounded-2xl border border-white/8 bg-[#12141c] p-5 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Conversion Rate</p>
            </div>
            <p className="text-sm font-bold text-white">{stats.successRate}%</p>
          </div>

          {/* Segmented bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            {stats.total > 0 && (
              <>
                <div
                  className="bg-emerald-500 rounded-l-full transition-all duration-700"
                  style={{ width: `${(stats.paid / stats.total) * 100}%` }}
                />
                <div
                  className="bg-amber-500 transition-all duration-700"
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                />
                <div
                  className="bg-red-500 rounded-r-full transition-all duration-700"
                  style={{ width: `${(stats.failed / stats.total) * 100}%` }}
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-white/45">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Paid</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Failed</span>
          </div>
        </motion.div>

      </main>
    </div>
  );
}

function Row({
  label,
  value,
  valueColor = "text-white",
  bold = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-3.5 ${bold ? "mt-1" : ""}`}>
      <p className={`text-sm ${bold ? "text-white font-semibold" : "text-white/55"}`}>{label}</p>
      <p className={`text-sm font-bold ${valueColor} ${bold ? "text-base" : ""}`}>{value}</p>
    </div>
  );
}
