"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    const dismissedAt = Number(
      localStorage.getItem("pwa_install_dismissed_at")
    );

    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const canShowAgain =
      !dismissedAt || Date.now() - dismissedAt > threeDays;

    if (!canShowAgain) return;

    const handler = (event: any) => {
      event.preventDefault();
      setDeferredPrompt(event);

      setTimeout(() => {
        setShowBanner(true);
      }, 8000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      localStorage.setItem("pwa_installed", "true");
    }

    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_install_dismissed_at", String(Date.now()));
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] sm:w-80 rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="pr-6">
            <h3 className="text-sm font-bold text-white">Install BitForge App</h3>
            
            <div className="mt-3 flex gap-2.5">
              <button
                onClick={handleInstall}
                className="flex-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 py-2 text-sm font-bold text-slate-950 transition-colors shadow-lg shadow-cyan-500/20"
              >
                Install
              </button>

              <button
                onClick={handleDismiss}
                className="flex-1 rounded-lg border border-white/10 hover:bg-white/5 py-2 text-sm font-semibold text-slate-300 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
