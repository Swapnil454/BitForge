"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Bell, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { notificationAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import { showError, showSuccess } from "@/lib/toast";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import NotificationCard from "@/app/dashboard/components/notifications/NotificationCard";
import { AppNotification, getNotificationDestination } from "@/lib/notification-ui";

interface User {
  id: string;
  role: "seller";
}

export default function SellerNotificationsPage() {
  const ITEMS_PER_PAGE = 15;
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<string>("all");

  const filteredNotifications = useMemo(
    () => notifications.filter((item) => (filter === "all" ? true : (item.category || "system") === filter)),
    [filter, notifications]
  );

  const categorySummary = useMemo(() => {
    return notifications.reduce<Record<string, number>>((acc, item) => {
      const key = item.category || "system";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [notifications]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || stored.role !== "seller") {
      router.push("/login");
      return;
    }
    setUser(stored);
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
      showError("Failed to load notifications");
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
      showError("Failed to mark notification as read");
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
      showSuccess("All notifications marked as read");
    } catch {
      showError("Failed to mark all as read");
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
      showSuccess("Notification deleted");
    } catch {
      showError("Failed to delete notification");
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_32%),linear-gradient(180deg,#030712_0%,#111827_100%)]">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        backHref="/dashboard/seller"
        backLabel="Dashboard"
      />

      <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/65 dark:hover:bg-white/10"
            }`}
          >
            All
          </button>
          {Object.keys(categorySummary).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === key
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/65 dark:hover:bg-white/10"
              }`}
            >
              {key.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <div className="mb-6">
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
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
        ) : filteredNotifications.length === 0 ? (
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
              Product reviews, payouts, sales, and admin updates will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
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
