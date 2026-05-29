"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const REJECT_REASONS = [
  'Poor or misleading description',
  'Copyright or IP violation',
  'Wrong category assigned',
  'Pricing or discount issue',
  'Invalid or inaccessible files',
  'Missing product thumbnail',
  'Duplicate product',
  'Other',
];

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reasons: string[], note: string) => void;
  productName: string;
}

export default function RejectReasonModal({
  isOpen,
  onClose,
  onReject,
  productName,
}: RejectReasonModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [adminNote, setAdminNote] = useState("");

  const handleToggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleReject = () => {
    onReject(selectedReasons, adminNote);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[1100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:w-[450px] max-w-full bg-white dark:bg-[#16161e] shadow-2xl border-l border-slate-200 dark:border-white/10 z-[1200] flex flex-col"
          >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reject Product</h2>
              <p className="text-sm text-slate-500 dark:text-white/50 truncate max-w-[200px]">
                {productName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-white/80">
              Reasons for rejection
            </label>
            <div className="grid gap-2">
              {REJECT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason)}
                    onChange={() => handleToggleReason(reason)}
                    className="mt-0.5 w-4 h-4 rounded text-red-600 bg-white dark:bg-black border-slate-300 dark:border-white/20 focus:ring-red-500/20"
                  />
                  <span className="text-sm text-slate-700 dark:text-white/70">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-white/80">
              Admin message to seller
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Write clear reason..."
              className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 resize-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3 bg-slate-50 dark:bg-white/[0.02] pb-8 sm:pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={selectedReasons.length === 0}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-red-600/20"
          >
            Reject Product
          </button>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
