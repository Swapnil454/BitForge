"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { NOTIFICATION_STYLES } from "./notificationStyles";
import { Notification, Role } from "./types";

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

  // Close dropdown when clicking / tapping outside (production-safe)
  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: PointerEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    // Use capture phase so we receive the event even when
    // other overlays or handlers might stop propagation
    document.addEventListener("pointerdown", handleOutside, true);

    return () => {
      document.removeEventListener("pointerdown", handleOutside, true);
    };
  }, [open]);

  // Close dropdown on browser navigation (back/forward)
  useEffect(() => {
    const handleRoute = () => setOpen(false);

    window.addEventListener("popstate", handleRoute);
    return () => window.removeEventListener("popstate", handleRoute);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* 🔔 Button */}
      <button
        onClick={() => {
          setOpen(v => !v);
          if (!open) fetchNotifications();
        }}
        className={`relative grid place-items-center transition-all duration-300 group hover:scale-105 ${ui.button}`}
      >
        <span className="text-lg group-hover:scale-110 transition-transform">
          🔔
        </span>

        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg ${ui.badge}`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-16 right-2 sm:right-4 w-72 sm:w-80 md:w-96 max-w-[calc(100vw-1rem)] rounded-2xl bg-linear-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-2 ${ui.dropdownBorder} shadow-2xl z-[9999]`}
          >
            {/* Header */}
            <div className={`px-5 py-4 border-b border-white/10 bg-linear-to-r ${ui.headerBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔔</span>
                  <h3 className="font-bold text-white">Notifications</h3>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-white/60">
                  Loading notifications…
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center text-white/50">
                  All caught up!
                </div>
              ) : (
                notifications.slice(0, 2).map((n, i) => (
                  <motion.div
                    key={n._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative px-5 py-4 border-b border-white/5 hover:bg-white/10 cursor-pointer ${
                      !n.isRead ? `bg-linear-to-r ${ui.unreadBg}` : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center">
                        {n.icon || "🔔"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {n.title}
                        </p>
                        <p className="text-xs text-white/60 line-clamp-2">
                          {n.message}
                        </p>
                      </div>

                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n._id);
                          }}
                          className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-white/10">
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push(ui.viewAllHref);
                  }}
                  className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-lg font-semibold"
                >
                  View All Notifications →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
