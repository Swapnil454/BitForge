"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notificationAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import toast from "react-hot-toast";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import { Bell, CheckCircle, Package, Info, AlertTriangle, Trash2, Check, CheckCheck } from "lucide-react";

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

  const getNotificationIcon = (n: Notification, className: string) => {
    const title = n.title?.toLowerCase() || '';
    const type = n.type || '';
    
    if (title.includes('purchase') || title.includes('order') || type === 'order_completed' || type === 'payment_received') {
      return <CheckCircle className={className + " text-emerald-400"} />;
    }
    if (title.includes('new product') || title.includes('live') || type === 'product_approved' || type === 'download_ready') {
      return <Package className={className + " text-purple-400"} />;
    }
    if (type.includes('reject') || type.includes('delete') || title.includes('fail') || title.includes('reject')) {
      return <AlertTriangle className={className + " text-red-400"} />;
    }
    if (type.includes('review') || type.includes('request') || type.includes('pending') || type.includes('edit')) {
      return <Info className={className + " text-blue-400"} />;
    }
    if (type === 'price_drop' || type === 'payout_sent' || title.includes('price') || title.includes('payout')) {
      return <CheckCircle className={className + " text-green-400"} />;
    }
    if (type === 'contact_message' || title.includes('message')) {
      return <Info className={className + " text-cyan-400"} />;
    }
    return <Bell className={className + " text-indigo-400"} />;
  };

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
    <div className="min-h-screen bg-linear-to-br from-black via-slate-900 to-slate-800 pb-20">
      {/* Header */}
      <PageHeader 
        title="Notifications" 
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        backHref="/dashboard/buyer"
      />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleMarkAllAsRead}
              className="px-5 py-2.5 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-cyan-500/50 flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl p-5 bg-white/5 border border-white/10 animate-pulse flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-white/20 shrink-0 mt-0.5"></div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-5 bg-white/20 rounded w-1/3"></div>
                    </div>
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-white/5 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-white/10"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-linear-to-br from-white/10 via-white/5 to-transparent border-2 border-white/20 rounded-2xl p-16 text-center shadow-2xl">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30 shadow-inner">
              <CheckCircle className="w-12 h-12 text-blue-400" />
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
                    <div className="pt-0.5 shrink-0 transition-all group-hover:scale-110">
                      {/* Use Lucide icon based on notification type and title */}
                      {getNotificationIcon(notification, "w-6 h-6")}
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
                  <div className="flex gap-1 shrink-0 items-start">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-full transition-all"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
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