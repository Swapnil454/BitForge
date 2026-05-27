"use client";

import { useState } from "react";
import { X, CheckCircle2, ShieldAlert, ShieldCheck, ShieldBan, Info, FileBox, AlertTriangle } from "lucide-react";
import { ModerationProduct } from "@/types/moderation";
import { motion, AnimatePresence } from "framer-motion";

export const CHECKLIST_ITEMS = [
  { id: 'title',       label: 'Title is clear and descriptive' },
  { id: 'description', label: 'Description is meaningful' },
  { id: 'price',       label: 'Price and discount are valid' },
  { id: 'thumbnail',   label: 'Product image is uploaded' },
  { id: 'files',       label: 'Files are accessible and correct' },
  { id: 'copyright',   label: 'No copyright issues detected' },
  { id: 'category',    label: 'Category is correctly assigned' },
  { id: 'drm',         label: 'License / DRM settings are valid' },
];

interface ProductModerationModalProps {
  product: ModerationProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (product: ModerationProduct, adminNote: string) => void;
  onRejectClick: () => void; // Opens the reject modal
  onRequestChangesClick: () => void; // Opens the request changes modal
}

export default function ProductModerationModal({
  product,
  isOpen,
  onClose,
  onApprove,
  onRejectClick,
  onRequestChangesClick,
}: ProductModerationModalProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [adminNote, setAdminNote] = useState("");

  const handleToggleCheck = (id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isApprovedDisabled = checkedItems.length !== CHECKLIST_ITEMS.length;

  const handleApprove = () => {
    if (!isApprovedDisabled && product) {
      onApprove(product, adminNote);
    }
  };

  const getSellerTrustColor = (status: string) => {
    switch(status) {
      case 'active': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'suspended': return 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20';
      case 'flagged': return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      default: return 'text-slate-600 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10';
    }
  };

  const getSellerTrustIcon = (status: string) => {
    switch(status) {
      case 'active': return <ShieldCheck className="w-4 h-4" />;
      case 'suspended': return <ShieldBan className="w-4 h-4" />;
      case 'flagged': return <ShieldAlert className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[900]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:w-[600px] md:w-[800px] max-w-full bg-white dark:bg-[#16161e] shadow-2xl border-l border-slate-200 dark:border-white/10 z-[1000] flex flex-col"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review Details</h2>
            <p className="text-sm text-slate-500 dark:text-white/50">{product.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Left Column: Product Info & Checklist */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Product Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileBox className="w-4 h-4 text-indigo-500" />
                Product Details
              </h3>
              <div className="flex gap-3 p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                {product.thumbnail ? (
                  <img src={product.thumbnail} alt="Thumbnail" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 dark:border-white/10" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-slate-400">
                    <FileBox className="w-6 h-6 sm:w-8 sm:h-8 opacity-70" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{product.fileType}</span>
                  </div>
                )}
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">{product.title}</h4>
                  <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs font-semibold">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{product.category}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-white/70">{product.fileType.toUpperCase()} ({product.fileCount} files)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 mt-1 line-clamp-2">{product.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/50">Base Price</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">₹{product.price}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/50">Discount</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{product.discountPercent}%</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10">
                  <p className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Final Price</p>
                  <p className="text-sm sm:text-base font-bold text-indigo-700 dark:text-indigo-300">₹{product.finalPrice}</p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Quality Checklist
                </h3>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">
                  {checkedItems.length} / {CHECKLIST_ITEMS.length} Checked
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {CHECKLIST_ITEMS.map((item) => {
                  const isChecked = checkedItems.includes(item.id);
                  return (
                    <label 
                      key={item.id} 
                      className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5" 
                          : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCheck(item.id)}
                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 bg-white dark:bg-black border-slate-300 dark:border-white/20 focus:ring-emerald-500/20"
                      />
                      <span className={`text-xs sm:text-sm ${isChecked ? "text-emerald-900 dark:text-emerald-100 font-medium" : "text-slate-700 dark:text-white/70"}`}>
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Seller Trust, History, Notes */}
          <div className="space-y-5">
            
            {/* Seller Trust */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Seller Trust</h3>
              <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{product.seller.name}</p>
                    <span className={`text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${getSellerTrustColor(product.seller.status)}`}>
                      {getSellerTrustIcon(product.seller.status)}
                      {product.seller.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-white/50">{product.seller.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="p-2 bg-white dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-400">Total Products</p>
                    <p className="font-semibold">{product.seller.totalProducts}</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-400">Approved</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{product.seller.approvedProducts}</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-400">Rejected</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">{product.seller.rejectedProducts}</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-400">Disputes</p>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">{product.seller.disputes}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Moderation History */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">History</h3>
              <div className="space-y-3">
                {product.history.map((event, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 shrink-0" />
                    <div>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {event.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(event.timestamp).toLocaleString()}
                        {event.by ? ` • by ${event.by}` : ""}
                      </p>
                      {event.note && (
                        <p className="text-xs mt-1 bg-slate-100 dark:bg-white/5 p-2 rounded-md italic text-slate-600 dark:text-white/60">
                          "{event.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Note */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Admin Note (Internal)</h3>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Optional notes for other admins..."
                className="w-full h-20 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-slate-900 dark:text-white"
              />
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-white/5 flex flex-wrap sm:flex-nowrap items-center justify-between bg-slate-50 dark:bg-[#16161e] shrink-0 gap-3 pb-6 sm:pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1">
            <button
              onClick={onRejectClick}
              className="flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors whitespace-nowrap flex items-center justify-center"
            >
              Reject
            </button>
            <button
              onClick={onRequestChangesClick}
              className="flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors whitespace-nowrap flex items-center justify-center"
            >
              Changes
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <div className="relative group/tooltip flex-1 sm:flex-none flex">
              <button
                onClick={handleApprove}
                disabled={isApprovedDisabled}
                className="flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-600/20 whitespace-nowrap flex items-center justify-center"
              >
                Approve
              </button>
              {isApprovedDisabled && (
                <div className="absolute bottom-full mb-2 right-0 w-48 p-2 bg-slate-800 text-white text-[10px] sm:text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                  Complete the quality checklist to enable approval.
                </div>
              )}
            </div>
          </div>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
