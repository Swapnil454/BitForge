"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Search } from "lucide-react";

export type ProductSortOption = "newest" | "oldest" | "price_high" | "price_low";
export type ProductStatusFilter = "all" | "approved" | "pending" | "rejected";

const STATUS_LABELS: Record<ProductStatusFilter, string> = {
  all: "All Status",
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

const SORT_LABELS: Record<ProductSortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  price_high: "Highest Price",
  price_low: "Lowest Price",
};

type AdminProductFiltersProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: ProductStatusFilter;
  onStatusFilterChange: (value: ProductStatusFilter) => void;
  sortBy: ProductSortOption;
  onSortChange: (value: ProductSortOption) => void;
  onClearAll: () => void;
};

export default function AdminProductFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  onClearAll,
}: AdminProductFiltersProps) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setFilterMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative flex-1">
        <Search className="h-4 w-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by product title, description, or seller..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-12 rounded-2xl border border-white/10 bg-[#16161e] pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/20 transition group-hover:bg-[#1a1a24]"
        />
      </div>

      <div className="relative" ref={filterMenuRef}>
        <button
          onClick={() => setFilterMenuOpen((prev) => !prev)}
          className="h-12 px-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 inline-flex items-center gap-2 transition"
        >
          <Filter className="h-4 w-4 text-white/60" />
          <span className="hidden sm:inline text-sm font-medium text-white/70">Filters</span>
        </button>

        <AnimatePresence mode="wait">
          {filterMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/15 bg-[#12121a] backdrop-blur-xl p-4 shadow-2xl z-20"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">Refine Search</p>
                <button
                  onClick={() => {
                    onClearAll();
                    setFilterMenuOpen(false);
                  }}
                  className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div>
                <p className="text-[11px] font-bold text-white/40 mb-3 px-1">Product Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["all", "approved", "pending", "rejected"] as ProductStatusFilter[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onStatusFilterChange(status);
                        setFilterMenuOpen(false);
                      }}
                      className={`rounded-xl px-3 py-2 text-xs text-left font-medium transition border ${
                        statusFilter === status
                          ? "border-purple-400/40 bg-purple-500/20 text-white"
                          : "border-white/5 bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5">
                <p className="text-[11px] font-bold text-white/40 mb-3 px-1">Sort Products</p>
                <div className="grid grid-cols-1 gap-2">
                  {(["newest", "oldest", "price_high", "price_low"] as ProductSortOption[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        onSortChange(sort);
                      }}
                      className={`rounded-xl px-3 py-2 text-xs text-left font-medium transition border ${
                        sortBy === sort
                          ? "border-indigo-400/40 bg-indigo-500/20 text-white"
                          : "border-white/5 bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {SORT_LABELS[sort]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
