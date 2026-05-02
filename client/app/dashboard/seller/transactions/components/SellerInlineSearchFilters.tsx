"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Search } from "lucide-react";

export type SortOption = "newest" | "oldest";
export type FilterOption = "all" | "completed" | "pending" | "cancelled";

const FILTER_LABELS: Record<FilterOption, string> = {
  all: "All",
  completed: "Completed",
  pending: "Pending",
  cancelled: "Cancelled",
};

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
};

type SellerInlineSearchFiltersProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterBy: FilterOption;
  onFilterChange: (value: FilterOption) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
};

export default function SellerInlineSearchFilters({
  searchQuery,
  onSearchChange,
  filterBy,
  onFilterChange,
  sortBy,
  onSortChange,
}: SellerInlineSearchFiltersProps) {
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
        <Search className="h-4 w-4 text-white/45 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by product, buyer, or order ID"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-11 rounded-xl border border-white/12 bg-white/5 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition"
        />
      </div>

      <div className="relative" ref={filterMenuRef}>
        <button
          onClick={() => setFilterMenuOpen((prev) => !prev)}
          className="h-11 px-3 sm:px-4 rounded-xl border border-white/12 bg-white/5 hover:bg-white/10 hover:border-white/25 inline-flex items-center gap-2 transition"
        >
          <Filter className="h-4 w-4 text-white/80" />
          <span className="hidden sm:inline text-sm text-white/80">Filters</span>
        </button>

        <AnimatePresence>
          {filterMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="absolute right-0 mt-2 w-72 rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/40 z-20"
            >
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/45 mb-2">Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["all", "completed", "pending", "cancelled"] as FilterOption[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        onFilterChange(filter);
                        setFilterMenuOpen(false);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm text-left transition border ${
                        filterBy === filter
                          ? "border-cyan-400/45 bg-cyan-500/25 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {FILTER_LABELS[filter]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-[11px] uppercase tracking-wider text-white/45 mb-2">Sort</p>
                <div className="grid grid-cols-1 gap-2">
                  {(["newest", "oldest"] as SortOption[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        onSortChange(sort);
                        setFilterMenuOpen(false);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm text-left transition border ${
                        sortBy === sort
                          ? "border-cyan-400/45 bg-cyan-500/25 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
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
