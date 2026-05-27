"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ModerationProduct } from "@/types/moderation";

export const CHANGE_REQUEST_REASONS = [
  'Title needs improvement',
  'Description too short or unclear',
  'Product image missing or low quality',
  'Incorrect category selected',
  'Pricing needs adjustment',
  'File format or quality issue',
  'License terms unclear',
  'Additional information required',
];

interface RequestChangesModalProps {
  product: ModerationProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reasons: string[], note: string) => void;
}

export default function RequestChangesModal({
  product,
  isOpen,
  onClose,
  onSubmit,
}: RequestChangesModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReasons([]);
      setNote("");
    }
  }, [isOpen]);

  const handleToggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const isSubmitDisabled = selectedReasons.length === 0;

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[1100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:w-[500px] max-w-full bg-white dark:bg-[#16161e] shadow-2xl border-l border-amber-200 dark:border-amber-500/20 z-[1200] flex flex-col"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Changes</h2>
            <p className="text-sm text-slate-500 dark:text-white/50">{product.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Select issues to fix <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHANGE_REQUEST_REASONS.map((reason) => {
                const isSelected = selectedReasons.includes(reason);
                return (
                  <label
                    key={reason}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-amber-500/50 bg-amber-50 dark:bg-amber-500/10"
                        : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleReason(reason)}
                      className="mt-0.5 w-4 h-4 rounded text-amber-600 bg-white dark:bg-black border-slate-300 dark:border-white/20 focus:ring-amber-500/20"
                    />
                    <span className={`text-sm ${isSelected ? "text-amber-900 dark:text-amber-100 font-medium" : "text-slate-700 dark:text-white/70"}`}>
                      {reason}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Instructions for Seller</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide specific details on what needs to be changed..."
              className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3 bg-slate-50 dark:bg-[#16161e] mt-auto pb-8 sm:pb-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <div className="relative group/tooltip">
            <button
              onClick={() => onSubmit(selectedReasons, note)}
              disabled={isSubmitDisabled}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-amber-500/20"
            >
              Send to Seller
            </button>
            {isSubmitDisabled && (
              <div className="absolute bottom-full mb-2 right-0 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                Select at least one issue to request changes.
              </div>
            )}
          </div>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
