import React from "react";

export function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-2xl border bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 animate-pulse">
          <div className="h-3 w-20 bg-slate-200 dark:bg-white/10 rounded mb-2" />
          <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ScanListSkeleton() {
  return (
    <div className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-white/10 rounded-full" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 w-48 bg-slate-200 dark:bg-white/10 rounded" />
                <div className="h-3 w-32 bg-slate-200 dark:bg-white/10 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-10 bg-slate-200 dark:bg-white/10 rounded-lg" />
                <div className="h-8 w-24 bg-slate-200 dark:bg-white/10 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
