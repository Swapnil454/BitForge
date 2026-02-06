"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { adminAPI, chatAPI } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";

interface ConversationSummary {
  userId: string;
  name: string;
  role: "buyer" | "seller";
  email?: string;
  lastMessageAt: string;
}

interface ChatMessage {
  _id: string;
  message: string;
  createdAt: string;
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

export default function AdminChatCenter() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});
  const [isMobileThreadView, setIsMobileThreadView] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
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

      // Mark all messages addressed to this admin as read when Help Center opens
      try {
        await chatAPI.markAllAsRead();
      } catch (err) {
        console.error("Failed to mark admin chat messages as read", err);
      }

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
      setMessages(data.messages || []);
      setSelectedMessageIds([]);
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
    if (!selectedUserId) return;
    loadThread(selectedUserId);
  }, [selectedUserId]);

  // Socket.IO subscription for real-time admin chat
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
      // Determine the non-admin participant for conversation updates
      const isFromAdmin = msg.from.role === "admin";
      const otherUser = isFromAdmin ? msg.to : msg.from;
      const otherUserId = otherUser._id;

      // Update messages if this thread is selected
      setMessages((prev) => {
        if (!selectedUserId || selectedUserId !== otherUserId) return prev;
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // Update conversation summaries
      setConversations((prev) => {
        const existing = prev.find((c) => c.userId === otherUserId);
        if (existing) {
          return prev.map((c) =>
            c.userId === otherUserId
              ? { ...c, lastMessageAt: msg.createdAt }
              : c
          );
        }

        // New conversation
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

      // Track unread per user for messages coming from buyers/sellers to admin
      if (!isFromAdmin && msg.to.role === "admin") {
        setUnreadByUser((prev) => {
          // If admin is currently viewing this user's thread, treat as read
          if (selectedUserId === otherUserId) return prev;
          const current = prev[otherUserId] || 0;
          return { ...prev, [otherUserId]: current + 1 };
        });
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error (admin chat)", err.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedUserId]);

  const handleSend = async () => {
    if (!selectedUserId || !input.trim()) return;
    try {
      setSending(true);
      const data = await chatAPI.adminSendMessage(selectedUserId, input.trim());
      setInput("");
      if (data.chat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.chat._id)) return prev;
          return [...prev, data.chat];
        });
      } else {
        loadThread(selectedUserId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  const selectedUser = selectedUserId
    ?
        allUsers.find((u) => u._id === selectedUserId) ||
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
      await chatAPI.adminDeleteMessages(selectedMessageIds);
      setMessages((prev) => prev.filter((m) => !selectedMessageIds.includes(m._id)));
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

  return (
    <div className="flex flex-col md:flex-row max-w-6xl mx-auto h-[calc(100vh-9rem)] min-h-[60vh] bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-xl">
      {/* Left: conversations list */}
      <div
        className={`w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-black/70/ ${
          isMobileThreadView && selectedUserId ? "hidden md:block" : "block"
        } flex flex-col`}
      >
        <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-indigo-600/40 to-purple-600/30 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Help Center Chats</h2>
            <p className="text-[11px] text-white/70">Buyers & Sellers needing support</p>
          </div>
        </div>

        {/* Role filter tabs */}
        <div className="flex text-[11px] border-b border-white/10">
          {["seller", "buyer"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role as "seller" | "buyer")}
              className={`flex-1 py-2 border-r last:border-r-0 border-white/10 uppercase tracking-wide font-semibold transition text-center ${
                roleFilter === role
                  ? "bg-white/15 text-white"
                  : "bg-black/40 text-white/60 hover:text-white"
              }`}
            >
              {role === "seller" ? "Sellers" : "Buyers"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <p className="text-xs text-white/60 px-4 py-3">Loading conversations...</p>
          ) : (
            // Build list of users for the selected role, merged with lastMessageAt from conversations
            allUsers
              .filter((u) => u.role === roleFilter)
              .map((u) => {
                const conv = conversations.find((c) => c.userId === u._id);
                return {
                  userId: u._id,
                  name: u.name,
                  role: u.role as "buyer" | "seller",
                  email: u.email,
                  lastMessageAt: conv?.lastMessageAt || u.createdAt,
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
                  // Clear unread badge for this user when opened
                  setUnreadByUser((prev) => {
                    if (!prev[c.userId]) return prev;
                    const copy = { ...prev };
                    delete copy[c.userId];
                    return copy;
                  });
                }}
                className={`w-full text-left px-4 py-3 text-xs border-b border-white/5 hover:bg-white/5 transition flex flex-col gap-0.5 ${
                  selectedUserId === c.userId ? "bg-white/10" : ""
                }`}
              >
                <span className="font-semibold text-white flex items-center gap-1">
                  {c.name}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/20 text-white/70">
                    {c.role}
                  </span>
                  {unreadByUser[c.userId] ? (
                    <span className="ml-auto flex items-center gap-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400 text-black font-semibold uppercase tracking-wide">
                        New
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/90 text-white font-semibold">
                        {unreadByUser[c.userId]}
                      </span>
                    </span>
                  ) : null}
                </span>
                {c.email && (
                  <span className="text-[10px] text-white/50 truncate">{c.email}</span>
                )}
                <span className="text-[10px] text-white/40">
                  Last: {new Date(c.lastMessageAt).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: thread */}
      {selectedUserId && (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-950/60 via-slate-900/70 to-slate-950/80">
        <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-gradient-to-r from-slate-900/70 to-slate-800/70 flex items-center justify-between gap-3 relative">
          <div>
              <div className="flex items-center gap-2">
                {selectedUserId && (
                  <button
                    type="button"
                    onClick={() => {
                      // On mobile, go back to list view; on desktop just keep selection
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setIsMobileThreadView(false);
                        setSelectedUserId(null);
                        setSelectedMessageIds([]);
                      }
                    }}
                    className="md:hidden text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/15"
                  >
                    ← 
                  </button>
                )}
                <h1 className="text-sm sm:text-base font-semibold text-white">
                  {selectedUser ? selectedUser.name : "Chat Thread"}
                </h1>
              </div>
              <p className="text-[11px] text-white/70">Buyers & Sellers support thread</p>
          </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs">
              <button
                type="button"
                onClick={() => setActionsOpen((v) => !v)}
                className="h-7 w-7 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/10 hover:border-indigo-400"
                title="Chat actions"
              >
                
              </button>
            </div>

            {actionsOpen && (
              <div className="absolute right-3 top-full mt-2 w-40 rounded-xl bg-black/95 border border-white/10 shadow-lg shadow-black/60 text-[11px] z-20">
                <button
                  className="w-full text-left px-3 py-2 hover:bg-white/10 text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!selectedUserId || messages.length === 0}
                  onClick={() => {
                    setSelectionMode((v) => !v);
                    setActionsOpen(false);
                  }}
                >
                  {selectionMode ? "Cancel select" : "Select messages"}
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!selectionMode || selectedMessageIds.length === 0}
                  onClick={() => {
                    handleDeleteSelected();
                    setActionsOpen(false);
                  }}
                >
                  Delete selected
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-amber-500/10 text-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!selectedUserId || messages.length === 0}
                  onClick={() => {
                    handleClearThread();
                    setActionsOpen(false);
                  }}
                >
                  Clear thread
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-red-600/15 text-red-200 border-t border-white/5"
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

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
          {loadingThread ? (
            <p className="text-sm text-white/60">Loading messages...</p>
          ) : !selectedUserId ? (
            <p className="text-sm text-white/60">Select a conversation to view messages.</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-white/60">
              No messages in this thread yet. Start by sending a message.
            </p>
          ) : (
            messages.map((m) => {
              const isFromAdmin = m.from.role === "admin";
              return (
                <div
                  key={m._id}
                  className={`flex ${isFromAdmin ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-start gap-2 max-w-[90%]">
                    {selectionMode && (
                      <input
                        type="checkbox"
                        checked={selectedMessageIds.includes(m._id)}
                        onChange={() => toggleSelectMessage(m._id)}
                        className="mt-1 h-3 w-3 rounded border-white/40 bg-black/40 text-indigo-400 focus:ring-0"
                      />
                    )}
                    <div
                      className={`max-w-full rounded-2xl px-3 py-2 text-sm shadow-md shadow-black/40 border border-white/10 ${
                        isFromAdmin
                          ? "bg-indigo-600/80 text-white"
                          : "bg-slate-900/80 text-white"
                      }`}
                    >
                      <p className="text-xs text-white/60 mb-1">
                        {isFromAdmin ? "You (Admin)" : `${m.from.name} (${m.from.role})`}
                      </p>
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      <p className="mt-1 text-[10px] text-white/50 text-right">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-white/10 bg-black/70 px-4 sm:px-6 py-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedUserId ? "Type your reply..." : "Select a conversation first"}
            disabled={!selectedUserId}
            className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim() || !selectedUserId}
            className="mt-1 sm:mt-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/60 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
