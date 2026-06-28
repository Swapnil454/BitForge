"use client";

import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

interface MarketplaceErrorStateProps {
  onRetry: () => void;
  lastAttemptTime: number | null;
  isAuthenticated: boolean;
}

export default function MarketplaceErrorState({
  onRetry,
  lastAttemptTime,
  isAuthenticated,
}: MarketplaceErrorStateProps) {
  const [elapsed, setElapsed] = useState<string>("just now");
  const { resolvedTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  // Default to light mode if not mounted yet to avoid hydration mismatch
  const isDark = mounted && isAuthenticated && resolvedTheme === "dark";

  useEffect(() => {
    if (!lastAttemptTime) return;

    const updateTimer = () => {
      const diff = Math.floor((Date.now() - lastAttemptTime) / 1000);
      if (diff < 60) setElapsed(`${diff}s ago`);
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ago`);
      else setElapsed(`${Math.floor(diff / 3600)}h ago`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastAttemptTime]);

  return (
    <div className="w-full flex flex-col pt-4 pb-24 items-center">
      {/* ── Hero Error Panel ── */}
      <div className="flex flex-col items-center max-w-2xl text-center mb-4 mt-[-1rem]">
        <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] -mb-2 sm:-mb-4">
          <Image 
            src="/markerplace_holder.png"
            alt="Marketplace Error"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <h2 className={`text-xl sm:text-2xl font-bold mb-0 tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          Failed to load
        </h2>
        
        <p className={`text-sm sm:text-base mb-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
          Seems like we encountered an error
        </p>

        <button
          onClick={onRetry}
          className={`flex items-center gap-1.5 font-semibold transition-colors hover:underline ${
            isDark ? "text-[#4da8e8]" : "text-[#005792]"
          }`}
        >
          Retry
        </button>
      </div>

      {/* ── Category Pills Placeholder (Dimmed) ── */}
      <div className="w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6 mb-4">
        <div className="flex gap-2 pb-0 overflow-hidden opacity-50 cursor-not-allowed">
          {["Explore all", "Courses", "eBooks", "Templates", "Software", "Design assets"].map((label, i) => (
            <div key={i} className={`flex-shrink-0 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border ${isDark ? "border-white/10 bg-[#0f0f11]" : "border-gray-200 bg-white"}`}>
              <span className={`text-[11px] sm:text-xs font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error Grid ── */}
      <div className={`w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6 space-y-12 border-t pt-6 mt-4 ${isDark ? "border-white/5" : "border-gray-200"}`}>
        {[
          { title: "Top courses" },
          { title: "Best eBooks" },
          { title: "Templates for you" },
          { title: "Software tools" }
        ].map((section, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-4 mb-4">
              <h2 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{section.title}</h2>
              <span className={`text-sm font-medium cursor-not-allowed ${isDark ? "text-slate-600" : "text-gray-400"}`}>See all</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-full group flex flex-col items-start rounded-[1.25rem] border p-3 opacity-80 ${isDark ? "bg-[#0f0f11] sm:border-white/5" : "bg-white border-gray-100"}`}
                >
                  <div className={`relative w-full aspect-square rounded-xl overflow-hidden flex flex-col items-center justify-center gap-2 border mb-3 ${isDark ? "bg-[#1a1a22] border-white/5" : "bg-[#f8f9fa] border-gray-100"}`}>
                    <AlertTriangle className={`w-8 h-8 ${isDark ? "text-slate-700" : "text-gray-300"}`} strokeWidth={1.5} />
                    <span className={`text-xs font-medium ${isDark ? "text-slate-600" : "text-gray-400"}`}>Failed to load</span>
                  </div>
                  
                  <div className="w-full flex flex-col gap-2">
                    <div className={`w-full h-3.5 rounded ${isDark ? "bg-white/5" : "bg-gray-100"}`}></div>
                    <div className={`w-3/4 h-3.5 rounded mb-1 ${isDark ? "bg-white/5" : "bg-gray-100"}`}></div>
                    <div className={`w-1/3 h-3.5 rounded ${isDark ? "bg-white/5" : "bg-gray-100"}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
