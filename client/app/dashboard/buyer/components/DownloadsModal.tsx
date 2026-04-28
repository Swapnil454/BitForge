"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";

export default function DownloadsModal({ onClose }: { onClose: () => void }) {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
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

  const handleDownload = async (download: any) => {
    try {
      setDownloading(download._id);

      const details = await buyerAPI.getPurchaseDetails(download._id);
      const response = await fetch(details.downloadUrl);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const name = (details.filename || download.productName || "download")
        .replace(/[^a-z0-9_\-]/gi, "_")
        .toLowerCase();
      const filename = name.endsWith(".pdf") ? name : `${name}.pdf`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-2 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative w-full max-w-5xl overflow-hidden rounded-t-[28px] rounded-b-none border border-white/10 bg-[#0b1220]/95 shadow-[0_24px_80px_rgba(2,6,23,0.6)] sm:max-h-[84vh] sm:rounded-[28px]"
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-cyan-400/10 via-transparent to-sky-400/10" />

        <div className="relative flex max-h-[92vh] flex-col overflow-y-auto p-4 sm:max-h-[84vh] sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4 sm:mb-6">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Downloads
              </div>
              <h2 className="text-xl font-semibold text-white sm:text-3xl">
                My Downloads
              </h2>
              <p className="mt-1 text-sm text-slate-300 sm:text-base">
                Clean access to every file you have purchased.
              </p>
            </div>

            <button
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close downloads modal"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-14">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-cyan-400" />
            </div>
          ) : downloads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">No downloads yet</h3>
              <p className="mt-2 text-sm text-slate-400">
                Purchased files will appear here once your orders are completed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {downloads.map((download) => {
                const isDownloading = downloading === download._id;

                return (
                  <div
                    key={download._id}
                    className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.22)] transition hover:border-cyan-400/20 hover:bg-white/[0.045] sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 sm:h-28 sm:w-28">
                        {download.thumbnailUrl ? (
                          <img
                            src={download.thumbnailUrl}
                            className="h-full w-full object-cover"
                            alt={download.productName || "Product thumbnail"}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <svg
                              className="h-8 w-8"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <path d="m7 10 5 5 5-5" />
                              <path d="M12 15V3" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-white sm:text-xl">
                              {download.productName}
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                              Secure file access from your purchase history.
                            </p>
                          </div>
                          <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                            Available
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <Info label="Seller" value={download.sellerName} />
                          <Info
                            label="Purchased"
                            value={new Date(download.purchaseDate).toLocaleDateString()}
                          />
                          <Info
                            label="Time"
                            value={new Date(download.purchaseDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          />
                          <Info
                            label="Amount"
                            value={currency.format(download.amount || 0)}
                            highlight
                          />
                        </div>

                        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-3 py-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                          <span>{getDaysAgo(download.purchaseDate)}</span>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              onClick={() => handleDownload(download)}
                              disabled={isDownloading}
                              className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDownloading ? "Downloading..." : "Download"}
                            </button>

                            <button
                              onClick={() =>
                                router.push(`/dashboard/buyer/purchases/${download._id}`)
                              }
                              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                              View details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 border-t border-white/10 pt-4">
            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Info({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/25 px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={highlight ? "mt-1 font-semibold text-cyan-200" : "mt-1 text-white"}>
        {value}
      </p>
    </div>
  );
}

function getDaysAgo(date: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  );

  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
