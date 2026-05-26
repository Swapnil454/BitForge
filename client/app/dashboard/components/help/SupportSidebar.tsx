import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTheme } from "next-themes";
import ConversationList from "./ConversationList";

interface SupportSidebarProps {
  conversations: any[];
  selectedUserId: string | null;
  onSelectConversation: (userId: string) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  mobileHidden: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  tabFilter: "all" | "seller" | "buyer" | "unread";
  setTabFilter: (t: "all" | "seller" | "buyer" | "unread") => void;
  statusFilter: "all" | "open" | "resolved";
  setStatusFilter: (s: "all" | "open" | "resolved") => void;
}

export default function SupportSidebar({
  conversations,
  selectedUserId,
  onSelectConversation,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  mobileHidden,
  searchQuery,
  setSearchQuery,
  tabFilter,
  setTabFilter,
  statusFilter,
  setStatusFilter
}: SupportSidebarProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      className={`w-full md:w-[320px] lg:w-[340px] flex-col shrink-0 border-r ${
        mobileHidden ? "hidden md:flex" : "flex"
      } ${isDark ? "bg-[#111B21] border-white/10" : "bg-white border-slate-200"}`}
    >
      {/* Header */}
      <div className={`px-4 py-3 h-16 flex items-center justify-between shrink-0 ${isDark ? "bg-[#202C33]" : "bg-slate-50"}`}>
        <h2 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Support Inbox</h2>
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-green-500">Live</span>
        </div>
      </div>

      {/* Search & Filters Area */}
      <div className={`flex flex-col gap-3 px-3 py-3 shrink-0 ${isDark ? "bg-[#111B21]" : "bg-white"}`}>
        {/* Search */}
        <div className={`relative flex items-center w-full rounded-lg px-3 py-1.5 transition-colors ${
          isDark ? "bg-[#202C33] focus-within:bg-[#2A3942]" : "bg-slate-100 focus-within:bg-slate-200"
        }`}>
          <Search className={`w-4 h-4 shrink-0 ${isDark ? "text-white/40" : "text-slate-400"}`} />
          <input
            type="search"
            name="support-conversations-search"
            autoComplete="nope"
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-sm px-2.5 py-1 text-inherit placeholder:text-inherit opacity-70 focus:opacity-100"
          />
        </div>

        {/* Primary Tabs */}
        <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? "bg-[#202C33]" : "bg-slate-100"}`}>
          {["all", "seller", "buyer", "unread"].map((tab) => (
            <button
              key={tab}
              onClick={() => setTabFilter(tab as any)}
              className={`flex-1 text-[12px] font-medium py-1.5 rounded-md transition-all ${
                tabFilter === tab
                  ? isDark ? "bg-[#3A4B54] text-white shadow-sm" : "bg-white text-slate-800 shadow-sm"
                  : isDark ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "seller" ? "Sellers" : tab === "buyer" ? "Buyers" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="flex items-center gap-2 px-1">
          {["all", "open", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === status
                  ? isDark ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-300" : "bg-cyan-50 border-cyan-200 text-cyan-700"
                  : isDark ? "bg-transparent border-white/10 text-white/40 hover:text-white/60" : "bg-transparent border-slate-200 text-slate-500 hover:text-slate-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <ConversationList 
        conversations={conversations} 
        selectedUserId={selectedUserId}
        onSelectConversation={onSelectConversation}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}
