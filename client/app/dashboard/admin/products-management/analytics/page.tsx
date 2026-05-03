"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  TrendingUp,
  Download,
  Loader2,
  Crown,
  Zap,
  ChevronUp,
  BarChart2,
  ChevronRight,
  Activity
} from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

// --- Types ---
interface AnalyticsData {
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    recentSubmissions: number;
  };
  categories: { _id: string; count: number }[];
  topSellers: { name: string; email: string; count: number }[];
}

// --- Animated Count Component ---
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    if (end === 0) return setDisplayValue(0);
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <>{displayValue}</>;
}

export default function ProductAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await adminAPI.getProductAnalytics();
      setData(res);
    } catch (error) {
      toast.error("Intelligence sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const blob = await adminAPI.getProductReport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BitForge_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Ready");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !data) return <AnalyticsSkeleton />;

  const stats = data!.stats;

  return (
    <div className="min-h-screen bg-[#05050a] text-white selection:bg-blue-500/30 pb-20">
      <PageHeader
        backHref="/dashboard/admin/products-management"
        backLabel="Back"
        title="Intelligence"
        subtitle="Catalog Performance"
        rightSlot={
          <div className="pr-1">
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
            >
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 👋 GREETING */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-white/90">Good Evening, <span className="text-blue-500">Virat</span></h2>
          <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Catalog Intelligence & Report</p>
        </div>

        {/* 🔥 HERO CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(59,130,246,0.15)", borderColor: "rgba(59,130,246,0.3)" }}
          className="relative h-[160px] rounded-[28px] p-8 overflow-hidden bg-[#16161e] border border-white/[0.05] group transition-all duration-500"
        >
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] group-hover:bg-blue-600/10 transition-all" />

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Total Catalog Units</p>
              <h2 className="text-6xl font-black tracking-tighter">
                <AnimatedNumber value={stats.total} />
              </h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Global Intelligence Sync
              </div>
              <div className="text-blue-500/40">
                <Activity className="w-8 h-8" />
              </div>
            </div>
          </div>
        </motion.div>

        {/*  METRICS GRID */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400" },
            { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-rose-400" },
            { label: "New Unit", value: stats.recentSubmissions, icon: TrendingUp, color: "text-blue-400" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "#1c1c24" }}
              className="h-[120px] rounded-[28px] p-6 bg-[#16161e] border border-white/[0.05] flex flex-col justify-between group transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl bg-white/[0.03] ${m.color} group-hover:bg-white/[0.08] transition-all`}>
                  <m.icon className="w-4 h-4" />
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${m.color.replace('text-', 'bg-')} opacity-20 group-hover:opacity-100 transition-all`} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">{m.label}</p>
                <h4 className="text-2xl font-black tracking-tight">{m.value}</h4>
              </div>
            </motion.div>
          ))}
        </div>

        {/*  CATEGORY TRENDS */}
        <motion.div
          className="bg-[#16161e] border border-white/[0.05] rounded-[32px] p-8 space-y-8"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Market Intelligence</h3>
            <BarChart2 className="w-5 h-5 text-white/10" />
          </div>

          <div className="space-y-6">
            {data?.categories.slice(0, 4).map((cat, i) => {
              const percentage = (cat.count / (stats.total || 1)) * 100;
              return (
                <div key={cat._id} className="space-y-2.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{cat._id || "Unclassified"}</span>
                    <span className="text-[10px] font-black text-blue-500">{Math.round(percentage)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 }}
                      className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 🏆 MARKET LEADERS */}
        <motion.div
          className="bg-[#16161e] border border-white/[0.05] rounded-[32px] p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Market Leaders</h3>
            <Crown className="w-5 h-5 text-white/10" />
          </div>

          <div className="space-y-3">
            {data?.topSellers.map((seller, i) => (
              <div key={seller.email} className="group p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-[#1c1c24] hover:border-white/10 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1c1c24] flex items-center justify-center text-xs font-black border border-white/5 relative">
                    {seller.name.substring(0, 2).toUpperCase()}
                    <div className={`absolute -right-1 -top-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border-2 border-[#16161e] ${i === 0 ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" : i === 1 ? "bg-slate-300 text-black" : "bg-orange-500 text-white"
                      }`}>
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{seller.name}</p>
                    <p className="text-[9px] text-white/20 font-medium tracking-tight truncate max-w-[150px]">{seller.email}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white transition-all" />
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #16161e 25%, #1c1c24 50%, #16161e 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}

// --- PROPER SKELETON COMPONENTS ---
function SkeletonBox({ className }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`} />;
}

function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-[#05050a]">
      <div className="h-16 w-full border-b border-white/[0.05] bg-[#0a0a0f]" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Greeting Skeleton */}
        <div className="space-y-3">
          <SkeletonBox className="h-8 w-48 rounded-xl" />
          <SkeletonBox className="h-3 w-64 rounded-lg" />
        </div>

        {/* Hero Card Skeleton */}
        <div className="h-[160px] w-full bg-[#16161e] rounded-[28px] border border-white/[0.05] p-8 flex flex-col justify-between">
          <div className="space-y-3">
            <SkeletonBox className="h-3 w-32 rounded-full opacity-50" />
            <SkeletonBox className="h-12 w-24 rounded-2xl" />
          </div>
          <div className="flex justify-between items-end">
            <SkeletonBox className="h-3 w-40 rounded-full opacity-30" />
            <SkeletonBox className="h-8 w-32 rounded-xl opacity-20" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[120px] bg-[#16161e] rounded-[28px] border border-white/[0.05] p-6 flex flex-col justify-between">
              <div className="flex justify-between">
                <SkeletonBox className="h-8 w-8 rounded-xl opacity-50" />
                <SkeletonBox className="h-2 w-12 rounded-full opacity-20" />
              </div>
              <div className="space-y-2">
                <SkeletonBox className="h-2 w-16 rounded-full opacity-30" />
                <SkeletonBox className="h-6 w-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Lists Skeleton */}
        <div className="bg-[#16161e] border border-white/[0.05] rounded-[32px] p-8 space-y-10">
          <div className="flex justify-between">
            <SkeletonBox className="h-3 w-40 rounded-full opacity-50" />
            <SkeletonBox className="h-5 w-5 rounded-lg opacity-20" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between">
                  <SkeletonBox className="h-2 w-24 rounded-full opacity-40" />
                  <SkeletonBox className="h-2 w-8 rounded-full opacity-20" />
                </div>
                <SkeletonBox className="h-1.5 w-full rounded-full opacity-10" />
              </div>
            ))}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #16161e 25%, #23232d 50%, #16161e 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
}

