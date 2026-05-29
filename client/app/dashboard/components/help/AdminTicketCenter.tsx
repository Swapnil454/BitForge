"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { type Socket } from "socket.io-client";
import { createSocket } from "@/lib/socket";
import { toast } from "react-hot-toast";
import { useTheme } from "next-themes";
import { User, Shield, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import TicketSidebar from "./TicketSidebar";
import TicketWindow from "./TicketWindow";
import EmptyState from "./EmptyState";
import AdminCreateTicketModal from "./AdminCreateTicketModal";

export default function AdminTicketCenter() {
  const { user, auth } = useAuth();
  const token = auth.token;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const [socket, setSocket] = useState<Socket | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "seller" | "buyer" | "mine">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "pending" | "resolved" | "closed">("all");

  const params = useParams();
  const router = useRouter();
  const urlId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(urlId || null);
  const selectedTicketIdRef = useRef<string | null>(urlId || null);

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicketId;
  }, [selectedTicketId]);

  const hasInitializedUrl = useRef(false);
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  const [messages, setMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    if (!hasInitializedUrl.current && urlId) {
      setMobileView("chat");
      fetchTicketDetails(urlId);
      hasInitializedUrl.current = true;
    } else if (urlId && urlId !== selectedTicketIdRef.current) {
      setSelectedTicketId(urlId);
      setMobileView("chat");
      fetchTicketDetails(urlId);
    } else if (!urlId && selectedTicketIdRef.current) {
      setSelectedTicketId(null);
      setMobileView("sidebar");
    }
  }, [urlId, token]);

  useEffect(() => {
    if (!token) return;

    // Initial fetch
    fetchTickets(1);

    const newSocket = createSocket(token);

    newSocket.on("ticket:new", ({ ticket, message }) => {
      setTickets((prev) => [ticket, ...prev]);
    });

    newSocket.on("ticket:new-message", (newMsg: any) => {
      const currentSelectedId = selectedTicketIdRef.current;
      if (currentSelectedId === newMsg.ticketId) {
        setMessages((prev) => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTickets(prev => {
          const updated = prev.map(t =>
            t._id === newMsg.ticketId
              ? { ...t, updatedAt: newMsg.createdAt, lastMessageText: newMsg.message, lastMessageAttachments: newMsg.attachments }
              : t
          );
          return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        });
        
        if (newMsg.from !== user?._id) {
          newSocket.emit('ticket:mark-read', { ticketId: newMsg.ticketId, msgIds: [newMsg._id] });
        }
      } else {
        setTickets(prev => {
          const updated = prev.map(t =>
            t._id === newMsg.ticketId
              ? { ...t, unreadCount: (t.unreadCount || 0) + 1, updatedAt: newMsg.createdAt, lastMessageText: newMsg.message, lastMessageAttachments: newMsg.attachments }
              : t
          );
          return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        });
      }
    });

    newSocket.on("ticket:new-note", ({ ticketId, note }) => {
      const currentSelectedId = selectedTicketIdRef.current;
      if (currentSelectedId === ticketId) {
        setMessages((prev) => {
          if (prev.some(m => m._id === note._id)) return prev;
          return [...prev, note];
        });
        // Do NOT update lastMessageText or unreadCount for internal notes
      }
    });

    newSocket.on("ticket:reopen-rejected", (eventMsg: any) => {
      const currentSelectedId = selectedTicketIdRef.current;
      if (currentSelectedId === eventMsg.ticketId) {
        setMessages((prev) => {
          // Remove reopen_request message and append the rejection event
          const filtered = prev.filter(m => m.messageType !== 'reopen_request');
          if (filtered.some(m => m._id === eventMsg._id)) return filtered;
          return [...filtered, eventMsg];
        });
      }
    });

    newSocket.on("ticket:status-changed", ({ ticketId, status }) => {
      setTickets((prev) => prev.map(t => t._id === ticketId ? { ...t, status } : t));
    });

    newSocket.on("ticket:updated", ({ ticketId, priority, assignedTo }) => {
      setTickets((prev) => prev.map(t => t._id === ticketId ? {
        ...t,
        ...(priority && { priority }),
        ...(assignedTo !== undefined && { assignedTo })
      } : t));
    });

    newSocket.on("ticket:message-status-update", ({ msgIds, status, deliveredAt, readAt, userId }) => {
      setMessages((prev) => prev.map(m => {
        if (msgIds.includes(m._id)) {
          const updates: any = {};
          if (status === 'delivered') updates.deliveredAt = deliveredAt;
          if (status === 'read' && userId) {
            updates.readBy = [...(m.readBy || []), userId];
            updates.readAt = readAt;
          }
          return { ...m, ...updates };
        }
        return m;
      }));
    });

    newSocket.on("connect_error", (err: any) => {
      console.error("Socket connect error (admin tickets)", err?.message || err);
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (!socket || !selectedTicketId) return;
    
    const joinRoom = () => {
      socket.emit("join-ticket", selectedTicketId);
    };
    
    joinRoom(); // Join immediately if already connected
    socket.on('connect', joinRoom); // Rejoin if socket reconnects
    
    return () => {
      socket.emit("leave-ticket", selectedTicketId);
      socket.off('connect', joinRoom);
    };
  }, [socket, selectedTicketId]);

  const fetchTickets = async (pageNum = 1) => {
    if (pageNum > 1) setLoadingMore(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets?page=${pageNum}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newTickets = data.tickets || [];

        if (pageNum === 1) {
          setTickets(newTickets);
          setPage(1);
        } else {
          setTickets((prev) => {
            const existing = new Set(prev.map((c: any) => c._id));
            const added = newTickets.filter((c: any) => !existing.has(c._id));
            return [...prev, ...added];
          });
        }
        setHasMore(newTickets.length === 10);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loading || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTickets(nextPage);
  };

  const fetchTicketDetails = async (tId: string) => {
    setChatLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${tId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Update the specific ticket in the list while preserving computed fields
        setTickets(prev => {
          const exists = prev.some((t) => t._id === tId);
          if (!exists) return [{ ...data.ticket, unreadCount: 0 }, ...prev];
          return prev.map(t => t._id === tId ? { ...t, ...data.ticket, unreadCount: 0 } : t);
        });
      } else if (res.status === 404) {
        toast.error("Ticket not found. Redirecting...");
        setSelectedTicketId(null);
        setMobileView("sidebar");
        window.history.pushState(null, '', '/dashboard/admin/help-center');
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectTicket = (tId: string) => {
    setSelectedTicketId(tId);
    setMobileView("chat");
    setTickets(prev => prev.map(t => t._id === tId ? { ...t, unreadCount: 0 } : t));
    if (tId !== selectedTicketIdRef.current) {
      fetchTicketDetails(tId);
    }
    window.history.pushState(null, '', `/dashboard/admin/help-center/${tId}`);
  };

  // Filter and Sort Logic
  const filteredTickets = useMemo(() => {
    let result = tickets;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(t =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.userId?.email && t.userId.email.toLowerCase().includes(q)) ||
        (t.userId?.name && t.userId.name.toLowerCase().includes(q))
      );
    }

    if (tabFilter !== "all") {
      if (tabFilter === "seller") result = result.filter(t => t.userRole === "seller");
      else if (tabFilter === "buyer") result = result.filter(t => t.userRole === "buyer");
      else if (tabFilter === "mine") result = result.filter(t => t.assignedTo?._id === user?._id);
    }

    if (statusFilter !== "all") {
      result = result.filter(t => t.status === statusFilter);
    }

    return result;
  }, [tickets, searchQuery, tabFilter, statusFilter, user?._id]);

  const selectedTicket = tickets.find((t) => t._id === selectedTicketId);

  return (
    <div className={`flex-1 w-full flex overflow-hidden rounded-xl border shadow-sm ${isDark ? "bg-[#0b1016] border-white/10" : "bg-white border-slate-200"}`}>
      <TicketSidebar
        tickets={filteredTickets}
        selectedTicketId={selectedTicketId}
        onSelectTicket={handleSelectTicket}
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
        page={page}
        onNewTicket={() => setIsCreateModalOpen(true)}
      />

      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "sidebar" ? "hidden md:flex" : "flex"}`}>
        {selectedTicket ? (
          <TicketWindow
            ticket={selectedTicket}
            messages={messages}
            loading={chatLoading}
            token={token}
            adminId={user?._id}
            socket={socket}
            setMessages={setMessages}
            onBack={() => {
              setMobileView("sidebar");
              setSelectedTicketId(null);
              window.history.pushState(null, '', '/dashboard/admin/help-center');
            }}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {isCreateModalOpen && (
        <AdminCreateTicketModal
          token={token}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(ticketId: string) => {
            setIsCreateModalOpen(false);
            setTabFilter('all');
            fetchTickets(1);
            handleSelectTicket(ticketId);
          }}
        />
      )}
    </div>
  );
}
