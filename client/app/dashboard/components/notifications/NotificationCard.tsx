"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Check, Trash2, ExternalLink } from "lucide-react";
import { AppNotification, cleanNotificationText, formatNotificationTime, getNotificationMeta } from "@/lib/notification-ui";

type NotificationCardProps = {
  notification: AppNotification;
  compact?: boolean;
  actionLoading?: boolean;
  onClick?: () => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: () => void;
  onLongPress?: () => void;
};

export default function NotificationCard({
  notification,
  compact = false,
  actionLoading = false,
  onClick,
  onMarkAsRead,
  onDelete,
  selectionMode = false,
  isSelected = false,
  onSelectToggle,
  onLongPress,
}: NotificationCardProps) {
  const meta = getNotificationMeta(notification);
  const sourceName = cleanNotificationText(notification.source?.name || "BitForge");
  const sourceLogo = notification.source?.logoUrl || "/icon.png";

  const [isExpanded, setIsExpanded] = useState(false);
  const message = cleanNotificationText(notification.message);
  const isLongMessage = message.length > 60; // Lowered threshold for mobile screens

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      }
    }, 500);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white/95 dark:bg-slate-950/70 backdrop-blur-sm transition-all ${
        isSelected 
          ? "border-cyan-500 shadow-[0_0_0_2px_rgba(6,182,212,0.2)] dark:border-cyan-400 dark:shadow-[0_0_0_2px_rgba(34,211,238,0.2)] bg-cyan-50/50 dark:bg-cyan-950/30"
          : notification.isRead
            ? "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
            : `${meta.unreadAccent} shadow-[0_18px_45px_-24px_rgba(14,165,233,0.28)]`
      } ${(isLongMessage || selectionMode) ? "cursor-pointer hover:-translate-y-0.5" : ""} ${!isExpanded ? "select-none" : ""} ${compact ? "p-3" : "p-5"}`}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onDoubleClick={() => {
        if (!selectionMode && onLongPress) {
          onLongPress();
        }
      }}
      onClick={() => {
        if (selectionMode && onSelectToggle) {
          onSelectToggle();
          return;
        }
        if (isLongMessage) {
          setIsExpanded(!isExpanded);
        }
      }}
    >
      <div className={`flex items-start ${compact ? "gap-2.5" : "gap-3.5"}`}>
        {selectionMode && (
          <div className="flex shrink-0 items-center justify-center h-full pt-2 pr-2">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full border ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300 dark:border-slate-600'}`}>
              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <div className={`flex items-center justify-center rounded-2xl border border-slate-200 shadow-sm dark:border-white/10 dark:bg-white/5 ${compact ? "h-9 w-9" : "h-11 w-11"} ${meta.accent} bg-slate-50`}>
            {meta.icon(compact ? "h-4 w-4" : "h-5 w-5")}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-center ${compact ? "mb-1 gap-1.5" : "mb-1.5 gap-2"}`}>
            <span className={`${compact ? "text-[10px]" : "text-xs"} font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/45`}>
              {sourceName}
            </span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${meta.accent} bg-slate-100 dark:bg-white/5`}>
              {meta.label}
            </span>
            {!notification.isRead && (
              <span className="inline-flex rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white dark:bg-white dark:text-slate-900">
                New
              </span>
            )}
          </div>

          <h3 className={`${compact ? "text-sm" : "text-sm sm:text-base"} font-semibold text-slate-900 dark:text-white leading-snug`}>
            {cleanNotificationText(notification.title)}
          </h3>
          <div className="mt-0.5">
            <p className={`${compact ? "text-xs leading-5" : "text-sm leading-6"} text-slate-600 dark:text-white/70 ${!isExpanded ? "line-clamp-2" : ""}`}>
              {message}
            </p>
            {isLongMessage && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-1 hover:underline focus:outline-none"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
          <div className={`flex items-center gap-1.5 font-medium text-slate-500 dark:text-white/45 ${compact ? "mt-1.5 text-[10px]" : "mt-3 text-xs gap-2"}`}>
            {meta.icon(compact ? "h-3 w-3" : "h-3.5 w-3.5")}
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
              className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 ${compact ? "h-7 w-7" : "h-9 w-9"}`}
              title="Mark as read"
            >
              <Check className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              disabled={actionLoading}
              className={`inline-flex items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 ${compact ? "h-7 w-7" : "h-9 w-9"}`}
              title="Delete"
            >
              <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </button>
          )}
          {onClick && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onClick();
              }}
              disabled={actionLoading}
              className={`inline-flex items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-500 disabled:opacity-50 dark:hover:border-indigo-400/20 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 ${compact ? "h-7 w-7" : "h-9 w-9"}`}
              title="Open Link"
            >
              <ExternalLink className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
