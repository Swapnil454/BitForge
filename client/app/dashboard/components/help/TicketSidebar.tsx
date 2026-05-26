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
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

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
      className={`w-full md:w-[360px] lg:w-[380px] flex-col shrink-0 border-r ${
        mobileHidden ? "hidden md:flex" : "flex"
      } ${isDark ? "bg-[#111B21] border-white/10" : "bg-white border-slate-200"}`}
    >
      <div className={`px-4 py-2 flex items-center justify-between shrink-0 border-b ${isDark ? "bg-[#202C33] border-white/10" : "bg-slate-50 border-slate-200"}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className={`p-1 rounded-md transition-colors ${isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"}`}
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className={`text-sm font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Support Tickets</h2>
        </div>
      </div>

      <div className={`flex flex-col gap-2 px-3 py-2 shrink-0 ${isDark ? "bg-[#111B21]" : "bg-white"}`}>
        <div className={`relative flex items-center w-full rounded-md px-2 py-1.5 transition-colors ${
          isDark ? "bg-[#202C33] focus-within:bg-[#2A3942]" : "bg-slate-100 focus-within:bg-slate-200"
        }`}>
          <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-white/40" : "text-slate-400"}`} />
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-[13px] px-2 text-inherit placeholder:text-inherit opacity-70 focus:opacity-100"
            suppressHydrationWarning
          />
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onNewTicket}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white text-[13px] font-medium transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Raise
            </button>
            <div className={`flex items-center w-full rounded-md p-0.5 ${isDark ? "bg-[#202C33]" : "bg-slate-100"}`}>
              {["all", "seller", "buyer", "mine"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTabFilter(tab as any)}
                  className={`flex-1 text-[11px] font-semibold py-1 rounded transition-all ${
                    tabFilter === tab
                      ? isDark ? "bg-[#3A4B54] text-white shadow-sm" : "bg-white text-slate-800 shadow-sm"
                      : isDark ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700"
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
            className="w-full flex items-center justify-center gap-2 py-1.5 px-4 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white text-[13px] font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        )}

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {["all", "open", "pending", "resolved", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`whitespace-nowrap text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
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

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading && page === 1 ? (
          <div className="flex justify-center py-10"><span className="loading loading-spinner loading-md"></span></div>
        ) : tickets.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">No tickets found.</div>
        ) : (
          <div className="flex flex-col">
            {tickets.map((ticket: any) => (
              <div
                key={ticket._id}
                onClick={() => onSelectTicket(ticket._id)}
                className={`flex flex-col gap-1.5 p-3.5 border-b cursor-pointer transition-colors ${
                  selectedTicketId === ticket._id
                    ? isDark ? "bg-[#2A3942] border-white/5" : "bg-slate-50 border-slate-200"
                    : isDark ? "hover:bg-[#202C33] border-white/5" : "hover:bg-slate-50/50 border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(ticket.status)}`} />
                    <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                      {ticket.ticketNumber}
                    </span>
                    <span className={`text-[8px] opacity-80 uppercase tracking-widest font-extrabold ${ticket.priority === 'urgent' ? 'text-red-500' : ticket.priority === 'high' ? 'text-orange-500' : ticket.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ticket.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                        {ticket.unreadCount}
                      </span>
                    )}
                    <span className={`text-[10px] ${isDark ? "text-white/40" : "text-slate-500"}`}>
                      {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-between mt-1 mb-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-white/10" : "bg-black/5"}`}>
                        <User className="w-2.5 h-2.5 opacity-70" />
                      </div>
                      <span className={`font-medium truncate ${isDark ? "text-white/80" : "text-slate-700"}`}>
                        {ticket.userId?.name || "Unknown"}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded ${isDark ? "bg-white/10 text-white/50" : "bg-slate-100 text-slate-500"}`}>
                        {ticket.userId?.role || "user"}
                      </span>
                    </div>
                    {ticket.messageCount > 0 && (
                      <span className={`text-[10px] font-medium shrink-0 ${isDark ? "text-white/40" : "text-slate-500"}`}>
                        {ticket.messageCount} msgs
                      </span>
                    )}
                  </div>
                )}

                {ticket.lastMessageText ? (
                  <div className={`text-xs truncate ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    {ticket.lastMessageText}
                  </div>
                ) : ticket.lastMessageAttachments && ticket.lastMessageAttachments.length > 0 ? (
                  <div className={`flex items-center gap-1 text-xs truncate ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    {ticket.lastMessageAttachments[0].type?.startsWith('image/') ? (
                      <><ImageIcon className="w-3 h-3" /> Image</>
                    ) : ticket.lastMessageAttachments[0].type?.startsWith('video/') ? (
                      <><Video className="w-3 h-3" /> Video</>
                    ) : (
                      <><FileText className="w-3 h-3" /> Attachment</>
                    )}
                  </div>
                ) : ticket.subject !== "Migrated Conversation" ? (
                  <div className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                    {ticket.subject}
                  </div>
                ) : null}
              </div>
            ))}
            
            {hasMore && (
              <button 
                onClick={onLoadMore}
                disabled={loadingMore}
                className={`w-full py-3 text-xs font-semibold hover:bg-black/5 transition-colors ${
                  isDark ? "text-cyan-400" : "text-cyan-600"
                }`}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
