import { useState } from "react";
import { Dispute } from "./DisputeCard";
import { X, Loader2, CheckSquare, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RejectDisputeModalProps {
  dispute: Dispute | null;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: (reasons: string[], message: string) => void;
  onClose: () => void;
}

const REJECTION_REASONS = [
  "Insufficient evidence",
  "Policy violation by buyer",
  "Dispute filed after window",
  "Product delivered as described",
  "Duplicate dispute",
  "Other"
];

export default function RejectDisputeModal({
  dispute,
  isOpen,
  isLoading,
  onConfirm,
  onClose,
}: RejectDisputeModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  if (!isOpen || !dispute) return null;

  const toggleReason = (reason: string) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter((r) => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedReasons, message);
  };

  // Reset state when closed
  if (!isOpen && (selectedReasons.length > 0 || message !== "")) {
    setSelectedReasons([]);
    setMessage("");
  }

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
              <h2 className="text-lg font-bold text-rose-600">Reject Dispute</h2>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-3">
                  Reasons (select all that apply):
                </p>
                <div className="space-y-2">
                  {REJECTION_REASONS.map((reason) => {
                    const isSelected = selectedReasons.includes(reason);
                    return (
                      <label
                        key={reason}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => toggleReason(reason)}
                          className="focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="text-rose-500" size={18} />
                          ) : (
                            <Square className="text-slate-400 dark:text-white/30" size={18} />
                          )}
                        </button>
                        <span className={`text-sm ${isSelected ? "text-slate-800 dark:text-white/90 font-medium" : "text-slate-600 dark:text-white/60"}`}>
                          {reason}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-2">
                  Message to buyer:
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain why the dispute was rejected. This will be sent to the buyer..."
                  className="w-full bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 dark:focus:border-rose-500/50 min-h-[100px] resize-none"
                />
              </div>
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
                onClick={handleConfirm}
                disabled={isLoading || (selectedReasons.length === 0 && !message.trim())}
                className="flex-[2] px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Reject Dispute
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
