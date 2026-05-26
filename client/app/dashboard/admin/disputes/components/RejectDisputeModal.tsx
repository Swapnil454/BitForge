import { useState } from "react";
import { Dispute } from "./DisputeCard";
import { X, Loader2, CheckSquare, Square } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white/90">Reject Dispute</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
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

        <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (selectedReasons.length === 0 && !message.trim())}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Reject Dispute
          </button>
        </div>
      </div>
    </div>
  );
}
