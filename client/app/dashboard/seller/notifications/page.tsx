"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCheck } from "lucide-react";
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
  const ITEMS_PER_PAGE = 20;
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || stored.role !== "seller") {
      router.push("/login");
      return;
    }
    setUser(stored);
    fetchNotifications(1);
  }, [router]);

  const fetchNotifications = async (page = 1, showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await notificationAPI.getNotifications({
        page,
        limit: ITEMS_PER_PAGE,
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setCurrentPage(data.pagination?.page || page);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalNotifications(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      showError("Failed to load notifications");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setActionLoading(true);
      await notificationAPI.markAsRead(notificationId);
      await fetchNotifications(currentPage, false);
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
      await fetchNotifications(currentPage, false);
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
      const nextPage =
        notifications.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      await fetchNotifications(nextPage, false);
      showSuccess("Notification deleted");
    } catch {
      showError("Failed to delete notification");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || loading || actionLoading) {
      return;
    }
    await fetchNotifications(page, true);
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
              <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white/80 animate-pulse dark:border-white/10 dark:bg-white/5" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-8 py-20 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-xl font-semibold text-slate-900 dark:text-white">No notifications yet</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
              Product reviews, payouts, sales, and admin updates will appear here.
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
                  notification.isRead ? undefined : () => {
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

        {!loading && totalNotifications > 0 && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-500 dark:text-white/55">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalNotifications)}-
              {Math.min(currentPage * ITEMS_PER_PAGE, totalNotifications)} of {totalNotifications}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || actionLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="px-3 py-2 text-sm text-slate-600 dark:text-white/60">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || actionLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
