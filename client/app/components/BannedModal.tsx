"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, XCircle, LogOut } from "lucide-react";
import { removeCookie } from "@/lib/cookies";

interface BannedModalProps {
  bannedReason?: string;
  onClose?: () => void;
}

export default function BannedModal({ bannedReason, onClose }: BannedModalProps) {
  const router = useRouter();

  const handleLogout = () => {
    removeCookie("token");
    removeCookie("user");
    if (onClose) onClose();
    router.push("/login");
  };

  const handleReport = () => {
    // DO NOT remove cookies here. We want them to stay logged in to track their report.
    if (onClose) onClose();
    router.push("/report");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white dark:bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-50 dark:bg-[#0a0a0f] border border-red-500/30 shadow-[0_0_60px_-15px_rgba(239,68,68,0.3)] relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Suspended</h2>
          <p className="text-slate-500 dark:text-white/60 text-sm mb-6">
            Your account has been restricted from accessing the platform due to a violation of our terms of service.
          </p>

          {bannedReason && (
            <div className="w-full p-4 rounded-xl bg-red-500/5 border border-red-500/10 mb-8 text-left">
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Reason provided</span>
              <p className="text-slate-700 dark:text-white/80 text-sm mt-1">{bannedReason}</p>
            </div>
          )}

          <div className="w-full space-y-3">
            <button
              onClick={handleReport}
              className="w-full py-3 px-4 rounded-xl font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              Submit an Appeal
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-xl font-semibold text-black bg-white hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
