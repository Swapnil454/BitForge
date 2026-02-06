"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { notificationAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { getStoredUser, clearAuthStorage } from "@/lib/cookies";

interface User {
  id: string;
  name: string;
  email: string;
  role: "seller";
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  icon: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedModel?: string;
}

export default function SellerNotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored) {
      router.push("/login");
      return;
    }
    if (stored.role !== "seller") {
      router.push("/dashboard");
      return;
    }
    setUser(stored);
    fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(100, 0);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      showError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark read failed", error);
      showError("Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess("All notifications marked as read");
    } catch (error) {
      console.error("Mark all read failed", error);
      showError("Failed to update notifications");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationAPI.deleteNotification(id);
      const notif = notifications.find(n => n._id === id);
      if (notif && !notif.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.filter(n => n._id !== id));
      showSuccess("Notification deleted");
    } catch (error) {
      console.error("Delete failed", error);
      showError("Failed to delete notification");
    }
  };

  const filtered = notifications.filter(n => filter === "unread" ? !n.isRead : true);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const logout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b0b14] to-[#1a1a2e]">
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-[#0b0b14]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/seller")}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="text-sm text-white/60">Total Notifications</div>
            <div className="text-3xl font-bold text-white">{notifications.length}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="text-sm text-white/60">Unread</div>
            <div className="text-3xl font-bold text-cyan-400">{unreadCount}</div>
          </motion.div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "all"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/5 text-white/60 border border-white/10 hover:border-white/20"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "unread"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/5 text-white/60 border border-white/10 hover:border-white/20"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition text-sm"
            >
              Mark All as Read
            </button>
          )}
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-white/60"
              >
                Loading notifications...
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-white/60"
              >
                No {filter === "unread" ? "unread" : ""} notifications
              </motion.div>
            ) : (
              filtered.map((n, index) => (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border-l-4 bg-white/5 border-b border-r border-white/10 ${
                    !n.isRead ? "ring-1 ring-cyan-500/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* SVG ICONS BASED ON TYPE */}
                        <span className="inline-block">
                          {n.type === "product_approved" && (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-green-400" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="12" fill="#22c55e" fillOpacity="0.15"/>
                              <path d="M8 12.5l2.5 2.5 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {n.type === "product_deleted" && (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-red-400" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="12" fill="#ef4444" fillOpacity="0.15"/>
                              <path d="M9 9l6 6M15 9l-6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {n.type === "admin_update" && (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-cyan-400" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="12" fill="#06b6d4" fillOpacity="0.15"/>
                              <path d="M12 8v4l2.5 2.5" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {/* Default icon */}
                          {n.type !== "product_approved" && n.type !== "product_deleted" && n.type !== "admin_update" && (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-indigo-400" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="12" fill="#6366f1" fillOpacity="0.15"/>
                              <path d="M12 8v4h4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="16" r="1" fill="#6366f1" />
                            </svg>
                          )}
                        </span>
                        <div>
                          <h3
                            className={`font-semibold ${n.isRead ? "text-white/70" : "text-white font-bold"}`}
                          >
                            {n.title}
                          </h3>
                          <p className="text-sm text-white/50">{formatDate(n.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/60 ml-11">{n.message}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(n._id)}
                          className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n._id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
