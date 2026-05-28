import { Dispute } from "./DisputeCard";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApproveRefundModalProps {
  dispute: Dispute | null;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ApproveRefundModal({
  dispute,
  isOpen,
  isLoading,
  onConfirm,
  onClose,
}: ApproveRefundModalProps) {
  if (!isOpen || !dispute) return null;

  const fmt = (n: number) => `₹${Number(n).toFixed(2)}`;

  return (
    <AnimatePresence>
      {isOpen && dispute && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-[900]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:w-[480px] bg-white dark:bg-[#16161e] shadow-2xl border-l border-slate-200 dark:border-white/10 z-[1000] flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
              <h2 className="text-lg font-bold text-emerald-600">Approve Refund?</h2>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-sm text-slate-600 dark:text-white/70">
                Please confirm the refund details before proceeding. This action cannot be undone.
              </p>

              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-white/50">Product</span>
                  <span className="font-semibold text-slate-800 dark:text-white/90 text-right">{dispute.productTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-white/50">Buyer</span>
                  <span className="font-semibold text-slate-800 dark:text-white/90 text-right">{dispute.buyer.name}</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-slate-200 dark:border-white/5">
                  <span className="text-slate-600 dark:text-white/60 font-medium">Refund Amount</span>
                  <span className="font-black text-emerald-500 text-lg">{fmt(dispute.refundAmount)}</span>
                </div>
              </div>

              <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                Seller will be debited this amount.
              </p>
            </div>

            {/* Drawer Footer */}
            <div className="p-5 pb-8 sm:pb-5 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#16161e] flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-[2] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Confirm & Refund
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
