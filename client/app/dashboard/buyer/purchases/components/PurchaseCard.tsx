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

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "success":
    case "paid":
      return "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25";
    case "pending":
      return "bg-amber-500/12 text-amber-300 border border-amber-500/25";
    case "failed":
      return "bg-red-500/12 text-red-300 border border-red-500/25";
    default:
      return "bg-white/10 text-white/70 border border-white/20";
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

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition-all shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
      <div className="flex gap-4">
        {purchase.thumbnailUrl ? (
          <img
            src={purchase.thumbnailUrl}
            alt={purchase.productName}
            className="h-24 w-24 shrink-0 rounded-xl object-cover border border-white/10"
          />
        ) : (
          <div className="h-24 w-24 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] inline-flex items-center justify-center">
            <Package className="h-8 w-8 text-white/45" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-white">{purchase.productName}</h3>
              <div className="mt-2 flex items-center gap-3">
                <span className="font-semibold text-cyan-300">₹{purchase.amount.toLocaleString()}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusColor(purchase.status)}`}>
                  {purchase.status}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] text-white/45 font-medium">Order</div>
              <div className="text-xs font-semibold text-white/70">#{purchase.orderId.slice(-8).toUpperCase()}</div>
            </div>
          </div>

          <p className="inline-flex items-center gap-2 text-xs text-white/50 mb-4">
            <Clock3 className="h-3.5 w-3.5" />
            {new Date(purchase.purchaseDate).toLocaleString()}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => !isLimitReached && onDownload(purchase._id)}
              disabled={isLimitReached || downloading}
              className={`h-9 rounded-lg px-3 text-sm font-semibold transition inline-flex items-center justify-center gap-2 whitespace-nowrap ${
                isLimitReached
                  ? "cursor-not-allowed bg-white/10 text-white/35 border border-white/10"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-500/50"
              }`}
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>{downloading ? "..." : "Download"}</span>
              <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[10px] font-medium shrink-0">
                {remaining}/{downloadLimit}
              </span>
            </button>

            {canReviewOrder(purchase.status) && purchase.productId ? (
              <button
                type="button"
                onClick={() => onReview(purchase)}
                className="h-9 rounded-lg px-3 text-sm font-semibold transition inline-flex items-center justify-center gap-2 border border-amber-400/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              >
                <Star className="h-4 w-4 shrink-0" />
                <span>Review</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => onViewProduct(purchase.productId)}
              disabled={!purchase.productId}
              className={`h-9 rounded-lg px-3 text-sm font-medium transition inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 ${
                !purchase.productId ? "opacity-40 cursor-not-allowed" : "text-white/85"
              }`}
            >
              <Eye className="h-4 w-4 shrink-0" />
              <span>Product</span>
            </button>

            <a
              href={`/dashboard/buyer/invoice/${purchase._id}`}
              className="h-9 rounded-lg px-3 text-sm font-medium transition inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 text-white/85"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>Invoice</span>
            </a>

            <button
              type="button"
              onClick={() => onRaiseDispute(purchase._id)}
              className="h-9 rounded-lg px-3 text-sm font-medium transition inline-flex items-center justify-center gap-2 col-span-2 border border-red-400/40 bg-red-500/8 text-red-300 hover:bg-red-500/15"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Raise Dispute</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
