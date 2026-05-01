"use client";

export default function PurchaseCardSkeleton() {
  return (
    <article className="rounded-2xl border border-white/5 bg-[#12141c] p-4 sm:p-5 shadow-lg overflow-hidden animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Image & Mobile Header */}
        <div className="flex gap-4 items-start sm:block shrink-0">
          <div className="h-20 w-20 sm:h-32 sm:w-32 rounded-xl bg-white/5 shrink-0" />
          
          {/* Mobile Header beside image */}
          <div className="sm:hidden flex flex-col justify-center min-w-0 flex-1 pt-1 space-y-2">
            <div className="h-4 w-3/4 rounded-md bg-white/5" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 rounded-md bg-white/5" />
              <div className="h-4 w-12 rounded-md bg-white/5" />
            </div>
            <div className="h-3 w-24 rounded-md bg-white/5" />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Desktop Header */}
          <div className="hidden sm:flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-5 w-1/2 rounded-md bg-white/5" />
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 rounded-md bg-white/5" />
                <div className="h-5 w-16 rounded-md bg-white/5" />
                <div className="h-4 w-24 rounded-md bg-white/5" />
              </div>
            </div>
            <div className="shrink-0 bg-white/[0.02] rounded-lg px-3 py-1.5 border border-white/5 space-y-2">
              <div className="h-2 w-12 rounded bg-white/5" />
              <div className="h-3 w-20 rounded bg-white/5" />
            </div>
          </div>

          {/* Mobile Order ID separator */}
          <div className="sm:hidden mb-4 border-t border-white/5 pt-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 rounded bg-white/5" />
              <div className="h-3 w-20 rounded bg-white/5" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 mt-auto pt-2 sm:pt-0">
            <div className="col-span-2 sm:col-span-1 h-10 w-full sm:w-32 rounded-lg bg-white/5" />
            <div className="h-10 w-full sm:w-24 rounded-lg bg-white/5" />
            <div className="h-10 w-full sm:w-24 rounded-lg bg-white/5" />
            <div className="col-span-2 sm:col-span-1 sm:ml-auto h-10 w-full sm:w-24 rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
    </article>
  );
}
