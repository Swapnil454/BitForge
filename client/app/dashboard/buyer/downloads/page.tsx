"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import api, { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import BitForgeBrand from "../../components/logo/BitForgeBrand";

type SortKey = "recent" | "title" | "amount";

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
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const router = useRouter();

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      const data = await buyerAPI.getAllPurchases();
      setDownloads(data.purchases || []);
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

  const filteredDownloads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = downloads.filter((download) => {
      if (!normalizedQuery) return true;
      return [download.productName, download.sellerName, download.orderId, download.productId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "title") {
        return String(a.productName || "").localeCompare(String(b.productName || ""));
      }

      if (sortBy === "amount") {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }

      return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
    });
  }, [downloads, query, sortBy]);

  const selectedDownload = useMemo(
    () => downloads.find((item) => item._id === selectedProductId) || null,
    [downloads, selectedProductId],
  );
  const selectedDetails = selectedProductId ? detailsById[selectedProductId] : null;
  const isLoadingSelectedDetails = selectedProductId === loadingDetailsId;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#05050a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.2),transparent_45%),radial-gradient(circle_at_85%_22%,rgba(34,211,238,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute right-[-15%] top-16 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05050a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <BitForgeBrand role="Buyer" />
          <button
            onClick={() => router.push("/dashboard/buyer")}
            className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-400/40 hover:bg-white/[0.09]"
          >
            Back to dashboard
          </button>
        </div>
      </header>

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-5 sm:px-5 sm:py-8 lg:px-6">
        <section className="rounded-3xl border border-white/10 bg-[#08111d]/88 p-3 shadow-[0_16px_45px_rgba(2,6,23,0.35)] sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white sm:text-2xl">Your downloads</h1>
            <span className="text-sm text-slate-400">
              {filteredDownloads.length} item{filteredDownloads.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex w-full flex-1 flex-col gap-3 md:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product, seller, order ID or product ID"
                className="w-full rounded-2xl border border-white/12 bg-[#0a1423] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
              />
              <div className="grid grid-cols-3 rounded-2xl border border-white/12 bg-[#0a1423] p-1 md:w-[280px]">
                <SortButton label="Recent" active={sortBy === "recent"} onClick={() => setSortBy("recent")} />
                <SortButton label="Title" active={sortBy === "title"} onClick={() => setSortBy("title")} />
                <SortButton label="Amount" active={sortBy === "amount"} onClick={() => setSortBy("amount")} />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#08111d]/78 shadow-[0_20px_55px_rgba(2,6,23,0.28)]">
          {loading ? (
            <div className="flex justify-center px-6 py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-cyan-400" />
            </div>
          ) : filteredDownloads.length === 0 ? (
            <div className="px-6 py-16 text-center sm:px-8">
              <p className="text-lg font-semibold text-white">No matching downloads</p>
              <p className="mt-2 text-sm text-slate-400">
                Try a different search term or clear the filter to view your full library.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/8">
              {filteredDownloads.map((download, index) => {
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
                    className="group px-3 py-4 transition hover:bg-white/[0.03] sm:px-5"
                  >
                    <div className="flex items-center gap-3">
                      <Thumbnail title={download.productName} url={download.thumbnailUrl} />

                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => handleOpenProductModal(download)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="line-clamp-2 break-words text-base font-semibold text-white transition group-hover:text-cyan-100 sm:text-lg">
                                {download.productName}
                              </h2>
                              <p className="mt-1 text-sm text-slate-300">by {download.sellerName}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {formatCompactDate(download.purchaseDate)} • {currency.format(download.amount || 0)}
                              </p>
                            </div>
                            <span
                              className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-slate-200 transition"
                            >
                              ⓘ
                            </span>
                          </div>
                        </button>

                        <span
                          className={`mt-3 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                            isLimitReached
                              ? "border border-amber-400/20 bg-amber-400/10 text-amber-200"
                              : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                          }`}
                        >
                          {!isLimitReached && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />}
                          {isLimitReached ? "Download limit reached" : `${remaining} downloads remaining`}
                        </span>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleDownload(download)}
                            disabled={isDownloading || isLimitReached}
                            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                          >
                            {isLimitReached ? "Unavailable" : isDownloading ? "Downloading..." : "Download"}
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/buyer/purchases/${download._id}`)}
                            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-400/30 hover:bg-white/[0.08]"
                          >
                            Full page
                          </button>
                          <span className="text-xs text-slate-400">{getDaysAgo(download.purchaseDate)}</span>
                        </div>

                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLimitReached ? "bg-amber-300/80" : "bg-cyan-400"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max((downloadCount / Math.max(downloadLimit, 1)) * 100, 0),
                              )}%`,
                            }}
                          />
                        </div>

                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      <AnimatePresence>
        {selectedDownload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProductId(null)}
            className="fixed inset-0 z-50 bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#08111d] shadow-[0_28px_80px_rgba(2,6,23,0.55)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
                <h3 className="text-lg font-semibold text-white">Product details</h3>
                <button
                  onClick={() => setSelectedProductId(null)}
                  className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-white transition hover:bg-white/[0.08]"
                >
                  Close
                </button>
              </div>

              <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-start gap-3">
                  <Thumbnail title={selectedDownload.productName} url={selectedDownload.thumbnailUrl} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-white sm:text-xl">{selectedDownload.productName}</h2>
                    <p className="mt-1 text-sm text-slate-300">by {selectedDownload.sellerName}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatCompactDate(selectedDownload.purchaseDate)} • {currency.format(selectedDownload.amount || 0)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleDownload(selectedDownload)}
                        disabled={
                          downloading === selectedDownload._id ||
                          Math.max(
                            Number(selectedDownload.downloadLimit || 5) - Number(selectedDownload.downloadCount || 0),
                            0,
                          ) <= 0
                        }
                        className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                      >
                        {downloading === selectedDownload._id ? "Downloading..." : "Download"}
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/buyer/purchases/${selectedDownload._id}`)}
                        className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-400/30 hover:bg-white/[0.08]"
                      >
                        Full page
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                  {isLoadingSelectedDetails ? (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-cyan-400" />
                      Loading product details...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDetails?.productDescription && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Description
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">
                            {selectedDetails.productDescription}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Detail label="Purchased" value={formatCompactDate(selectedDownload.purchaseDate)} />
                        <Detail label="Time" value={formatTime(selectedDownload.purchaseDate)} />
                        <Detail label="Amount" value={currency.format(selectedDownload.amount || 0)} accent />
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
                          )}/${Number(selectedDownload.downloadLimit || 5)}`}
                          accent
                        />
                        <Detail label="Category" value={selectedDetails?.category || "N/A"} />
                      </div>

                      <div className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/50 p-3">
                        <Detail label="Order ID" value={selectedDownload.orderId || selectedDetails?.orderId || "N/A"} mono />
                        <Detail label="Product ID" value={selectedDownload.productId || selectedDetails?.productId || "N/A"} mono />
                        <Detail label="Purchase ID" value={selectedDownload._id} mono />
                        <Detail label="Seller Email" value={selectedDetails?.sellerEmail || "N/A"} />
                        <Detail label="Razorpay Order ID" value={selectedDetails?.razorpayOrderId || "N/A"} mono />
                        <Detail label="Razorpay Payment ID" value={selectedDetails?.razorpayPaymentId || "N/A"} mono />
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
  );
}

function SortButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
        active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Thumbnail({ title, url }: { title: string; url?: string | null }) {
  if (url) {
    return (
      <div className="h-28 w-[46%] min-w-[148px] max-w-[182px] overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 sm:h-32 sm:w-[220px] sm:rounded-2xl">
        <img src={url} alt={title || "Product thumbnail"} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-28 w-[46%] min-w-[148px] max-w-[182px] items-end rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(15,23,42,0.95))] p-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 sm:h-32 sm:w-[220px] sm:rounded-2xl">
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
