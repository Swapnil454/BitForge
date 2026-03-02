"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  action?: string | null;
}

/**
 * Production-level authentication modal component.
 * Shows a sleek modal prompting users to login or register.
 * Features smooth animations, keyboard accessibility, and clean design.
 */
export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  action,
}: AuthModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  // Get action-specific messaging
  const getActionMessage = () => {
    const actionText = action?.toLowerCase() || "continue";
    
    const actionMessages: { [key: string]: { title: string; subtitle: string } } = {
      "add to cart": {
        title: "Sign in to add to cart",
        subtitle: "Keep track of your items and checkout securely",
      },
      "add to wishlist": {
        title: "Sign in to save to wishlist",
        subtitle: "Save your favorite items and access them anywhere",
      },
      "buy": {
        title: "Sign in to purchase",
        subtitle: "Complete your purchase securely with your account",
      },
      "view cart": {
        title: "Sign in to view your cart",
        subtitle: "Access your saved items and complete checkout",
      },
      "view wishlist": {
        title: "Sign in to view wishlist",
        subtitle: "Access your saved favorites from any device",
      },
    };

    return (
      actionMessages[actionText] || {
        title: `Sign in to ${actionText}`,
        subtitle: "Create an account or sign in to continue",
      }
    );
  };

  const { title, subtitle } = getActionMessage();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all z-10"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Gradient Decoration */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-cyan-500/20 to-transparent blur-3xl pointer-events-none" />

              {/* Content */}
              <div className="relative p-8 pt-12">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full blur-lg opacity-50" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/20 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="text-center mb-8">
                  <h2
                    id="auth-modal-title"
                    className="text-2xl font-bold text-white mb-2"
                  >
                    {title}
                  </h2>
                  <p className="text-white/60">{subtitle}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={onLogin}
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={onRegister}
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Create Account
                  </button>
                </div>

                {/* Benefits */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-center text-sm text-white/40 mb-4">
                    Why create an account?
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                        ✓
                      </span>
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                        ✓
                      </span>
                      <span>Track orders</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                        ✓
                      </span>
                      <span>Save wishlist</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                        ✓
                      </span>
                      <span>Instant downloads</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
