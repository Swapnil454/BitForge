import { Dispute } from "./DisputeCard";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
            className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:w-[540px] bg-white dark:bg-[#16161e] shadow-2xl border-l border-slate-200 dark:border-white/10 z-[1000] flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white/90">
                  Dispute Details
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{dispute.disputeNumber}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
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

            {/* Drawer Footer */}
            <div className="p-5 pb-8 sm:pb-5 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#16161e] flex gap-3 justify-end">
              {(dispute.status === 'open' || dispute.status === 'reopened') ? (
                <>
                  <button
                    onClick={onReject}
                    className="flex-1 px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Reject Dispute
                  </button>
                  <button
                    onClick={onApprove}
                    className="flex-[2] px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Approve Refund
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
