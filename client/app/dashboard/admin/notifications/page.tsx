"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { notificationAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { getStoredUser, clearAuthStorage } from "@/lib/cookies";

/* ================= TYPES ================= */

interface Notification {
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

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

/* ================= PAGE ================= */

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

    if (stored.role !== "admin") {
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
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
      showError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      showError("Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
      showSuccess("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      showError("Failed to update notifications");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      
      const notification = notifications.find((n) => n._id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );
      
      showSuccess("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      showError("Failed to delete notification");
    }
  };

  const deletionNotifications = notifications.filter((n) => n.type === "user_deleted");
  const sellerDeletionNotifications = notifications.filter((n) => n.type === "seller_deletion_requested");
  const otherNotifications = notifications.filter((n) => 
    n.type !== "user_deleted" && n.type !== "seller_deletion_requested"
  );

  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.isRead : true
  );

  const getNotificationColor = (type: string) => {
    const colors: { [key: string]: string } = {
      product_pending_review: "border-l-yellow-500",
      product_update_requested: "border-l-blue-500",
      product_deletion_requested: "border-l-red-500",
      product_approved: "border-l-green-500",
      product_rejected: "border-l-red-500",
      product_change_approved: "border-l-green-500",
      product_change_rejected: "border-l-red-500",
      user_deleted: "border-l-orange-500",
      seller_deletion_requested: "border-l-yellow-500",
      seller_deletion_approved: "border-l-green-500",
      seller_deletion_rejected: "border-l-red-500",
    };
    return colors[type] || "border-l-cyan-500";
  };

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

  if (!user)
    return (
      <div className="w-full h-screen bg-gradient-to-br from-[#0b0b14] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b14] to-[#1a1a2e]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-[#0b0b14]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
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

        {/* Filters & Actions */}
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

        {/* User Deletion Alerts Section */}
        {deletionNotifications.length > 0 && (
          <div className="mb-8 p-6 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <h2 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
              <span className="text-2xl">🗑️</span>
              Buyer Account Deletions ({deletionNotifications.length})
            </h2>
            <div className="space-y-3">
              {deletionNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border-l-4 bg-white/5 border-l-orange-500 border-b border-r border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-white/50 mb-2">
                        {formatDate(notification.createdAt)}
                      </p>
                      <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDeleteNotification(notification._id)
                        }
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Seller Deletion Requests Section */}
        {sellerDeletionNotifications.length > 0 && (
          <div className="mb-8 p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Seller Deletion Requests ({sellerDeletionNotifications.length})
              </h2>
              <button
                onClick={() => router.push("/dashboard/admin/seller-deletions")}
                className="px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 transition font-semibold text-sm"
              >
                Review Requests →
              </button>
            </div>
            <div className="space-y-3">
              {sellerDeletionNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border-l-4 bg-white/5 border-l-yellow-500 border-b border-r border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-white/50 mb-2">
                        {formatDate(notification.createdAt)}
                      </p>
                      <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDeleteNotification(notification._id)
                        }
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Other Notifications Section */}
        {otherNotifications.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-white mb-4">Other Notifications</h2>
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
            ) : filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-white/60"
              >
                No {filter === "unread" ? "unread" : ""} notifications
              </motion.div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border-l-4 bg-white/5 border-b border-r border-white/10 ${getNotificationColor(
                    notification.type
                  )} ${!notification.isRead ? "ring-1 ring-cyan-500/30" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{notification.icon}</span>
                        <div>
                          <h3
                            className={`font-semibold ${
                              notification.isRead
                                ? "text-white/70"
                                : "text-white font-bold"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-sm text-white/50">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-white/60 ml-11">
                        {notification.message}
                      </p>
                      {notification.type && (
                        <div className="mt-2 ml-11">
                          <span className="inline-block px-2 py-1 text-xs rounded bg-white/5 text-white/50">
                            {notification.type
                              .replace(/_/g, " ")
                              .charAt(0)
                              .toUpperCase() +
                              notification.type
                                .replace(/_/g, " ")
                                .slice(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDeleteNotification(notification._id)
                        }
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
          </>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-white/60"
          >
            No notifications yet
          </motion.div>
        )}
      </main>
    </div>
  );
}
