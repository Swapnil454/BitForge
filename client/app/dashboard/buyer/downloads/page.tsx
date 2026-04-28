"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function BuyerDownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
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
          `Download limit reached (${error.response.data.downloadLimit}). Contact support for assistance.`
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
    []
  );

  const filteredDownloads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = downloads.filter((download) => {
      if (!normalizedQuery) return true;
      return [download.productName, download.sellerName]
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

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#05050a] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_58%)]" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-cyan-400/6 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05050a]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <BitForgeBrand role="Buyer" />
          <button
            onClick={() => router.push("/dashboard/buyer")}
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-400/30 hover:bg-white/[0.08]"
          >
            Back to dashboard
          </button>
        </div>
      </header>

      <section className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <section className="border-b border-white/10 pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by product or seller"
                className="w-full rounded-2xl border border-white/10 bg-[#0a1423] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/30 focus:outline-none"
              />
              <div className="flex rounded-2xl border border-white/10 bg-[#0a1423] p-1">
                <SortButton label="Recent" active={sortBy === "recent"} onClick={() => setSortBy("recent")} />
                <SortButton label="Title" active={sortBy === "title"} onClick={() => setSortBy("title")} />
                <SortButton label="Amount" active={sortBy === "amount"} onClick={() => setSortBy("amount")} />
              </div>
            </div>
            <p className="text-sm text-slate-400">
              {filteredDownloads.length} item{filteredDownloads.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#08111d]/78 shadow-[0_18px_50px_rgba(2,6,23,0.24)]">
          <div className="border-b border-white/10 px-5 py-4 sm:px-8">
            <div className="grid gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid-cols-[100px_minmax(0,1.8fr)_minmax(260px,1fr)_auto]">
              <span>Preview</span>
              <span>Product</span>
              <span>Purchase details</span>
              <span className="md:text-right">Actions</span>
            </div>
          </div>

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
              {filteredDownloads.map((download) => {
                const isDownloading = downloading === download._id;
                const downloadCount = Number(download.downloadCount || 0);
                const downloadLimit = Number(download.downloadLimit || 5);
                const remaining = Math.max(downloadLimit - downloadCount, 0);
                const isLimitReached = remaining <= 0;

                return (
                  <article
                    key={download._id}
                    className="group grid gap-4 px-5 py-5 transition hover:bg-white/[0.02] sm:px-8 md:grid-cols-[100px_minmax(0,1.8fr)_minmax(260px,1fr)_auto] md:items-center"
                  >
                    <Thumbnail title={download.productName} url={download.thumbnailUrl} />

                    <div className="min-w-0">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <h2 className="truncate text-lg font-semibold text-white transition group-hover:text-cyan-100">
                          {download.productName}
                        </h2>
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                            isLimitReached
                              ? "border border-amber-400/20 bg-amber-400/10 text-amber-200"
                              : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                          }`}
                        >
                          {isLimitReached ? "Download limit reached" : `${remaining} downloads remaining`}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        Purchased from {download.sellerName}. File access remains available from your buyer workspace.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <Detail label="Purchased" value={formatCompactDate(download.purchaseDate)} />
                      <Detail label="Time" value={formatTime(download.purchaseDate)} />
                      <Detail label="Amount" value={currency.format(download.amount || 0)} accent />
                      <Detail label="Recency" value={getDaysAgo(download.purchaseDate)} />
                      <Detail label="Used" value={`${downloadCount}/${downloadLimit}`} />
                      <Detail label="Remaining" value={`${remaining}/${downloadLimit}`} accent={!isLimitReached} />
                    </div>

                    <div className="flex flex-col gap-2 md:items-end">
                      <button
                        onClick={() => handleDownload(download)}
                        disabled={isDownloading || isLimitReached}
                        className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                      >
                        {isLimitReached ? "Download unavailable" : isDownloading ? "Downloading..." : "Download file"}
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/buyer/purchases/${download._id}`)}
                        className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:border-cyan-400/30 hover:bg-white/[0.08]"
                      >
                        View details
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
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
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-950"
          : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Thumbnail({ title, url }: { title: string; url?: string | null }) {
  if (url) {
    return (
      <div className="h-24 w-24 overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/80">
        <img src={url} alt={title || "Product thumbnail"} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 items-end rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(15,23,42,0.95))] p-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
      File
    </div>
  );
}

function Detail({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={accent ? "mt-1 font-medium text-cyan-200" : "mt-1 text-white"}>{value}</p>
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

