"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { chatAPI } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";

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

interface SupportChatProps {
  title: string;
  subtitle: string;
}

export default function SupportChat({ title, subtitle }: SupportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const loadMessages = async () => {
    try {
      const data = await chatAPI.getSupportThread();
      setMessages(data.messages || []);
      // Mark all messages in this thread as read for the current user
      try {
        await chatAPI.markAllAsRead();
      } catch (err) {
        console.error("Failed to mark chat messages as read", err);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Socket.IO real-time subscription
  useEffect(() => {
    if (typeof window === "undefined") return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const socketUrl = apiBase.replace(/\/api$/, "");
    const token = getCookie("token");

    const socket = io(socketUrl, {
      // allow Socket.IO to negotiate transports (polling + websocket)
      auth: { token },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("chat:new-message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error (support chat)", err.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      setSending(true);
      const data = await chatAPI.sendSupportMessage(input.trim());
      setInput("");
      // Optimistically append; polling will keep us in sync
      if (data.chat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.chat._id)) return prev;
          return [...prev, data.chat];
        });
      } else {
        loadMessages();
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

  return (
    <div className="flex flex-col max-w-5xl mx-auto h-[calc(100vh-9rem)] min-h-[60vh] bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-xl">
      <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-600/30 via-blue-600/20 to-indigo-600/30 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-white">{title}</h1>
          <p className="text-xs sm:text-sm text-white/70">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        {loading ? (
          <p className="text-sm text-white/60">Loading conversation...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-white/60">
            No messages yet. Start a conversation with the admin team.
          </p>
        ) : (
          messages.map((m) => {
            const isFromAdmin = m.from.role === "admin";
            return (
              <div
                key={m._id}
                className={`flex ${isFromAdmin ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-md shadow-black/40 border border-white/10 ${
                    isFromAdmin
                      ? "bg-slate-900/80 text-white"
                      : "bg-cyan-600/80 text-white"
                  }`}
                >
                  <p className="text-xs text-white/60 mb-1">
                    {isFromAdmin ? "Admin" : "You"}
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
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 bg-black/60 px-4 sm:px-6 py-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Shift+Enter for newline)"
          className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-cyan-500/80"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="mt-1 sm:mt-0 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800/60 text-sm font-semibold text-white shadow-md shadow-cyan-500/30 disabled:cursor-not-allowed"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
