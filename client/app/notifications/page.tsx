"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCheck, Bell, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { notificationAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import NotificationCard from "@/app/dashboard/components/notifications/NotificationCard";
import { AppNotification, getNotificationDestination } from "@/lib/notification-ui";

export default function NotificationsPage() {
  const ITEMS_PER_PAGE = 20;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }

    fetchNotifications(1);
  }, [router]);

  const fetchNotifications = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const data = await notificationAPI.getNotifications({
        page,
        limit: ITEMS_PER_PAGE,
      });

      const incoming = data.notifications || [];
      setNotifications((prev) => (append ? [...prev, ...incoming] : incoming));
      setUnreadCount(data.unreadCount || 0);
      setCurrentPage(data.pagination?.page || page);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalNotifications(data.pagination?.total || 0);
      setHasNextPage((data.pagination?.page || page) < (data.pagination?.totalPages || 1));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore && !loading) {
          void fetchNotifications(currentPage + 1, true);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, loading, currentPage]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setActionLoading(true);
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      toast.error("Failed to mark notification as read");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all notifications as read");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      setActionLoading(true);
      await notificationAPI.deleteNotification(notificationId);
      const deletedNotif = notifications.find((n) => n._id === notificationId);
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setTotalNotifications((prev) => Math.max(prev - 1, 0));
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        backHref="/dashboard/buyer"
      />

      <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-6">
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="mb-6">
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <CheckCheck className="h-4 w-4" />
              {actionLoading ? "Updating..." : "Mark all as read"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl border border-slate-200 bg-white/80 animate-pulse dark:border-white/10 dark:bg-white/5"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-16 sm:py-24 px-4">
            {/* Animated floating empty state icon */}
            <motion.div
              animate={{
                y: [0, -8, 0],
                rotate: [0, -2, 2, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-20 h-20 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-100/50 dark:shadow-none"
            >
              <Bell className="h-9 w-9 text-slate-400 dark:text-white/40" />
            </motion.div>

            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              No Notifications Yet
            </h3>
            <p className="text-slate-500 dark:text-white/50 text-sm max-w-xs leading-relaxed">
              When something important happens on BitForge, it will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                actionLoading={actionLoading}
                onClick={() => {
                  if (!notification.isRead) {
                    void handleMarkAsRead(notification._id);
                  }
                  router.push(getNotificationDestination(notification));
                }}
                onMarkAsRead={
                  notification.isRead
                    ? undefined
                    : () => {
                        void handleMarkAsRead(notification._id);
                      }
                }
                onDelete={() => {
                  void handleDelete(notification._id);
                }}
              />
            ))}
          </div>
        )}

        {/* Sentinel div for Intersection Observer */}
        <div ref={sentinelRef} className="h-10 w-full" />

        {loadingMore && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        )}
      </div>
    </div>
  );
}
