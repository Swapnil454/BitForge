import { useState, useRef, useEffect } from "react";
import { MessageCircle, ImageIcon, File, Paperclip as AttachmentIcon, Trash, User, MoreVertical, X, CheckCircle2, ChevronLeft, Send, Loader2, Smile, Check, CheckCheck, Download } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import EmojiPicker, { Theme } from 'emoji-picker-react';

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

function formatDateHeader(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

const ALL_QUICK_REPLIES = [
  "We're looking into it",
  "Can you share the order ID?",
  "Payment has been confirmed",
  "We'll follow up within 24 hours",
  "Could you provide a screenshot of the issue?",
  "Your payout is being processed",
  "Let me check that for you right now",
  "Has the issue been resolved on your end?",
  "Is there anything else I can help you with?",
  "Apologies for the inconvenience",
  "I've escalated this to our technical team",
  "Please clear your browser cache and try again"
];

interface ChatWindowProps {
  user: any;
  messages: any[];
  ticketId: string | null;
  avgResponseTime: number | null;
  loading: boolean;
  onBack?: () => void;
  onSendMessage: (text: string, attachments: File[]) => void;
  onDeleteMessages: (ids: string[]) => void;
  onClearThread: () => void;
  adminId: string;
  hasMoreMessages: boolean;
  loadingMoreMessages: boolean;
  onLoadMoreMessages: () => void;
}

export default function ChatWindow({
  user,
  messages,
  ticketId,
  avgResponseTime,
  loading,
  onBack,
  onSendMessage,
  onDeleteMessages,
  onClearThread,
  adminId,
  hasMoreMessages,
  loadingMoreMessages,
  onLoadMoreMessages
}: ChatWindowProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{url: string, name: string} | null>(null);
  const [activeQuickReplies, setActiveQuickReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    // Randomize quick replies when user changes or component mounts
    const shuffled = [...ALL_QUICK_REPLIES].sort(() => 0.5 - Math.random());
    setActiveQuickReplies(shuffled.slice(0, 4));
  }, [user?._id]);

  // Remove automatic scroll to bottom if loading more, only scroll if new message arrives or first load
  // Actually, we'll keep it simple: scroll to bottom on new message.
  useEffect(() => {
    if (!loadingMoreMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length > 0 ? messages[messages.length - 1]._id : null]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      if (hasMoreMessages && !loadingMoreMessages) {
        onLoadMoreMessages();
      }
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    onSendMessage(inputValue, attachments);
    setInputValue("");
    setAttachments([]);
    setShowEmojiPicker(false);
  };

  const handleChipClick = (text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  if (!user) return null;

  const avatarStyle = getAvatarStyle(user.name);

  // Group messages by date
  const groupedMessages = messages.reduce((acc: any, msg: any) => {
    const dateStr = formatDateHeader(msg.createdAt);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(msg);
    return acc;
  }, {});

  return (
    <div className={`flex-1 flex flex-col h-full ${isDark ? "bg-[#0b1016]" : "bg-[#efeae2]"}`}>
      {/* Sticky Header */}
      <div className={`flex flex-col shrink-0 border-b ${isDark ? "bg-[#202C33] border-white/10" : "bg-slate-50 border-slate-200"}`}>
        <div className="flex items-center justify-between px-4 py-3 h-16">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className={`mr-2 p-1.5 rounded-full ${isDark ? "hover:bg-white/10" : "hover:bg-slate-200"}`}>
                <ChevronLeft className={`w-5 h-5 ${isDark ? "text-white" : "text-slate-700"}`} />
              </button>
            )}
            
            <div className="relative">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
              >
                {getInitials(user.name)}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#202C33] rounded-full" />
            </div>

            <div className="flex flex-col min-w-0 max-w-[140px] sm:max-w-none">
              <span className={`font-semibold text-[13px] sm:text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>{user.name}</span>
              <span className={`text-[9px] sm:text-[11px] font-medium uppercase tracking-wider truncate ${
                user.role === "seller" 
                  ? isDark ? "text-fuchsia-400" : "text-fuchsia-600"
                  : isDark ? "text-cyan-400" : "text-cyan-600"
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className={`hidden sm:flex text-[12px] font-semibold px-3 py-1.5 rounded-lg border items-center gap-1.5 transition-colors ${
              isDark ? "border-white/10 text-white/70 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Resolved
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-slate-200 text-slate-600"}`}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-[5]" onClick={() => setShowMenu(false)} />
                  <div className={`absolute right-0 mt-1 w-56 rounded-xl shadow-lg border overflow-hidden z-10 ${
                    isDark ? "bg-[#202C33] border-white/10" : "bg-white border-slate-200"
                  }`}>
                    <div className={`sm:hidden px-4 py-3 border-b text-[11px] font-medium leading-relaxed ${isDark ? "border-white/10 text-white/50" : "border-slate-200 text-slate-500"}`}>
                      <div>Ticket #{ticketId || "Pending"}</div>
                      <div>Opened {messages.length > 0 ? new Date(messages[0].createdAt).toLocaleDateString() : "Just now"}</div>
                      <div>Avg response: {avgResponseTime !== null ? `${avgResponseTime} min` : "—"}</div>
                    </div>
                  <button 
                    onClick={() => { setShowMenu(false); }}
                    className={`sm:hidden w-full flex items-center gap-2 text-left px-4 py-3 text-sm font-medium transition-colors border-b ${
                      isDark ? "border-white/10 hover:bg-white/5 text-white/90" : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Resolved
                  </button>
                  <button 
                    onClick={() => { setShowMenu(false); onClearThread(); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 font-medium transition-colors"
                  >
                    Clear Chat History
                  </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Ticket Info Bar */}
        <div className={`hidden sm:flex px-4 py-1.5 items-center gap-3 text-[11px] font-medium ${isDark ? "bg-[#182229] text-white/50" : "bg-slate-100 text-slate-500"}`}>
          <span>Ticket #{ticketId || "Pending"}</span>
          <span>·</span>
          <span>Opened {messages.length > 0 ? new Date(messages[0].createdAt).toLocaleDateString() : "Just now"}</span>
          <span>·</span>
          <span>Avg response: {avgResponseTime !== null ? `${avgResponseTime} min` : "—"}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6 flex flex-col" onScroll={handleScroll}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className={`w-8 h-8 animate-spin ${isDark ? "text-white/20" : "text-slate-300"}`} />
          </div>
        ) : (
          <>
            {loadingMoreMessages && (
              <div className="flex justify-center items-center py-2 shrink-0">
                <Loader2 className={`w-5 h-5 animate-spin ${isDark ? "text-white/20" : "text-slate-300"}`} />
              </div>
            )}
            {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
            <div key={date} className="space-y-4">
              <div className="flex justify-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  isDark ? "bg-[#202C33] text-white/60" : "bg-white shadow-sm text-slate-500"
                }`}>
                  {date}
                </span>
              </div>
              
              {msgs.map((msg: any) => {
                const isAdmin = msg.fromRole === "admin";
                const isDeleted = msg.status === "deleted" || msg.isDeleted;
                
                return (
                  <div key={msg._id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] sm:max-w-[75%] md:max-w-[60%] flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                      {!isAdmin && (
                        <span className={`text-[11px] font-medium mb-1 ml-1 ${isDark ? "text-white/40" : "text-slate-500"}`}>
                          {msg.from.name}
                        </span>
                      )}
                      
                      <div className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl relative group text-[13px] sm:text-[15px] ${
                        isDeleted 
                          ? isDark ? "bg-red-500/10 border border-red-500/20 text-red-400 italic" : "bg-red-50 border border-red-100 text-red-500 italic"
                          : isAdmin
                            ? "bg-[#005C4B] text-white rounded-tr-sm"
                            : isDark ? "bg-[#202C33] text-white rounded-tl-sm" : "bg-white text-slate-800 shadow-sm rounded-tl-sm"
                      }`}>
                        {isDeleted ? (
                          <div className="flex items-center gap-2">
                            <Trash className="w-3.5 h-3.5" />
                            <span className="text-sm">Message deleted</span>
                          </div>
                        ) : (
                          <>
                            {msg.attachments?.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {msg.attachments.map((att: any, i: number) => {
                                  const isImg = att.type?.startsWith("image/");
                                  if (isImg) {
                                    return (
                                      <div 
                                        key={i} 
                                        className="rounded-lg overflow-hidden relative w-36 h-36 sm:w-64 sm:h-64 bg-black/10 cursor-pointer"
                                        onClick={() => setSelectedImage({ url: att.url, name: att.name || 'image.png' })}
                                      >
                                        <Image src={att.url} alt="Attachment" fill className="object-cover" />
                                      </div>
                                    );
                                  }
                                  return (
                                    <a 
                                      key={i} 
                                      href={att.url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg transition-colors ${
                                        isAdmin ? "bg-black/20 hover:bg-black/30 text-white" : isDark ? "bg-white/5 hover:bg-white/10 text-cyan-400" : "bg-slate-100 hover:bg-slate-200 text-cyan-600"
                                      }`}
                                    >
                                      <File className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                      <span className="truncate max-w-[120px] sm:max-w-[200px] text-[11px] sm:text-[13px]">{att.name || "File"}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                            
                            {msg.message && (
                              <div className="text-[12px] sm:text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                {msg.message}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Delete button (only for active messages) */}
                        {!isDeleted && (
                          <button
                            onClick={() => onDeleteMessages([msg._id])}
                            className={`absolute top-2 -right-8 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                              isDark ? "hover:bg-white/10 text-white/40 hover:text-red-400" : "hover:bg-slate-200 text-slate-400 hover:text-red-500"
                            }`}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Timestamp & Read Receipts outside bubble */}
                      <div className={`text-[10px] mt-1 flex items-center gap-1 ${
                        isAdmin ? "justify-end mr-1" : "justify-start ml-1"
                      } ${isDark ? "text-white/40" : "text-slate-500 font-medium"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        
                        {isAdmin && !isDeleted && (
                          <span className="ml-0.5">
                            {msg.readBy && msg.readBy.length > 0 ? (
                              <CheckCheck className="w-[14px] h-[14px] text-blue-500" />
                            ) : (
                              <Check className="w-[14px] h-[14px]" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          </>
        )}
        <div ref={messagesEndRef} className="shrink-0" />
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-3">
            <button 
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const response = await fetch(selectedImage.url);
                  const blob = await response.blob();
                  const blobUrl = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = selectedImage.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(blobUrl);
                } catch (error) {
                  console.error("Failed to download image", error);
                }
              }}
              title="Download Original"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="relative w-full max-w-5xl h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image 
              src={selectedImage.url} 
              alt="Preview" 
              fill 
              className="object-contain" 
            />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`p-2 sm:p-4 shrink-0 ${isDark ? "bg-[#202C33]" : "bg-[#f0f2f5]"}`}>
        
        {/* Quick Replies */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 custom-scrollbar">
          {activeQuickReplies.map((text, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(text)}
              className={`shrink-0 text-[10px] sm:text-[12px] font-medium px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border transition-all ${
                isDark 
                  ? "bg-[#111B21] border-white/10 text-cyan-400 hover:bg-[#2A3942] hover:border-cyan-500/50" 
                  : "bg-white border-slate-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-200"
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {attachments.map((file, idx) => (
              <div key={idx} className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border ${
                isDark ? "bg-[#111B21] border-white/10 text-white" : "bg-white border-slate-200 text-slate-700"
              }`}>
                <span className="truncate max-w-[100px] sm:max-w-[150px] text-[11px] sm:text-sm">{file.name}</span>
                <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-600 ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Row */}
        <div className="relative">
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-4 z-50 shadow-xl rounded-xl">
              <EmojiPicker 
                theme={isDark ? Theme.DARK : Theme.LIGHT} 
                onEmojiClick={(emojiData) => setInputValue(prev => prev + emojiData.emoji)} 
                lazyLoadEmojis={true}
              />
            </div>
          )}
          
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
            <div className={`relative flex-1 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl ${isDark ? "bg-[#2A3942]" : "bg-white"} shadow-sm border ${isDark ? "border-transparent" : "border-slate-200"}`}>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                className={`p-1.5 rounded-full transition-colors ${showEmojiPicker ? (isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800") : (isDark ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-800")}`}
              >
                <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <label className={`p-1.5 rounded-full cursor-pointer transition-colors ${isDark ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}>
                <AttachmentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>
              
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                name={Math.random().toString(36).substring(7)}
                id="chat-message-input"
                autoComplete="nope"
                autoCorrect="off"
                spellCheck="false"
                data-lpignore="true"
                data-form-type="other"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Type a message"
                className="flex-1 bg-transparent border-none focus:outline-none py-1.5 sm:py-2 text-[13px] sm:text-[15px] text-inherit placeholder:opacity-60 min-w-0 resize-none h-[32px] sm:h-[40px] scrollbar-hide overflow-hidden pt-2"
              />
            </div>
            
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() && attachments.length === 0}
              className={`p-2.5 sm:p-3 rounded-full shrink-0 shadow-sm transition-colors flex items-center justify-center ${
                (!inputValue.trim() && attachments.length === 0)
                  ? isDark ? "bg-[#2A3942] text-white/30" : "bg-white border border-slate-200 text-slate-300"
                  : "text-white bg-[#00A884] hover:bg-[#008f6f]"
              }`}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
