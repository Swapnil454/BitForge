"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Download,
  Loader2,
  ArrowUpRight,
  AlertTriangle,
  ChevronLeft,
  MoreVertical,
  Banknote
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
import { adminAPI } from "@/lib/api";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface PayoutAnalyticsData {
  stats: {
    pendingPayouts: number;
    pendingValue: number;
    paidThisMonth: number;
    rejectedThisMonth: number;
  };
  volumeData: { date: string; amount: number; count: number }[];
  statusData: { name: string; value: number; color: string }[];
  needsAttention: { id: string; sellerName: string; amount: number; createdAt: string; daysOpen: number }[];
}

const rangeOptions = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" }
];

export default function PayoutsAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");
  const [data, setData] = useState<PayoutAnalyticsData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPayoutAnalytics({ range });
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

  const handleDownloadReport = async () => {
    toast.error("PDF generation for payouts coming soon.");
    setMenuOpen(false);
  };

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatTimeAgo = (value: string) => {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const lineData = useMemo(() => {
    const labels = data?.volumeData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }) || [];
    const amounts = data?.volumeData.map(d => d.amount) || [];
    
    return {
      labels,
      datasets: [
        {
          label: "Payout Volume (₹)",
          data: amounts,
          borderColor: "#06b6d4",
          backgroundColor: "rgba(6, 182, 212, 0.18)",
          pointRadius: 3,
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [data]);

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#94A3B8" } },
        y: {
          grid: { color: "rgba(148,163,184,0.2)" },
          ticks: { color: "#94A3B8", precision: 0 },
          title: { display: true, text: "Amount (₹)", color: "#94A3B8", font: { size: 11, weight: 600 as const } },
        },
      },
    }),
    []
  );

  const donutData = useMemo(() => {
    const labels = data?.statusData.map(c => c.name) || [];
    const counts = data?.statusData.map(c => c.value) || [];
    const colors = data?.statusData.map(c => c.color) || [];
    return {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
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
           <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
           <p className="text-sm font-medium">Loading payout analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats } = data;

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
              Payouts Analytics
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
                              ? "bg-slate-900 text-white dark:bg-cyan-500/20 dark:text-cyan-400"
                              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-white/5 mx-4" />

                  <div className="p-2">
                    <button
                      onClick={handleDownloadReport}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      Download Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* STATS ROW */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Pending Requests", value: stats.pendingPayouts, accent: "border-t-2 border-t-amber-400" },
            { label: "Pending Value", value: formatCurrency(stats.pendingValue), accent: "border-t-2 border-t-amber-500" },
            { label: "Paid This Month", value: stats.paidThisMonth, accent: "border-t-2 border-t-emerald-400" },
            { label: "Rejected This Month", value: stats.rejectedThisMonth, accent: "border-t-2 border-t-rose-400" },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 shadow-sm px-4 py-4 ${item.accent}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/40 truncate">
                {item.label}
              </p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white leading-none">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          <div className="space-y-6">
            
            {/* TIMELINE CHART */}
            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Payout Volume ({range} Days)
              </h3>
              <div className="mt-4">
                {data.volumeData.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    Not enough data for this period. Try a wider date range.
                  </p>
                ) : (
                  <Line data={lineData} options={lineOptions} height={100} />
                )}
              </div>
            </section>

            {/* STATUS BREAKDOWN */}
            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Status Distribution
              </h3>
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-center">
                <div className="space-y-4">
                  {data.statusData.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-white/60">No status data available.</p>
                  )}
                  {data.statusData.map((status) => {
                    const total = data.statusData.reduce((acc, curr) => acc + curr.value, 0);
                    const percentage = total ? Math.round((status.value / total) * 100) : 0;
                    return (
                      <div key={status.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium text-slate-700 dark:text-white/80">
                            {status.name} <span className="text-xs text-slate-400">({status.value})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${percentage}%`, backgroundColor: status.color }}
                            />
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 dark:bg-[#0b0b12] text-slate-600 dark:text-white/70 shadow-sm">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center">
                  {data.statusData.length === 0 ? (
                    <div className="h-28 w-28 rounded-full border border-dashed border-slate-200 dark:border-white/10" />
                  ) : (
                    <div className="h-36 w-36">
                      <Doughnut data={donutData} options={donutOptions} />
                    </div>
                  )}
                </div>
              </div>
            </section>

          </div>

          <div className="space-y-6 lg:border-l lg:border-slate-200/70 dark:lg:border-white/10 lg:pl-6">
            
            {/* NEEDS ATTENTION */}
            <section className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200/70 dark:border-amber-500/20 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Needs attention (Oldest Pending)
                </h3>
              </div>
              {data.needsAttention.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                  Inbox zero! No old pending payouts.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {data.needsAttention.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="pr-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {item.sellerName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">
                          {formatCurrency(item.amount)} · Pending for {item.daysOpen} days
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/admin/payouts`)}
                        className="h-8 px-3 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition inline-flex items-center gap-1 shrink-0"
                      >
                        Process
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-white/40 text-center md:text-left mt-8">Data updates in real-time.</p>
      </main>
    </div>
  );
}
