"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Search, CalendarDays } from "lucide-react";

export type SalesSortOption = "newest" | "oldest";
export type SalesFilterOption = "all" | "paid" | "failed" | "created";

const FILTER_LABELS: Record<SalesFilterOption, string> = {
  all: "All",
  paid: "Paid",
  failed: "Failed",
  created: "Pending",
};

const SORT_LABELS: Record<SalesSortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
};

type SalesInlineSearchFiltersProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterBy: SalesFilterOption;
  onFilterChange: (value: SalesFilterOption) => void;
  sortBy: SalesSortOption;
  onSortChange: (value: SalesSortOption) => void;
  month: string;
  onMonthChange: (value: string) => void;
};

// Generate last 12 months for dropdown
const generatePastMonths = () => {
  const months = [];
  const date = new Date();
  // Set to 1st of the month to prevent day overflow (e.g. May 31 - 1 month = April 31 -> wraps to May 1)
  date.setDate(1); 
  
  for (let i = 0; i < 12; i++) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const value = `${year}-${month.toString().padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    months.push({ value, label });
    date.setMonth(date.getMonth() - 1);
  }
  return months;
};

export default function SalesInlineSearchFilters({
  searchQuery,
  onSearchChange,
  filterBy,
  onFilterChange,
  sortBy,
  onSortChange,
  month,
  onMonthChange,
}: SalesInlineSearchFiltersProps) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const monthMenuRef = useRef<HTMLDivElement>(null);
  
  const monthsList = useRef(generatePastMonths()).current;

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

  const selectedMonthLabel = month ? monthsList.find(m => m.value === month)?.label : "All Time";

  return (
    <div className="flex flex-row items-center gap-2">
      <div className="flex-1 flex flex-row items-stretch bg-white dark:bg-white/5 border border-slate-200 dark:border-white/12 rounded-xl overflow-visible transition focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20">
        
        {/* Search Input (Left) */}
        <div className="relative flex-1 flex items-center h-11">
          <Search className="h-4 w-4 text-slate-400 dark:text-white/45 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-full bg-transparent pl-9 pr-2 sm:pl-10 sm:pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none border-none focus:ring-0"
          />
        </div>

        {/* Month Dropdown inside search field area (Right) */}
        <div className="relative shrink-0 flex items-center border-l border-slate-200 dark:border-white/10 h-11" ref={monthMenuRef}>
          <button
            onClick={() => setMonthMenuOpen(!monthMenuOpen)}
            className="h-full px-3 sm:px-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-800 dark:text-white/90 outline-none hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-cyan-500" />
              <span className="hidden sm:inline truncate">{selectedMonthLabel}</span>
            </div>
            <svg className={`hidden sm:block w-4 h-4 text-slate-400 transition-transform ${monthMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          
          <AnimatePresence>
            {monthMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                className="absolute right-0 top-full mt-2 w-48 sm:w-56 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/95 backdrop-blur-xl p-2 shadow-xl dark:shadow-2xl dark:shadow-black/40 z-30"
              >
                <button
                  onClick={() => {
                    onMonthChange("");
                    setMonthMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    month === ""
                      ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-medium"
                      : "text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  All Time
                </button>
                {monthsList.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      onMonthChange(m.value);
                      setMonthMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      month === m.value
                        ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-medium"
                        : "text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter Button */}
      <div className="relative shrink-0" ref={filterMenuRef}>
        <button
          onClick={() => setFilterMenuOpen((prev) => !prev)}
          className="h-11 w-11 sm:w-auto px-0 sm:px-4 rounded-xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/25 flex flex-row items-center justify-center gap-2 transition shadow-sm dark:shadow-none"
        >
          <Filter className="h-4 w-4 text-slate-700 dark:text-white/80" />
          <span className="hidden sm:inline text-sm text-slate-700 dark:text-white/80">Filters</span>
        </button>

        <AnimatePresence>
          {filterMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="absolute right-0 mt-2 w-64 sm:w-72 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/95 backdrop-blur-xl p-3 shadow-xl dark:shadow-2xl dark:shadow-black/40 z-20"
            >
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/45 mb-2">Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["all", "paid", "failed", "created"] as SalesFilterOption[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        onFilterChange(filter);
                        setFilterMenuOpen(false);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm text-left transition border ${
                        filterBy === filter
                          ? "border-cyan-400/45 bg-cyan-500/25 text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {FILTER_LABELS[filter]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/45 mb-2">Sort</p>
                <div className="grid grid-cols-1 gap-2">
                  {(["newest", "oldest"] as SalesSortOption[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        onSortChange(sort);
                        setFilterMenuOpen(false);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm text-left transition border ${
                        sortBy === sort
                          ? "border-cyan-400/45 bg-cyan-500/25 text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
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
