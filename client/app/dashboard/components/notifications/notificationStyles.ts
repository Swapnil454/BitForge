

import { Role } from "./types";

export const NOTIFICATION_STYLES: Record<Role, any> = {
  admin: {
    button:
      "h-10 w-10 md:h-11 md:w-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 hover:border-blue-500/50 hover:from-blue-500/20 hover:to-blue-600/20 shadow-lg hover:shadow-blue-500/50",
    badge:
      "bg-linear-to-r from-red-500 to-orange-500 shadow-red-500/50 animate-pulse",
    dropdownBorder: "border-white/20",
    headerBg: "from-blue-500/10 to-purple-500/10",
    unreadBg: "from-blue-500/10 to-purple-500/10",
    viewAllHref: "/notifications",
  },

  seller: {
    button:
      "h-9 w-9 rounded-lg bg-white/5 border border-white/10",
    badge:
      "bg-linear-to-r from-cyan-500 to-purple-500",
    dropdownBorder: "border-cyan-400/20",
    headerBg: "from-cyan-500/10 to-purple-500/10",
    unreadBg: "from-cyan-500/10 to-purple-500/10",
    viewAllHref: "/dashboard/seller/notifications",
  },

  buyer: {
    button:
      "h-10 w-10 md:h-11 md:w-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 hover:border-blue-500/50 hover:from-blue-500/20 hover:to-blue-600/20 shadow-lg hover:shadow-blue-500/50",
    badge:
      "bg-linear-to-r from-red-500 to-orange-500 shadow-red-500/50 animate-pulse",
    dropdownBorder: "border-white/20",
    headerBg: "from-blue-500/10 to-purple-500/10",
    unreadBg: "from-blue-500/10 to-purple-500/10",
    viewAllHref: "/notifications",
  },
};
