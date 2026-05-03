"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { adminAPI, chatAPI } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
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
  RotateCcw,
  MessageCircle,
  Image as ImageIcon,
  File,
  Paperclip as AttachmentIcon,
  Trash
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
  lastIncomingMessage?: string;
  lastIncomingAttachments?: ChatAttachment[];
  lastIncomingAt?: string | null;
  lastIncomingStatus?: "active" | "deleted" | "placeholderDeleted";
  lastIncomingIsDeleted?: boolean;
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
        adminAPI.getAllUsers({ page: 1, limit: 10000 }),
      ]);

      const conversationList = Array.isArray(convData?.conversations)
        ? convData.conversations
        : [];
      const userList = Array.isArray(usersData)
        ? usersData
        : Array.isArray(usersData?.users)
          ? usersData.users
          : [];

      setConversations(conversationList);
      setAllUsers(
        userList.filter(
          (u: any) => u.role === "buyer" || u.role === "seller"
        )
      );

      const serverUnread: Record<string, number> = {};
      conversationList.forEach((c: any) => {
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
              ? {
                  ...c,
                  lastMessageAt: msg.createdAt,
                  ...(isFromAdmin
                    ? {}
                    : {
                        lastIncomingMessage: msg.message || "",
                        lastIncomingAttachments: msg.attachments || [],
                        lastIncomingAt: msg.createdAt,
                        lastIncomingStatus: msg.status || (msg.isDeleted ? "deleted" : "active"),
                        lastIncomingIsDeleted: Boolean(msg.isDeleted),
                      }),
                }
              : c
          );
        }
        return [
          {
            userId: otherUserId,
            name: otherUser.name,
            role: otherUser.role as "buyer" | "seller",
            lastMessageAt: msg.createdAt,
            ...(isFromAdmin
              ? {}
              : {
                  lastIncomingMessage: msg.message || "",
                  lastIncomingAttachments: msg.attachments || [],
                  lastIncomingAt: msg.createdAt,
                  lastIncomingStatus: msg.status || (msg.isDeleted ? "deleted" : "active"),
                  lastIncomingIsDeleted: Boolean(msg.isDeleted),
                }),
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

  const chatDirectory = allUsers.map((u) => {
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
      lastIncomingMessage: conv?.lastIncomingMessage || "",
      lastIncomingAttachments: conv?.lastIncomingAttachments || [],
      lastIncomingAt: conv?.lastIncomingAt || null,
      lastIncomingStatus: conv?.lastIncomingStatus || "active",
      lastIncomingIsDeleted: Boolean(conv?.lastIncomingIsDeleted),
    };
  });

  const visibleChats = chatDirectory
    .filter((u) => u.role === roleFilter)
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );

  const unreadByRole = {
    seller: chatDirectory
      .filter((u) => u.role === "seller")
      .reduce((sum, u) => sum + u.unreadCount, 0),
    buyer: chatDirectory
      .filter((u) => u.role === "buyer")
      .reduce((sum, u) => sum + u.unreadCount, 0),
  };

  const totalUnread = unreadByRole.seller + unreadByRole.buyer;

  const truncatePreview = (text: string, max = 32) => {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max).trimEnd()}.....` : text;
  };

  const getConversationPreviewData = (chat: {
    role: "buyer" | "seller";
    lastIncomingMessage?: string;
    lastIncomingAttachments?: ChatAttachment[];
    lastIncomingStatus?: "active" | "deleted" | "placeholderDeleted";
    lastIncomingIsDeleted?: boolean;
  }) => {
    const incomingMessage = (chat.lastIncomingMessage || "").trim();
    const hasIncomingMessage = Boolean(incomingMessage);
    const attachments = chat.lastIncomingAttachments || [];
    const hasAttachments = attachments.length > 0;
    const isDeleted = chat.lastIncomingStatus === "deleted" || chat.lastIncomingIsDeleted;

    if (isDeleted) return { text: "Message deleted", icon: Trash, type: "deleted" };
    if (hasIncomingMessage) return { text: truncatePreview(incomingMessage), icon: MessageCircle, type: "message" };

    if (hasAttachments) {
      const hasImage = attachments.some((att) => att.type?.startsWith("image/"));
      const hasNonImage = attachments.some((att) => !att.type?.startsWith("image/"));
      if (hasImage && !hasNonImage) return { text: "Image sent", icon: ImageIcon, type: "image" };
      if (!hasImage && hasNonImage) return { text: "File sent", icon: File, type: "file" };
      return { text: "Attachment sent", icon: AttachmentIcon, type: "attachment" };
    }

    return { 
      text: chat.role === "seller" ? "Seller" : "Buyer", 
      icon: User, 
      type: "role" 
    };
  };

  const getConversationPreview = (chat: {
    role: "buyer" | "seller";
    lastIncomingMessage?: string;
    lastIncomingAttachments?: ChatAttachment[];
    lastIncomingStatus?: "active" | "deleted" | "placeholderDeleted";
    lastIncomingIsDeleted?: boolean;
  }) => {
    return getConversationPreviewData(chat).text;
  };

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
    <div className="w-full h-full flex flex-col bg-[#05050a] text-white overflow-hidden">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        title="Users Help Center"
        subtitle="Realtime support operations"
        rightSlot={
          totalUnread > 0 ? (
            <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-2 text-[11px] font-black text-white shadow-lg shadow-cyan-900/40">
              {totalUnread}
            </div>
          ) : null
        }
      />

      <div className="flex-1 min-h-0">
        <div className="w-full h-full flex flex-col md:flex-row bg-[#0B141A] overflow-hidden max-w-6xl mx-auto shadow-2xl md:border-x border-white/10 md:rounded-t-2xl relative">
          {previewImage && (
            <div
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
              onWheel={(e) => {
                e.preventDefault();
                setImageZoom((prev) => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 5));
              }}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2 z-[101]">
                <button
                  onClick={() => setImageZoom((prev) => Math.min(prev + 0.25, 5))}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setImageZoom((prev) => Math.max(prev - 0.25, 0.5))}
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
                  onClick={() => {
                    setPreviewImage(null);
                    setImageZoom(1);
                  }}
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
                  style={{ transform: `scale(${imageZoom})`, transformOrigin: "center center" }}
                />
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white/70 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                {Math.round(imageZoom * 100)}%
              </div>
            </div>
          )}

          {/* Left: conversations list */}
          <div
            className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 bg-linear-to-b from-[#111B21] via-[#101A2C] to-[#0A1421] flex-col ${
              isMobileThreadView && selectedUserId ? "hidden" : "flex"
            }`}
          >
            <div className="px-4 py-3 bg-black/25 backdrop-blur-xl flex items-center justify-between border-b border-white/10 h-16">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white tracking-tight">Support Chats</h2>
                <p className="text-[11px] text-white/55 truncate">Centralized inbox for buyer and seller support</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-cyan-200/90 bg-cyan-500/15 border border-cyan-500/30 rounded-full px-2 py-1">
                Live
              </span>
            </div>

            {/* Role filter tabs */}
            <div className="px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-xl space-y-2">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/40 p-2">
                {["seller", "buyer"].map((role) => {
                  const unreadForRole = role === "seller" ? unreadByRole.seller : unreadByRole.buyer;

                  return (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role as "seller" | "buyer")}
                      className={`flex-1 py-2.5 uppercase tracking-widest font-black transition text-center rounded-lg text-[10px] relative group ${
                        roleFilter === role
                          ? "text-white bg-linear-to-r from-indigo-600 to-cyan-600 border border-indigo-400/60 shadow-lg shadow-indigo-900/40"
                          : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {role === "seller" ? "Sellers" : "Buyers"}
                      </span>
                      {unreadForRole > 0 && (
                        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-1.5 text-[9px] text-white font-black shadow-lg shadow-cyan-900/40">
                          {unreadForRole}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1">
              {loadingConvos ? (
                <div className="flex flex-col px-2 py-2 gap-3 animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 w-full rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
                      <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded w-2/3" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visibleChats.length === 0 ? (
                <div className="h-full min-h-[220px] grid place-items-center px-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center max-w-[260px]">
                    <p className="text-sm font-semibold text-white/90">No active {roleFilter} chats</p>
                    <p className="text-xs text-white/55 mt-1">New conversations will appear here automatically.</p>
                  </div>
                </div>
              ) : (
                visibleChats.map((c) => {
                  const conversationPreview = getConversationPreview(c);

                  return (
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
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition flex items-center gap-3.5 ${
                      selectedUserId === c.userId
                        ? "bg-linear-to-r from-indigo-600/25 to-cyan-600/25 border-indigo-400/40 shadow-lg shadow-indigo-900/30"
                        : "bg-white/[0.02] border-white/8 hover:bg-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden ${
                      c.role === "seller" 
                        ? "bg-red-600/15 border-red-400/25" 
                        : "bg-blue-600/15 border-blue-400/25"
                    }`}>
                      <User className={`w-5.5 h-5.5 ${c.role === "seller" ? "text-red-300" : "text-blue-300"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2 mb-1">
                        <span className={`font-extrabold truncate max-w-[150px] text-[15px] leading-tight ${
                          c.role === "seller" ? "text-fuchsia-100" : "text-cyan-100"
                        }`}>
                          {c.name}
                        </span>
                        <span className={`text-xs ${c.unreadCount > 0 ? "text-cyan-300 font-bold" : "text-white/40"} shrink-0`}>
                          {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        {(() => {
                          const previewData = getConversationPreviewData(c);
                          const IconComponent = previewData.icon;
                          const isRole = previewData.type === "role";
                          const iconColorMap: Record<string, string> = {
                            message: c.role === "seller" ? "text-fuchsia-400" : "text-cyan-400",
                            image: "text-purple-400",
                            file: "text-amber-400",
                            attachment: "text-sky-400",
                            deleted: "text-red-400/50",
                            role: c.role === "seller" ? "text-fuchsia-300/50" : "text-cyan-300/50",
                          };
                          const bgColorMap: Record<string, string> = {
                            message: c.role === "seller" ? "bg-fuchsia-500/10" : "bg-cyan-500/10",
                            image: "bg-purple-500/10",
                            file: "bg-amber-500/10",
                            attachment: "bg-sky-500/10",
                            deleted: "bg-red-500/5",
                            role: "transparent",
                          };

                          return (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={`p-1.5 rounded-lg ${bgColorMap[previewData.type]} shrink-0`}>
                                <IconComponent className={`w-3.5 h-3.5 ${iconColorMap[previewData.type]}`} />
                              </div>
                              <span
                                className={`text-[12px] tracking-wide font-medium truncate max-w-[110px] ${
                                  isRole
                                    ? c.role === "seller"
                                      ? "text-fuchsia-300/60"
                                      : "text-cyan-300/60"
                                    : c.role === "seller"
                                    ? "text-fuchsia-200"
                                    : "text-cyan-100"
                                }`}
                                title={previewData.text}
                              >
                                {previewData.text}
                              </span>
                            </div>
                          );
                        })()}
                        {c.unreadCount > 0 && (
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-1.5 text-[10px] text-white font-black shadow-lg shadow-cyan-900/40 shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )})
            
              )}
            </div>
          </div>

      {/* Right: thread */}
      <div className={`flex-1 min-h-0 flex flex-col bg-linear-to-br from-[#070a12] via-[#0a1020] to-[#0d1326] relative ${isMobileThreadView && selectedUserId ? "flex" : "hidden md:flex"}`}>
        {selectedUserId ? (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-black/40 backdrop-blur-xl border-b border-white/10 h-16 z-10 shrink-0">
              {isSelectionMode ? (
                <div className="flex items-center gap-4 w-full">
                  <button onClick={() => setSelectedMessageIds([])} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition">
                    <X className="w-5 h-5" />
                  </button>
                  <span className="text-[#E9EDEF] font-semibold text-sm flex-1">{selectedMessageIds.length} selected</span>
                  <button onClick={handleDeleteSelected} className="p-2 rounded-full hover:bg-white/10 text-red-400 transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3.5">
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
                    <div className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${
                      selectedUser?.role === "seller" 
                        ? "bg-red-600/15 border-red-400/25" 
                        : "bg-blue-600/15 border-blue-400/25"
                    }`}>
                      <User className={`w-5.5 h-5.5 ${selectedUser?.role === "seller" ? "text-red-300" : "text-blue-300"}`} />
                    </div>
                    <div>
                      <h1
                        className={`text-[17px] font-extrabold leading-tight ${
                          selectedUser?.role === "seller" ? "text-fuchsia-100" : "text-cyan-100"
                        }`}
                      >
                        {selectedUser ? selectedUser.name : "User"}
                      </h1>
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-wide ${
                          selectedUser?.role === "seller" ? "text-fuchsia-300/80" : "text-cyan-300/80"
                        }`}
                      >
                        {selectedUser?.role === "seller" ? "Seller" : "Buyer"}
                      </p>
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
                      <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 rounded-lg shadow-xl border border-white/10 py-1 z-50 backdrop-blur-xl">
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-white/85 hover:bg-white/10 transition rounded-md mx-1 my-0.5"
                          onClick={() => {
                            handleClearThread();
                            setActionsOpen(false);
                          }}
                        >
                          Clear thread
                        </button>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition rounded-md mx-1 my-0.5"
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
              className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-gradient-to-br from-[#05050a] via-[#0a0a14] to-[#0f1123] relative"
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
                <div className="flex justify-center py-12">
                  <div className="bg-white/[0.04] border border-white/10 text-white/70 text-xs px-4 py-2.5 rounded-lg max-w-xs text-center shadow-md">
                    Start a conversation with <span className="font-semibold">{selectedUser?.name}</span>
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
                      className={`flex w-full group ${isFromAdmin ? "justify-end" : "justify-start"} ${isSelected ? "bg-red-500/10 -mx-5 px-5 py-1.5 rounded-lg" : ""}`}
                      onClick={() => isSelectionMode && toggleSelectMessage(m._id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleSelectMessage(m._id);
                      }}
                    >
                      {!isFromAdmin && !isSelectionMode && (
                        <div className="hidden md:flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 transition shrink-0 mr-3">
                          <button onClick={() => toggleSelectMessage(m._id)} className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div 
                        className={`relative max-w-[85%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-lg select-none ${
                          isFromAdmin 
                            ? "bg-slate-700/85 text-white rounded-tr-sm border border-slate-600/80" 
                            : "bg-white/6 backdrop-blur-md text-white rounded-tl-sm border border-white/12"
                        }`}
                        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                      >
                        {!isFromAdmin && (
                          <p className="text-[10px] font-bold text-blue-300 mb-1 leading-tight uppercase tracking-wide">
                            {m.from.name}
                          </p>
                        )}

                        {messageStatus === "deleted" ? (
                          <p className="text-sm italic text-white/50">Message deleted</p>
                        ) : (
                          <>
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mb-2.5 space-y-2">
                                {m.attachments.map((att, idx) => {
                                  const isImage = att.type.startsWith('image/');
                                  return isImage ? (
                                    <div 
                                      key={idx} 
                                      className="relative w-full max-w-[240px] md:max-w-xs rounded-lg overflow-hidden cursor-pointer group"
                                      onClick={() => setPreviewImage({ url: att.url, name: att.name || 'Image' })}
                                    >
                                      <img 
                                        src={att.url} 
                                        alt="attachment" 
                                        onLoad={handleAttachmentLoad}
                                        className="w-full h-auto max-h-64 object-contain rounded-lg bg-black/20" 
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                        <Maximize className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition shadow-lg" />
                                      </div>
                                    </div>
                                  ) : (
                                    <a key={idx} onClick={(e) => handleDownload(att.url, att.name || 'file', e)} href="#" className="flex items-center gap-3 p-3 bg-black/30 rounded-lg hover:bg-black/40 transition cursor-pointer border border-white/8">
                                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate font-medium text-white">{att.name}</p>
                                        <p className="text-[9px] text-white/50 uppercase font-semibold">{att.type.split('/')[1] || 'FILE'}</p>
                                      </div>
                                      <Download className="w-4 h-4 text-white/60 shrink-0" />
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
            <div className="px-3 md:px-5 py-3 flex flex-col gap-2.5 relative z-10 bg-[#05050a] shrink-0 border-t border-white/10">
              
              {attachment && (
                <div className="flex items-center gap-3 p-3.5 bg-white/6 backdrop-blur-xl border border-white/12 rounded-lg mb-1.5 mx-1">
                  <div className="w-11 h-11 bg-black/30 rounded-lg flex items-center justify-center overflow-hidden relative shrink-0">
                    {attachment.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(attachment)} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-5 h-5 text-white/70" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-white/50">{(attachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setAttachment(null)} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2.5 max-w-4xl mx-auto w-full">
                <div className="flex-1 bg-white/6 backdrop-blur-xl rounded-xl flex items-end min-h-[42px] px-2 md:px-3.5 border border-white/12 focus-within:border-indigo-500/60 focus-within:bg-white/8 transition-all shadow-lg hover:border-white/15">
                  
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
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#05050a] via-[#0a0a14] to-[#0f1123] p-6 md:p-10">
            <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-linear-to-b from-white/[0.05] to-white/[0.02] px-8 py-10 text-center shadow-2xl shadow-indigo-950/30 backdrop-blur-xl">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-500/30 via-violet-500/25 to-cyan-500/30 border border-indigo-300/25 shadow-lg shadow-indigo-900/40">
                <MessageCircle className="h-10 w-10 text-cyan-200" />
              </div>
              <h3 className="text-3xl font-semibold tracking-tight text-white">Bitforge Help Center</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
                Select a chat to start responding to buyers and sellers with secure, real-time messaging.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Live replies
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image support
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                  <Paperclip className="h-3.5 w-3.5" />
                  File sharing
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    longPressTimer: any;
  }
}
