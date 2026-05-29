import React, { useState, useRef, useEffect } from "react";
import { formatDistanceToNow, format, isToday, isYesterday, isSameYear, isSameDay } from "date-fns";
import { useTheme } from "next-themes";
import { Paperclip, Send, X, ChevronLeft, MoreVertical, FileIcon, Tag, Clock, AlertCircle, Download, ChevronDown, Check, Smile } from "lucide-react";
import { toast } from "react-hot-toast";
import EmojiPicker, { Theme } from "emoji-picker-react";

function DoubleTick({ color = '#8A9DB5' }: { color?: string }) {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden="true" className="shrink-0">
      <path d="M1 5.5L4.5 9L10 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M5 5.5L8.5 9L14 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function TickIcon({ status }: { status: 'sending' | 'failed' | 'sent' | 'delivered' | 'read' }) {
  if (status === 'sending') return <Clock className="w-[12px] h-[12px] text-slate-400" />;
  if (status === 'failed') return <AlertCircle className="w-[12px] h-[12px] text-red-500" />;
  if (status === 'sent') return <Check className="w-[14px] h-[14px] text-slate-400" strokeWidth={2.5} />;
  if (status === 'delivered') return <DoubleTick color="#8A9DB5" />;
  if (status === 'read') return <DoubleTick color="#185FA5" />;
  return null;
}

function formatDateSeparator(dateStr: string | number | Date) {
  const date = new Date(dateStr);
  if (isToday(date)) return "TODAY";
  if (isYesterday(date)) return "YESTERDAY";
  if (isSameYear(date, new Date())) return format(date, "MMMM d").toUpperCase();
  return format(date, "MMMM yyyy").toUpperCase();
}

export default function TicketWindow({
  ticket,
  messages,
  loading,
  token,
  adminId,
  userId,
  onBack,
  isAdmin = true,
  socket,
  setMessages,
}: any) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const [visibleCount, setVisibleCount] = useState(10);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevTotalMessagesRef = useRef(0);
  const isFetchingMoreRef = useRef(false);

  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isNote, setIsNote] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [serverClosed, setServerClosed] = useState(false);
  const [previewImage, setPreviewImage] = useState<{url: string, name: string} | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [visibilityKey, setVisibilityKey] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;

    // Reset visible count when a different ticket is selected
    if (prevTotalMessagesRef.current === 0) {
      // Initial load of messages for a ticket
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else if (messages.length > prevTotalMessagesRef.current) {
      // A new message arrived or was sent
      // Only increment visibleCount if we were already showing the end of the list
      setVisibleCount(prev => prev + (messages.length - prevTotalMessagesRef.current));
      
      // Allow DOM to update then scroll smoothly
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
    
    prevTotalMessagesRef.current = messages.length;
  }, [messages.length]);

  // Reset when ticket changes
  useEffect(() => {
    setVisibleCount(10);
    prevTotalMessagesRef.current = 0;
  }, [ticket?._id]);

  const handleScroll = () => {
    if (!scrollContainerRef.current || isFetchingMoreRef.current) return;
    
    if (scrollContainerRef.current.scrollTop < 100 && visibleCount < messages.length) {
      isFetchingMoreRef.current = true;
      const container = scrollContainerRef.current;
      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;
      
      setVisibleCount(prev => Math.min(prev + 10, messages.length));
      
      // Adjust scroll position after render so we don't jump to top
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const newScrollHeight = scrollContainerRef.current.scrollHeight;
          scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
          isFetchingMoreRef.current = false;
        }
      }, 0);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setInputText(prev => prev + emojiData.emoji);
  };

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        setVisibilityKey(k => k + 1);
      }
    };
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('focus', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
      window.removeEventListener('focus', handler);
    };
  }, []);

  useEffect(() => {
    if (!socket || !messages?.length || !ticket?._id) return;
    
    if (document.visibilityState !== 'visible') return;

    const currentUserId = isAdmin ? adminId : userId;
    const unreadMessages = messages.filter((m: any) => {
      const fromId = typeof m.from === 'object' && m.from !== null ? String(m.from._id) : String(m.from);
      return fromId !== String(currentUserId) && 
        !m.readBy?.includes(currentUserId) &&
        m.messageType !== 'event';
    });

    if (unreadMessages.length > 0) {
      socket.emit('ticket:mark-read', {
        ticketId: ticket._id,
        msgIds: unreadMessages.map((m: any) => m._id)
      });
    }
  }, [messages, visibilityKey, socket, ticket?._id, isAdmin, adminId, userId]);

  useEffect(() => {
    if (!socket || !messages?.length || !ticket?._id) return;
    
    const currentUserId = isAdmin ? adminId : userId;
    const undeliveredMessages = messages.filter((m: any) => {
      const fromId = typeof m.from === 'object' && m.from !== null ? String(m.from._id) : String(m.from);
      return fromId !== String(currentUserId) && 
        !m.deliveredAt &&
        m.messageType !== 'event';
    });

    undeliveredMessages.forEach((m: any) => {
      socket.emit('ticket:mark-delivered', { msgId: m._id });
    });
  }, [messages, socket, ticket?._id, isAdmin, adminId, userId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isSending) return;

    const currentUserId = isAdmin ? adminId : userId;
    const localId = `local-${Date.now()}`;
    const savedInputText = inputText;
    const savedAttachments = attachments;

    const optimisticMsg = {
      _id: localId,
      localId: localId,
      message: inputText.trim(),
      messageType: isNote ? 'note' : 'message',
      fromRole: isAdmin ? 'admin' : ticket.userRole, // approximation
      from: currentUserId,
      createdAt: new Date().toISOString(),
      attachments: attachments.map(f => ({ url: URL.createObjectURL(f), name: f.name, type: f.type })),
      isSending: true,
    };
    
    // Optimistic UI update
    setMessages((prev: any) => [...prev, optimisticMsg]);
    setIsSending(true);
    setInputText("");
    setAttachments([]);

    try {
      const endpoint = !isAdmin
        ? `${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticket._id}/messages`
        : isNote 
          ? `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket._id}/notes`
          : `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket._id}/messages`;

      let uploadedAttachments: any[] = [];
      if (!isNote && savedAttachments.length > 0) {
        for (const file of savedAttachments) {
          const fd = new FormData();
          fd.append("attachment", file);
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (res.ok) {
            uploadedAttachments.push(await res.json());
          }
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: savedInputText, attachments: uploadedAttachments }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev: any) => {
          const filtered = prev.filter((m: any) => m.localId !== localId);
          if (data.message && !filtered.some((m: any) => m._id === data.message._id)) {
            filtered.push(data.message);
          }
          return filtered;
        });
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.action === 'create_new_ticket') {
          setServerClosed(true);
        } else {
          toast.error(data.error || "Failed to send");
        }
        setMessages((prev: any) => prev.map((m: any) => m.localId === localId ? { ...m, isSending: false, isFailed: true } : m));
        setInputText(savedInputText);
        setAttachments(savedAttachments);
      }
    } catch (err) {
      toast.error("An error occurred");
      setMessages((prev: any) => prev.map((m: any) => m.localId === localId ? { ...m, isSending: false, isFailed: true } : m));
      setInputText(savedInputText);
      setAttachments(savedAttachments);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("Status updated successfully");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRequestReopen = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticket._id}/request-reopen`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.success("Reopen request sent successfully");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to request reopen");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleCancelReopen = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticket._id}/cancel-reopen`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.success("Reopen request cancelled");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to cancel reopen request");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleRejectReopen = async () => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket._id}/reject-reopen`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.success("Reopen request rejected");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to reject reopen");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDownload = (url: string, name: string) => {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name || "download";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      })
      .catch(err => {
        console.error("Download failed", err);
        toast.error("Failed to download image");
      });
  };

  return (
    <div className={`flex flex-col w-full h-full relative ${isDark ? "bg-[#0b1016]" : "bg-white"}`}>
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="absolute top-4 right-4 flex gap-4">
            <button 
              onClick={() => handleDownload(previewImage.url, previewImage.name)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download image"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setPreviewImage(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img 
            src={previewImage.url} 
            alt={previewImage.name} 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Header */}
      <div className={`relative px-2 md:px-4 py-2 md:py-3 min-h-14 md:min-h-16 flex items-center justify-between border-b shrink-0 ${isDark ? "bg-[#202C33] border-white/10" : "bg-slate-50 border-slate-200"}`}>
        
        {/* Left Side: Back Button */}
        <div className="flex items-center shrink-0 z-10 min-w-[32px]">
          <button onClick={onBack} className={`md:hidden p-1.5 rounded-full shrink-0 ${isDark ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-200"}`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        {/* Center: Title & Details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-12 md:px-32">
          <div className="flex items-center justify-center gap-1.5 md:gap-2 w-full">
            <h2 className={`font-bold tracking-tight truncate text-sm md:text-base text-center ${isDark ? "text-white" : "text-slate-900"}`}>
              {isAdmin ? ticket.userId?.name : "BitForge Support"}
            </h2>
            <span className={`text-[9px] md:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${
              ticket.priority === 'urgent' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
              ticket.priority === 'high' ? 'text-orange-500 ' :
              ticket.priority === 'medium' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' :
              'text-blue-500 bg-blue-500/10 border-blue-500/20'
            }`}>
              {ticket.priority}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 md:gap-3 text-[10px] md:text-xs mt-0.5 w-full">
            <span className={`font-semibold shrink-0 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
              {ticket.ticketNumber}
            </span>
            <span className={`flex items-center justify-center gap-1 truncate ${isDark ? "text-white/40" : "text-slate-500"}`}>
              <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" /> 
              {formatDistanceToNow(new Date(ticket.createdAt))
                .replace('about ', '')
                .replace('less than a minute', 'Just now')
                .replace(' minutes', ' Min')
                .replace(' minute', ' Min')
                .replace(' hours', ' Hr')
                .replace(' hour', ' Hr')
                .replace(' days', ' D')
                .replace(' day', ' D')
                .replace(' months', ' Mo')
                .replace(' month', ' Mo')} ago
            </span>
          </div>
        </div>
        
        {/* Right Side: Status Menu */}
        <div className="flex items-center shrink-0 z-10">
          {isAdmin ? (
          <div className="relative flex items-center gap-2 shrink-0 ml-2" ref={statusMenuRef}>
            {/* Desktop Status Button */}
            <button
              onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              disabled={statusUpdating}
              className={`hidden md:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                ticket.status === 'open' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20' :
                ticket.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20' :
                ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' :
                'bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20'
              } ${statusUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Mobile 3-dot menu button */}
            <button
              onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              disabled={statusUpdating}
              className={`md:hidden p-1.5 rounded-full transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-200"}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isStatusMenuOpen && (
              <div className={`absolute top-[110%] right-0 min-w-[140px] rounded-xl shadow-lg border overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100 ${
                isDark ? "bg-[#202C33] border-white/10" : "bg-white border-slate-200"
              }`}>
                {['open', 'pending', 'resolved', 'closed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      handleStatusChange(s);
                      setIsStatusMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                      ticket.status === s 
                        ? (isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900")
                        : (isDark ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {ticket.status === s && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="relative flex items-center gap-2 shrink-0 ml-2">
            {/* Desktop Status Badge */}
            <span className={`hidden md:inline-flex text-xs font-semibold px-3 py-1.5 rounded-full border ${
              ticket.status === 'open' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
              ticket.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
              ticket.status === 'resolved' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
              'bg-slate-500/10 text-slate-600 border-slate-500/20'
            }`}>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
            
            {/* Mobile Status Menu (View Only) */}
            <div className="md:hidden relative" ref={statusMenuRef}>
              <button
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                className={`p-1.5 rounded-full transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {isStatusMenuOpen && (
                <div className={`absolute top-[110%] right-0 p-3 min-w-[120px] rounded-xl shadow-lg border overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark ? "bg-[#202C33] border-white/10" : "bg-white border-slate-200"
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-50">Status</div>
                  <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    ticket.status === 'open' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                    ticket.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                    ticket.status === 'resolved' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                    'bg-slate-500/10 text-slate-600 border-slate-500/20'
                  }`}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 ${isDark ? "bg-[#0b1016]" : "bg-[#efeae2]"}`}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <>
            {messages.slice(-visibleCount).map((msg: any, index: number, arr: any[]) => {
              const prevMsg = index > 0 ? arr[index - 1] : null;
              const showDateSeparator = !prevMsg || !isSameDay(new Date(msg.createdAt || Date.now()), new Date(prevMsg.createdAt || Date.now()));

              let messageContent = null;

              if (msg.messageType === 'event') {
                messageContent = (
                  <div className="flex justify-center my-2">
                    <div className={`text-xs px-3 py-1 rounded-full ${isDark ? "bg-white/10 text-white/60" : "bg-black/5 text-slate-500"}`}>
                      {msg.message}
                    </div>
                  </div>
                );
              } else {
                const isSenderAdmin = msg.fromRole === "admin";
                const isInternalNote = msg.messageType === 'note';
                
                const isMe = isAdmin ? isSenderAdmin : !isSenderAdmin;
                
                const currentUserId = isAdmin ? adminId : userId;
                let messageStatus: 'sending' | 'failed' | 'sent' | 'delivered' | 'read' = 'sent';
                if (msg.isSending) messageStatus = 'sending';
                else if (msg.isFailed) messageStatus = 'failed';
                else if (!msg.deliveredAt) messageStatus = 'sent';
                else if (!msg.readBy?.some((id: any) => String(id) !== String(currentUserId))) messageStatus = 'delivered';
                else messageStatus = 'read';

                messageContent = (
                  <div className={`flex flex-col max-w-[80%] ${isMe ? "self-end" : "self-start"}`}>
                    {!isMe && (
                      <span className={`text-[10px] mb-1 ${isMe ? "mr-1 text-right" : "ml-1 text-left"} ${isDark ? "text-white/40" : "text-slate-500"}`}>
                        {isSenderAdmin ? "Support Agent" : (msg.from?.name || "User")}
                      </span>
                    )}

                    <div className={`px-3 py-1.5 rounded-2xl shadow-sm relative ${
                      isInternalNote 
                        ? (isDark ? "bg-amber-900/40 text-amber-100 border border-amber-700/50" : "bg-amber-100 text-amber-900 border border-amber-200")
                        : isMe 
                          ? (isDark ? "bg-[#005C4B] text-white rounded-tr-none" : "bg-[#d9fdd3] text-slate-900 rounded-tr-none")
                          : (isDark ? "bg-[#202C33] text-white rounded-tl-none" : "bg-white text-slate-900 rounded-tl-none")
                    }`}>
                      {isInternalNote && (
                        <div className="flex items-center gap-1 mb-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
                          <AlertCircle className="w-3 h-3" /> Internal Note
                        </div>
                      )}
                      {msg.messageType === 'reopen_request' && (
                        <div className={`flex items-center gap-1 mb-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                          <AlertCircle className="w-3 h-3" /> Reopen Request
                        </div>
                      )}

                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.messageType === 'reopen_request' && !isAdmin 
                          ? "You requested to reopen this ticket." 
                          : msg.message}
                      </p>
                      
                      {msg.messageType === 'reopen_request' && !isAdmin && ticket.status === 'closed' && (
                        <div className="mt-1 text-right">
                          <button 
                            onClick={() => {
                              handleCancelReopen().then(() => window.location.reload());
                            }}
                            className={`text-[10px] uppercase font-bold tracking-wider hover:underline transition-colors ${
                              isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"
                            }`}
                          >
                            Delete Request
                          </button>
                        </div>
                      )}
                      {msg.messageType === 'reopen_request' && isAdmin && ticket.status === 'closed' && (
                        <div className="mt-3 border-t border-current/10 pt-2 flex gap-2">
                          <button 
                            onClick={() => handleStatusChange('open')}
                            disabled={statusUpdating}
                            className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${
                              isDark ? "bg-[#202C33] text-cyan-400 hover:bg-[#2A3942]" : "bg-white text-cyan-700 hover:bg-slate-50"
                            }`}
                          >
                            {statusUpdating ? "..." : "Approve"}
                          </button>
                          <button 
                            onClick={handleRejectReopen}
                            disabled={statusUpdating}
                            className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${
                              isDark ? "bg-[#202C33] text-red-400 hover:bg-red-500/10" : "bg-white text-red-600 hover:bg-red-50"
                            }`}
                          >
                            {statusUpdating ? "..." : "Reject"}
                          </button>
                        </div>
                      )}
                      
                      {msg.attachments?.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {msg.attachments.map((att: any, i: number) => (
                            att.type.startsWith("image/") ? (
                              <img 
                                key={i} 
                                src={att.url} 
                                alt="Attachment" 
                                className="max-w-[200px] rounded-lg cursor-pointer" 
                                onClick={() => setPreviewImage({ url: att.url, name: att.name || "image" })} 
                              />
                            ) : (
                              <a key={i} href={att.url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 text-xs p-2 rounded-lg max-w-full w-max ${isDark ? "bg-black/20" : "bg-black/5"}`}>
                                <FileIcon className="w-4 h-4 shrink-0" /> <span className="max-w-[150px] truncate">{att.name}</span>
                              </a>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isMe ? "self-end justify-end" : "self-start"} ${isDark ? "text-white/40" : "text-slate-500"}`}>
                      {format(new Date(msg.createdAt || Date.now()), "h:mm a")}
                      {isMe && <TickIcon status={messageStatus} />}
                    </div>
                  </div>
                );
              }

              return (
                <React.Fragment key={msg.localId || msg._id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-3">
                      <div className={`text-[10px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wide ${isDark ? "bg-[#202C33] text-white/60" : "bg-white text-slate-500 border border-slate-200"}`}>
                        {formatDateSeparator(msg.createdAt || Date.now())}
                      </div>
                    </div>
                  )}
                  {messageContent}
                </React.Fragment>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} className="shrink-0 h-1" />
      </div>

      {/* Input Area */}
      <div className={`flex flex-col border-t shrink-0 pb-safe ${isDark ? "bg-[#202C33] border-white/10" : "bg-slate-50 border-slate-200"}`}>
        {(ticket.status === 'closed' || serverClosed) ? (
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <p className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              This ticket has been closed.
            </p>
            {!isAdmin && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.location.href = '/dashboard/support'}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition-colors"
                >
                  Create New Ticket
                </button>
                <button 
                  onClick={handleRequestReopen}
                  className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    isDark ? "border-slate-600 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Request Reopen
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
        {isAdmin && (
          <div className={`flex items-center border-b px-2 ${isDark ? "border-white/10" : "border-slate-200"}`}>
            <button
              onClick={() => setIsNote(false)}
              className={`flex-1 py-1.5 text-[12px] font-semibold border-b-2 transition-colors ${
                !isNote 
                  ? (isDark ? "border-cyan-500 text-cyan-400" : "border-cyan-600 text-cyan-700")
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Reply to user
            </button>
            <button
              onClick={() => setIsNote(true)}
              className={`flex-1 py-1.5 text-[12px] font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                isNote 
                  ? (isDark ? "border-amber-500 text-amber-400" : "border-amber-500 text-amber-600")
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Tag className="w-3 h-3" />
              Internal Note
            </button>
          </div>
        )}

        {attachments.length > 0 && !isNote && (
          <div className="px-3 py-1.5 flex items-center gap-2 overflow-x-auto">
            {attachments.map((file, i) => (
              <div key={i} className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] shrink-0 ${isDark ? "bg-[#111B21]" : "bg-white border"}`}>
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeAttachment(i)} className="p-0.5 hover:bg-black/10 rounded">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className={`flex items-end gap-2 px-3 pb-3 pt-1.5 ${isNote ? (isDark ? "bg-yellow-900/10" : "bg-amber-50/50") : ""}`}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
          
          <div className={`flex-1 rounded-3xl min-h-[44px] flex items-end p-1 transition-colors ${
            isDark ? (isNote ? "bg-[#202C33] border border-yellow-500/20" : "bg-[#202C33] border border-transparent focus-within:border-white/10") 
                   : (isNote ? "bg-amber-50 border border-amber-200" : "bg-slate-100 border border-transparent focus-within:border-slate-300")
          }`}>
            {!isNote && (
              <div className="flex items-center gap-0.5 pr-1 pl-1 pb-[2px]">
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-full shrink-0 transition-colors ${isDark ? "text-white/50 hover:bg-white/10 hover:text-white/80" : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-[calc(100%+12px)] left-0 z-50 animate-in fade-in zoom-in-95 duration-100 shadow-xl rounded-xl">
                      <EmojiPicker 
                        onEmojiClick={handleEmojiClick}
                        theme={isDark ? Theme.DARK : Theme.LIGHT}
                        width={300}
                        height={400}
                        previewConfig={{showPreview: false}}
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-full shrink-0 transition-colors ${isDark ? "text-white/50 hover:bg-white/10 hover:text-white/80" : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={isNote ? "Only visible to admins..." : "Type a message..."}
              className={`flex-1 bg-transparent border-none focus:outline-none text-[14px] py-2.5 px-3 resize-none max-h-[150px] overflow-y-auto min-h-[24px] ${
                isDark ? "text-white placeholder:text-white/40" : "text-slate-900 placeholder:text-slate-500"
              } ${isNote ? "ml-3" : ""}`}
              rows={1}
            />

            <button
              type="submit"
              disabled={(!inputText.trim() && attachments.length === 0) || isSending}
              className={`p-2 rounded-full shrink-0 transition-all relative flex items-center justify-center overflow-hidden mr-1 mb-1 shadow-sm ${
                isNote 
                  ? (inputText.trim() ? "bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-md hover:scale-105" : isDark ? "bg-white/5 text-white/20" : "bg-slate-200 text-slate-400")
                  : (inputText.trim() || attachments.length > 0 ? (isDark ? "bg-[#00A884] text-white hover:bg-[#008f6f] hover:shadow-md hover:scale-105" : "bg-[#005C4B] text-white hover:bg-[#004d3e] hover:shadow-md hover:scale-105") : isDark ? "bg-white/5 text-white/20" : "bg-slate-200 text-slate-400")
              }`}
            >
              {isSending && (
                <span className="absolute inset-0 rounded-full border-2 border-current border-t-transparent animate-spin opacity-40 m-0.5"></span>
              )}
              <Send className={`w-4 h-4 ml-0.5 ${isSending ? 'opacity-50' : ''}`} />
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  );
}
