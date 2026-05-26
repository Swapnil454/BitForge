"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { NOTIFICATION_STYLES } from "./notificationStyles";
import { Notification, Role } from "./types";
import NotificationCard from "./NotificationCard";
import { getNotificationDestination } from "@/lib/notification-ui";

interface Props {
  role: Role;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => void;
  markAsRead: (id: string) => void;
}

export default function NotificationDropdown({
  role,
  notifications,
  unreadCount,
  loading,
  fetchNotifications,
  markAsRead,
}: Props) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const ui = NOTIFICATION_STYLES[role];

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside, true);
    return () => document.removeEventListener("pointerdown", handleOutside, true);
  }, [open]);

  useEffect(() => {
    const handleRoute = () => setOpen(false);
    window.addEventListener("popstate", handleRoute);
    return () => window.removeEventListener("popstate", handleRoute);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((value) => !value);
          if (!open) fetchNotifications();
        }}
        className={`relative grid place-items-center transition-all duration-300 group hover:scale-105 ${ui.button}`}
      >
        <Bell className="h-5 w-5 text-slate-800 dark:text-white/90" />
        {unreadCount > 0 && (
          <span className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg ${ui.badge}`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className={`fixed right-2 top-16 z-[9999] w-[18rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl border bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-slate-950/95 sm:right-4 md:w-[20rem] ${ui.dropdownBorder}`}
          >
            <div className={`border-b border-slate-200 px-4 py-3 dark:border-white/10 bg-linear-to-r ${ui.headerBg}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/45">
                    BitForge
                  </p>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Notifications
                  </h3>
                </div>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-[16rem] space-y-2 overflow-y-auto p-2">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                  You are all caught up.
                </div>
              ) : (
                notifications.slice(0, 3).map((notification) => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    compact
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification._id);
                      }
                      setOpen(false);
                      router.push(getNotificationDestination(notification));
                    }}
                    onMarkAsRead={
                      notification.isRead
                        ? undefined
                        : () => {
                            markAsRead(notification._id);
                          }
                    }
                  />
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-slate-200 p-2 dark:border-white/10">
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push(ui.viewAllHref);
                  }}
                  className="w-full rounded-2xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
