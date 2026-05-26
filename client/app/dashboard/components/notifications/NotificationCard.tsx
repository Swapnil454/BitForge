"use client";

import Image from "next/image";
import { Check, Trash2 } from "lucide-react";
import { AppNotification, cleanNotificationText, formatNotificationTime, getNotificationMeta } from "@/lib/notification-ui";

type NotificationCardProps = {
  notification: AppNotification;
  compact?: boolean;
  actionLoading?: boolean;
  onClick?: () => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
};

export default function NotificationCard({
  notification,
  compact = false,
  actionLoading = false,
  onClick,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
  const meta = getNotificationMeta(notification);
  const sourceName = cleanNotificationText(notification.source?.name || "BitForge");
  const sourceLogo = notification.source?.logoUrl || "/icon.png";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white/95 dark:bg-slate-950/70 backdrop-blur-sm transition-all ${
        notification.isRead
          ? "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
          : `${meta.unreadAccent} shadow-[0_18px_45px_-24px_rgba(14,165,233,0.28)]`
      } ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""} ${compact ? "p-4" : "p-5"}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <Image src={sourceLogo} alt={sourceName} width={28} height={28} className="h-7 w-7 object-contain" />
          </div>
          {!compact && (
            <div className={`hidden h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 md:flex ${meta.accent}`}>
              {meta.icon("h-5 w-5")}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
              {sourceName}
            </span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${meta.accent} bg-slate-100 dark:bg-white/5`}>
              {meta.label}
            </span>
            {!notification.isRead && (
              <span className="inline-flex rounded-full bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white dark:bg-white dark:text-slate-900">
                New
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
            {cleanNotificationText(notification.title)}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-white/70">
            {cleanNotificationText(notification.message)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-white/45">
            {meta.icon("h-3.5 w-3.5")}
            <span>{formatNotificationTime(notification.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {!notification.isRead && onMarkAsRead && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onMarkAsRead();
              }}
              disabled={actionLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              disabled={actionLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
