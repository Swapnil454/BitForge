"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Download,
  Loader2,
  ArrowUpRight,
  ChevronLeft,
  MoreVertical,
  CreditCard,
  ShoppingBag,
  DownloadCloud
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

interface PurchaseAnalyticsData {
  stats: {
    total: number;
    totalValue: number;
    totalDownloads: number;
    recentSubmissions: number;
    limitReached: number;
  };
  categories: { _id: string; count: number }[];
  topSellers: { id: string; name: string; email: string; purchaseCount: number; spentValue: number }[];
  recentPurchases: {
    _id: string;
    productName: string;
    category: string;
    sellerName: string;
    amount: number;
    downloadCount: number;
    createdAt: string;
  }[];
  timeline: { labels: string[]; counts: number[]; amounts: number[] };
}

const categoryColors: Record<string, string> = {
  software: "#3B82F6",
  ebook: "#8B5CF6",
  video: "#EC4899",
  audio: "#F59E0B",
  graphics: "#10B981",
  template: "#06B6D4",
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

export default function BuyerPurchasesAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all");
  const [data, setData] = useState<PurchaseAnalyticsData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await buyerAPI.getPurchasesAnalytics({ dateRange: range });
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
    toast.error("PDF generation for purchases coming soon.");
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
    const amounts = data?.timeline.amounts || [];
    return {
      labels,
      datasets: [
        {
          label: "Amount Spent (₹)",
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
          title: { display: true, text: "Amount (₹)", color: "#94A3B8", font: { size: 11, weight: 600 as const } },
        },
      },
    }),
    [showLegend]
  );

  const donutData = useMemo(() => {
    const labels = data?.categories.map((c) => formatCategory(c._id)) || [];
    const counts = data?.categories.map((c) => c.count) || [];
    const colors = data?.categories.map((c) => categoryColors[c._id.toLowerCase()] || "#94A3B8") || [];
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
           <p className="text-sm font-medium">Loading purchase analytics...</p>
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
              Purchase Analytics
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Purchases", value: stats.total, accent: "border-t-2 border-t-cyan-400" },
            { label: "Total Spent", value: formatCurrency(stats.totalValue || 0), accent: "border-t-2 border-t-emerald-400" },
            { label: "Total Downloads", value: stats.totalDownloads, accent: "border-t-2 border-t-violet-400" },
            { label: "Limit Reached", value: stats.limitReached, accent: "border-t-2 border-t-pink-400" },
            { label: "New Purchases", value: stats.recentSubmissions || 0, accent: "border-t-2 border-t-amber-400" },
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
                Purchase categories
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
                    const color = categoryColors[category._id.toLowerCase()] || "#94A3B8";
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
                Spending timeline
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
                  Recent purchases
                </h3>
                <button
                  onClick={() => router.push("/dashboard/buyer/purchases")}
                  className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  View all
                </button>
              </div>
              {data.recentPurchases.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-white/60">
                  No purchases found in this period.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <div className="min-w-[600px] divide-y divide-slate-100 dark:divide-white/5">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr] text-xs uppercase tracking-wide text-slate-400 pb-2">
                      <span>Product & Category</span>
                      <span>Seller</span>
                      <span>Value</span>
                      <span>Date</span>
                    </div>
                    {data.recentPurchases.map((item) => (
                      <div
                        key={item._id}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center text-left text-sm py-3 text-slate-700 dark:text-white/80"
                      >
                        <div>
                           <span className="font-semibold block text-slate-900 dark:text-white truncate pr-4">{item.productName}</span>
                           <span className="text-xs text-slate-500 dark:text-white/50">{formatCategory(item.category)}</span>
                        </div>
                        <div>
                           <span className="block truncate pr-4">{item.sellerName}</span>
                        </div>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.amount)}</span>
                        <span className="text-slate-500 dark:text-white/60">{formatTimeAgo(item.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6 lg:border-l lg:border-slate-200/70 dark:lg:border-white/10 lg:pl-6">
            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Top Sellers
              </h3>
              {data.topSellers.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-white/60">
                  No purchase data available.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {data.topSellers.map((seller, index) => (
                    <div key={seller.email} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-semibold text-slate-500 dark:text-white/60">#{index + 1}</div>
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-white/80">
                          {getInitials(seller.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{seller.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-white/50">
                            {seller.purchaseCount} {seller.purchaseCount === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right pl-2">
                        <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{formatCurrency(seller.spentValue)}</p>
                      </div>
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