"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import api, { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Search, Filter, Check, Info, DownloadCloud, Loader2, Download, AlertTriangle, TrendingUp, Calendar, Hash, Copy } from "lucide-react";
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const cacheKey = `buyer_downloads_page1_${sortBy}_${debouncedQuery}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setDownloads(parsedCache.downloads);
        setHasNextPage(parsedCache.hasNextPage);
        setLoading(false);
      }
    } catch (e) {}

    void fetchPage(1, true);
  }, [sortBy, debouncedQuery]);

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
    
    const cacheKey = `buyer_downloads_page1_${sortBy}_${debouncedQuery}`;
    if (isInitial) {
      if (!sessionStorage.getItem(cacheKey)) {
        setLoading(true);
      }
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await buyerAPI.getAllPurchases({
        page: targetPage,
        limit: PAGE_LIMIT,
        sortBy,
        search: debouncedQuery,
      });
      const incoming = data.purchases || [];
      const hasNext = data.pagination?.hasNextPage ?? false;
      
      if (isInitial) {
        setDownloads(incoming);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            downloads: incoming,
            hasNextPage: hasNext
          }));
        } catch (e) {}
      } else {
        setDownloads((prev) => {
          const existingIds = new Set(prev.map(p => p._id));
          const newItems = incoming.filter((p: DownloadItem) => !existingIds.has(p._id));
          return [...prev, ...newItems];
        });
      }
      setHasNextPage(hasNext);
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

      const response = await api.get(`/download/${download._id}`);

      if (response.data?.mode === "redirect" && response.data?.downloadUrl) {
        const downloadUrl = response.data.downloadUrl;
        const filename = response.data.filename || "download";

        if (downloadUrl.includes("cloudinary.com")) {
          // Legacy Cloudinary URL: Fetch as blob to force custom filename
          const res = await fetch(downloadUrl);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } else {
          // R2 Signed URL: Already handles filename in Content-Disposition
          const link = document.createElement("a");
          link.href = downloadUrl;
          // Don't set link.download property so browser relies on the server's Content-Disposition header
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        toast.dismiss(loadingToast);
        toast.success("Download started securely!");
        void fetchPage(1, true);
      } else {
        throw new Error("Invalid download response format");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);

      let errData: any = error.response?.data;
      if (errData && typeof errData.text === 'function') {
        try {
          const text = await errData.text();
          try {
            errData = JSON.parse(text);
          } catch {
            errData = { message: text.substring(0, 100) };
          }
        } catch {
          errData = error.response?.data;
        }
      } else if (errData && errData instanceof Blob) {
        try {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(errData);
          });
          try {
            errData = JSON.parse(text);
          } catch {
            errData = { message: text.substring(0, 100) };
          }
        } catch {
          errData = error.response?.data;
        }
      } else if (typeof errData === 'string') {
        try {
           errData = JSON.parse(errData);
        } catch {
           errData = { message: errData };
        }
      }

      if (error.response?.status === 404) {
        toast.error("This file is no longer available. Please contact admin for assistance.");
      } else if (error.response?.status === 403 && errData?.downloadLimit) {
        const limit = errData.downloadLimit;
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-sm w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-amber-200 dark:border-amber-500/30 flex items-start gap-3 p-4`}
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">
                  Download Limit Reached
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  You&apos;ve used all {limit} downloads for this product.
                  Contact support if you need more access.
                </p>
                <button
                  onClick={() => { toast.dismiss(t.id); window.open("/dashboard/support", "_blank"); }}
                  className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Contact Support →
                </button>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-white transition text-lg leading-none"
              >
                ×
              </button>
            </div>
          ),
          { duration: 6000 }
        );
      } else {
        toast.error(errData?.message || error.message || "Download failed");
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
        maximumFractionDigits: 2,
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
        rightSlot={
          <button
            onClick={() => router.push("/dashboard/buyer/purchases/analytics")}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-3 sm:py-5 lg:py-6">
        <div className="mb-3 flex flex-col justify-between gap-3 sm:mb-4 md:flex-row md:items-start">
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
                  className="group flex flex-col sm:flex-row p-4 sm:p-5 gap-4 sm:gap-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12141c] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 relative overflow-hidden shadow-xs hover:shadow-md dark:shadow-none"
                >
                  {/* Left Side: Thumbnail */}
                  <div className="w-full sm:w-44 shrink-0">
                    <Thumbnail title={download.productName} url={download.thumbnailUrl} />
                  </div>

                  {/* Right Side: Details */}
                  <div className="flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                          {download.productName}
                        </h2>
                        <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                           <Info className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Sold by <span className="font-semibold text-slate-900 dark:text-white">{download.sellerName}</span>
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatCompactDate(download.purchaseDate)}</span>
                        </div>
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 dark:text-slate-500">ID:</span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">{download._id.slice(-8)}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(download._id);
                              toast.success("Order ID copied");
                            }}
                            className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            title="Copy ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {currency.format(download.amount || 0)}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          PAID
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        onClick={() => router.push(`/dashboard/buyer/purchases/${download._id}`)}
                        className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-left"
                      >
                        View Details
                      </button>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex flex-col gap-1 flex-1 sm:w-36 text-left">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {isLimitReached ? <span className="text-rose-500">Limit reached</span> : <span>{remaining} downloads left</span>}
                            <span>{downloadCount}/{downloadLimit}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLimitReached ? "bg-slate-300 dark:bg-slate-600" : "bg-cyan-500 dark:bg-cyan-400"
                              }`}
                              style={{ width: `${Math.min(100, Math.max((downloadCount / Math.max(downloadLimit, 1)) * 100, 0))}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownload(download)}
                          disabled={isDownloading || isLimitReached}
                          className={`shrink-0 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                            isLimitReached 
                              ? "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5" 
                              : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 border border-transparent shadow-slate-900/20"
                          }`}
                        >
                          {isLimitReached ? "Unavailable" : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              {isDownloading ? "..." : "Download"}
                            </>
                          )}
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
      <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-900/50 sm:h-36 sm:w-44">
        <img src={url} alt={title || "Product thumbnail"} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-32 w-full shrink-0 items-end rounded-xl border border-slate-200 dark:border-white/5 bg-gradient-to-br from-indigo-100 dark:from-indigo-500/10 to-slate-200 dark:to-slate-900/50 p-4 text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400 sm:h-36 sm:w-44">
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
