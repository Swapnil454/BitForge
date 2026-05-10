"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-md bg-white dark:bg-[#05050a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-[#8696A0] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-[#E9EDEF] mb-2">Ready to Leave?</h2>
            <p className="text-slate-500 dark:text-[#8696A0] text-sm mb-8 px-4">
              You are about to log out of your account. You will need to sign in again to access your dashboard.
            </p>
            
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-medium transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-lg shadow-red-500/20 rounded-xl text-white font-bold transition-all active:scale-[0.98]"
              >
                Yes, Log Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
