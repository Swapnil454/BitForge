"use client";

import { useState, useRef, useEffect } from "react";
import { AlertCircle, Download, Eye, FileText, Package, Star, MoreHorizontal } from "lucide-react";
import { Purchase } from "../types";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

type PurchaseCardProps = {
  purchase: Purchase;
  downloading: boolean;
  onDownload: (orderId: string) => void;
  onReview: (purchase: Purchase) => void;
  onViewProduct: (productId: string | null) => void;
  onRaiseDispute: (orderId: string) => void;
};

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "success":
    case "paid":
      return { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", stripe: "bg-emerald-500" };
    case "pending":
      return { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", stripe: "bg-amber-500" };
    case "failed":
      return { bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", stripe: "bg-rose-500" };
    default:
      return { bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", stripe: "bg-slate-500" };
  }
};

const canReviewOrder = (status: string) =>
  ["completed", "success", "paid"].includes(status.toLowerCase());

export default function PurchaseCard({
  purchase,
  downloading,
  onDownload,
  onReview,
  onViewProduct,
  onRaiseDispute,
}: PurchaseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadLocked, setDownloadLocked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const downloadCount = purchase.downloadCount || 0;
  const downloadLimit = purchase.downloadLimit || 5;
  const remaining = Math.max(downloadLimit - downloadCount, 0);
  const isLimitReached = remaining <= 0;
  
  const statusConfig = getStatusConfig(purchase.status);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  return (
    <article className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col group hover:border-slate-300 dark:hover:border-white/10 transition-all shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-black/50">
      <div className="flex gap-4 sm:gap-5 items-center">
        {/* Thumbnail - Fixed Left */}
        <div className="w-[88px] h-[88px] sm:w-[110px] sm:h-[110px] shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 relative shadow-inner">
          {purchase.thumbnailUrl ? (
            <img
              src={purchase.thumbnailUrl}
              alt={purchase.productName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300 dark:text-white/20" />
            </div>
          )}
        </div>

        {/* Content - Right */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 relative">
          <div>
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate tracking-tight leading-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {purchase.productName}
              </h3>
              
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  className="p-1.5 -mt-1 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Actions"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-44 sm:w-48 bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 z-20 overflow-hidden py-1.5"
                    >
                      {canReviewOrder(purchase.status) && purchase.productId && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onReview(purchase);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <Star className="w-4 h-4 text-amber-500" /> Review
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onViewProduct(purchase.productId);
                        }}
                        disabled={!purchase.productId}
                        className={`w-full flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                          !purchase.productId ? "opacity-40 cursor-not-allowed text-slate-400 dark:text-white/40" : "text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <Eye className="w-4 h-4 text-cyan-500" /> Product
                      </button>
                      
                      <Link
                        href={`/dashboard/buyer/invoice/${purchase._id}`}
                        onClick={() => setMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-500" /> Invoice
                      </Link>
                      
                      <div className="h-px bg-slate-200 dark:bg-white/10 my-1.5 mx-2" />
                      
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onRaiseDispute(purchase._id);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4" /> Dispute
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${statusConfig.bg}`}>
                {purchase.status}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {new Date(purchase.purchaseDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate mb-3 sm:mb-0">
              Order #{purchase.orderId.slice(-8).toUpperCase()}
            </div>
          </div>

          {/* Price & Primary Action */}
          <div className="flex flex-col mt-3">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight shrink-0">
                ₹{purchase.amount.toLocaleString()}
              </p>
              
              <button
                type="button"
                onClick={() => {
                  if (!purchase.productId) {
                    toast.error("Product is unavailable. Please contact support team.", {
                      id: `unavailable-${purchase._id}`,
                    });
                    return;
                  }
                  if (!isLimitReached && !downloading && !downloadLocked) {
                    setDownloadLocked(true);
                    onDownload(purchase._id);
                    setTimeout(() => setDownloadLocked(false), 60000);
                  } else if (downloadLocked) {
                    toast.error("Please wait 1 minute before downloading again.", {
                      id: `locked-${purchase._id}`,
                    });
                  }
                }}
                disabled={downloading || (isLimitReached && !!purchase.productId)}
                className={`shrink-0 h-9 px-3 sm:px-5 rounded-xl text-[11px] sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-1.5 shadow-md max-w-[160px] sm:max-w-none ${
                  isLimitReached || !purchase.productId
                    ? "cursor-not-allowed bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 border border-slate-200 dark:border-white/5 shadow-none"
                    : downloadLocked
                    ? "cursor-wait bg-cyan-500/50 text-white/80 shadow-none"
                    : "bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/25 active:scale-95"
                }`}
              >
                <Download className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${downloadLocked ? "animate-pulse" : ""}`} />
                <span className="whitespace-nowrap">{downloading ? "Wait..." : downloadLocked ? "Wait 1m" : "Download"}</span>
                {(!isLimitReached && purchase.productId) && (
                  <span className="rounded bg-white/25 px-1 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-inner leading-none">
                    {remaining}/{downloadLimit}
                  </span>
                )}
              </button>
            </div>
            {isLimitReached && purchase.productId && (
              <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-medium text-right mt-1.5 truncate" title="Download limit reached. Please repurchase.">
                Download limit reached. Please repurchase.
              </p>
            )}
            {!purchase.productId && (
              <p className="text-[10px] sm:text-xs text-amber-500 dark:text-amber-400 font-medium text-right mt-1.5 truncate" title="Product is currently unavailable. Please contact support.">
                Product is currently unavailable. Please contact support.
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
