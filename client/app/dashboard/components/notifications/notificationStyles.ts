

import { Role } from "./types";

export const NOTIFICATION_STYLES: Record<Role, any> = {
  admin: {
    button:
      "h-10 w-10 md:h-11 md:w-11 rounded-full bg-slate-100 dark:bg-transparent dark:bg-linear-to-br dark:from-white/10 dark:to-white/5 border border-slate-200 dark:border-white/20 hover:border-blue-500/50 hover:bg-slate-200 dark:hover:from-blue-500/20 dark:hover:to-blue-600/20 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-blue-500/50",
    badge:
      "bg-linear-to-r from-red-500 to-orange-500 shadow-red-500/50 animate-pulse",
    dropdownBorder: "border-slate-200 dark:border-white/20",
    headerBg: "from-blue-500/10 to-purple-500/10",
    unreadBg: "from-blue-500/10 to-purple-500/10",
    viewAllHref: "/notifications",
  },

  seller: {
    button:
      "h-9 w-9 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10",
    badge:
      "bg-linear-to-r from-cyan-500 to-purple-500",
    dropdownBorder: "border-cyan-400/20",
    headerBg: "from-cyan-500/10 to-purple-500/10",
    unreadBg: "from-cyan-500/10 to-purple-500/10",
    viewAllHref: "/dashboard/seller/notifications",
  },

  buyer: {
    button:
      "h-10 w-10 md:h-11 md:w-11 rounded-full bg-slate-100 dark:bg-transparent dark:bg-linear-to-br dark:from-white/10 dark:to-white/5 border border-slate-200 dark:border-white/20 hover:border-blue-500/50 hover:bg-slate-200 dark:hover:from-blue-500/20 dark:hover:to-blue-600/20 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-blue-500/50",
    badge:
      "bg-linear-to-r from-red-500 to-orange-500 shadow-red-500/50 animate-pulse",
    dropdownBorder: "border-slate-200 dark:border-white/20",
    headerBg: "from-blue-500/10 to-purple-500/10",
    unreadBg: "from-blue-500/10 to-purple-500/10",
    viewAllHref: "/notifications",
  },
};
