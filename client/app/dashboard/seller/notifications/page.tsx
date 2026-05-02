"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notificationAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import { showSuccess, showError } from "@/lib/toast";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import { CheckCircle, Trash2, CheckCheck, Clock, ChevronLeft, ChevronRight, Bell, Package, Info, AlertTriangle, CircleDollarSign } from "lucide-react";

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
  isRead: boolean;
  createdAt: string;
}

export default function SellerNotificationsPage() {
  const ITEMS_PER_PAGE = 20;
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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
      if (showLoader) {
        setLoading(true);
      }
      const data = await notificationAPI.getNotifications({
        page,
        limit: ITEMS_PER_PAGE,
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setCurrentPage(data.pagination?.page || page);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalNotifications(data.pagination?.total || 0);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      showError("Failed to load notifications");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setActionLoading(true);
      await notificationAPI.markAsRead(notificationId);
      await fetchNotifications(currentPage, false);
    } catch (error: any) {
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
    } catch (error: any) {
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
        notifications.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;
      await fetchNotifications(nextPage, false);
      showSuccess("Notification deleted");
    } catch (error: any) {
      showError("Failed to delete notification");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage || loading || actionLoading) {
      return;
    }
    await fetchNotifications(nextPage, true);
  };

  const cleanNotificationText = (value: string) =>
    value
      .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
      .replace(/\s{2,}/g, " ")
      .trim();

  const getNotificationIcon = (notification: NotificationItem) => {
    const title = notification.title?.toLowerCase() || "";
    const type = notification.type || "";
    const iconClass = "h-5 w-5";

    if (title.includes("purchase") || title.includes("order") || type === "order_completed") {
      return <CircleDollarSign className={`${iconClass} text-emerald-400`} />;
    }
    if (title.includes("product") || type.includes("product") || type === "download_ready") {
      return <Package className={`${iconClass} text-purple-400`} />;
    }
    if (type.includes("reject") || type.includes("delete") || title.includes("fail")) {
      return <AlertTriangle className={`${iconClass} text-red-400`} />;
    }
    if (type.includes("review") || type.includes("request") || type.includes("pending")) {
      return <Info className={`${iconClass} text-blue-400`} />;
    }
    return <Bell className={`${iconClass} text-indigo-400`} />;
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#05050a] pb-20">
      {/* Header */}
      <PageHeader 
        title="Notifications" 
        subtitle={unreadCount > 0 ? `${unreadCount} unread messages` : "All caught up"}
        backHref="/dashboard/seller"
        backLabel="Dashboard"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Action Buttons */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#05050a] rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              {actionLoading ? "Updating..." : "Mark all as read"}
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl p-5 bg-[#0b0b14] border border-[#27272a] animate-pulse flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-5 bg-[#18181b] rounded w-1/3 border border-[#27272a]"></div>
                    </div>
                    <div className="h-4 bg-[#18181b] rounded w-3/4 mb-2 border border-[#27272a]"></div>
                    <div className="h-3 bg-[#18181b] rounded w-1/4 border border-[#27272a]"></div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#18181b] border border-[#27272a]"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#0b0b14]/50 border-2 border-dashed border-[#27272a] rounded-3xl p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#18181b] flex items-center justify-center border border-[#27272a]">
              <CheckCircle className="w-10 h-10 text-cyan-500" />
            </div>
            <p className="text-white text-xl font-bold mb-3">All Clear!</p>
            <p className="text-zinc-500 text-base max-w-md mx-auto">You're all caught up. No new notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={notification._id}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`group relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] animate-fadeIn ${
                  notification.isRead
                    ? "bg-[#0b0b14] border border-[#27272a] hover:border-zinc-500/50"
                    : "bg-[#0b0b14] border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.05)] cursor-pointer"
                }`}
                onClick={() => { if (!notification.isRead) handleMarkAsRead(notification._id); }}
              >
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="pt-1 shrink-0">
                      {getNotificationIcon(notification)}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className={`font-bold text-base ${
                          notification.isRead ? "text-zinc-300" : "text-white"
                        }`}>
                          {cleanNotificationText(notification.title)}
                        </h3>
                        {!notification.isRead && (
                          <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs rounded-md font-bold uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mb-3 ${
                        notification.isRead ? "text-zinc-500" : "text-zinc-400"
                      }`}>
                        {cleanNotificationText(notification.message)}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons & Unread Dot */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(notification._id); }}
                      disabled={actionLoading}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {!notification.isRead && (
                      <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse mt-1 mr-3" title="Unread"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && totalNotifications > 0 && (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-zinc-500">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalNotifications)}-
              {Math.min(currentPage * ITEMS_PER_PAGE, totalNotifications)} of {totalNotifications}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || actionLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-[#27272a] px-3 py-1.5 text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="px-3 py-1.5 text-sm text-zinc-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || actionLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-[#27272a] px-3 py-1.5 text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-800"
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
