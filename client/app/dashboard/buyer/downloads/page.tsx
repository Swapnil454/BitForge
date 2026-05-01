"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import api, { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Search, Filter, Check, Info, DownloadCloud } from "lucide-react";
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

export default function BuyerDownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, PurchaseDetails>>({});
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalRecords: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
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
      setPage(1); // Reset page on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    fetchDownloads();
  }, [page, sortBy, debouncedQuery]);

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const data = await buyerAPI.getAllPurchases({
        page,
        limit: 5,
        sortBy,
        search: debouncedQuery,
      });
      setDownloads(data.purchases || []);
      if (data.pagination) setPagination(data.pagination);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Failed to load downloads");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProductModal = async (download: DownloadItem) => {
    setSelectedProductId(download._id);
    if (detailsById[download._id]) {
      return;
    }

    try {
      setLoadingDetailsId(download._id);
      const data = await buyerAPI.getPurchaseDetails(download._id);
      setDetailsById((prev) => ({ ...prev, [download._id]: data }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load product details");
    } finally {
      setLoadingDetailsId(null);
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

      fetchDownloads();
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

  const selectedDownload = useMemo(
    () => downloads.find((item) => item._id === selectedProductId) || null,
    [downloads, selectedProductId],
  );
  const selectedDetails = selectedProductId ? detailsById[selectedProductId] : null;
  const isLoadingSelectedDetails = selectedProductId === loadingDetailsId;

  return (
    <div className="min-h-screen bg-[#05050a] text-white scroll-smooth">
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <input
                  type="text"
                  placeholder="Search product, seller, order ID"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/12 bg-white/5 pl-10 pr-3 text-sm text-white placeholder:text-white/40 transition focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="relative" ref={filterMenuRef}>
                <button
                  onClick={() => setFilterMenuOpen((prev) => !prev)}
                  className="h-11 px-3 sm:px-4 rounded-xl border border-white/12 bg-white/5 hover:bg-white/10 hover:border-white/25 inline-flex items-center gap-2 transition"
                >
                  <Filter className="h-4 w-4 text-white/80" />
                  <span className="hidden sm:inline text-sm text-white/80">Sort By</span>
                </button>

                <AnimatePresence>
                  {filterMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/40 z-20"
                    >
                      <p className="text-[11px] uppercase tracking-wider text-white/45 mb-2">Sort</p>
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
                                ? "border-indigo-400/45 bg-indigo-500/25 text-white"
                                : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
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
            Array.from({ length: Math.min(5, pagination.limit || 5) }).map((_, i) => (
              <PurchaseCardSkeleton key={i} />
            ))
          ) : downloads.length === 0 ? (
            <div className="py-16 text-center rounded-[28px] border border-white/10 bg-[#08111d]/78 shadow-[0_20px_55px_rgba(2,6,23,0.28)]">
              <p className="text-lg font-semibold text-white">No matching downloads</p>
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
                  className="group flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 relative overflow-hidden"
                >
                  <Thumbnail title={download.productName} url={download.thumbnailUrl} />

                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold text-white transition group-hover:text-cyan-400 sm:text-xl">
                            {download.productName}
                          </h2>
                          <p className="mt-1 text-sm text-slate-400 truncate">
                            {download.sellerName}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenProductModal(download)}
                          className="text-slate-500 hover:text-white transition p-1 shrink-0"
                          title="View Details"
                        >
                          <Info className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="mt-2.5 text-xs font-medium text-slate-500">
                        {formatCompactDate(download.purchaseDate)} <span className="mx-1.5">•</span> {currency.format(download.amount || 0)}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex flex-col gap-2 flex-1 w-full sm:max-w-[200px]">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                          <span>{isLimitReached ? "Limit reached" : `${remaining} downloads left`}</span>
                          <span>{downloadCount} / {downloadLimit}</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLimitReached ? "bg-slate-500" : "bg-cyan-400"
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
                          className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/20"
                        >
                          View Order
                        </button>
                        <button
                          onClick={() => handleDownload(download)}
                          disabled={isDownloading || isLimitReached}
                          className="flex items-center gap-2 rounded-lg bg-white/[0.08] border border-white/[0.08] px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.15] disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500"
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

        {!loading && pagination.totalRecords > 0 && (
          <div className="mt-8 space-y-3">
            <p className="text-center text-white/40 text-sm">
              Showing page {pagination.page} of {pagination.totalPages} • {pagination.totalRecords} total
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              <span className="px-4 py-2 rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-200 text-sm font-semibold min-w-16 text-center">
                {pagination.page}
              </span>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

      <AnimatePresence>
        {selectedDownload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProductId(null)}
            className="fixed inset-0 z-50 bg-black/75 p-3 backdrop-blur-sm sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#08111d] shadow-[0_0_80px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 sm:px-5">
                <h3 className="text-base font-semibold text-white">Product Details</h3>
                <button
                  onClick={() => setSelectedProductId(null)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Close
                </button>
              </div>

              <div className="overflow-y-auto">
                <div className="p-4 sm:p-5 border-b border-white/5 bg-[#08111d]">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="relative w-full sm:w-32 sm:h-28 aspect-video sm:aspect-auto shrink-0 overflow-hidden rounded-xl bg-[#05050a] border border-white/5 shadow-md">
                      {selectedDownload.thumbnailUrl ? (
                        <img
                          src={selectedDownload.thumbnailUrl}
                          alt={selectedDownload.productName}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-end p-3 bg-gradient-to-br from-indigo-500/10 to-slate-900/50">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">File</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col min-w-0 w-full justify-center sm:min-h-[112px]">
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug truncate">
                        {selectedDownload.productName}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-400 font-medium">by <span className="text-slate-300">{selectedDownload.sellerName}</span></p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-slate-300 border border-white/[0.05]">
                          {formatCompactDate(selectedDownload.purchaseDate)}
                        </span>
                        <span className="rounded bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-300 border border-indigo-500/20">
                          {currency.format(selectedDownload.amount || 0)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleDownload(selectedDownload)}
                          disabled={
                            downloading === selectedDownload._id ||
                            Math.max(
                              Number(selectedDownload.downloadLimit || 5) - Number(selectedDownload.downloadCount || 0),
                              0,
                            ) <= 0
                          }
                          className="rounded-lg bg-white text-slate-950 px-4 py-1.5 text-xs font-bold shadow-md shadow-white/5 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500 disabled:shadow-none"
                        >
                          {downloading === selectedDownload._id ? "Downloading..." : "Download File"}
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/buyer/purchases/${selectedDownload._id}`)}
                          className="rounded-lg border border-white/10 bg-transparent px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.05]"
                        >
                          Full Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-[#05050a]">
                  {isLoadingSelectedDetails ? (
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />
                      Fetching latest details...
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {selectedDetails?.productDescription && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                            Description
                          </p>
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
                            {selectedDetails.productDescription}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                          Download Activity
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-white/5 bg-[#08111d] p-3">
                          <Detail label="Purchased" value={formatCompactDate(selectedDownload.purchaseDate)} />
                          <Detail label="Time" value={formatTime(selectedDownload.purchaseDate)} />
                          <Detail
                            label="Used"
                            value={`${Number(selectedDownload.downloadCount || 0)}/${Number(
                              selectedDownload.downloadLimit || 5,
                            )}`}
                          />
                          <Detail
                            label="Remaining"
                            value={`${Math.max(
                              Number(selectedDownload.downloadLimit || 5) - Number(selectedDownload.downloadCount || 0),
                              0,
                            )}`}
                            accent
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                          System Metadata
                        </p>
                        <div className="grid gap-2 rounded-xl border border-white/5 bg-[#08111d] p-3">
                          <Detail label="Order ID" value={selectedDownload.orderId || selectedDetails?.orderId || "N/A"} mono />
                          <Detail label="Product ID" value={selectedDownload.productId || selectedDetails?.productId || "N/A"} mono />
                          <Detail label="Razorpay Ref" value={selectedDetails?.razorpayPaymentId || "N/A"} mono />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}

function Thumbnail({ title, url }: { title: string; url?: string | null }) {
  if (url) {
    return (
      <div className="h-44 w-full shrink-0 overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 sm:h-32 sm:w-44">
        <img src={url} alt={title || "Product thumbnail"} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-44 w-full shrink-0 items-end rounded-xl border border-white/5 bg-gradient-to-br from-indigo-500/10 to-slate-900/50 p-4 text-[10px] font-medium uppercase tracking-widest text-slate-400 sm:h-32 sm:w-44">
      File
    </div>
  );
}

function Detail({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p
        className={`${accent ? "text-cyan-200" : "text-white"} ${mono ? "font-mono text-xs break-all" : "text-sm break-words"} mt-1`}
      >
        {value}
      </p>
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
