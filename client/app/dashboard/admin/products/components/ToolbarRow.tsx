"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Filter } from "lucide-react";

interface ToolbarRowProps {
  search: string;
  setSearch: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  sortOrder: string;
  setSortOrder: (s: any) => void;
}

export default function ToolbarRow({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  sortOrder,
  setSortOrder,
}: ToolbarRowProps) {
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState(search);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, setSearch]);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'design', label: 'Design Assets' },
    { value: 'software', label: 'Software' },
    { value: 'templates', label: 'Templates' },
  ];

  const sorts = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'price_low', label: 'Price: Low to High' },
  ];

  return (
    <div className="flex gap-2 w-full relative" ref={dropdownRef}>
      
      {/* Search Input */}
      <div className="relative flex-1 group">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search products, sellers, or categories..." 
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-900 dark:text-white"
        />
      </div>

      {/* Filter Button */}
      <button 
        onClick={() => setShowFilters(!showFilters)}
        className={`px-3.5 py-2.5 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm transition-colors flex items-center justify-center shrink-0 ${
          showFilters ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200' : 'text-slate-600 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5'
        }`}
      >
        <Filter className="w-4 h-4" />
      </button>

      {/* Custom Filter Popover */}
      {showFilters && (
        <div className="absolute right-0 top-[110%] w-64 bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 p-5 origin-top-right animate-in fade-in zoom-in-95 duration-200">
          
          {/* CATEGORY */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-3">Category</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all text-left ${
                    categoryFilter === cat.value
                      ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* SORT */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-3">Sort</p>
            <div className="flex flex-col gap-2">
              {sorts.map(srt => (
                <button
                  key={srt.value}
                  onClick={() => setSortOrder(srt.value as any)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all text-left ${
                    sortOrder === srt.value
                      ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  {srt.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
