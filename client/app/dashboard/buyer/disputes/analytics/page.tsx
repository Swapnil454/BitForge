"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Download,
  Loader2,
  ArrowUpRight,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  MoreVertical,
  Clock,
  CheckCircle2,
  FileWarning,
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
import { buyerAPI } from "@/lib/api";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface DisputeAnalyticsData {
  stats: {
    total: number;
    open: number;
    resolved: number;
    rejected: number;
    recentSubmissions: number;
    totalValue: number;
  };
  categories: { _id: string; count: number }[];
  topSellers: { id: string; name: string; email: string; disputeCount: number; disputedValue: number }[];
  recentSubmissions: {
    _id: string;
    title: string;
    sellerName: string;
    buyerName: string;
    category: string;
    status: string;
    amount: number;
    createdAt: string;
  }[];
  needsAttention: { _id: string; title: string; status: string; createdAt: string; reason: string; amount: number }[];
  timeline: { labels: string[]; counts: number[] };
  health: { resolutionRate: number; avgResolutionDays: number; activeDisputes: number };
}

const categoryColors: Record<string, string> = {
  item_not_delivered: "#EF4444",
  wrong_item: "#F59E0B",
  quality_issue: "#3B82F6",
  not_as_described: "#8B5CF6",
  payment_issue: "#EC4899",
  other: "#64748B",
};

const formatCategory = (cat: string) => {
  if (!cat) return "Unknown";
  return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const rangeOptions = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" },
];

export default function BuyerDisputesAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [range, setRange] = useState("30");
  const [data, setData] = useState<DisputeAnalyticsData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await buyerAPI.getMyDisputeAnalytics({ range });
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
    toast.error("PDF generation for disputes coming soon.");
    setMenuOpen(false);
  };

  const formatCurrency = (value: number) =>
    `₹${(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "S";
  };

  const formatTimeAgo = (value: string) => {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const lineData = useMemo(() => {
    const labels = data?.timeline.labels || [];
    const counts = data?.timeline.counts || [];
    return {
      labels,
      datasets: [
        {
          label: "Disputes Opened",
          data: counts,
          borderColor: "#EF4444",
          backgroundColor: "rgba(239, 68, 68, 0.18)",
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
      plugins: { legend: { display: showLegend }, tooltip: { enabled: true } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#94A3B8" } },
        y: {
          grid: { color: "rgba(148,163,184,0.2)" },
          ticks: { color: "#94A3B8", precision: 0 },
          title: { display: true, text: "Disputes", color: "#94A3B8", font: { size: 11, weight: 600 as const } },
        },
      },
    }),
    [showLegend]
  );

  const donutData = useMemo(() => {
    const labels = data?.categories.map((c) => formatCategory(c._id)) || [];
    const counts = data?.categories.map((c) => c.count) || [];
    const colors = data?.categories.map((c) => categoryColors[c._id] || "#94A3B8") || [];
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
           <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
           <p className="text-sm font-medium">Loading dispute analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

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
              Disputes Analytics
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
                              ? "bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-400"
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
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total, accent: "border-t-2 border-t-slate-300 dark:border-t-white/20" },
            { label: "Open", value: stats.open, accent: "border-t-2 border-t-rose-400" },
            { label: "Resolved", value: stats.resolved, accent: "border-t-2 border-t-emerald-400" },
            { label: "Rejected", value: stats.rejected, accent: "border-t-2 border-t-slate-400" },
            { label: "Disputed Value", value: formatCurrency(stats.totalValue || 0), accent: "border-t-2 border-t-violet-400" },
            { label: "New Disputes", value: stats.recentSubmissions || 0, accent: "border-t-2 border-t-amber-400" },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 shadow-sm px-3 py-3 ${item.accent}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/40 truncate">
                {item.label}
              </p>
              <p className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white leading-none">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          <div className="space-y-6">
            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Dispute reasons
              </h3>
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-center">
                <div className="space-y-4">
                  {data.categories.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-white/60">No category data available.</p>
                  )}
                  {data.categories.map((category) => {
                    const count = category.count;
                    const percentage = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    const label = formatCategory(category._id);
                    const color = categoryColors[category._id] || "#94A3B8";
                    return (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium text-slate-700 dark:text-white/80">
                            {label} <span className="text-xs text-slate-400">({count})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${percentage}%`, backgroundColor: color }}
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
                  {data.categories.length === 0 ? (
                    <div className="h-28 w-28 rounded-full border border-dashed border-slate-200 dark:border-white/10" />
                  ) : (
                    <div className="h-36 w-36">
                      <Doughnut data={donutData} options={donutOptions} />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Dispute timeline
              </h3>
              <div className="mt-4">
                {data.timeline.labels.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    Not enough data for this period. Try a wider date range.
                  </p>
                ) : (
                  <Line data={lineData} options={lineOptions} height={120} />
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                  Recent disputes
                </h3>
                <button
                  onClick={() => router.push("/dashboard/buyer/disputes")}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  View all
                </button>
              </div>
              {data.recentSubmissions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-white/60">
                  No disputes opened in this period.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <div className="min-w-[600px] divide-y divide-slate-100 dark:divide-white/5">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] text-xs uppercase tracking-wide text-slate-400 pb-2">
                      <span>Product & Reason</span>
                      <span>Parties</span>
                      <span>Value</span>
                      <span>Status</span>
                      <span>Opened</span>
                    </div>
                    {data.recentSubmissions.map((item) => (
                      <div
                        key={item._id}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] text-left text-sm py-3 text-slate-700 dark:text-white/80"
                      >
                        <div>
                           <span className="font-semibold block text-slate-900 dark:text-white">{item.title}</span>
                           <span className="text-xs text-slate-500 dark:text-white/50">{formatCategory(item.category)}</span>
                        </div>
                        <div>
                           <span className="block">{item.buyerName}</span>
                           <span className="text-xs text-slate-500 dark:text-white/50 block mt-0.5">from {item.sellerName}</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(item.amount)}</span>
                        <div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${item.status === 'open' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : item.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white/60'}`}>
                             {item.status}
                          </span>
                        </div>
                        <span className="text-slate-500 dark:text-white/60">{formatTimeAgo(item.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6 lg:border-l lg:border-slate-200/70 dark:lg:border-white/10 lg:pl-6">
            <section className="bg-rose-50 dark:bg-rose-500/5 border border-rose-200/70 dark:border-rose-500/20 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                  Needs attention
                </h3>
              </div>
              {data.needsAttention.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                  Inbox zero! No open disputes needing attention.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {data.needsAttention.map((item) => (
                    <div key={item._id} className="flex items-center justify-between">
                      <div className="pr-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">
                          {formatCategory(item.reason)} · {formatTimeAgo(item.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/buyer/disputes`)}
                        className="h-8 px-3 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition inline-flex items-center gap-1 shrink-0"
                      >
                        View
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Most disputed sellers
              </h3>
              {data.topSellers.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-white/60">
                  No dispute data available.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {data.topSellers.map((seller, index) => (
                    <div key={seller.email} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-semibold text-slate-500 dark:text-white/60">#{index + 1}</div>
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xs font-semibold">
                          {getInitials(seller.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{seller.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-white/50">
                            {seller.disputeCount} disputes
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-rose-500 dark:text-rose-400">{formatCurrency(seller.disputedValue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Dispute health
              </h3>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/60">
                    <span>Resolution rate</span>
                    <span className={data.health.resolutionRate < 50 ? "text-amber-500 font-medium" : ""}>{data.health.resolutionRate}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${data.health.resolutionRate < 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${data.health.resolutionRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/60 pt-2 border-t border-slate-100 dark:border-white/5">
                  <span>Your active disputes queue</span>
                  <span className="text-slate-900 dark:text-white inline-flex items-center gap-1 font-semibold">
                    {data.health.activeDisputes}
                    {data.health.activeDisputes > 0 && <TrendingUp className="w-3.5 h-3.5 text-rose-500" />}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-white/40 text-center md:text-left mt-8">Data updates in real-time.</p>
      </main>
    </div>
  );
}
