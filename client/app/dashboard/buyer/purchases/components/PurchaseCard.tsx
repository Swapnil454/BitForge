"use client";

import { AlertCircle, Clock3, Download, Eye, FileText, Package, Star } from "lucide-react";
import { Purchase } from "../types";

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
      return { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", stripe: "bg-emerald-500" };
    case "pending":
      return { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", stripe: "bg-amber-500" };
    case "failed":
      return { bg: "bg-rose-500/10 text-rose-400 border-rose-500/20", stripe: "bg-rose-500" };
    default:
      return { bg: "bg-transparent text-slate-300 border-white/20", stripe: "bg-slate-500" };
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
  const downloadCount = purchase.downloadCount || 0;
  const downloadLimit = purchase.downloadLimit || 5;
  const remaining = Math.max(downloadLimit - downloadCount, 0);
  const isLimitReached = remaining <= 0;
  
  const statusConfig = getStatusConfig(purchase.status);

  return (
    <article className="bg-[#08111d] border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col group hover:border-white/10 transition-all shadow-xl">
      <div className="flex gap-3 sm:gap-4">
        {/* Thumbnail - Fixed Left */}
        <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/5 relative">
          {purchase.thumbnailUrl ? (
            <img
              src={purchase.thumbnailUrl}
              alt={purchase.productName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white/20" />
            </div>
          )}
        </div>

        {/* Content - Right */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex justify-between items-start gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-bold text-white truncate tracking-tight leading-tight">
                {purchase.productName}
              </h3>
              {/* Price Top Right */}
              <p className="text-sm sm:text-base font-bold text-cyan-400 tracking-tight shrink-0">
                ₹{purchase.amount.toLocaleString()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded bg-transparent border ${statusConfig.bg}`}>
                {purchase.status}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                {new Date(purchase.purchaseDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">
              Order #{purchase.orderId.slice(-8).toUpperCase()}
            </div>
          </div>

          {/* Primary Action */}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => !isLimitReached && onDownload(purchase._id)}
              disabled={isLimitReached || downloading}
              className={`h-8 sm:h-9 px-4 sm:px-5 rounded-lg text-[11px] sm:text-xs font-bold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-white/5 ${
                isLimitReached
                  ? "cursor-not-allowed bg-white/5 text-white/30 border border-white/5 shadow-none"
                  : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/30"
              }`}
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>{downloading ? "Wait..." : "Download"}</span>
              {!isLimitReached && (
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-cyan-300 ml-1">
                  {remaining}/{downloadLimit}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Actions Row */}
      <div className="mt-3 sm:mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {canReviewOrder(purchase.status) && purchase.productId && (
            <button
              type="button"
              onClick={() => onReview(purchase)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] sm:text-[11px] font-medium transition-colors border border-transparent hover:border-white/10"
            >
              <Star className="w-3.5 h-3.5" /> Review
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewProduct(purchase.productId)}
            disabled={!purchase.productId}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent text-[10px] sm:text-[11px] font-medium transition-colors ${
              !purchase.productId ? "opacity-40 cursor-not-allowed text-white/40" : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white hover:border-white/10"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Product
          </button>

          <a
            href={`/dashboard/buyer/invoice/${purchase._id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] sm:text-[11px] font-medium transition-colors border border-transparent hover:border-white/10"
          >
            <FileText className="w-3.5 h-3.5" /> Invoice
          </a>
        </div>

        <button
          type="button"
          onClick={() => onRaiseDispute(purchase._id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 text-rose-400/80 hover:text-rose-400 text-[10px] sm:text-[11px] font-medium transition-colors border border-transparent hover:border-rose-500/10 shrink-0"
        >
          <AlertCircle className="w-3.5 h-3.5" /> Dispute
        </button>
      </div>
    </article>
  );
}
