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

interface AnalyticsData {
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    recentSubmissions: number;
    totalRevenue: number;
    revenueOrders: number;
  };
  categories: { _id: string; count: number }[];
  topSellers: { id: string; name: string; email: string; productCount: number; revenue: number }[];
  recentSubmissions: {
    _id: string;
    title: string;
    sellerName: string;
    category: string;
    status: string;
    createdAt: string;
  }[];
  needsAttention: { _id: string; title: string; status: string; createdAt: string; reason: string }[];
  timeline: { labels: string[]; counts: number[] };
  health: { approvalRate: number; avgApprovalDays: number; activeSellers: number };
}

const categoryColors: Record<string, string> = {
  Template: "#378ADD",
  Software: "#1D9E75",
  Course: "#7F77DD",
  Ebook: "#EF9F27",
  eBook: "#EF9F27",
};

const rangeOptions = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" },
];

export default function ProductAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [range, setRange] = useState("30");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getProductAnalytics({ range });
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
    setDownloading(true);
    try {
      const blob = await adminAPI.getProductReport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `product-analytics-${range === "all" ? "all" : `${range}d`}-${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Report ready");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
          label: "Submissions",
          data: counts,
          borderColor: "#1D9E75",
          backgroundColor: "rgba(29, 158, 117, 0.18)",
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
          title: { display: true, text: "Submissions", color: "#94A3B8", font: { size: 11, weight: 600 as const } },
        },
      },
    }),
    [showLegend]
  );

  const donutData = useMemo(() => {
    const labels = data?.categories.map((category) => category._id || "Uncategorized") || [];
    const counts = data?.categories.map((category) => category.count) || [];
    const colors = labels.map((label) => categoryColors[label] || "#94A3B8");
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
        <div className="text-slate-500 dark:text-white/60 text-sm">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { stats } = data;
  const totalRevenueAvailable = stats.revenueOrders > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0b0b12]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Left – back button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Center – title */}
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white absolute left-1/2 -translate-x-1/2">
              Product Analytics
            </h1>

            {/* Right – 3-dot action menu */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                id="analytics-menu-btn"
                onClick={() => setMenuOpen((o) => !o)}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white transition inline-flex items-center justify-center"
                aria-label="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 w-64 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {/* Date range section */}
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
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-white/5 mx-4" />

                  {/* Download section */}
                  <div className="p-2">
                    <button
                      onClick={() => { handleDownloadReport(); setMenuOpen(false); }}
                      disabled={downloading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 transition disabled:opacity-50"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Download className="w-4 h-4 shrink-0" />
                      )}
                      {downloading ? "Generating report…" : "Download Report"}
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
            { label: "Approved", value: stats.approved, accent: "border-t-2 border-t-emerald-400" },
            { label: "Pending", value: stats.pending, accent: "border-t-2 border-t-amber-400" },
            { label: "Rejected", value: stats.rejected, accent: "border-t-2 border-t-rose-400" },
            { label: "Revenue", value: formatCurrency(stats.totalRevenue || 0), accent: "border-t-2 border-t-violet-400" },
            { label: "Submissions", value: stats.recentSubmissions || 0, accent: "border-t-2 border-t-blue-400" },
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
                Category distribution
              </h3>
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-center">
                <div className="space-y-4">
                  {data.categories.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-white/60">No category data available.</p>
                  )}
                  {data.categories.map((category) => {
                    const count = category.count;
                    const percentage = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    const label = category._id || "Uncategorized";
                    const color = categoryColors[label] || "#94A3B8";
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
                Submission timeline
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
                  Recent submissions
                </h3>
                <button
                  onClick={() => router.push("/dashboard/admin/products-management")}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all
                </button>
              </div>
              {data.recentSubmissions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-white/60">
                  No products submitted in this period.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <div className="min-w-[560px] divide-y divide-slate-100 dark:divide-white/5">
                    <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] text-xs uppercase tracking-wide text-slate-400 pb-2">
                      <span>Product</span>
                      <span>Seller</span>
                      <span>Category</span>
                      <span>Status</span>
                      <span>Submitted</span>
                    </div>
                    {data.recentSubmissions.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => router.push(`/dashboard/admin/products-management/${item._id}`)}
                        className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] text-left text-sm py-3 text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white"
                      >
                        <span className="font-semibold">{item.title}</span>
                        <span className="text-slate-500 dark:text-white/60">{item.sellerName}</span>
                        <span>{item.category}</span>
                        <span className="capitalize">{item.status}</span>
                        <span className="text-slate-500 dark:text-white/60">{formatTimeAgo(item.createdAt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6 lg:border-l lg:border-slate-200/70 dark:lg:border-white/10 lg:pl-6">
            <section className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/30 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Needs attention
                </h3>
              </div>
              {data.needsAttention.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                  No products need attention. All submissions are reviewed.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {data.needsAttention.map((item) => (
                    <div key={item._id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          {item.reason} · Submitted {formatTimeAgo(item.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/admin/products-management/${item._id}`)}
                        className="h-8 px-3 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-400 transition inline-flex items-center gap-1"
                      >
                        Review
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Top sellers by revenue
              </h3>
              {data.topSellers.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-white/60">
                  No seller data available yet.
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
                          <p className="text-sm font-semibold">{seller.name}</p>
                          <p className="text-xs text-slate-500 dark:text-white/60">
                            {seller.productCount} products · {seller.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(seller.revenue)}</p>
                        <button
                          onClick={() => router.push(`/dashboard/admin/users/${seller.id}`)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
                        >
                          View
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Catalog health
              </h3>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/60">
                    <span>Approval rate</span>
                    <span>{data.health.approvalRate}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${data.health.approvalRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/60">
                  <span>Avg time to approval</span>
                  <span className="text-slate-900 dark:text-white inline-flex items-center gap-1">
                    {data.health.avgApprovalDays} days
                    {data.health.avgApprovalDays >= 30 && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/60">
                  <span>Active sellers</span>
                  <span className="text-slate-900 dark:text-white inline-flex items-center gap-1">
                    {data.health.activeSellers}
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-white/40">Data updates every 15 minutes.</p>
      </main>
    </div>
  );
}
