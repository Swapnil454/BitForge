"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { notificationAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import { showError, showSuccess } from "@/lib/toast";
import NotificationCard from "@/app/dashboard/components/notifications/NotificationCard";
import { AppNotification, getNotificationDestination } from "@/lib/notification-ui";

interface User {
  id: string;
  role: "admin";
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || stored.role !== "admin") {
      router.push("/login");
      return;
    }

    setUser(stored);
    void fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(100, 0);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      showError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = useMemo(
    () => notifications.filter((item) => (filter === "unread" ? !item.isRead : true)),
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/45">
              BitForge Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              Notifications
            </h1>
          </div>
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-white/75 dark:hover:bg-white/5"
          >
            Back to dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-white/55">Total notifications</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{notifications.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-white/55">Unread</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{unreadCount}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-white/55">Tracked categories</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{Object.keys(categorySummary).length}</p>
          </motion.div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:text-white/50">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </div>
            <button
              onClick={() => setFilter("all")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                filter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                filter === "unread"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(categorySummary).map(([key, count]) => (
            <span
              key={key}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/65"
            >
              {key.replace(/_/g, " ")}: {count}
            </span>
          ))}
        </div>

        <div className="mt-6 space-y-3">
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
      </main>
    </div>
  );
}
