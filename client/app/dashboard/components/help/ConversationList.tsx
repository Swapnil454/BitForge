import { MessageCircle, ImageIcon, File, Paperclip as AttachmentIcon, Trash, User } from "lucide-react";
import { useTheme } from "next-themes";

const AVATAR_COLORS = [
  { bg: '#B5D4F4', text: '#0C447C' },
  { bg: '#C0DD97', text: '#27500A' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#CECBF6', text: '#3C3489' },
  { bg: '#9FE1CB', text: '#085041' },
  { bg: '#F5C4B3', text: '#712B13' },
];

function getAvatarStyle(name: string) {
  if (!name) return AVATAR_COLORS[0];
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name: string) {
  if (!name) return "U";
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return initials || "U";
}

interface ConversationListProps {
  conversations: any[];
  selectedUserId: string | null;
  onSelectConversation: (userId: string) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function ConversationList({ conversations, selectedUserId, onSelectConversation, loading, loadingMore, hasMore, onLoadMore }: ConversationListProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const truncatePreview = (text: string, max = 35) => {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
  };

  const getConversationPreviewData = (chat: any) => {
    const incomingMessage = (chat.lastIncomingMessage || "").trim();
    const hasIncomingMessage = Boolean(incomingMessage);
    const attachments = chat.lastIncomingAttachments || [];
    const hasAttachments = attachments.length > 0;
    const isDeleted = chat.lastIncomingStatus === "deleted" || chat.lastIncomingIsDeleted;

    if (isDeleted) return { text: "Message deleted", icon: Trash, type: "deleted" };
    if (hasIncomingMessage) return { text: truncatePreview(incomingMessage), icon: MessageCircle, type: "message" };

    if (hasAttachments) {
      const hasImage = attachments.some((att: any) => att.type?.startsWith("image/"));
      const hasNonImage = attachments.some((att: any) => !att.type?.startsWith("image/"));
      if (hasImage && !hasNonImage) return { text: "Image sent", icon: ImageIcon, type: "image" };
      if (!hasImage && hasNonImage) return { text: "File sent", icon: File, type: "file" };
      return { text: "Attachment sent", icon: AttachmentIcon, type: "attachment" };
    }

    return { 
      text: "No preview available", 
      icon: MessageCircle, 
      type: "empty" 
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col px-2 py-2 gap-2 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 w-full rounded-xl px-3 py-3">
            <div className="w-11 h-11 rounded-full bg-white/5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/5 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="h-full grid place-items-center px-4">
        <div className="text-center max-w-[220px]">
          <p className={`text-sm font-semibold ${isDark ? "text-white/60" : "text-slate-500"}`}>No conversations found</p>
        </div>
      </div>
    );
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
      {conversations.map((c) => {
        const previewData = getConversationPreviewData(c);
        const avatarStyle = getAvatarStyle(c.name);
        const isSelected = selectedUserId === c.userId;

        return (
          <button
            key={c.userId}
            onClick={() => onSelectConversation(c.userId)}
            className={`w-full text-left px-4 py-3 border-b flex items-center gap-3.5 transition-colors ${
              isSelected
                ? isDark ? "bg-white/[0.08] border-white/5" : "bg-slate-100 border-slate-200"
                : isDark ? "bg-transparent hover:bg-white/[0.04] border-white/5" : "bg-transparent hover:bg-slate-50 border-slate-100"
            }`}
          >
            {/* Avatar */}
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm shadow-sm"
              style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
            >
              {getInitials(c.name)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className={`font-semibold truncate max-w-[140px] text-[14px] ${isDark ? "text-white" : "text-slate-900"}`}>
                  {c.name}
                </span>
                <span className={`text-[11px] font-medium shrink-0 ${c.unreadCount > 0 ? (isDark ? "text-white" : "text-slate-900") : (isDark ? "text-white/40" : "text-slate-400")}`}>
                  {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              
              <div className="flex justify-between items-center gap-2">
                <span className={`text-[13px] truncate ${c.unreadCount > 0 && !isSelected ? (isDark ? "text-white font-medium" : "text-slate-800 font-medium") : (isDark ? "text-white/50" : "text-slate-500")}`}>
                  {previewData.text}
                </span>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Role Badge */}
                  <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                    c.role === "seller" 
                      ? isDark ? "bg-fuchsia-500/10 text-fuchsia-300" : "bg-fuchsia-100 text-fuchsia-700"
                      : isDark ? "bg-cyan-500/10 text-cyan-300" : "bg-cyan-100 text-cyan-700"
                  }`}>
                    {c.role}
                  </span>
                  
                  {/* Unread Badge */}
                  {c.unreadCount > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E53935] px-1 text-[10px] text-white font-bold">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
      
      {loadingMore && (
        <div className="flex justify-center items-center py-4">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
