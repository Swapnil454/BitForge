"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { adminAPI, chatAPI } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";
import { 
  MoreVertical, 
  Paperclip, 
  X, 
  Trash2, 
  Camera, 
  Download, 
  ChevronLeft,
  Send,
  FileText,
  User,
  Maximize,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";

interface ChatAttachment {
  url: string;
  type: string;
  name: string;
}

interface ConversationSummary {
  userId: string;
  name: string;
  role: "buyer" | "seller";
  email?: string;
  lastMessageAt: string;
  unreadCount?: number;
}

interface ChatMessage {
  _id: string;
  message: string;
  createdAt: string;
  isDeleted?: boolean;
  status?: "active" | "deleted" | "placeholderDeleted";
  attachments?: ChatAttachment[];
  from: {
    _id: string;
    name: string;
    role: "buyer" | "seller" | "admin";
  };
  to: {
    _id: string;
    name: string;
    role: "buyer" | "seller" | "admin";
  };
}

interface DeleteMessagesResponse {
  updates?: Array<{
    _id: string;
    status: "deleted" | "placeholderDeleted";
  }>;
}

const handleDownload = async (url: string, filename: string, e?: React.MouseEvent) => {
  if (e) e.preventDefault();
  const toastId = toast.loading(`Downloading ${filename}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network response was not ok");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success("Download complete", { id: toastId });
  } catch (error) {
    console.error("Download failed, opening in new tab", error);
    toast.dismiss(toastId);
    window.open(url, '_blank');
  }
};

export default function AdminChatCenter() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [roleFilter, setRoleFilter] = useState<"buyer" | "seller">("seller");
  const [allUsers, setAllUsers] = useState<{
    _id: string;
    name: string;
    email?: string;
    role: "buyer" | "seller" | "admin";
    createdAt: string;
  }[]>([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});
  const [isMobileThreadView, setIsMobileThreadView] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<{url: string, name: string} | null>(null);
  const [imageZoom, setImageZoom] = useState(1);

  const queryClient = useQueryClient();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior | null>(null);
  const scrollRetryTimeoutsRef = useRef<number[]>([]);
  const settleScrollToBottomRef = useRef<(behavior?: ScrollBehavior) => void>(() => {});

  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= 120;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };

  const queueScrollToBottom = (behavior: ScrollBehavior = "auto") => {
    pendingScrollBehaviorRef.current = behavior;
  };

  const clearScheduledScrolls = () => {
    scrollRetryTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    scrollRetryTimeoutsRef.current = [];
  };

  const settleScrollToBottom = (behavior: ScrollBehavior = "auto") => {
    queueScrollToBottom(behavior);
    clearScheduledScrolls();

    if (typeof window === "undefined") return;

    [0, 120, 320, 700].forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        scrollToBottom(behavior);
      }, delay);
      scrollRetryTimeoutsRef.current.push(timeoutId);
    });
  };

  settleScrollToBottomRef.current = settleScrollToBottom;

  const handleMessagesScroll = () => {
    shouldAutoScrollRef.current = isNearBottom();
  };

  const applyStatusUpdates = (
    updates: Array<{ _id: string; status: "deleted" | "placeholderDeleted" }> = []
  ) => {
    const updatesMap = new Map(updates.map((update) => [update._id, update.status]));
    setMessages((prev) =>
      prev
        .filter((m) => updatesMap.get(m._id) !== "placeholderDeleted")
        .map((m) =>
          updatesMap.has(m._id)
            ? { ...m, isDeleted: true, status: updatesMap.get(m._id) }
            : m
        )
    );
  };

  const getMessageStatus = (message: ChatMessage) => {
    if (message.status) return message.status;
    return message.isDeleted ? "deleted" : "active";
  };

  const handleAttachmentLoad = () => {
    if (!shouldAutoScrollRef.current) return;
    settleScrollToBottom("auto");
  };
  
  const loadConversations = async () => {
    try {
      const [convData, usersData] = await Promise.all([
        chatAPI.adminGetConversations(),
        adminAPI.getAllUsers(),
      ]);

      setConversations(convData.conversations || []);
      setAllUsers(
        (usersData || []).filter(
          (u: any) => u.role === "buyer" || u.role === "seller"
        )
      );

      const serverUnread: Record<string, number> = {};
      (convData.conversations || []).forEach((c: any) => {
        if (c.unreadCount > 0) {
          serverUnread[c.userId] = c.unreadCount;
        }
      });
      setUnreadByUser(serverUnread);

    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load chats");
    } finally {
      setLoadingConvos(false);
    }
  };

  const loadThread = async (userId: string) => {
    try {
      setLoadingThread(true);
      const data = await chatAPI.adminGetThread(userId);
      shouldAutoScrollRef.current = true;
      settleScrollToBottom("auto");
      setMessages(data.messages || []);
      setSelectedMessageIds([]);
      setAttachment(null);
      
      try {
        await chatAPI.adminMarkThreadAsRead(userId);
        setUnreadByUser((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.userId === userId ? { ...c, unreadCount: 0 } : c
          )
        );
        const currentCount = queryClient.getQueryData<number>(["chat", "unread"]) || 0;
        const threadUnread = conversations.find(c => c.userId === userId)?.unreadCount || 0;
        const newCount = Math.max(0, currentCount - threadUnread);
        queryClient.setQueryData(["chat", "unread"], newCount);
      } catch (err) {
        console.error("Failed to mark thread as read", err);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load thread");
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    return () => {
      clearScheduledScrolls();
    };
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    loadThread(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const socketUrl = apiBase.replace(/\/api$/, "");
    const token = getCookie("token");

    const socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("chat:new-message", (msg: ChatMessage) => {
      const isFromAdmin = msg.from.role === "admin";
      const otherUser = isFromAdmin ? msg.to : msg.from;
      const otherUserId = otherUser._id;
      const isActiveThread = selectedUserId === otherUserId;
      const shouldStickToBottom = shouldAutoScrollRef.current;

      setMessages((prev) => {
        if (!isActiveThread) return prev;
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      setConversations((prev) => {
        const existing = prev.find((c) => c.userId === otherUserId);
        if (existing) {
          return prev.map((c) =>
            c.userId === otherUserId
              ? { ...c, lastMessageAt: msg.createdAt }
              : c
          );
        }
        return [
          {
            userId: otherUserId,
            name: otherUser.name,
            role: otherUser.role as "buyer" | "seller",
            lastMessageAt: msg.createdAt,
          },
          ...prev,
        ];
      });

      if (!isFromAdmin && msg.to.role === "admin") {
        setUnreadByUser((prev) => {
          if (selectedUserId === otherUserId) return prev;
          const current = prev[otherUserId] || 0;
          return { ...prev, [otherUserId]: current + 1 };
        });
      }
      if (isActiveThread && shouldStickToBottom) {
        settleScrollToBottomRef.current("smooth");
      }
    });

    socket.on("chat:messages-status-updated", (updates: DeleteMessagesResponse["updates"]) => {
      applyStatusUpdates(updates || []);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error (admin chat)", err.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedUserId]);

  useEffect(() => {
    if (!pendingScrollBehaviorRef.current) return;
    const behavior = pendingScrollBehaviorRef.current;
    pendingScrollBehaviorRef.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToBottom(behavior));
    });
  }, [messages]);

  const handleSend = async () => {
    if (!selectedUserId || (!input.trim() && !attachment)) return;
    try {
      setSending(true);

      let attachmentData = null;
      if (attachment) {
        setUploading(true);
        const formData = new FormData();
        formData.append("attachment", attachment);
        const uploadRes = await chatAPI.uploadAttachment(formData);
        attachmentData = {
          url: uploadRes.url,
          type: uploadRes.type,
          name: uploadRes.name
        };
        setUploading(false);
      }

      const data = await chatAPI.adminSendMessage(selectedUserId, input.trim(), attachmentData ? [attachmentData] : undefined);
      
      setInput("");
      setAttachment(null);
      
      if (data.chat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.chat._id)) return prev;
          return [...prev, data.chat];
        });
        shouldAutoScrollRef.current = true;
        settleScrollToBottom("smooth");
      } else {
        loadThread(selectedUserId);
      }
    } catch (err: any) {
      setUploading(false);
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending && !uploading) handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const selectedUser = selectedUserId
    ? allUsers.find((u) => u._id === selectedUserId) ||
        (() => {
          const conv = conversations.find((c) => c.userId === selectedUserId);
          if (!conv) return null;
          return {
            _id: conv.userId,
            name: conv.name,
            email: conv.email,
            role: conv.role as "buyer" | "seller" | "admin",
            createdAt: "",
          };
        })()
    : null;

  const toggleSelectMessage = (id: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedUserId || selectedMessageIds.length === 0) return;

    try {
      const data = (await chatAPI.adminDeleteMessages(selectedMessageIds)) as DeleteMessagesResponse;
      applyStatusUpdates(data.updates || []);
      setSelectedMessageIds([]);
      toast.success("Selected messages deleted");
      loadConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete messages");
    }
  };

  const handleClearThread = async () => {
    if (!selectedUserId) return;
    try {
      await chatAPI.adminClearThread(selectedUserId);
      setMessages([]);
      setSelectedMessageIds([]);
      toast.success("Thread cleared");
      loadConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to clear thread");
    }
  };

  const handleClearAllChats = async () => {
    try {
      await chatAPI.adminClearAllChats();
      setMessages([]);
      setSelectedMessageIds([]);
      setConversations([]);
      toast.success("All chats cleared");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to clear all chats");
    }
  };

  const isSelectionMode = selectedMessageIds.length > 0;

  return (
    <div className="w-full h-full flex flex-col md:flex-row flex-1 bg-[#0B141A] overflow-hidden max-w-5xl xl:max-w-6xl mx-auto shadow-2xl md:border-x border-white/5 relative">
      
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onWheel={(e) => {
            e.preventDefault();
            setImageZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 5));
          }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-[101]">
            <button 
              onClick={() => setImageZoom(prev => Math.min(prev + 0.25, 5))}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setImageZoom(prev => Math.max(prev - 0.25, 0.5))}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setImageZoom(1)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => handleDownload(previewImage.url, previewImage.name, e)} 
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm font-medium hidden md:inline">Download</span>
            </button>
            <button 
              onClick={() => { setPreviewImage(null); setImageZoom(1); }}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden">
            <img 
              src={previewImage.url} 
              alt={previewImage.name} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-150 cursor-zoom-in"
              style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white/70 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            {Math.round(imageZoom * 100)}%
          </div>
        </div>
      )}

      {/* Left: conversations list */}
      <div
        className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-white/5 bg-[#111B21] flex-col ${
          isMobileThreadView && selectedUserId ? "hidden" : "flex"
        }`}
      >
        <div className="px-4 py-3 bg-[#202C33] flex items-center justify-between border-b border-white/5 h-16">
          <div>
            <h2 className="text-base font-semibold text-[#E9EDEF]">Chats</h2>
            <p className="text-[11px] text-[#8696A0]">Buyers & Sellers support</p>
          </div>
        </div>

        {/* Role filter tabs */}
        <div className="flex text-[11px] border-b border-white/5 bg-[#202C33]">
          {["seller", "buyer"].map((role) => {
            const unreadForRole = allUsers
              .filter((u) => u.role === role)
              .reduce((sum, u) => {
                const conv = conversations.find((c) => c.userId === u._id);
                const serverUnread = conv?.unreadCount || 0;
                const localUnread = unreadByUser[u._id] || 0;
                return sum + Math.max(serverUnread, localUnread);
              }, 0);
            
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role as "seller" | "buyer")}
                className={`flex-1 py-3 uppercase tracking-wider font-semibold transition text-center relative ${
                  roleFilter === role
                    ? "text-[#00A884] border-b-2 border-[#00A884]"
                    : "text-[#8696A0] hover:text-[#E9EDEF]"
                }`}
              >
                {role === "seller" ? "Sellers" : "Buyers"}
                {unreadForRole > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-[#00A884] text-white rounded-full font-bold">
                    {unreadForRole}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingConvos ? (
            <div className="flex flex-col px-4 py-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 rounded-full bg-white/5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            allUsers
              .filter((u) => u.role === roleFilter)
              .map((u) => {
                const conv = conversations.find((c) => c.userId === u._id);
                const serverUnread = conv?.unreadCount || 0;
                const localUnread = unreadByUser[u._id] || 0;
                return {
                  userId: u._id,
                  name: u.name,
                  role: u.role as "buyer" | "seller",
                  email: u.email,
                  lastMessageAt: conv?.lastMessageAt || u.createdAt,
                  unreadCount: Math.max(serverUnread, localUnread),
                };
              })
              .sort((a, b) =>
                new Date(b.lastMessageAt).getTime() -
                new Date(a.lastMessageAt).getTime()
              )
              .map((c) => (
              <button
                key={c.userId}
                onClick={() => {
                  setSelectedUserId(c.userId);
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setIsMobileThreadView(true);
                  }
                  setUnreadByUser((prev) => {
                    if (!prev[c.userId]) return prev;
                    const copy = { ...prev };
                    delete copy[c.userId];
                    return copy;
                  });
                }}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-[#202C33] transition flex items-center gap-3 ${
                  selectedUserId === c.userId ? "bg-[#2A3942]" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center shrink-0 overflow-hidden">
                  <User className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-[#E9EDEF] truncate max-w-[120px]">{c.name}</span>
                    <span className={`text-[11px] ${c.unreadCount > 0 ? 'text-[#00A884] font-medium' : 'text-[#8696A0]'}`}>
                      {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-[#8696A0] truncate max-w-[140px]">
                      {c.role} support
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#00A884] text-[#111B21] text-[10px] font-bold flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: thread */}
      <div className={`flex-1 min-h-0 flex flex-col bg-[#0B141A] relative ${isMobileThreadView && selectedUserId ? "flex" : "hidden md:flex"}`}>
        {selectedUserId ? (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/5 h-16 z-10 shrink-0">
              {isSelectionMode ? (
                <div className="flex items-center gap-4 w-full">
                  <button onClick={() => setSelectedMessageIds([])} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition">
                    <X className="w-5 h-5" />
                  </button>
                  <span className="text-[#E9EDEF] font-medium flex-1">{selectedMessageIds.length} selected</span>
                  <button onClick={handleDeleteSelected} className="p-2 rounded-full hover:bg-white/10 text-white transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsMobileThreadView(false);
                        setSelectedUserId(null);
                        setSelectedMessageIds([]);
                      }}
                      className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition md:hidden"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-cyan-600/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h1 className="text-base font-semibold text-[#E9EDEF]">
                        {selectedUser ? selectedUser.name : "User"}
                      </h1>
                      <p className="text-xs text-[#8696A0] capitalize">{selectedUser?.role || "user"}</p>
                    </div>
                  </div>
                  
                  <div className="relative shrink-0" ref={dropdownRef}>
                    <button 
                      onClick={() => setActionsOpen(!actionsOpen)}
                      className="p-2 rounded-full hover:bg-white/10 text-[#8696A0] transition"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {actionsOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-[#233138] rounded-lg shadow-xl border border-white/5 py-2 z-50">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-[#E9EDEF] hover:bg-[#111B21] transition"
                          onClick={() => {
                            handleClearThread();
                            setActionsOpen(false);
                          }}
                        >
                          Clear thread
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#111B21] transition border-t border-white/5"
                          onClick={() => {
                            handleClearAllChats();
                            setActionsOpen(false);
                          }}
                        >
                          Clear all chats
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-br from-[#05050a] via-[#0a0a14] to-[#0f1123] relative"
            >
              {loadingThread ? (
                <div className="flex flex-col gap-4 animate-pulse px-2 py-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`flex w-full ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                      <div className={`h-16 w-2/3 md:w-1/2 rounded-2xl ${i % 2 === 0 ? "bg-[#1E293B] rounded-tr-sm" : "bg-white/5 rounded-tl-sm"}`} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center py-10">
                  <div className="bg-[#111B21] text-[#8696A0] text-xs px-4 py-2 rounded-lg max-w-xs text-center shadow-md">
                    Start a conversation with {selectedUser?.name}.
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isFromAdmin = m.from.role === "admin";
                  const isSelected = selectedMessageIds.includes(m._id);
                  const messageStatus = getMessageStatus(m);
                  
                  return (
                    <div 
                      key={m._id} 
                      className={`flex w-full group ${isFromAdmin ? "justify-end" : "justify-start"} ${isSelected ? "bg-cyan-500/10 -mx-4 px-4 py-1" : ""}`}
                      onClick={() => isSelectionMode && toggleSelectMessage(m._id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleSelectMessage(m._id);
                      }}
                    >
                      {!isFromAdmin && !isSelectionMode && (
                        <div className="hidden md:flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 transition shrink-0 mr-2">
                          <button onClick={() => toggleSelectMessage(m._id)} className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div 
                        className={`relative max-w-[85%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-md select-none ${
                          isFromAdmin 
                            ? "bg-[#1E293B] text-white rounded-tr-sm border border-[#334155]" 
                            : "bg-white/5 backdrop-blur-md text-white rounded-tl-sm border border-white/10"
                        }`}
                        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                      >
                        {!isFromAdmin && (
                          <p className="text-[11px] font-medium text-indigo-400 mb-1 leading-tight">
                            {m.from.name}
                          </p>
                        )}

                        {messageStatus === "deleted" ? (
                          <p className="text-sm italic text-white/50 flex items-center gap-1">
                            🚫 This message was deleted
                          </p>
                        ) : (
                          <>
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {m.attachments.map((att, idx) => {
                                  const isImage = att.type.startsWith('image/');
                                  return isImage ? (
                                    <div 
                                      key={idx} 
                                      className="relative w-full max-w-[240px] md:max-w-xs rounded-md overflow-hidden cursor-pointer group"
                                      onClick={() => setPreviewImage({ url: att.url, name: att.name || 'Image' })}
                                    >
                                      <img 
                                        src={att.url} 
                                        alt="attachment" 
                                        onLoad={handleAttachmentLoad}
                                        className="w-full h-auto max-h-64 object-contain rounded-md bg-black/20" 
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                        <Maximize className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition shadow-sm" />
                                      </div>
                                    </div>
                                  ) : (
                                    <a key={idx} onClick={(e) => handleDownload(att.url, att.name || 'file', e)} href="#" className="flex items-center gap-3 p-3 bg-black/20 rounded-md hover:bg-black/30 transition cursor-pointer">
                                      <div className="w-10 h-10 bg-cyan-600/20 rounded-full flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-cyan-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate font-medium">{att.name}</p>
                                        <p className="text-[10px] text-white/50 uppercase">{att.type.split('/')[1] || 'FILE'}</p>
                                      </div>
                                      <Download className="w-4 h-4 text-white/50" />
                                    </a>
                                  );
                                })}
                              </div>
                            )}

                            {m.message && (
                              <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words pr-12">
                                {m.message}
                              </p>
                            )}
                          </>
                        )}
                        
                        <div className={`text-[10px] text-white/50 flex items-center justify-end gap-1 mt-1 -mr-1`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {isFromAdmin && !isSelectionMode && (
                        <div className="hidden md:flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                          <button onClick={() => toggleSelectMessage(m._id)} className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Area */}
            <div className="px-2 md:px-4 py-2 flex flex-col gap-2 relative z-10 bg-[#05050a] shrink-0">
              
              {attachment && (
                <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-2 mx-2">
                  <div className="w-10 h-10 bg-black/30 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {attachment.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(attachment)} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-5 h-5 text-white/70" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{attachment.name}</p>
                    <p className="text-xs text-white/50">{(attachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setAttachment(null)} className="p-2 rounded-full hover:bg-white/10 text-white/70">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
                <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-3xl flex items-end min-h-[40px] px-1 md:px-2 border border-white/10 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all shadow-lg">
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-white/50 hover:text-white transition shrink-0"
                    title="Attach File"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect}
                  />

                  <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-white text-[14px] placeholder-white/40 py-2.5 px-2 resize-none max-h-[120px] focus:outline-none custom-scrollbar leading-relaxed"
                    rows={1}
                  />

                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-3 text-white/50 hover:text-white transition shrink-0"
                    title="Take Photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={cameraInputRef} 
                    onChange={handleFileSelect}
                  />
                </div>

                {input.trim() || attachment ? (
                  <button
                    onClick={handleSend}
                    disabled={sending || uploading}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {uploading || sending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 text-white ml-1" />
                    )}
                  </button>
                ) : (
                  <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/30 cursor-not-allowed">
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#05050a] via-[#0a0a14] to-[#0f1123] p-6 text-center">
            <div className="w-24 h-24 mb-6 text-[#8696A0] opacity-50">
              <svg viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="45" opacity="0.1" />
                <path d="M50 20C33.4 20 20 33.4 20 50C20 56.6 22.1 62.7 25.6 67.8L22 78L32.2 74.4C37.3 77.9 43.4 80 50 80C66.6 80 80 66.6 80 50C80 33.4 66.6 20 50 20ZM61.3 60.1C60.8 61.5 58.7 62.6 57.3 62.8C56 62.9 54.4 63.2 46.2 59.8C36.3 55.7 29.9 45.6 29.4 44.9C28.9 44.3 25.5 39.8 25.5 35C25.5 30.2 28 27.8 28.9 26.8C29.8 25.9 31 25.5 32 25.5C32.3 25.5 32.6 25.5 32.8 25.5C33.6 25.6 34 25.6 34.5 26.8C35.1 28.3 36.6 31.9 36.8 32.3C37 32.8 37.2 33.4 36.9 34C36.6 34.6 36.3 34.9 35.8 35.4C35.4 35.9 34.8 36.5 34.4 36.9C33.9 37.4 33.3 37.9 33.9 38.9C34.5 39.9 36.5 43.2 39.5 45.9C43.3 49.4 46.5 50.5 47.6 51C48.7 51.5 49.3 51.4 49.8 50.8C50.3 50.2 51.8 48.4 52.4 47.5C53 46.6 53.6 46.8 54.6 47.1C55.6 47.5 60.8 50 61.8 50.5C62.8 51 63.5 51.2 63.7 51.7C64 52.2 64 54.6 61.3 60.1Z" />
              </svg>
            </div>
            <h3 className="text-2xl font-light text-[#E9EDEF] mb-2">Sellify Help Center</h3>
            <p className="text-[#8696A0] text-sm max-w-sm leading-relaxed">
              Select a chat to start responding to buyers and sellers. Send and receive messages, files, and images securely.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    longPressTimer: any;
  }
}
