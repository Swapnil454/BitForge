import { useEffect, useState } from "react";
import { Search, Tag, User, AlertCircle, Plus, ChevronLeft, Image as ImageIcon, Video, FileText } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function TicketSidebar({
  tickets,
  selectedTicketId,
  onSelectTicket,
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
  setStatusFilter,
  page,
  isAdmin = true,
  onNewTicket
}: any) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState<number | null>(null);
  const [touchEndPos, setTouchEndPos] = useState<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchEndPos(null);
    setTouchStartPos(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchEndPos(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStartPos || !touchEndPos) return;
    
    const distance = touchStartPos - touchEndPos;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      const statuses = ["all", "open", "pending", "resolved", "closed"];
      const currentIndex = statuses.indexOf(statusFilter || "all");
      
      if (isLeftSwipe && currentIndex < statuses.length - 1) {
        setStatusFilter(statuses[currentIndex + 1] as any);
      } else if (isRightSwipe && currentIndex > 0) {
        setStatusFilter(statuses[currentIndex - 1] as any);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div
      className={`w-full md:w-[360px] lg:w-[380px] flex-col shrink-0 md:border-r ${
        mobileHidden ? "hidden md:flex" : "flex"
      } ${isDark ? "bg-[#0B141A] md:border-white/5" : "bg-slate-50 md:border-slate-200"}`}
    >
      {isAdmin && (
        <div className={`px-4 py-3 flex items-center justify-between shrink-0 ${isDark ? "bg-[#0B141A]" : "bg-slate-50"}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-full transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white" : "bg-white shadow-sm hover:shadow text-slate-600 hover:text-slate-900"}`}
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className={`text-lg font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Support Tickets</h2>
          </div>
        </div>
      )}

      <div className={`flex flex-col gap-3 px-4 py-2 shrink-0 ${isDark ? "bg-[#0B141A]" : "bg-slate-50"}`}>
        <div className={`relative flex items-center w-full rounded-2xl px-3 py-2.5 transition-all shadow-sm border ${
          isDark ? "bg-[#182229] border-white/5 focus-within:border-cyan-500/50 focus-within:ring-1 ring-cyan-500/50" : "bg-white border-transparent focus-within:border-cyan-400 focus-within:ring-1 ring-cyan-400/50"
        }`}>
          <Search className={`w-4 h-4 shrink-0 mr-2 ${isDark ? "text-white/40" : "text-slate-400"}`} />
          <input
            type="search"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-[13px] font-medium text-inherit placeholder:text-inherit opacity-70 focus:opacity-100"
            suppressHydrationWarning
          />
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onNewTicket}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all shrink-0 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Raise
            </button>
            <div className={`flex items-center w-full rounded-xl p-1 shadow-inner border ${isDark ? "bg-black/20 border-white/5" : "bg-slate-200/50 border-slate-300/30"}`}>
              {["all", "seller", "buyer", "mine"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTabFilter(tab as any)}
                  className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                    tabFilter === tab
                      ? isDark ? "bg-[#2A3942] text-white shadow-sm" : "bg-white text-slate-800 shadow-sm"
                      : isDark ? "text-white/50 hover:text-white/80 hover:bg-white/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={onNewTicket}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-bold shadow-md shadow-cyan-500/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create New Ticket
          </button>
        )}

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {["all", "open", "pending", "resolved", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`whitespace-nowrap text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${
                statusFilter === status
                  ? isDark ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-300 shadow-sm shadow-cyan-900/20" : "bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-500/20"
                  : isDark ? "bg-[#182229] border-white/5 text-white/40 hover:bg-[#202C33] hover:text-white/80" : "bg-white border-slate-200/50 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div 
        className={`flex-1 overflow-y-auto no-scrollbar pb-28 pt-2 px-3 ${isDark ? "bg-[#0B141A]" : "bg-slate-50"}`}
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          if (target.scrollHeight - target.scrollTop - target.clientHeight < 150) {
            if (hasMore && !loadingMore) {
              onLoadMore();
            }
          }
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        {loading && page === 1 ? (
          <div className="flex justify-center py-10"><span className="loading loading-spinner loading-md text-cyan-500"></span></div>
        ) : tickets.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-[#182229]" : "bg-white shadow-sm"}`}>
              <FileText className={`w-8 h-8 ${isDark ? "text-white/20" : "text-slate-300"}`} />
            </div>
            <p className={`text-sm font-bold ${isDark ? "text-white/60" : "text-slate-600"}`}>No tickets found</p>
            <p className={`text-xs mt-1 ${isDark ? "text-white/40" : "text-slate-400"}`}>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {tickets.map((ticket: any) => (
              <div
                key={ticket._id}
                onClick={() => onSelectTicket(ticket._id)}
                className={`flex flex-col gap-2 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                  selectedTicketId === ticket._id
                    ? isDark ? "bg-[#182229] border-cyan-500/30 shadow-lg shadow-cyan-900/10" : "bg-white border-cyan-500 shadow-md shadow-cyan-500/10"
                    : isDark ? "bg-[#111B21] border-white/5 hover:bg-[#182229] hover:border-white/10" : "bg-white border-transparent hover:border-slate-200 shadow-sm hover:shadow"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${getStatusColor(ticket.status)}`} />
                    <span className={`text-[12px] font-extrabold tracking-wider uppercase ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                      {ticket.ticketNumber}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest font-extrabold ${
                      ticket.priority === 'urgent' ? 'text-red-500 bg-red-500/10' : 
                      ticket.priority === 'high' ? 'text-orange-500 bg-orange-500/10' : 
                      ticket.priority === 'medium' ? 'text-amber-500 bg-amber-500/10' : 
                      'text-emerald-500 bg-emerald-500/10'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ticket.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-md shadow-emerald-500/20 text-white flex items-center justify-center text-[10px] font-extrabold animate-pulse">
                        {ticket.unreadCount}
                      </span>
                    )}
                    <span className={`text-[10px] font-medium ${isDark ? "text-white/40" : "text-slate-500"}`}>
                      {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-between mt-1 mb-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                        <User className="w-3 h-3 opacity-70" />
                      </div>
                      <span className={`font-semibold truncate ${isDark ? "text-white/90" : "text-slate-700"}`}>
                        {ticket.userId?.name || "Unknown"}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md ${isDark ? "bg-white/10 text-white/50" : "bg-slate-100 text-slate-500"}`}>
                        {ticket.userId?.role || "user"}
                      </span>
                    </div>
                    {ticket.messageCount > 0 && (
                      <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full ${isDark ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"}`}>
                        {ticket.messageCount} msgs
                      </span>
                    )}
                  </div>
                )}

                {ticket.lastMessageText ? (
                  <div className={`text-[13px] leading-relaxed truncate ${selectedTicketId === ticket._id ? (isDark ? "text-white/80" : "text-slate-700") : (isDark ? "text-white/60" : "text-slate-500")}`}>
                    {ticket.lastMessageText}
                  </div>
                ) : ticket.lastMessageAttachments && ticket.lastMessageAttachments.length > 0 ? (
                  <div className={`flex items-center gap-1.5 text-[13px] font-medium truncate ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    {ticket.lastMessageAttachments[0].type?.startsWith('image/') ? (
                      <><ImageIcon className="w-3.5 h-3.5" /> Image</>
                    ) : ticket.lastMessageAttachments[0].type?.startsWith('video/') ? (
                      <><Video className="w-3.5 h-3.5" /> Video</>
                    ) : (
                      <><FileText className="w-3.5 h-3.5" /> Attachment</>
                    )}
                  </div>
                ) : ticket.subject !== "Migrated Conversation" ? (
                  <div className={`text-[13px] font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                    {ticket.subject}
                  </div>
                ) : null}
              </div>
            ))}
            
            {hasMore && (
              <div className="w-full py-4 mt-2 flex justify-center items-center">
                {loadingMore ? (
                  <span className="loading loading-spinner loading-md text-cyan-500"></span>
                ) : (
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-slate-400"}`}>
                    Scroll for more
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
