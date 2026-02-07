"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notificationAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import toast from "react-hot-toast";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  icon: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }

    fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getNotifications(50, 0);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(
        notifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error: any) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error: any) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      toast.success("Notification deleted");
    } catch (error: any) {
      toast.error("Failed to delete notification");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-slate-900 to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-linear-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => router.back()}
                className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <span className="text-xl md:text-2xl">🔔</span>
              </div>
              
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-black text-white truncate">Notifications</h1>
                <p className="text-xs md:text-sm text-white/70">
                  {unreadCount > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All caught up
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleMarkAllAsRead}
              className="px-5 py-2.5 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-cyan-500/50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
            <p className="text-white/60">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-linear-to-br from-white/10 via-white/5 to-transparent border-2 border-white/20 rounded-2xl p-16 text-center shadow-2xl">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-6xl">🧘</span>
            </div>
            <p className="text-white text-2xl font-bold mb-3">All Clear!</p>
            <p className="text-white/60 text-lg">You're all caught up. No new notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={notification._id}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`group relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] animate-fadeIn ${
                  notification.isRead
                    ? "bg-linear-to-br from-white/5 to-transparent border border-white/10 hover:border-white/20"
                    : "bg-linear-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 hover:border-blue-500/50 shadow-lg shadow-blue-500/10"
                }`}
              >
                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-linear-to-r from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50 animate-pulse"></div>
                )}
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${
                      notification.isRead 
                        ? "bg-linear-to-br from-white/10 to-white/5 border border-white/10"
                        : "bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30"
                    }`}>
                      {/* Use SVG icon based on notification type or icon */}
                      {notification.type === 'success' || notification.icon === '✅' ? (
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : notification.type === 'celebration' || notification.icon === '🎉' ? (
                        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      ) : notification.type === 'info' || notification.icon === 'ℹ️' ? (
                        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : notification.type === 'warning' || notification.icon === '⚠️' ? (
                        <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : notification.icon === '💰' || notification.icon === '💵' ? (
                        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : notification.icon === '📦' || notification.icon === '🛍️' ? (
                        <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-base ${
                          notification.isRead ? "text-white/90" : "text-white"
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="px-2 py-0.5 bg-linear-to-r from-cyan-500 to-blue-500 text-white text-xs rounded-full font-bold">
                            New
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mb-2 ${
                        notification.isRead ? "text-white/60" : "text-white/80"
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="px-4 py-1.5 bg-linear-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs rounded-lg transition-all font-semibold whitespace-nowrap flex items-center gap-1.5"
                        title="Mark as read"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs rounded-lg transition-all font-semibold flex items-center gap-1.5"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}