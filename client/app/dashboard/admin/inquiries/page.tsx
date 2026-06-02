"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { inquiryAPI } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  MessageSquare, Trash2, Mail, Clock, Tag,
  Search, RefreshCw, Inbox, ChevronDown, ChevronUp,
  Headphones, Briefcase, Handshake, HelpCircle,
  ArrowLeft, Filter,
} from "lucide-react";


type InquiryType = "support" | "sales" | "partnerships" | "other";

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  type: InquiryType;
  message: string;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<InquiryType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  support:      { label: "Support",     icon: Headphones, color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  sales:        { label: "Sales",       icon: Briefcase,  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  partnerships: { label: "Partnership", icon: Handshake,  color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  other:        { label: "Other",       icon: HelpCircle, color: "text-slate-400",  bg: "bg-slate-800",     border: "border-slate-700" },
};

const TABS: { label: string; value: string }[] = [
  { label: "All",          value: "all" },
  { label: "Support",      value: "support" },
  { label: "Sales",        value: "sales" },
  { label: "Partnerships", value: "partnerships" },
  { label: "Other",        value: "other" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function InquiryCard({ inquiry, onDelete, onRead }: { inquiry: Inquiry; onDelete: (id: string) => void; onRead: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cfg = TYPE_CONFIG[inquiry.type] || TYPE_CONFIG.other;
  const Icon = cfg.icon;

  const handleDelete = async () => {
    if (!confirm("Delete this inquiry? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await inquiryAPI.deleteOne(inquiry._id);
      toast.success("Inquiry deleted");
      onDelete(inquiry._id);
    } catch {
      toast.error("Failed to delete inquiry");
      setDeleting(false);
    }
  };

  const handleMarkRead = async () => {
    if (inquiry.read) return;
    try {
      await inquiryAPI.markRead(inquiry._id);
      onRead(inquiry._id);
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={`group rounded-2xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${!inquiry.read ? "border-l-4 border-l-indigo-500 border-slate-200 dark:border-slate-800" : "border-slate-200 dark:border-slate-800"}`}
      onMouseEnter={handleMarkRead}
      onClick={handleMarkRead}
    >
      <div className="p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
            <span className="text-white font-bold text-sm">{inquiry.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-white text-[15px]">{inquiry.name}</span>
              {!inquiry.read && (
                <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">NEW</span>
              )}
            </div>
            <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-indigo-400 transition-colors mt-0.5">
              <Mail size={11} /><span className="truncate">{inquiry.email}</span>
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <span className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
              <Icon size={11} />{cfg.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Clock size={11} />{timeAgo(inquiry.createdAt)}
            </span>
          </div>
        </div>

        {/* Mobile type */}
        <div className="sm:hidden mt-2">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
            <Icon size={11} />{cfg.label}
          </span>
        </div>

        {/* Message */}
        <div className="mt-3">
          <p className={`text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
            {inquiry.message}
          </p>
          {inquiry.message.length > 120 && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 mt-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {expanded ? <><ChevronUp size={12} />Show less</> : <><ChevronDown size={12} />Read more</>}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <a
            href={`mailto:${inquiry.email}?subject=Re: Your ${cfg.label} Enquiry on BitForge`}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all"
          >
            <Mail size={12} />Reply
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all disabled:opacity-50"
          >
            {deleting ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={12} />}
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
      </div>
    </div>
  );
}

const PAGE_SIZE = 7;

export default function AdminInquiriesPage() {
  const router = useRouter();

  const [inquiries, setInquiries]   = useState<Inquiry[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);
  const [loading, setLoading]       = useState(true);   // initial / reset load
  const [loadingMore, setLoadingMore] = useState(false); // appending next page
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState("all");
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Sentinel div at bottom – triggers next page load
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Track whether a fetch is in-flight (avoids double-fetching)
  const fetchingRef  = useRef(false);

  // Debounce search → send to server
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 380);
    return () => clearTimeout(t);
  }, [search]);

  // ── RESET whenever tab or debounced search changes ──────────────────────
  const resetAndFetch = useCallback(async (tab: string, q: string) => {
    const cacheKey = `admin_inquiries_${tab}_${q.trim()}`;
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setInquiries(parsed.inquiries || []);
        setTotal(parsed.total || 0);
        setHasMore(parsed.hasMore || false);
        setPage(2);
        setLoading(false);
      } else {
        setLoading(true);
        setInquiries([]);
        setPage(1);
        setHasMore(false);
      }
    } catch(e) {
      setLoading(true);
      setInquiries([]);
      setPage(1);
      setHasMore(false);
    }

    try {
      const data = await inquiryAPI.getAll({
        page: 1,
        limit: PAGE_SIZE,
        type: tab === "all" ? undefined : tab,
        search: q || undefined,
      });
      setInquiries(data.inquiries || []);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setPage(2); // next page to fetch
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {}
    } catch {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    resetAndFetch(activeTab, debouncedSearch);
  }, [activeTab, debouncedSearch, resetAndFetch]);

  // ── LOAD MORE (append) ───────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoadingMore(true);
    try {
      const data = await inquiryAPI.getAll({
        page,
        limit: PAGE_SIZE,
        type: activeTab === "all" ? undefined : activeTab,
        search: debouncedSearch || undefined,
      });
      setInquiries(prev => [...prev, ...(data.inquiries || [])]);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setPage(p => p + 1);
    } catch {
      toast.error("Failed to load more inquiries");
    } finally {
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [page, hasMore, activeTab, debouncedSearch]);

  // ── IntersectionObserver – fires loadMore when sentinel visible ──────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Refresh (reset to page 1) ────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await resetAndFetch(activeTab, debouncedSearch);
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    setInquiries(prev => prev.filter(i => i._id !== id));
    setTotal(prev => Math.max(0, prev - 1));
  };

  const handleRead = useCallback((id: string) => {
    setInquiries(prev => prev.map(i => i._id === id ? { ...i, read: true } : i));
  }, []);

  const unread = inquiries.filter(i => !i.read).length;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24 md:pb-10">
      {/* Sticky header — title + search + pills */}
      <header className="sticky top-0 z-50 bg-white dark:bg-black/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        {/* Top row: back + title + refresh */}
        <div className="max-w-7xl mx-auto h-14 px-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-none">Inquiries</h1>
            {total > 0 && (
              <span className="text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full leading-none">
                {total}
              </span>
            )}
            {unread > 0 && (
              <span className="text-[11px] font-bold bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full leading-none">
                {unread} new
              </span>
            )}
          </div>

          <button
            onClick={() => handleRefresh()}
            disabled={refreshing}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search bar — full width below title */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-white/[0.06] rounded-xl border border-slate-200 dark:border-white/10 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-400/30 transition-all">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs leading-none">✕</button>
            )}
          </div>
        </div>

        {/* Filter pills — scrollable strip */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                activeTab === tab.value
                  ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white shadow-sm"
                  : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:text-slate-700 dark:hover:text-white"
              }`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-4 space-y-5">

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : inquiries.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white dark:border-slate-800 shadow-sm py-20 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Inbox size={26} className="text-slate-400" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-white mb-1">
                {search ? "No matching inquiries" : "No inquiries yet"}
              </h3>
              <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-xs">
                {search ? "Try a different search term." : "Submissions from the contact page will appear here."}
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" className="space-y-3">
              {inquiries.map((inquiry) => (
                <InquiryCard key={inquiry._id} inquiry={inquiry} onDelete={handleDelete} onRead={handleRead} />
              ))}

              {/* Sentinel for IntersectionObserver */}
              <div ref={sentinelRef} className="h-4" />

              {/* Loading more spinner */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <span className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              )}

              {/* End of list */}
              {!hasMore && !loadingMore && inquiries.length > 0 && (
                <p className="text-center text-[12px] text-slate-400 dark:text-slate-600 pt-1 pb-2">
                  Showing all {total} {total === 1 ? "inquiry" : "inquiries"}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
