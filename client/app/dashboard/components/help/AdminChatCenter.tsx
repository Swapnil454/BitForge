"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import { useTheme } from "next-themes";
import SupportSidebar from "./SupportSidebar";
import ChatWindow from "./ChatWindow";
import EmptyState from "./EmptyState";

interface Conversation {
  userId: string;
  name: string;
  role: string;
  email: string;
  lastMessageAt: string;
  unreadCount: number;
  lastIncomingMessage: string;
  lastIncomingAttachments: any[];
  lastIncomingAt: string;
  lastIncomingStatus: string;
  lastIncomingIsDeleted: boolean;
}

export default function AdminChatCenter() {
  const { user, auth } = useAuth();
  const token = auth.token;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "seller" | "buyer" | "unread">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("all");

  // Selection & Chat
  const params = useParams();
  const router = useRouter();
  const urlId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(urlId || null);
  const selectedUserIdRef = useRef<string | null>(urlId || null);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const hasInitializedUrl = useRef(false);

  useEffect(() => {
    if (!hasInitializedUrl.current && urlId) {
      setMobileView("chat");
      fetchThread(urlId);
      markThreadAsRead(urlId);
      hasInitializedUrl.current = true;
    } else if (urlId && urlId !== selectedUserIdRef.current) {
      setSelectedUserId(urlId);
      setMobileView("chat");
      fetchThread(urlId);
      markThreadAsRead(urlId);
    } else if (!urlId && selectedUserIdRef.current) {
      setSelectedUserId(null);
      setMobileView("sidebar");
    }
  }, [urlId]);

  const [messages, setMessages] = useState<any[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [avgResponseTime, setAvgResponseTime] = useState<number | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);

  // Responsive Layout
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");

  useEffect(() => {
    if (!token) return;
    fetchConversations(1);

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    setSocket(newSocket);

    newSocket.on("chat:new-message", (newMsg: any) => {
      fetchConversations(page);
      
      const currentSelectedId = selectedUserIdRef.current;
      const fromId = typeof newMsg.from === 'object' ? newMsg.from._id : newMsg.from;
      const toId = typeof newMsg.to === 'object' ? newMsg.to._id : newMsg.to;

      if (currentSelectedId && (fromId === currentSelectedId || toId === currentSelectedId)) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        if (fromId === currentSelectedId) {
          markThreadAsRead(currentSelectedId);
        }
      }
    });

    newSocket.on("chat:messages-read", ({ readerId }) => {
      setMessages((prev) => 
        prev.map((msg) => {
          if (msg.to === readerId && !msg.readBy?.includes(readerId)) {
            return { ...msg, readBy: [...(msg.readBy || []), readerId] };
          }
          return msg;
        })
      );
    });

    newSocket.on("chat:messages-status-updated", (updates: any[]) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const update = updates.find((u) => u._id === msg._id);
          if (update) {
            return {
              ...msg,
              status: update.status,
              isDeleted: update.status === "deleted" || update.status === "placeholderDeleted",
            };
          }
          return msg;
        })
      );
      fetchConversations(1); // refresh list for previews
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const fetchConversations = async (pageNum = 1) => {
    if (pageNum > 1) setLoadingMore(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/admin/conversations?page=${pageNum}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newConvos = data.conversations || [];
        
        if (pageNum === 1) {
          setConversations(newConvos);
          setPage(1);
        } else {
          setConversations((prev) => {
            const existing = new Set(prev.map((c: any) => c.userId));
            const added = newConvos.filter((c: any) => !existing.has(c.userId));
            return [...prev, ...added];
          });
        }
        setHasMore(newConvos.length === 10);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loading || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchConversations(nextPage);
  };

  const fetchThread = async (uId: string, pageNum = 1) => {
    if (pageNum === 1) {
      setChatLoading(true);
    } else {
      setLoadingMoreMessages(true);
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/admin/thread/${uId}?page=${pageNum}&limit=7`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newMsgs = data.messages || [];
        
        if (pageNum === 1) {
          setMessages(newMsgs);
          setMessagePage(1);
          setAvgResponseTime(data.avgResponseTime);
          setTicketId(data.ticketId);
        } else {
          setMessages((prev) => {
            const existing = new Set(prev.map(m => m._id));
            const added = newMsgs.filter((m: any) => !existing.has(m._id));
            return [...added, ...prev]; // Prepend older messages
          });
        }
        setHasMoreMessages(newMsgs.length === 7);
      }
    } catch (error) {
      console.error("Error fetching thread:", error);
    } finally {
      setChatLoading(false);
      setLoadingMoreMessages(false);
    }
  };

  const handleLoadMoreMessages = () => {
    if (!hasMoreMessages || chatLoading || loadingMoreMessages || !selectedUserId) return;
    const nextPage = messagePage + 1;
    setMessagePage(nextPage);
    fetchThread(selectedUserId, nextPage);
  };

  const markThreadAsRead = async (uId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/admin/thread/${uId}/mark-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Locally reset unread count immediately for better UX
      setConversations((prev) => 
        prev.map((c) => c.userId === uId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleSelectConversation = (uId: string) => {
    // Optimistically update the UI instantly
    setSelectedUserId(uId);
    setMobileView("chat");
    
    // Only fetch if it's a new user
    if (uId !== selectedUserIdRef.current) {
      fetchThread(uId);
      markThreadAsRead(uId);
    }
    
    // Change the URL without triggering a full page remount
    window.history.pushState(null, '', `/dashboard/admin/help-center/${uId}`);
  };

  const handleSendMessage = async (text: string, files: File[]) => {
    if (!selectedUserId) return;
    try {
      const uploadedAttachments = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("attachment", file);
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedAttachments.push(data);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/admin/thread/${selectedUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, attachments: uploadedAttachments }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      const data = await res.json();
      setMessages((prev) => {
        if (prev.some(m => m._id === data.chat._id)) return prev;
        return [...prev, data.chat];
      });
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleDeleteMessages = async (messageIds: string[]) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/admin/messages`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageIds }),
      });
      if (res.ok) {
        toast.success("Message deleted");
      } else {
        toast.error("Failed to delete message");
      }
    } catch (err) {
      toast.error("An error occurred while deleting");
    }
  };

  const handleClearThread = async () => {
    if (!selectedUserId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/admin/thread/${selectedUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages([]);
        fetchConversations();
        setSelectedUserId(null);
        setMobileView("sidebar");
        toast.success("Thread cleared");
      }
    } catch (err) {
      toast.error("Failed to clear thread");
    }
  };

  // Filter and Sort Logic
  const filteredConversations = useMemo(() => {
    let result = conversations;

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }

    // 2. Tab Filter
    if (tabFilter !== "all") {
      if (tabFilter === "seller") result = result.filter(c => c.role === "seller");
      else if (tabFilter === "buyer") result = result.filter(c => c.role === "buyer");
      else if (tabFilter === "unread") result = result.filter(c => c.unreadCount > 0);
    }

    // 3. Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "open") result = result.filter(c => true); // For now, treat all as open unless explicitly resolved
      else if (statusFilter === "resolved") result = result.filter(c => false); // Stub
    }

    // 4. Sort Descending
    return result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [conversations, searchQuery, tabFilter, statusFilter]);

  const selectedUser = conversations.find((c) => c.userId === selectedUserId);

  return (
    <div className={`h-[calc(100vh-80px)] w-full flex overflow-hidden rounded-xl border shadow-sm ${isDark ? "bg-[#0b1016] border-white/10" : "bg-white border-slate-200"}`}>
      <SupportSidebar
        conversations={filteredConversations}
        selectedUserId={selectedUserId}
        onSelectConversation={handleSelectConversation}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        mobileHidden={mobileView === "chat"}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        tabFilter={tabFilter}
        setTabFilter={setTabFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "sidebar" ? "hidden md:flex" : "flex"}`}>
        {selectedUser ? (
          <ChatWindow
            user={selectedUser}
            messages={messages}
            ticketId={ticketId}
            avgResponseTime={avgResponseTime}
            loading={chatLoading}
            onBack={() => {
              setMobileView("sidebar");
              setSelectedUserId(null);
              window.history.pushState(null, '', '/dashboard/admin/help-center');
            }}
            onSendMessage={handleSendMessage}
            onDeleteMessages={handleDeleteMessages}
            onClearThread={handleClearThread}
            adminId={user?._id}
            hasMoreMessages={hasMoreMessages}
            loadingMoreMessages={loadingMoreMessages}
            onLoadMoreMessages={handleLoadMoreMessages}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
