"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { adminAPI } from "@/lib/api";
import Link from "next/link";
import { ExternalLink, ShieldAlert, AlertTriangle } from "lucide-react";
import React, { useEffect, useRef } from "react";

const SCAN_PAGE_SIZE = 75;

export default function ScanHistoryTable() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery({
    queryKey: ["malwareScans"],
    queryFn: ({ pageParam = undefined }) =>
      adminAPI.getMalwareScans({ cursor: pageParam, limit: SCAN_PAGE_SIZE }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const scans = data.pages.flatMap((page) => page.scans);
  const totalCount = data.pages[0]?.totalCount || 0;

  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl">
        <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-white/20 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No scans found</h3>
        <p className="text-slate-500 dark:text-white/50 text-sm mt-1">No products have been scanned yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Scans</h3>
        </div>
        <div className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-bold">
          {totalCount} Total
        </div>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
        {scans.map((p) => (
          <div key={p._id} className="p-3 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all">
            <div className="flex flex-row flex-wrap sm:flex-nowrap gap-2 sm:gap-4 items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                  <p className="font-bold text-[13px] sm:text-base text-slate-900 dark:text-white truncate">{p.title}</p>
                  {p.scanStatus === "MALICIOUS" || p.scanStatus === "FLAGGED" ? (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[9px] sm:text-[10px] font-bold uppercase shrink-0">
                      Threats
                    </span>
                  ) : p.scanStatus === "CLEAN" ? (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[9px] sm:text-[10px] font-bold uppercase shrink-0">
                      Clean
                    </span>
                  ) : (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[9px] sm:text-[10px] font-bold uppercase shrink-0">
                      {p.scanStatus}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-white/50">
                  <span className="truncate">{p.sellerId?.name || "Unknown Seller"}</span>
                  <span>•</span>
                  <span className="shrink-0">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto justify-end mt-1 sm:mt-0">
                {p.virusTotalLink && (
                  <a href={p.virusTotalLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-all text-slate-600 dark:text-white">
                    <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </a>
                )}
                <Link href={`/dashboard/admin/security/scans/${p._id}`}
                  className="flex items-center gap-1 px-3 sm:px-3 py-1.5 sm:py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-indigo-500 transition-all">
                  View Report
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div ref={observerTarget} className="h-4 w-full">
        {isFetchingNextPage && (
          <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-center">
            <span className="text-xs font-bold text-slate-500 dark:text-white/50">Loading more scans...</span>
          </div>
        )}
      </div>
    </div>
  );
}
