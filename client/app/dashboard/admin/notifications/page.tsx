"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Filter, Bell, Loader2, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { notificationAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import { showError, showSuccess } from "@/lib/toast";
import NotificationCard from "@/app/dashboard/components/notifications/NotificationCard";
import { AppNotification, getNotificationDestination } from "@/lib/notification-ui";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

interface User {
  id: string;
  role: "admin";
}

export default function AdminNotificationsPage() {
  const ITEMS_PER_PAGE = 15;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectionMode = selectedIds.length > 0;
  const [actionLoading, setActionLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || stored.role !== "admin") {
      router.push("/login");
      return;
    }

    setUser(stored);
    void fetchNotifications(1);
  }, [router]);

  const fetchNotifications = async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await notificationAPI.getNotifications({
        page,
        limit: ITEMS_PER_PAGE,
      });
      const incoming = response.notifications || [];
      setNotifications((prev) => (append ? [...prev, ...incoming] : incoming));
      setUnreadCount(response.unreadCount || 0);
      setCurrentPage(response.pagination?.page || page);
      setHasNextPage((response.pagination?.page || page) < (response.pagination?.totalPages || 1));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item
        )
      );
      setUnreadCount((value) => Math.max(0, value - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      showError("Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      showSuccess("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      showError("Failed to update notifications");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const target = notifications.find((item) => item._id === notificationId);
      await notificationAPI.deleteNotification(notificationId);
      setNotifications((current) => current.filter((item) => item._id !== notificationId));
      if (target && !target.isRead) {
        setUnreadCount((value) => Math.max(0, value - 1));
      }
      showSuccess("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      showError("Failed to delete notification");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await notificationAPI.bulkDeleteNotifications(selectedIds);
      
      const deletedCount = selectedIds.length;
      let unreadDeleted = 0;
      
      setNotifications((prev) => {
        const remaining = [];
        for (const n of prev) {
          if (selectedIds.includes(n._id)) {
            if (!n.isRead) unreadDeleted++;
          } else {
            remaining.push(n);
          }
        }
        return remaining;
      });
      
      setUnreadCount((prev) => Math.max(prev - unreadDeleted, 0));
      setSelectedIds([]);
      showSuccess(`${deletedCount} notifications deleted`);
    } catch (error) {
      console.error("Failed to delete notifications:", error);
      showError("Failed to delete notifications");
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <PageHeader 
        title="Notifications" 
        backHref="/dashboard/admin" 
        backLabel="Dashboard" 
      />

      {/* Bulk Action Bar */}
      {selectionMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 h-16 shadow-sm animate-in slide-in-from-top-full duration-300">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedIds([])} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
              <span className="font-semibold text-slate-900 dark:text-white text-base">
                {selectedIds.length} selected
              </span>
            </div>
            <button
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="px-4 py-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
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

        <div className="mt-3 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white/80 animate-pulse dark:border-white/10 dark:bg-white/5" />
            ))
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-8 py-20 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-xl font-semibold text-slate-900 dark:text-white">No notifications to show</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
                Moderation alerts, disputes, seller requests, and support updates will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                actionLoading={actionLoading}
                selectionMode={selectionMode}
                isSelected={selectedIds.includes(notification._id)}
                onSelectToggle={() => {
                  setSelectedIds((prev) => 
                    prev.includes(notification._id)
                      ? prev.filter((id) => id !== notification._id)
                      : [...prev, notification._id]
                  );
                }}
                onLongPress={() => {
                  if (!selectionMode) {
                    setSelectedIds([notification._id]);
                  }
                }}
                onClick={() => {
                  if (!notification.isRead) {
                    void handleMarkAsRead(notification._id);
                  }
                  router.push(getNotificationDestination(notification));
                }}
                onMarkAsRead={
                  notification.isRead ? undefined : () => {
                    void handleMarkAsRead(notification._id);
                  }
                }
                onDelete={() => {
                  void handleDeleteNotification(notification._id);
                }}
              />
            ))
          )}
        </div>

        {/* Sentinel div for Intersection Observer */}
        <div ref={sentinelRef} className="h-10 w-full" />

        {loadingMore && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        )}
      </main>
    </div>
  );
}
