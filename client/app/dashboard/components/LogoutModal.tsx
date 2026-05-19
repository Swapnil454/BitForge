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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              transition: { type: "spring", stiffness: 350, damping: 25 } 
            }}
            exit={{ scale: 0.95, opacity: 0, y: 15, transition: { duration: 0.15 } }}
            className="relative w-full max-w-sm bg-white/95 dark:bg-[#0a0a0f]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden p-6 text-center"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-400 dark:text-white/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Icon Container with multi-layered glow */}
            <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              {/* Outer soft breathing background ring */}
              <motion.div 
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 dark:border-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
              />
              {/* Inner glowing badge */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500/20 to-red-500/20 dark:from-rose-500/10 dark:to-red-500/10 border border-rose-500/30 dark:border-rose-500/20 flex items-center justify-center relative shadow-inner">
                <motion.div
                  initial={{ rotate: -10 }}
                  animate={{ rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <LogOut className="w-6 h-6 text-rose-500" />
                </motion.div>
              </div>
            </div>
            
            {/* Heading & Paragraph */}
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Ready to Leave?
            </h2>
            <p className="text-slate-500 dark:text-white/50 text-sm mb-6 max-w-[280px] mx-auto leading-relaxed">
              You are about to log out of your account. You will need to sign in again to access your dashboard.
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-white/80 text-sm font-bold transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:shadow-[0_4px_20px_rgba(244,63,94,0.5)] active:scale-[0.98]"
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
