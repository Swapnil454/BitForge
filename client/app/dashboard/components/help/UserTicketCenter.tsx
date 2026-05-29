"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { createSocket } from "@/lib/socket";
import TicketSidebar from "./TicketSidebar";
import TicketWindow from "./TicketWindow";
import EmptyState from "./EmptyState";
import { toast } from "react-hot-toast";
import CreateTicketModal from "../../support/CreateTicketModal";

export default function UserTicketCenter({ 
  urlId,
  onChatOpenChange 
}: { 
  urlId?: string | null;
  onChatOpenChange?: (isOpen: boolean) => void;
}) {
  const { auth, user } = useAuth();
  const token = auth.token;
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(urlId || null);
  const selectedTicketIdRef = useRef<string | null>(selectedTicketId);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">(urlId ? "chat" : "sidebar");

  useEffect(() => {
    if (onChatOpenChange) {
      onChatOpenChange(mobileView === "chat");
    }
  }, [mobileView, onChatOpenChange]);

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicketId;
  }, [selectedTicketId]);

  useEffect(() => {
    if (urlId && urlId !== selectedTicketId) {
      setSelectedTicketId(urlId);
      setMobileView("chat");
    }
  }, [urlId]);

  useEffect(() => {
    if (!token) return;
    
    fetchTickets(1);

    const newSocket = createSocket(token);

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

    newSocket.on("ticket:reopen-rejected", (eventMsg: any) => {
      const currentSelectedId = selectedTicketIdRef.current;
      if (currentSelectedId === eventMsg.ticketId) {
        setMessages((prev) => {
          const filtered = prev.filter(m => m.messageType !== 'reopen_request');
          if (filtered.some(m => m._id === eventMsg._id)) return filtered;
          return [...filtered, eventMsg];
        });
      }
    });

    newSocket.on("ticket:status-changed", ({ ticketId, status }) => {
      setTickets((prev) => prev.map(t => t._id === ticketId ? { ...t, status } : t));
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
      console.error("Socket connect error (user tickets)", err?.message || err);
    });

    setSocket(newSocket);

    return () => { 
      newSocket.disconnect(); 
    };
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

  useEffect(() => {
    if (selectedTicketId && token) {
      fetchTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId, token]);

  useEffect(() => {
    if (token) {
      // Small debounce for search query
      const timer = setTimeout(() => {
        fetchTickets(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [statusFilter, searchQuery, token]);

  const fetchTickets = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const q = new URLSearchParams();
      if (statusFilter !== "all") q.append("status", statusFilter);
      if (searchQuery) q.append("search", searchQuery);
      q.append("page", pageNum.toString());
      q.append("limit", "20");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newTickets = data.tickets || [];
        if (pageNum === 1) setTickets(newTickets);
        else setTickets((prev) => [...prev, ...newTickets]);
        
        setHasMore(pageNum < (data.pages || 1));
        setPage(pageNum);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchTicketDetails = async (tId: string) => {
    setChatLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${tId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTickets((prev) => {
          const exists = prev.some((t) => t._id === tId);
          if (!exists) return [{ ...data.ticket, unreadCount: 0 }, ...prev];
          return prev.map(t => t._id === tId ? { ...t, ...data.ticket, unreadCount: 0 } : t);
        });
      } else if (res.status === 404) {
        toast.error("Ticket not found");
        setSelectedTicketId(null);
        setMobileView("sidebar");
        window.history.pushState(null, '', '/dashboard/support');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
    setMobileView("chat");
    setTickets(prev => prev.map(t => t._id === id ? { ...t, unreadCount: 0 } : t));
    window.history.pushState(null, '', `/dashboard/support/${id}`);
  };

  const handleBack = () => {
    setMobileView("sidebar");
    setSelectedTicketId(null);
    window.history.pushState(null, '', '/dashboard/support');
  };

  const selectedTicket = tickets.find(t => t._id === selectedTicketId);

  return (
    <div className="flex w-full h-full overflow-hidden">
      <TicketSidebar
        tickets={tickets}
        selectedTicketId={selectedTicketId}
        onSelectTicket={handleSelectTicket}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={() => fetchTickets(page + 1)}
        mobileHidden={mobileView === "chat"}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        page={page}
        isAdmin={false}
        onNewTicket={() => setIsCreateModalOpen(true)}
      />
      
      <div className={`flex-1 min-w-0 ${mobileView === "sidebar" ? "hidden md:flex" : "flex"}`}>
        {selectedTicketId && selectedTicket ? (
          <TicketWindow
            ticket={selectedTicket}
            messages={messages}
            loading={chatLoading}
            token={token}
            userId={user?._id}
            onBack={handleBack}
            isAdmin={false}
            socket={socket}
            setMessages={setMessages}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {isCreateModalOpen && (
        <CreateTicketModal
          token={token}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(ticketId: string) => {
            setIsCreateModalOpen(false);
            setStatusFilter('all');
            fetchTickets(1);
            handleSelectTicket(ticketId);
          }}
        />
      )}
    </div>
  );
}
