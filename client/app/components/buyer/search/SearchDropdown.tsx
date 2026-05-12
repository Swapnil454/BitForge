"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Clock, X, Trash2, TrendingUp, ChevronRight, Sparkles } from "lucide-react";
import { searchAPI } from "@/lib/api";

interface Suggestion {
  text: string;
  category: string;
}

interface HistoryItem {
  query: string;
  searchedAt: string;
}

interface SearchDropdownProps {
  query: string;
  isAuthenticated: boolean;
  onSelect: (term: string) => void;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Course: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  eBook: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  Template: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Software: "bg-green-500/15 text-green-400 border-green-500/20",
  "Design Asset": "bg-pink-500/15 text-pink-400 border-pink-500/20",
  default: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
};

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${cls} shrink-0`}>
      {category}
    </span>
  );
}

export default function SearchDropdown({
  query,
  isAuthenticated,
  onSelect,
  onClose,
}: SearchDropdownProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Fetch history on mount (only for authenticated users) ────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingHistory(true);
    searchAPI
      .getHistory()
      .then((d) => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [isAuthenticated]);

  // ── Debounced suggestion fetch ────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchAPI.getSuggestions(query.trim());
        setSuggestions((data.suggestions || []).slice(0, 8)); // suggestions still capped at 8 on frontend
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ── Reset active index when content changes ───────────────────────────────────
  useEffect(() => setActiveIndex(-1), [query, suggestions, history]);

  // ── Delete single history item ────────────────────────────────────────────────
  const handleDeleteHistory = useCallback(
    async (e: React.MouseEvent, q: string) => {
      e.stopPropagation();
      setHistory((prev) => prev.filter((h) => h.query !== q));
      try {
        await searchAPI.deleteHistoryItem(q);
      } catch {}
    },
    []
  );

  // ── Clear all history ─────────────────────────────────────────────────────────
  const handleClearAll = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    try {
      await searchAPI.clearHistory();
    } catch {}
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────────
  const allItems: string[] = query.trim().length >= 2
    ? suggestions.map((s) => s.text)
    : history.map((h) => h.query);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        onSelect(allItems[activeIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [allItems, activeIndex, onSelect, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const hasHistory = history.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const showHistory = !query || query.trim().length < 2;
  const showSuggestions = query.trim().length >= 2;

  // Nothing to show
  if (showHistory && !hasHistory && !loadingHistory) return null;
  if (showSuggestions && !hasSuggestions && !loadingSuggestions) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 z-[200] rounded-2xl overflow-hidden
        bg-white/95 dark:bg-[#0c1322]/98 backdrop-blur-2xl
        border border-gray-200/80 dark:border-white/8
        shadow-2xl shadow-black/10 dark:shadow-black/60
        animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* ── Suggestions (when typing) ─────────────────────────────────────── */}
      {showSuggestions && (
        <div className="p-2">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
            <Sparkles size={13} className="text-indigo-400 shrink-0" />
            <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Suggestions
            </span>
          </div>

          {/* Loading shimmer */}
          {loadingSuggestions && (
            <div className="space-y-1 px-1 pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {/* Items */}
          {!loadingSuggestions &&
            suggestions.map((s, idx) => (
              <button
                key={s.text + idx}
                onMouseDown={() => onSelect(s.text)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                  transition-all duration-100 group
                  ${activeIndex === idx
                    ? "bg-indigo-50 dark:bg-indigo-500/15"
                    : "hover:bg-gray-50 dark:hover:bg-white/5"
                  }
                `}
              >
                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  bg-gray-100 dark:bg-white/8 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20
                  ${activeIndex === idx ? "bg-indigo-100 dark:bg-indigo-500/20" : ""}
                `}>
                  <Search size={13} className={`transition-colors ${activeIndex === idx ? "text-indigo-500" : "text-gray-400 dark:text-slate-500 group-hover:text-indigo-400"}`} />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                  {highlightMatch(s.text, query)}
                </span>
                <CategoryBadge category={s.category} />
                <ChevronRight size={13} className="text-gray-300 dark:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
        </div>
      )}

      {/* ── Search History (when not typing) ──────────────────────────────── */}
      {showHistory && (
        <div className="p-2">
          {/* Header with clear all */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Recent Searches
              </span>
            </div>
            {hasHistory && (
              <button
                onMouseDown={handleClearAll}
                className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-500 dark:text-red-400/70 dark:hover:text-red-400 font-medium transition-colors"
              >
                <Trash2 size={11} />
                Clear all
              </button>
            )}
          </div>

          {/* Loading */}
          {loadingHistory && (
            <div className="space-y-1 px-1 pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {/* Items */}
          {!loadingHistory &&
            history.map((item, idx) => (
              <div
                key={item.query + idx}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-100 group cursor-pointer
                  ${activeIndex === idx
                    ? "bg-indigo-50 dark:bg-indigo-500/15"
                    : "hover:bg-gray-50 dark:hover:bg-white/5"
                  }
                `}
                onMouseDown={() => onSelect(item.query)}
              >
                {/* Icon */}
                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  bg-gray-100 dark:bg-white/8 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20
                  ${activeIndex === idx ? "bg-indigo-100 dark:bg-indigo-500/20" : ""}
                `}>
                  <Clock size={13} className={`transition-colors ${activeIndex === idx ? "text-indigo-500" : "text-gray-400 dark:text-slate-500 group-hover:text-indigo-400"}`} />
                </div>

                {/* Query */}
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-slate-300 truncate">
                  {item.query}
                </span>

                {/* Time ago */}
                <span className="text-[11px] text-gray-400 dark:text-slate-600 shrink-0 hidden sm:block">
                  {timeAgo(item.searchedAt)}
                </span>

                {/* Delete button */}
                <button
                  onMouseDown={(e) => handleDeleteHistory(e, item.query)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  aria-label={`Remove "${item.query}" from history`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}

          {/* Empty state for auth users with no history */}
          {!loadingHistory && !hasHistory && isAuthenticated && (
            <div className="flex flex-col items-center py-6 gap-2">
              <TrendingUp size={28} className="text-gray-200 dark:text-slate-700" />
              <p className="text-xs text-gray-400 dark:text-slate-600">No recent searches yet</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom gradient accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wraps matched portion of text in a highlight span */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-indigo-500 dark:text-indigo-400 font-semibold">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

/** Returns a human-friendly relative time string */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
