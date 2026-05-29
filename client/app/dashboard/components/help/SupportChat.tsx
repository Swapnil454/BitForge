"use client";

import { useEffect, useRef, useState } from "react";
import { type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { chatAPI } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import { createSocket } from "@/lib/socket";
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
  Headset,
  Maximize,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatAttachment {
  url: string;
  type: string;
  name: string;
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

interface SupportChatProps {
  title: string;
  subtitle: string;
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

export default function SupportChat({ title, subtitle }: SupportChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null);
  const [imageZoom, setImageZoom] = useState(1);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior | null>(null);
  const scrollRetryTimeoutsRef = useRef<number[]>([]);
  const settleScrollToBottomRef = useRef<(behavior?: ScrollBehavior) => void>(() => { });

  const queryClient = useQueryClient();

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

  const loadMessages = async () => {
    try {
      const data = await chatAPI.getSupportThread();
      shouldAutoScrollRef.current = true;
      settleScrollToBottom("auto");
      setMessages(data.messages || []);
      try {
        await chatAPI.markAllAsRead();
        queryClient.setQueryData(["chat", "unread"], 0);
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

  useEffect(() => {
    return () => {
      clearScheduledScrolls();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = getCookie("token");

    const socket = createSocket(token);

    socketRef.current = socket;

    socket.on("chat:new-message", (msg: ChatMessage) => {
      const shouldStickToBottom = shouldAutoScrollRef.current;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      if (shouldStickToBottom) {
        settleScrollToBottomRef.current("smooth");
      }
    });

    socket.on("chat:messages-status-updated", (updates: DeleteMessagesResponse["updates"]) => {
      applyStatusUpdates(updates || []);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error (support chat)", err.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!pendingScrollBehaviorRef.current) return;
    const behavior = pendingScrollBehaviorRef.current;
    pendingScrollBehaviorRef.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToBottom(behavior));
    });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;
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

      const data = await chatAPI.sendSupportMessage(input.trim(), attachmentData ? [attachmentData] : undefined);

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
        loadMessages();
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

  const toggleSelection = (id: string) => {
    setSelectedMessages(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;

    try {
      const data = (await chatAPI.deleteMessages(selectedMessages)) as DeleteMessagesResponse;
      applyStatusUpdates(data.updates || []);
      setSelectedMessages([]);
      toast.success("Messages deleted");
    } catch {
      toast.error("Failed to delete messages");
    }
  };

  const handleClearChat = async () => {
    toast.error("Clear chat is only available for Admins currently");
    setShowDropdown(false);
  };

  const isSelectionMode = selectedMessages.length > 0;

  return (
    <div className="flex flex-col w-full h-full flex-1 min-h-0 max-w-5xl xl:max-w-6xl mx-auto md:border-x border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-gradient-to-br dark:from-[#05050a] dark:via-[#0a0a14] dark:to-[#0f1123] overflow-hidden relative">

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-white dark:bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onWheel={(e) => {
            e.preventDefault();
            setImageZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 5));
          }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-[101]">
            <button
              onClick={() => setImageZoom(prev => Math.min(prev + 0.25, 5))}
              className="p-2.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setImageZoom(prev => Math.max(prev - 0.25, 0.5))}
              className="p-2.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setImageZoom(1)}
              className="p-2.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleDownload(previewImage.url, previewImage.name, e)}
              className="p-2.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white transition flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm font-medium hidden md:inline">Download</span>
            </button>
            <button
              onClick={() => { setPreviewImage(null); setImageZoom(1); }}
              className="p-2.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white transition"
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
          {/* Zoom level indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-black/60 text-slate-600 dark:text-white/70 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            {Math.round(imageZoom * 100)}%
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-black/40 backdrop-blur-md border-b border-slate-200 dark:border-white/5 relative z-10 shrink-0 shadow-sm">
        {isSelectionMode ? (
          <div className="flex items-center gap-4 w-full">
            <button onClick={() => setSelectedMessages([])} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white transition">
              <X className="w-5 h-5" />
            </button>
            <span className="text-slate-900 dark:text-white font-medium flex-1">{selectedMessages.length} selected</span>
            <button onClick={handleDeleteSelected} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white transition">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white transition">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                <Headset className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <h1 className="text-base font-semibold text-slate-900 dark:text-[#E9EDEF] truncate">{title}</h1>
                <p className="text-xs text-slate-500 dark:text-[#8696A0] truncate">{subtitle}</p>
              </div>
            </div>

            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-[#8696A0] transition"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#233138] rounded-lg shadow-xl border border-slate-200 dark:border-white/5 py-2 z-50">
                  <button
                    onClick={handleClearChat}
                    className="w-full text-left px-4 py-2 text-sm text-slate-800 dark:text-[#E9EDEF] hover:bg-slate-100 dark:hover:bg-[#111B21] transition"
                  >
                    Clear chat
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* CHAT AREA */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 space-y-2 relative"
      >
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse px-2 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex w-full ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className={`h-16 w-2/3 md:w-1/2 rounded-2xl ${i % 2 === 0 ? "bg-indigo-100 dark:bg-[#1E293B] rounded-tr-sm" : "bg-slate-100 dark:bg-white/5 rounded-tl-sm"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="bg-white dark:bg-[#111B21] text-slate-500 dark:text-[#8696A0] text-xs px-5 py-3 rounded-2xl max-w-xs text-center shadow-sm border border-slate-200 dark:border-white/5">
              Start a conversation with our support team.
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.from.role !== "admin";
            const isSelected = selectedMessages.includes(m._id);
            const messageStatus = getMessageStatus(m);

            return (
              <div
                key={m._id}
                className={`flex w-full group ${isMine ? "justify-end" : "justify-start"} ${isSelected ? "bg-indigo-500/10 -mx-4 px-4 py-1 rounded-xl" : ""} mb-1`}
                onClick={() => isSelectionMode && toggleSelection(m._id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleSelection(m._id);
                }}
              >
                {!isMine && !isSelectionMode && (
                  <div className="hidden md:flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 transition shrink-0 mr-2">
                    <button onClick={() => toggleSelection(m._id)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] md:max-w-[70%] px-4 py-2.5 select-none ${isMine
                      ? "bg-indigo-600 dark:bg-indigo-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-indigo-500/20"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-white/5"
                    }`}
                  style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                >
                  {/* Sender Name for incoming */}
                  {!isMine && (
                    <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 leading-tight tracking-wide uppercase">
                      Support Team
                    </p>
                  )}

                  {messageStatus === "deleted" ? (
                    <p className="text-sm italic text-slate-400 dark:text-white/40 flex items-center gap-1.5">
                      <span className="opacity-60">⊘</span> This message was deleted
                    </p>
                  ) : (
                    <>
                      {/* Attachments */}
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
                                  className="w-full h-auto max-h-64 object-contain rounded-md bg-white dark:bg-black/20"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                  <Maximize className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition shadow-sm" />
                                </div>
                              </div>
                            ) : (
                              <a key={idx} onClick={(e) => handleDownload(att.url, att.name || 'file', e)} href="#" className="flex items-center gap-3 p-3 bg-white/15 dark:bg-black/20 rounded-xl hover:bg-white/25 dark:hover:bg-black/30 transition cursor-pointer">
                                <div className="w-10 h-10 bg-cyan-600/20 rounded-full flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate font-medium">{att.name}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-white/50 uppercase">{att.type.split('/')[1] || 'FILE'}</p>
                                </div>
                                <Download className="w-4 h-4 text-slate-400 dark:text-white/50" />
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Text content */}
                      {m.message && (
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                          {m.message}
                        </p>
                      )}
                    </>
                  )}

                  {/* Timestamp */}
                  <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-indigo-200/80 dark:text-white/40' : 'text-slate-400 dark:text-white/40'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isMine && !isSelectionMode && (
                  <div className="hidden md:flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                    <button onClick={() => toggleSelection(m._id)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* INPUT AREA */}
      <div className="px-3 md:px-5 py-3 flex flex-col gap-2 relative z-10 bg-slate-100 dark:bg-transparent border-t border-slate-200 dark:border-transparent shrink-0">

        {/* Attachment Preview */}
        {attachment && (
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl mb-2 shadow-sm">
            <div className="w-10 h-10 bg-white dark:bg-black/30 rounded-lg flex items-center justify-center overflow-hidden relative">
              {attachment.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(attachment)} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-5 h-5 text-slate-600 dark:text-white/70" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 dark:text-white truncate">{attachment.name}</p>
              <p className="text-xs text-slate-400 dark:text-white/50">{(attachment.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => setAttachment(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-3 max-w-4xl mx-auto w-full">
          {/* Input field */}
          <div className="flex-1 bg-white dark:bg-white/5 rounded-full flex items-center min-h-[48px] px-3 border border-slate-200 dark:border-white/10 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20 dark:focus-within:border-indigo-500/50 transition-all shadow-sm">

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 dark:text-white/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4" />
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
              className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 py-3 px-2 resize-none max-h-[120px] focus:outline-none leading-relaxed"
              rows={1}
            />

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 text-slate-400 dark:text-white/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0"
              title="Take Photo"
            >
              <Camera className="w-4 h-4" />
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

          {/* Send Button */}
          <button
            onClick={input.trim() || attachment ? handleSend : undefined}
            disabled={(!input.trim() && !attachment) || sending || uploading}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 ${input.trim() || attachment
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 cursor-pointer'
                : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/20 cursor-not-allowed'
              }`}
          >
            {uploading || sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className={`w-5 h-5 ml-0.5 ${input.trim() || attachment ? 'text-white' : 'text-slate-400 dark:text-white/30'}`} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
