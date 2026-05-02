"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { chatAPI } from "@/lib/api";
import { getCookie, getStoredUser } from "@/lib/cookies";
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
import Image from "next/image";

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
  const [previewImage, setPreviewImage] = useState<{url: string, name: string} | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const loadMessages = async () => {
    try {
      const data = await chatAPI.getSupportThread();
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

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const socketUrl = apiBase.replace(/\/api$/, "");
    const token = getCookie("token");

    const socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("chat:new-message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 100);
    });

    socket.on("chat:messages-deleted", (deletedIds: string[]) => {
      setMessages((prev) => 
        prev.filter(m => !deletedIds.includes(m._id))
      );
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
        setTimeout(scrollToBottom, 100);
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
      await chatAPI.deleteMessages(selectedMessages);
      setMessages(prev => prev.filter(m => !selectedMessages.includes(m._id)));
      setSelectedMessages([]);
      toast.success("Messages deleted");
    } catch (err) {
      toast.error("Failed to delete messages");
    }
  };

  const handleClearChat = async () => {
    toast.error("Clear chat is only available for Admins currently");
    setShowDropdown(false);
  };

  const isSelectionMode = selectedMessages.length > 0;

  return (
    <div className="flex flex-col w-full h-full flex-1 min-h-0 max-w-5xl xl:max-w-6xl mx-auto md:border-x border-white/5 bg-gradient-to-br from-[#05050a] via-[#0a0a14] to-[#0f1123] overflow-hidden relative shadow-2xl">
      
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
          {/* Zoom level indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white/70 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            {Math.round(imageZoom * 100)}%
          </div>
        </div>
      )}
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/5 relative z-10 shrink-0">
        {isSelectionMode ? (
          <div className="flex items-center gap-4 w-full">
            <button onClick={() => setSelectedMessages([])} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition">
              <X className="w-5 h-5" />
            </button>
            <span className="text-white font-medium flex-1">{selectedMessages.length} selected</span>
            <button onClick={handleDeleteSelected} className="p-2 rounded-full hover:bg-white/10 text-white transition">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 rounded-full bg-cyan-600/20 flex items-center justify-center shrink-0">
                <Headset className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <h1 className="text-base font-semibold text-[#E9EDEF] truncate">{title}</h1>
                <p className="text-xs text-[#8696A0] truncate">{subtitle}</p>
              </div>
            </div>
            
            <div className="relative shrink-0" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-full hover:bg-white/10 text-[#8696A0] transition"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#233138] rounded-lg shadow-xl border border-white/5 py-2 z-50">
                  <button 
                    onClick={handleClearChat}
                    className="w-full text-left px-4 py-2 text-sm text-[#E9EDEF] hover:bg-[#111B21] transition"
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
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 relative"
      >
        {loading ? (
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
              Start a conversation with the support team. Messages are end-to-end encrypted.
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.from.role !== "admin";
            const isSelected = selectedMessages.includes(m._id);
            
            return (
              <div 
                key={m._id} 
                className={`flex w-full group ${isMine ? "justify-end" : "justify-start"} ${isSelected ? "bg-cyan-500/10 -mx-4 px-4 py-1" : ""}`}
                onClick={() => isSelectionMode && toggleSelection(m._id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleSelection(m._id);
                }}
              >
                {!isMine && !isSelectionMode && (
                  <div className="hidden md:flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 transition shrink-0 mr-2">
                    <button onClick={() => toggleSelection(m._id)} className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div 
                  className={`relative max-w-[85%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-md select-none ${
                    isMine 
                      ? "bg-[#1E293B] text-white rounded-tr-sm border border-[#334155]" 
                      : "bg-white/5 backdrop-blur-md text-white rounded-tl-sm border border-white/10"
                  }`}
                  style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                >
                  {/* Sender Name for incoming */}
                  {!isMine && (
                    <p className="text-[11px] font-medium text-cyan-400 mb-1 leading-tight">
                      Admin Team
                    </p>
                  )}

                  {m.isDeleted ? (
                    <p className="text-sm italic text-white/50 flex items-center gap-1">
                      🚫 This message was deleted
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

                      {/* Text content */}
                      {m.message && (
                        <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words pr-12">
                          {m.message}
                        </p>
                      )}
                    </>
                  )}
                  
                  {/* Timestamp */}
                  <div className={`text-[10px] text-white/50 flex items-center justify-end gap-1 mt-1 -mr-1`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isMine && !isSelectionMode && (
                  <div className="hidden md:flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                    <button onClick={() => toggleSelection(m._id)} className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div className="px-2 md:px-4 py-2 flex flex-col gap-2 relative z-10 bg-transparent shrink-0">
        
        {/* Attachment Preview */}
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
          {/* Action Icons inside input container */}
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

          {/* Send Button */}
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
    </div>
  );
}
