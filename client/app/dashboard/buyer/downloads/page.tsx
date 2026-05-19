"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import api, { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Search, Filter, Check, Info, DownloadCloud, Loader2 } from "lucide-react";
import PageHeader from "../transactions/components/PageHeader";
import PurchaseCardSkeleton from "../purchases/components/PurchaseCardSkeleton";

type SortKey = "newest" | "oldest";

interface DownloadItem {
  _id: string;
  orderId?: string;
  productId?: string | null;
  productName: string;
  thumbnailUrl?: string | null;
  sellerName: string;
  amount: number;
  purchaseDate: string;
  downloadCount?: number;
  downloadLimit?: number;
}

interface PurchaseDetails {
  _id: string;
  orderId?: string;
  productName?: string;
  productDescription?: string;
  productId?: string;
  thumbnailUrl?: string;
  sellerName?: string;
  sellerEmail?: string;
  amount?: number;
  purchaseDate?: string;
  downloadUrl?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  category?: string;
}

const PAGE_LIMIT = 7;

export default function BuyerDownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Debounce search — reset to page 1 on new query/sort
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset list when filters change
  useEffect(() => {
    void fetchPage(1, true);
  }, [sortBy, debouncedQuery]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore && !loading) {
          void fetchPage(currentPage + 1, false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, loading, currentPage]);

  const fetchPage = async (targetPage: number, isInitial: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await buyerAPI.getAllPurchases({
        page: targetPage,
        limit: PAGE_LIMIT,
        sortBy,
        search: debouncedQuery,
      });
      const incoming = data.purchases || [];
      setDownloads((prev) => (isInitial ? incoming : [...prev, ...incoming]));
      setHasNextPage(data.pagination?.hasNextPage ?? false);
      setCurrentPage(targetPage);
    } catch {
      toast.error("Failed to load downloads");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  const handleDownload = async (download: DownloadItem) => {
    const loadingToast = toast.loading("Preparing secure download...");

    try {
      setDownloading(download._id);

      const response = await api.get(`/download/${download._id}`, {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const contentDisposition = response.headers["content-disposition"];
      let filename = "download.pdf";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"|filename=([^;\s]+)/);
        if (filenameMatch) {
          filename = filenameMatch[1] || filenameMatch[2];
        }
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const nextCount = response.headers["x-download-count"];
      const limit = response.headers["x-download-limit"];

      toast.dismiss(loadingToast);

      if (nextCount && limit) {
        const remaining = Math.max(parseInt(limit, 10) - parseInt(nextCount, 10), 0);
        toast.success(`Download started! ${remaining} downloads remaining.`);
      } else {
        toast.success("Download started successfully!");
      }

      void fetchPage(1, true);
    } catch (error: any) {
      toast.dismiss(loadingToast);

      if (error.response?.status === 404) {
        toast.error("This file is no longer available. Please contact admin for assistance.");
      } else if (error.response?.status === 403 && error.response?.data?.downloadLimit) {
        toast.error(
          `Download limit reached (${error.response.data.downloadLimit}). Contact support for assistance.`,
        );
      } else {
        toast.error(error.response?.data?.message || error.message || "Download failed");
      }
    } finally {
      setDownloading(null);
    }
  };

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white scroll-smooth">
      <PageHeader
        backHref="/dashboard/buyer"
        backLabel="Dashboard"
        title="Your Downloads"
        subtitle="access your purchased digital files"
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:py-10">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 md:flex-row md:items-start">
          <div className="w-full flex-1">
            <div className="flex w-full items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/45" />
                <input
                  type="text"
                  placeholder="Search product, seller, order ID"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/35 transition focus:border-violet-500 dark:focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="relative" ref={filterMenuRef}>
                <button
                  onClick={() => setFilterMenuOpen((prev) => !prev)}
                  className="h-11 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/25 inline-flex items-center gap-2 transition"
                >
                  <Filter className="h-4 w-4 text-slate-700 dark:text-white/80" />
                  <span className="hidden sm:inline text-sm text-slate-700 dark:text-white/80">Sort By</span>
                </button>

                <AnimatePresence>
                  {filterMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-3 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/40 z-20"
                    >
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/45 mb-2">Sort</p>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { key: "newest", label: "Newest First" },
                          { key: "oldest", label: "Oldest First" },
                        ].map((sort) => (
                          <button
                            key={sort.key}
                            onClick={() => {
                              setSortBy(sort.key as SortKey);
                              setFilterMenuOpen(false);
                            }}
                            className={`rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between transition border ${
                              sortBy === sort.key
                                ? "border-indigo-400/45 bg-indigo-500/25 text-slate-900 dark:text-white"
                                : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                            }`}
                          >
                            {sort.label}
                            {sortBy === sort.key && <Check className="h-4 w-4 text-indigo-300" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <section className="flex flex-col gap-4 sm:gap-5">
          {loading ? (
            Array.from({ length: PAGE_LIMIT }).map((_, i) => (
              <PurchaseCardSkeleton key={i} />
            ))
          ) : downloads.length === 0 ? (
            <div className="py-16 text-center rounded-[28px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#08111d]/78 shadow-xl shadow-slate-200/50 dark:shadow-[0_20px_55px_rgba(2,6,23,0.28)]">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">No matching downloads</p>
              <p className="mt-2 text-sm text-slate-400">
                Try a different search term or clear the filter to view your full library.
              </p>
            </div>
          ) : (
            downloads.map((download, index) => {
              const isDownloading = downloading === download._id;
              const downloadCount = Number(download.downloadCount || 0);
              const downloadLimit = Number(download.downloadLimit || 5);
              const remaining = Math.max(downloadLimit - downloadCount, 0);
              const isLimitReached = remaining <= 0;

              return (
                <motion.article
                  key={download._id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
                  className="group flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 relative overflow-hidden shadow-xs hover:shadow-md dark:shadow-none"
                >
                  <Thumbnail title={download.productName} url={download.thumbnailUrl} />

                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-white transition group-hover:text-cyan-600 dark:group-hover:text-cyan-400 sm:text-xl">
                            {download.productName}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">
                            {download.sellerName}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/buyer/purchases/${download._id}`)}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition p-1 shrink-0"
                          title="View Details"
                        >
                          <Info className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="mt-2.5 text-xs font-medium text-slate-600 dark:text-slate-500">
                        {formatCompactDate(download.purchaseDate)} <span className="mx-1.5">•</span> {currency.format(download.amount || 0)}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex flex-col gap-2 flex-1 w-full sm:max-w-[200px]">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                          <span>{isLimitReached ? "Limit reached" : `${remaining} downloads left`}</span>
                          <span>{downloadCount} / {downloadLimit}</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLimitReached ? "bg-slate-400 dark:bg-slate-500" : "bg-cyan-500 dark:bg-cyan-400"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max((downloadCount / Math.max(downloadLimit, 1)) * 100, 0)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/buyer/purchases/${download._id}`)}
                          className="rounded-lg border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 transition hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                        >
                          View Order
                        </button>
                        <button
                          onClick={() => handleDownload(download)}
                          disabled={isDownloading || isLimitReached}
                          className="flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-white/[0.08] border border-slate-900 dark:border-white/[0.08] px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:hover:bg-white/[0.15] disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-white/5 disabled:border-slate-200 dark:disabled:border-white/5 disabled:text-slate-400 dark:disabled:text-slate-500 shadow-md dark:shadow-none"
                        >
                          {isLimitReached ? "Unavailable" : isDownloading ? "Downloading..." : "Download"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </section>

        <div ref={sentinelRef} className="h-4" />

        {loadingMore && (
          <div className="flex justify-center py-6">
            <div className="flex items-center gap-2 text-slate-500 dark:text-white/40 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
              <span>Loading more downloads...</span>
            </div>
          </div>
        )}

        {!hasNextPage && !loadingMore && downloads.length > 0 && (
          <p className="text-center text-xs text-slate-400 dark:text-white/25 py-4 tracking-wide">
            — You've reached the end —
          </p>
        )}

      </main>
    </div>
  );
}

function Thumbnail({ title, url }: { title: string; url?: string | null }) {
  if (url) {
    return (
      <div className="h-44 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-900/50 sm:h-32 sm:w-44">
        <img src={url} alt={title || "Product thumbnail"} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-44 w-full shrink-0 items-end rounded-xl border border-slate-200 dark:border-white/5 bg-gradient-to-br from-indigo-100 dark:from-indigo-500/10 to-slate-200 dark:to-slate-900/50 p-4 text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400 sm:h-32 sm:w-44">
      File
    </div>
  );
}

function formatCompactDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDaysAgo(date: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));

  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
