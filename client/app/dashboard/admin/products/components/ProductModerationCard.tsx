"use client";

import { ModerationProduct } from "@/types/moderation";
import { computeRisk } from "@/lib/moderation/riskScore";
import { Clock, CheckCircle2, XCircle, AlertTriangle, FileBox, ExternalLink } from "lucide-react";

interface ProductModerationCardProps {
  product: ModerationProduct;
  onPreview: () => void;
  onReviewDetails: () => void;
  onRejectClick: () => void;
}

export default function ProductModerationCard({
  product,
  onPreview,
  onReviewDetails,
  onRejectClick,
}: ProductModerationCardProps) {
  const risk = computeRisk(product);

  const getStatusBadge = () => {
    switch (product.status) {
      case 'pending':
        return <span className="flex items-center gap-1.5 px-3 py-1  text-amber-600 dark:text-amber-400 text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Pending Review</span>;
      case 'approved':
        return <span className="flex items-center gap-1.5 px-3 py-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1.5 px-3 py-1  text-red-600 dark:text-red-400  text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'changes_requested':
        return <span className="flex items-center gap-1.5 px-3 py-1  text-orange-600 dark:text-orange-400 text-xs font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Needs Changes</span>;
      default:
        return null;
    }
  };

  const getRiskBadge = () => {
    switch (risk) {
      case 'low':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Low Risk</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">Medium Risk</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">High Risk</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20">
      
      {/* Top section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Thumbnail */}
        <div className="shrink-0 w-full sm:w-24 h-24 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
          {product.thumbnail ? (
            <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <FileBox className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{product.fileType}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{product.title}</h3>
              <p className="text-sm text-slate-500 dark:text-white/60">{product.category} • {product.fileType.toUpperCase()}</p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="text-sm text-slate-600 dark:text-white/70">
            <p><span className="font-semibold text-slate-800 dark:text-white/90">Seller:</span> {product.seller.email}</p>
            <p><span className="font-semibold text-slate-800 dark:text-white/90">Uploaded:</span> {new Date(product.uploadedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Middle Stats Bar */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-slate-400 dark:text-white/40 mb-1">Pricing</p>
          <div className="flex items-end gap-2">
            <span className="font-bold text-slate-900 dark:text-white">₹{product.finalPrice}</span>
            {product.discountPercent > 0 && (
              <span className="text-xs text-slate-400 line-through mb-0.5">₹{product.price}</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 dark:text-white/40 mb-1">Files</p>
          <p className="font-semibold text-slate-800 dark:text-white/80">{product.fileCount} Assets</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 dark:text-white/40 mb-1">Discount</p>
          <p className="font-semibold text-slate-800 dark:text-white/80">{product.discountPercent}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 dark:text-white/40 mb-1">Risk Assessment</p>
          {getRiskBadge()}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex gap-1 sm:gap-2">
        <button onClick={onPreview} className="flex-1 sm:flex-none flex justify-center items-center gap-1 sm:gap-1.5 px-1 sm:px-4 py-2 rounded-xl text-[10px] sm:text-sm font-semibold text-slate-600 dark:text-white/60 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap">
          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline sm:hidden lg:inline">Preview</span><span className="xs:hidden sm:inline lg:hidden">View</span>
        </button>
        <button onClick={onReviewDetails} className="flex-[1.5] sm:flex-none flex justify-center items-center px-1 sm:px-5 py-2 rounded-xl text-[10px] sm:text-sm font-bold text-cyan-800 bg-gradient-to-r from-cyan-50 to-cyan-100 border border-cyan-200 hover:from-cyan-100 hover:to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30 dark:text-cyan-300 dark:border-cyan-700/30 dark:hover:from-cyan-900/50 dark:hover:to-cyan-800/50 transition-colors shadow-sm whitespace-nowrap">
          Review Details
        </button>
        {product.status === 'pending' && (
          <button onClick={onRejectClick} className="flex-1 sm:flex-none flex justify-center items-center px-1 sm:px-5 py-2 rounded-xl text-[10px] sm:text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 transition-colors sm:ml-auto whitespace-nowrap">
            Reject
          </button>
        )}
      </div>

    </div>
  );
}
