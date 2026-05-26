import { Dispute } from "./DisputeCard";
import { X, Loader2 } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white/90">Approve Refund?</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
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

        <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Confirm & Refund
          </button>
        </div>
      </div>
    </div>
  );
}
