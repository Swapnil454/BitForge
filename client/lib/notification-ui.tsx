import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  MessageSquareMore,
  Package,
  Scale,
  ShieldCheck,
  Store,
} from "lucide-react";

export type AppNotification = {
  _id: string;
  title: string;
  message: string;
  type?: string;
  category?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  isRead: boolean;
  actionUrl?: string | null;
  actionLabel?: string;
  audienceRole?: "buyer" | "seller" | "admin";
  source?: {
    name?: string;
    logoUrl?: string;
  };
};

const CATEGORY_META: Record<
  string,
  {
    label: string;
    icon: (className: string) => ReactNode;
    accent: string;
    unreadAccent: string;
  }
> = {
  transaction: {
    label: "Transaction",
    icon: (className) => <CreditCard className={className} />,
    accent: "text-emerald-600 dark:text-emerald-300",
    unreadAccent: "border-emerald-300/80 dark:border-emerald-400/40",
  },
  payout: {
    label: "Payout",
    icon: (className) => <CreditCard className={className} />,
    accent: "text-sky-600 dark:text-sky-300",
    unreadAccent: "border-sky-300/80 dark:border-sky-400/40",
  },
  moderation: {
    label: "Review",
    icon: (className) => <Package className={className} />,
    accent: "text-violet-600 dark:text-violet-300",
    unreadAccent: "border-violet-300/80 dark:border-violet-400/40",
  },
  chat: {
    label: "Chat",
    icon: (className) => <MessageSquareMore className={className} />,
    accent: "text-cyan-600 dark:text-cyan-300",
    unreadAccent: "border-cyan-300/80 dark:border-cyan-400/40",
  },
  security: {
    label: "Security",
    icon: (className) => <ShieldCheck className={className} />,
    accent: "text-amber-600 dark:text-amber-300",
    unreadAccent: "border-amber-300/80 dark:border-amber-400/40",
  },
  account: {
    label: "Account",
    icon: (className) => <Store className={className} />,
    accent: "text-indigo-600 dark:text-indigo-300",
    unreadAccent: "border-indigo-300/80 dark:border-indigo-400/40",
  },
  promotion: {
    label: "Discover",
    icon: (className) => <Store className={className} />,
    accent: "text-fuchsia-600 dark:text-fuchsia-300",
    unreadAccent: "border-fuchsia-300/80 dark:border-fuchsia-400/40",
  },
  support: {
    label: "Support",
    icon: (className) => <Bell className={className} />,
    accent: "text-teal-600 dark:text-teal-300",
    unreadAccent: "border-teal-300/80 dark:border-teal-400/40",
  },
  dispute: {
    label: "Dispute",
    icon: (className) => <Scale className={className} />,
    accent: "text-rose-600 dark:text-rose-300",
    unreadAccent: "border-rose-300/80 dark:border-rose-400/40",
  },
  system: {
    label: "System",
    icon: (className) => <CheckCircle2 className={className} />,
    accent: "text-slate-600 dark:text-slate-300",
    unreadAccent: "border-slate-300/80 dark:border-slate-400/40",
  },
};

export const cleanNotificationText = (value: string) =>
  String(value || "")
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export const formatNotificationTime = (dateString: string) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

export const getNotificationMeta = (notification: Partial<AppNotification>) => {
  const fallback = CATEGORY_META.system;
  const base = CATEGORY_META[notification.category || ""] || fallback;
  const type = notification.type || "";
  const title = (notification.title || "").toLowerCase();

  if (type.includes("reject") || type.includes("failed") || title.includes("failed")) {
    return {
      ...base,
      label: base.label === "System" ? "Attention" : base.label,
      icon: (className: string) => <AlertTriangle className={className} />,
      accent: "text-rose-600 dark:text-rose-300",
      unreadAccent: "border-rose-300/80 dark:border-rose-400/40",
    };
  }

  return base;
};

export const getNotificationDestination = (notification: Partial<AppNotification>) =>
  notification.actionUrl || "/notifications";
