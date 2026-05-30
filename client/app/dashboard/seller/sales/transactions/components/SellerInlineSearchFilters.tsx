"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Search, Calendar, ChevronDown, Check } from "lucide-react";

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
  month: string;
  onMonthChange: (value: string) => void;
};

export default function SellerInlineSearchFilters({
  searchQuery,
  onSearchChange,
  filterBy,
  onFilterChange,
  sortBy,
  onSortChange,
  month,
  onMonthChange,
}: SellerInlineSearchFiltersProps) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const monthMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setFilterMenuOpen(false);
      }
      if (monthMenuRef.current && !monthMenuRef.current.contains(target)) {
        setMonthMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Generate last 12 months for dropdown
  const months = [{ label: "All Time", value: "all" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    months.push({ label, value });
  }

  const selectedMonthLabel = months.find(m => m.value === month)?.label || "All Time";

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full">
      <div className="relative flex-1 w-full flex items-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/12 rounded-xl focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-400 transition h-11">
        <div className="pl-3 flex items-center justify-center shrink-0">
          <Search className="h-4 w-4 text-slate-400 dark:text-white/45" />
        </div>
        <input
          type="text"
          placeholder="Search product, order ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 w-full bg-transparent border-none outline-none px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 min-w-0"
        />
        
        {/* Inside Search Field Custom Month Dropdown */}
        <div className="relative h-full shrink-0 flex items-center border-l border-slate-200 dark:border-white/10" ref={monthMenuRef}>
          <button
            onClick={() => setMonthMenuOpen((prev) => !prev)}
            className="h-full px-3 sm:px-4 flex items-center gap-1.5 text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-slate-400 dark:text-white/50" />
            <span className="hidden sm:inline-block font-medium">{selectedMonthLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          
          <AnimatePresence>
            {monthMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                className="absolute right-0 top-[calc(100%+4px)] w-48 max-h-64 overflow-y-auto no-scrollbar rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-xl dark:shadow-2xl dark:shadow-black/40 z-30"
              >
                {months.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      onMonthChange(m.value);
                      setMonthMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-between ${
                      month === m.value
                        ? "bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400"
                        : "text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    {m.label}
                    {month === m.value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative w-full sm:w-auto shrink-0" ref={filterMenuRef}>
        <button
          onClick={() => setFilterMenuOpen((prev) => !prev)}
          className="w-full sm:w-auto h-11 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/25 inline-flex items-center justify-center gap-2 transition shadow-sm dark:shadow-none"
        >
          <Filter className="h-4 w-4 text-slate-700 dark:text-white/80" />
          <span className="text-sm font-medium text-slate-700 dark:text-white/80">Filters</span>
        </button>

        <AnimatePresence>
          {filterMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="absolute right-0 sm:right-0 left-0 sm:left-auto top-[calc(100%+4px)] w-full sm:w-72 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/95 backdrop-blur-xl p-3 shadow-xl dark:shadow-2xl dark:shadow-black/40 z-20"
            >
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/45 mb-2 font-bold">Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["all", "completed", "pending", "cancelled"] as FilterOption[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        onFilterChange(filter);
                        setFilterMenuOpen(false);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm text-left transition border font-medium ${
                        filterBy === filter
                          ? "border-cyan-400/45 bg-cyan-50 dark:bg-cyan-500/25 text-cyan-700 dark:text-white"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                    >
                      {FILTER_LABELS[filter]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/45 mb-2 font-bold">Sort</p>
                <div className="grid grid-cols-1 gap-2">
                  {(["newest", "oldest"] as SortOption[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        onSortChange(sort);
                        setFilterMenuOpen(false);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm text-left transition border font-medium ${
                        sortBy === sort
                          ? "border-cyan-400/45 bg-cyan-50 dark:bg-cyan-500/25 text-cyan-700 dark:text-white"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
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
