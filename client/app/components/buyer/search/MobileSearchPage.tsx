"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, Clock, ChevronRight, Trash2,
  TrendingUp, ChevronLeft, Sparkles, Hash,
  BookOpen, Code2, Layers, Layout, Cpu, Zap,
} from "lucide-react";
import { searchAPI } from "@/lib/api";

const TRENDING = [
  "JavaScript", "Python", "Figma Templates", "React",
  "Node.js", "UI Kit", "Machine Learning", "Excel Sheets",
];

const CATEGORIES = [
  { label: "Courses",       icon: BookOpen, filter: "Course"   },
  { label: "eBooks",        icon: Code2,    filter: "eBook"    },
  { label: "Templates",     icon: Layout,   filter: "Template" },
  { label: "Software",      icon: Cpu,      filter: "Software" },
  { label: "Design Assets", icon: Layers,   filter: "Design"   },
];

interface Suggestion { text: string; category: string }
interface HistoryItem { query: string; searchedAt: string }
interface Props {
  isAuthenticated: boolean;
  onSearch: (term: string) => void;
  onClose: () => void;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-indigo-500 dark:text-indigo-400 font-bold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function MobileSearchPage({ isAuthenticated, onSearch, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery]             = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory]         = useState<HistoryItem[]>([]);
  const [loadingSug, setLoadingSug]   = useState(false);
  const [vhPx, setVhPx]              = useState<string>("100dvh");
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Track visual viewport (shrinks when keyboard opens on mobile) ──────────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setVhPx(`${vv.height}px`);
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    onResize();
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    searchAPI.getHistory().then(d => setHistory(d.history || [])).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) { setSuggestions([]); setLoadingSug(false); return; }
    setLoadingSug(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchAPI.getSuggestions(q);
        setSuggestions((data.suggestions || []).slice(0, 8));
      } catch { setSuggestions([]); }
      finally { setLoadingSug(false); }
    }, 260);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const commit = useCallback((term: string) => {
    if (!term.trim()) return;
    onSearch(term.trim());
    onClose();
  }, [onSearch, onClose]);

  const deleteItem = useCallback(async (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    setHistory(p => p.filter(h => h.query !== q));
    try { await searchAPI.deleteHistoryItem(q); } catch {}
  }, []);

  const clearAll = useCallback(async () => {
    setHistory([]);
    try { await searchAPI.clearHistory(); } catch {}
  }, []);

  const isTyping   = query.trim().length >= 2;
  const hasHistory = history.length > 0;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[400] bg-white dark:bg-[#030712] flex flex-col animate-in slide-in-from-top duration-150 overflow-hidden"
      style={{ height: vhPx }}
    >

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100 dark:border-white/[0.06]">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shrink-0"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        <form 
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) commit(query);
          }}
          className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-[#0f1629] rounded-xl px-3 py-2 border border-slate-300 dark:border-white/20 focus-within:border-violet-500 dark:focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all duration-200"
        >
          {/* Dummy inputs to trap Chrome autofill */}
          <input type="text" name="fake-email" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          <input type="password" name="fake-password" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />

          <Search size={15} className="text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            name={`search-${Math.random().toString(36).substring(2, 8)}`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
            }}
            placeholder="Search products, topics, skills…"
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-[13.5px] font-medium"
            autoComplete="nope" 
            autoCorrect="off" 
            autoCapitalize="none"
            spellCheck={false}
            inputMode="search"
            enterKeyHint="search"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 transition-colors shrink-0">
              <X size={13} />
            </button>
          )}
        </form>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">

        {/* SUGGESTIONS */}
        {isTyping && (
          <div className="pt-3 pb-1">
            {/* Section label */}
            <div className="flex items-center gap-1.5 px-4 mb-1">
              <Sparkles size={11} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Suggestions</span>
            </div>

            {loadingSug
              ? [1,2,3].map(i => <div key={i} className="mx-3 mb-0.5 h-9 rounded-lg bg-gray-100 dark:bg-white/[0.05] animate-pulse" />)
              : suggestions.length > 0
                ? suggestions.map((s, i) => (
                    <button
                      key={i} onClick={() => commit(s.text)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.04] text-left transition-colors group"
                    >
                      <Search size={13} className="text-gray-400 dark:text-slate-500 shrink-0" />
                      <span className="flex-1 text-[13px] font-medium text-gray-800 dark:text-slate-200 truncate">
                        <Highlight text={s.text} query={query} />
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{s.category}</span>
                      <ChevronRight size={12} className="text-gray-300 dark:text-slate-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                : (
                    <div className="py-7 flex flex-col items-center gap-2 text-center px-4">
                      <p className="text-[13px] text-gray-500 dark:text-slate-500">No results for <span className="font-semibold">"{query}"</span></p>
                      <button onClick={() => commit(query)} className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-bold rounded-lg transition-colors">
                        Search anyway →
                      </button>
                    </div>
                  )
            }
          </div>
        )}

        {/* RECENT SEARCHES */}
        {!isTyping && hasHistory && (
          <div className="pt-3 pb-1">
            <div className="flex items-center justify-between px-4 mb-1">
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Recent</span>
              </div>
              <button onClick={clearAll} className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-500 font-semibold transition-colors">
                <Trash2 size={10} /> Clear all
              </button>
            </div>

            {history.map((item, i) => (
              <div
                key={i} onClick={() => commit(item.query)}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer group transition-colors"
              >
                <Clock size={13} className="text-gray-400 dark:text-slate-600 shrink-0" />
                <span className="flex-1 text-[13px] font-medium text-gray-800 dark:text-slate-200 truncate">{item.query}</span>
                <button
                  onClick={e => deleteItem(e, item.query)}
                  className="text-gray-300 dark:text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* divider between recent and trending */}
        {!isTyping && hasHistory && (
          <div className="mx-4 my-2 h-px bg-gray-100 dark:bg-white/[0.05]" />
        )}

        {/* TRENDING */}
        {!isTyping && (
          <div className="pt-2 pb-1 px-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={11} className="text-cyan-400" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Trending</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING.map(term => (
                <button
                  key={term} onClick={() => commit(term)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-slate-400 text-[11.5px] font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                >
                  <Hash size={9} className="text-gray-400 dark:text-slate-600" /> {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {!isTyping && (
          <div className="pt-3 pb-6 px-3">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Zap size={11} className="text-amber-400" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Browse Categories</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map(({ label, icon: Icon, filter }) => (
                <button
                  key={label} onClick={() => {
                    onClose();
                    router.push(`/marketplace?category=${filter}`);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.05] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/20 text-left transition-all group"
                >
                  <Icon size={13} className="text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
                  <span className="text-[12px] font-semibold text-gray-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
