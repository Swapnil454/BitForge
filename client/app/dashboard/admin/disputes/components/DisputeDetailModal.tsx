import { Dispute } from "./DisputeCard";
import { X } from "lucide-react";

interface DisputeDetailModalProps {
  dispute: Dispute | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function DisputeDetailModal({
  dispute,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: DisputeDetailModalProps) {
  if (!isOpen || !dispute) return null;

  const fmt = (n: number) => `₹${Number(n).toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white/90">
              Dispute Details
            </h2>
            <p className="text-sm text-slate-500 font-mono mt-1">{dispute.disputeNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/5 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Transaction
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Date</span>
                  <span className="text-slate-800 dark:text-white/90">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase Amount</span>
                  <span className="text-slate-800 dark:text-white/90">{fmt(dispute.originalPrice)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-slate-600 dark:text-white/70 font-semibold">Refund Requested</span>
                  <span className="text-emerald-500 font-bold">{fmt(dispute.refundAmount)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/5 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Product
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white/90 line-clamp-2">
                {dispute.productTitle}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {dispute.productCategory} · {dispute.productFileType}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buyer</p>
              <div className="bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-sm">
                <p className="font-semibold text-slate-800 dark:text-white/90">{dispute.buyer.name}</p>
                <p className="text-slate-500 text-xs">{dispute.buyer.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller</p>
              <div className="bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-sm">
                <p className="font-semibold text-slate-800 dark:text-white/90">{dispute.seller.name}</p>
                <p className="text-slate-500 text-xs">{dispute.seller.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dispute Reason</p>
            <div className="bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/5 rounded-xl p-4">
              <p className="text-sm text-slate-700 dark:text-white/80 whitespace-pre-wrap">
                {dispute.reason}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">History Timeline</p>
            <div className="border border-slate-200 dark:border-white/5 rounded-xl divide-y divide-slate-100 dark:divide-white/5">
              {dispute.history.map((event, i) => (
                <div key={i} className="p-3 text-sm flex justify-between items-center bg-slate-50 dark:bg-[#0a0a0f]">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white/90">{event.action}</p>
                    {event.note && <p className="text-xs text-slate-500 mt-0.5">{event.note}</p>}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {dispute.adminNote && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Notes</p>
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                  {dispute.adminNote}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 justify-end shrink-0">
          {(dispute.status === 'open' || dispute.status === 'reopened') ? (
            <>
              <button
                onClick={onReject}
                className="px-6 py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                Reject Dispute
              </button>
              <button
                onClick={onApprove}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
              >
                Approve Refund
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-white/80 text-sm font-bold transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
