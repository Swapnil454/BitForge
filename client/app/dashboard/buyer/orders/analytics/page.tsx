"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2,
  ChevronLeft,
  MoreVertical,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  Clock
} from "lucide-react";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { buyerAPI } from "@/lib/api";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface OrderAnalyticsData {
  summary: {
    total: { count: number; amount: number };
    success: { count: number; amount: number };
    pending: { count: number; amount: number };
    failed: { count: number; amount: number };
  };
  timeline: { date: string; amount: number; count: number }[];
}

const rangeOptions = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "All time", value: "all" },
];

export default function BuyerOrdersAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all");
  const [data, setData] = useState<OrderAnalyticsData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await buyerAPI.getBuyerTransactionAnalytics(range);
      setData(res);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatCurrency = (value: number) =>
    `₹${(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const lineData = useMemo(() => {
    const labels = data?.timeline.map((t) => t.date) || [];
    const amounts = data?.timeline.map((t) => t.amount) || [];
    return {
      labels,
      datasets: [
        {
          label: "Payment Volume (₹)",
          data: amounts,
          borderColor: "#8b5cf6", // Purple
          backgroundColor: "rgba(139, 92, 246, 0.15)",
          pointRadius: 3,
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [data]);

  const showLegend = lineData.datasets.length > 1;

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: showLegend }, tooltip: { enabled: true } },
      scales: {
        x: { 
          grid: { display: false }, 
          ticks: { 
            color: "#94A3B8",
            maxRotation: 45,
            minRotation: 0,
            maxTicksLimit: 6,
            autoSkip: true
          } 
        },
        y: {
          grid: { color: "rgba(148,163,184,0.2)" },
          ticks: { color: "#94A3B8", precision: 0 },
          title: { display: true, text: "Amount (₹)", color: "#94A3B8", font: { size: 11, weight: 600 as const } },
        },
      },
    }),
    [showLegend]
  );

  const donutData = useMemo(() => {
    const s = data?.summary;
    if (!s) return { labels: [], datasets: [] };
    return {
      labels: ["Successful", "Pending", "Failed"],
      datasets: [
        {
          data: [s.success.count, s.pending.count, s.failed.count],
          backgroundColor: ["#10B981", "#F59E0B", "#F43F5E"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  }, [data]);

  const donutOptions = useMemo(
    () => ({
      cutout: "70%",
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
    }),
    []
  );

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-white/60">
           <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
           <p className="text-sm font-medium">Loading order analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0b0b12]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white absolute left-1/2 -translate-x-1/2">
              Order Analytics
            </h1>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white transition inline-flex items-center justify-center"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 w-64 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-2">
                      Date Range
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {rangeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setRange(option.value); setMenuOpen(false); }}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition text-center ${
                            range === option.value
                              ? "bg-slate-900 text-white dark:bg-purple-500/20 dark:text-purple-400"
                              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* TOP SUMMARY CARDS (Like Purchases Analytics) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <ShoppingBag className="w-3.5 h-3.5" /> Total Orders
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {summary.total.count.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <CreditCard className="w-3.5 h-3.5" /> Total Spent
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {formatCurrency(summary.total.amount)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-emerald-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px] font-bold">
               Successful
            </div>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                {summary.success.count}
              </p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 pb-1">
                {formatCurrency(summary.success.amount)}
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-rose-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px] font-bold">
               Failed
            </div>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
                {summary.failed.count}
              </p>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 pb-1">
                {formatCurrency(summary.failed.amount)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* STATUS CATEGORIES SECTION (Bar Chart + Donut) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.05]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Order Status Distribution
              </h3>
            </div>
            
            <div className="p-6 flex-1 flex flex-col sm:flex-row gap-8 items-center">
              <div className="flex-1 w-full space-y-6">
                {[
                  { label: "Successful", count: summary.success.count, amount: summary.success.amount, color: "bg-emerald-500", text: "text-emerald-500" },
                  { label: "Pending", count: summary.pending.count, amount: summary.pending.amount, color: "bg-amber-500", text: "text-amber-500" },
                  { label: "Failed", count: summary.failed.count, amount: summary.failed.amount, color: "bg-rose-500", text: "text-rose-500" },
                ].map((item) => {
                  const percent = summary.total.count > 0 ? Math.round((item.count / summary.total.count) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {item.label} <span className="text-slate-400 dark:text-slate-500 font-normal">({item.count})</span>
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {formatCurrency(item.amount)}
                          </span>
                          <span className={`font-bold ${item.text} w-10 text-right text-xs`}>
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="w-40 h-40 shrink-0 relative flex items-center justify-center">
                {summary.total.count > 0 ? (
                  <Doughnut data={donutData} options={donutOptions} />
                ) : (
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5" />
                )}
              </div>
            </div>
          </div>

          {/* EXTRA STATS (Pending / General Info) */}
          <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.05]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pending Actions
              </h3>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {summary.pending.count} Pending Orders
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Worth {formatCurrency(summary.pending.amount)} awaiting verification
                </p>
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/[0.05] text-left">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg Order Value</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {summary.total.count > 0 ? formatCurrency(summary.total.amount / summary.total.count) : '₹0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* TIMELINE SECTION */}
        <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Payment Timeline
            </h3>
            <span className="text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 px-2 py-1 rounded-md">
              Successful Only
            </span>
          </div>
          
          <div className="p-4 sm:p-6 w-full">
            <div className="h-64 sm:h-72 w-full">
              {data.timeline.length > 0 ? (
                <Line data={lineData} options={lineOptions} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No timeline data for selected range</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
