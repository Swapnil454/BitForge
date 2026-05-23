"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleHelp,
  CreditCard,
  IndianRupee,
  Landmark,
  LogOut,
  Flag,
  FileText,
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Upload,
  UserRound,
  X,
  Moon,
  Sun,
  Monitor,
  TrendingUp,
  Megaphone,
  BarChart3,
  ChevronRight,
  FolderOpen,
  CloudDownload,
  WalletCards,
  ClipboardCheck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { clearAuthStorage, getStoredUser, setCookie, getCookie } from "@/lib/cookies";
import { notificationAPI, userAPI } from "@/lib/api";
import {
  useSellerDashboard,
  useInvalidateSellerCache,
  sellerQueryKeys,
} from "@/lib/hooks/useSellerDashboard";

import { KPI, Glass, MenuItem } from "../components/Cards";
import DashboardActionCard from "../components/DashboardActionCard";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import { BarMetricChart } from "../components/charts/BarMetricChart";
import BitForgeBrand from "../components/logo/BitForgeBrand";
import LogoutModal from "../components/LogoutModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  isVerified: boolean;
  approvalStatus?: string;
  isApproved?: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setProfileOpen(false);
    
    userAPI.updatePreferences({ theme: newTheme }).then((res) => {
      const userStr = getCookie("user");
      if (userStr && userStr !== '""') {
        try {
          const userObj = JSON.parse(userStr as string);
          userObj.preferences = res.preferences || { theme: newTheme };
          setCookie("user", JSON.stringify(userObj), 7);
        } catch(e) {}
      }
    }).catch(() => {
      toast.error("Failed to sync theme preference", { id: "theme-sync-error" });
    });
  };

  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const {
    stats,
    monthly,
    recentSales,
    notifications,
    unreadCount,
    chatUnread: chatUnreadCount,
    isInitialLoading,
    queries,
  } = useSellerDashboard();

  const cacheInvalidator = useInvalidateSellerCache();
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored) {
      router.push("/login");
      return;
    }

    if (stored.role === "seller") {
      const isApproved = stored.approvalStatus === "approved" || stored.isApproved;
      if (!isApproved) {
        router.push("/pending-approval");
        return;
      }
    }

    setUser(stored);

    const syncProfile = async () => {
      try {
        const fresh = await userAPI.getCurrentUser();

        if (!fresh) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
          return;
        }

        if (fresh.role === "seller") {
          const isApproved = fresh.approvalStatus === "approved" || fresh.isApproved;
          if (!isApproved) {
            router.push("/pending-approval");
            return;
          }
        }

        setUser(fresh);
        setCookie("user", JSON.stringify(fresh), 7);
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("user", JSON.stringify(fresh));
        }
      } catch (err) {
        console.error("Failed to sync user profile", err);
        if (err instanceof Error && err.message.includes("401")) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
        }
      }
    };

    syncProfile();
    fetchNotifications();

    const closeOnOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };

    const deleteCheckInterval = setInterval(async () => {
      try {
        const fresh = await userAPI.getCurrentUser();
        if (!fresh) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("401")) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
        }
      }
    }, 5000);

    document.addEventListener("mousedown", closeOnOutside);
    window.addEventListener("keydown", esc);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      window.removeEventListener("keydown", esc);
      clearInterval(deleteCheckInterval);
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const socketUrl = apiBase.replace(/\/api$/, "");
    const token = getCookie("token");

    const socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("chat:new-message", (msg: any) => {
      if (msg?.to?._id === user.id) {
        cacheInvalidator.invalidateChatUnread();
      }
    });

    socket.on("notification:new", () => {
      cacheInvalidator.invalidateNotifications();
    });

    socket.on("connect_error", (err: any) => {
      console.error("Socket connect error (seller dashboard)", err?.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, cacheInvalidator]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      await queries.notifications.refetch();
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      queryClient.setQueryData(
        [...sellerQueryKeys.notifications(), 5],
        (oldData: any) => {
          if (!oldData) return oldData;
          const notification = oldData.notifications.find((n: any) => n._id === id);
          const shouldDecrement = notification && !notification.isRead;
          return {
            ...oldData,
            notifications: oldData.notifications.map((n: any) =>
              n._id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: shouldDecrement
              ? Math.max(0, (oldData.unreadCount || 0) - 1)
              : oldData.unreadCount,
          };
        }
      );

      await notificationAPI.markAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      cacheInvalidator.invalidateNotifications();
    }
  };

  const logout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  if (!user) return null;

  if (isInitialLoading) {
    return <SellerDashboardSkeleton />;
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-50 bg-white dark:bg-gradient-to-r dark:from-black dark:via-slate-900 dark:to-black backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/50">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <BitForgeBrand role="Seller" />

          <div className="flex items-center gap-2 md:gap-3">
            <NotificationDropdown
              role="seller"
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loadingNotifs}
              fetchNotifications={fetchNotifications}
              markAsRead={handleMarkAsRead}
            />

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className={`relative p-2 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors grid place-items-center ${
                  profileOpen
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                    : ""
                }`}
                title="Menu"
              >
                {chatUnreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#05050a]" />
                )}
                {profileOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-2 dark:border-indigo-500/20 shadow-xl dark:shadow-2xl dark:shadow-indigo-500/20"
                  >
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-t-2xl">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">Menu</p>
                    </div>
                    <MenuItem
                      label="Profile"
                      icon={<UserRound className="h-4 w-4" />}
                      onClick={() => {
                        router.push("/dashboard/settings?tab=profile");
                        setProfileOpen(false);
                      }}
                    />
                    <MenuItem
                      label="Settings"
                      icon={<Settings className="h-4 w-4" />}
                      onClick={() => {
                        router.push("/dashboard/settings");
                        setProfileOpen(false);
                      }}
                    />
                    <MenuItem
                      label="Help Center"
                      icon={<CircleHelp className="h-4 w-4" />}
                      badge={chatUnreadCount > 0 ? chatUnreadCount : undefined}
                      onClick={() => {
                        cacheInvalidator.invalidateChatUnread();
                        router.push("/dashboard/seller/help-center");
                        setProfileOpen(false);
                      }}
                    />
                    <MenuItem
                      label="Submit Report"
                      icon={<Flag className="h-4 w-4" />}
                      onClick={() => {
                        router.push("/report");
                        setProfileOpen(false);
                      }}
                    />
                    <MenuItem
                      label="My Reports"
                      icon={<FileText className="h-4 w-4" />}
                      onClick={() => {
                        router.push("/dashboard/seller/reports");
                        setProfileOpen(false);
                      }}
                    />
                    {mounted && (() => {
                      let nextTheme = "light";
                      let label = "Light Mode";
                      let icon = <Sun className="h-4 w-4" />;

                      if (theme === "light") {
                        nextTheme = "dark";
                        label = "Dark Mode";
                        icon = <Moon className="h-4 w-4" />;
                      } else if (theme === "dark") {
                        nextTheme = "system";
                        label = "System Theme";
                        icon = <Monitor className="h-4 w-4" />;
                      } else {
                        if (resolvedTheme === "dark") {
                          nextTheme = "light";
                          label = "Light Mode";
                          icon = <Sun className="h-4 w-4" />;
                        } else {
                          nextTheme = "dark";
                          label = "Dark Mode";
                          icon = <Moon className="h-4 w-4" />;
                        }
                      }

                      return (
                        <MenuItem 
                          label={label} 
                          icon={icon}
                          onClick={() => handleThemeChange(nextTheme)} 
                        />
                      );
                    })()}
                    <div className="h-px bg-linear-to-r from-transparent via-indigo-500/20 to-transparent" />
                    <MenuItem
                      label="Logout"
                      icon={<LogOut className="h-4 w-4" />}
                      danger
                      onClick={() => {
                        setIsLogoutModalOpen(true);
                        setProfileOpen(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

            <section className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* === Custom Live Animations === */}
        <style>{`
          @keyframes drawAnim {
            0%, 0.5%, 8.5%, 100% { stroke-dashoffset: 220; opacity: 0.2; }
            4.25% { stroke-dashoffset: 0; opacity: 1; }
          }
          @keyframes bounceAnim {
            0%, 0.5%, 8.5%, 100% { transform: translateY(0) scale(1); }
            1.75%, 6.75% { transform: translateY(-6px) scaleY(1.05); }
            4.25% { transform: translateY(0) scaleY(0.95); }
          }
          @keyframes wiggleAnim {
            0%, 0.5%, 4.25%, 8.5%, 100% { transform: rotate(0deg) scale(1); }
            1.75% { transform: rotate(-10deg) scale(1.1); }
            6.75% { transform: rotate(10deg) scale(1.1); }
          }
          @keyframes pulseAnim {
            0%, 0.5%, 4.25%, 8.5%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 transparent); }
            1.75%, 6.75% { transform: scale(1.2); filter: drop-shadow(0 0 8px currentColor); }
          }
          @keyframes flipAnim {
            0%, 0.5%, 8.5%, 100% { transform: perspective(400px) rotateY(0) scale(1); }
            4.25% { transform: perspective(400px) rotateY(180deg) scale(1.1); }
            8% { transform: perspective(400px) rotateY(360deg) scale(1); }
          }
          @keyframes floatAnim {
            0%, 0.5%, 4.25%, 8.5%, 100% { transform: translateY(0) rotate(0); }
            1.75%, 6.75% { transform: translateY(-8px) rotate(3deg); }
          }
          @keyframes swingAnim {
            0%, 0.5%, 4.25%, 8.5%, 100% { transform: rotate(0deg); transform-origin: top center; }
            1.75% { transform: rotate(15deg); }
            6.75% { transform: rotate(-15deg); }
          }
          @keyframes spinAnim {
            0%, 0.5%, 8.5%, 100% { transform: rotate(0deg) scale(1); }
            4.25% { transform: rotate(180deg) scale(0.85); }
            8% { transform: rotate(360deg) scale(1); }
          }
          @keyframes hoverShine {
            0% { left: -100%; }
            100% { left: 200%; }
          }

          /* Base Classes & Resets */
          .anim-wrapper svg { overflow: visible; will-change: transform, filter; }
          .hover-shine { position: relative; overflow: hidden; }
          .recharts-wrapper, .recharts-surface, .recharts-wrapper * {
            outline: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }
          
          .hover-shine::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
            transform: skewX(-20deg);
          }
          .dark .hover-shine::after {
            background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%);
          }
          .group:hover .hover-shine::after {
            animation: hoverShine 0.8s ease-out forwards;
          }
          
          /* Animation Assignments */
          .icon-draw svg path, .icon-draw svg polyline, .icon-draw svg line, .icon-draw svg rect, .icon-draw svg circle {
            stroke-dasharray: 220;
            stroke-dashoffset: 220;
            animation: drawAnim 32s ease-in-out infinite;
          }
          .anim-bounce svg { animation: bounceAnim 32s ease-in-out infinite; }
          .anim-wiggle svg { animation: wiggleAnim 32s ease-in-out infinite; }
          .anim-pulse svg  { animation: pulseAnim 32s ease-in-out infinite; }
          .anim-flip svg   { animation: flipAnim 32s ease-in-out infinite; }
          .anim-float svg  { animation: floatAnim 32s ease-in-out infinite; }
          .anim-swing svg  { animation: swingAnim 32s ease-in-out infinite; }
          .anim-spin svg   { animation: spinAnim 32s ease-in-out infinite; }
          
          /* Stagger Delays (synchronized with border rings) */
          .delay-1 svg, .delay-1 svg path, .delay-1 svg circle, .delay-1 svg rect, .delay-1 svg polyline, .delay-1 svg line { animation-delay: 20s; }
          .delay-2 svg, .delay-2 svg path, .delay-2 svg circle, .delay-2 svg rect, .delay-2 svg polyline, .delay-2 svg line { animation-delay: 8s; }
          .delay-3 svg, .delay-3 svg path, .delay-3 svg circle, .delay-3 svg rect, .delay-3 svg polyline, .delay-3 svg line { animation-delay: 24s; }
          .delay-4 svg, .delay-4 svg path, .delay-4 svg circle, .delay-4 svg rect, .delay-4 svg polyline, .delay-4 svg line { animation-delay: 12s; }
          .delay-5 svg, .delay-5 svg path, .delay-5 svg circle, .delay-5 svg rect, .delay-5 svg polyline, .delay-5 svg line { animation-delay: 28s; }
          .delay-6 svg, .delay-6 svg path, .delay-6 svg circle, .delay-6 svg rect, .delay-6 svg polyline, .delay-6 svg line { animation-delay: 4s; }
          .delay-7 svg, .delay-7 svg path, .delay-7 svg circle, .delay-7 svg rect, .delay-7 svg polyline, .delay-7 svg line { animation-delay: 16s; }
          .delay-8 svg, .delay-8 svg path, .delay-8 svg circle, .delay-8 svg rect, .delay-8 svg polyline, .delay-8 svg line { animation-delay: 0s; }

          /* === Rotating Border Ring === */
          :root { --rb-base: #000; }
          .dark { --rb-base: #fff; }
          .rb-parent { position: relative; border-radius: 9999px; }
          .rb-ring {
            position: absolute; inset: -1.5px; border-radius: 9999px;
            pointer-events: none; z-index: 10;
            opacity: 0;
            -webkit-mask: radial-gradient(closest-side, transparent 88%, black 94%);
            mask: radial-gradient(closest-side, transparent 88%, black 94%);
          }
          .rb-cw  { animation: rbSpinCw 32s linear infinite; }
          .rb-ccw { animation: rbSpinCcw 32s linear infinite; }
          @keyframes rbSpinCw {
            0%       { opacity: 0; transform: rotate(0deg); }
            0.5%     { opacity: 1; transform: rotate(0deg); }
            3%       { opacity: 1; transform: rotate(720deg); }
            5.5%     { opacity: 1; transform: rotate(720deg); }
            8%       { opacity: 1; transform: rotate(1440deg); }
            8.5%     { opacity: 0; transform: rotate(1440deg); }
            100%     { opacity: 0; transform: rotate(1440deg); }
          }
          @keyframes rbSpinCcw {
            0%       { opacity: 0; transform: rotate(0deg); }
            0.5%     { opacity: 1; transform: rotate(0deg); }
            3%       { opacity: 1; transform: rotate(-720deg); }
            5.5%     { opacity: 1; transform: rotate(-720deg); }
            8%       { opacity: 1; transform: rotate(-1440deg); }
            8.5%     { opacity: 0; transform: rotate(-1440deg); }
            100%     { opacity: 0; transform: rotate(-1440deg); }
          }
          .rb-blue   { background: conic-gradient(from 0deg, var(--rb-base) 0%, var(--rb-base) 12%, transparent 12%, transparent 15%, #3b82f6 15%, #3b82f6 27%, transparent 27%); }
          .rb-green  { background: conic-gradient(from 0deg, var(--rb-base) 0%, var(--rb-base) 12%, transparent 12%, transparent 15%, #10b981 15%, #10b981 27%, transparent 27%); }
          .rb-rose   { background: conic-gradient(from 0deg, var(--rb-base) 0%, var(--rb-base) 12%, transparent 12%, transparent 15%, #f43f5e 15%, #f43f5e 27%, transparent 27%); }
          .rb-violet { background: conic-gradient(from 0deg, var(--rb-base) 0%, var(--rb-base) 12%, transparent 12%, transparent 15%, #8b5cf6 15%, #8b5cf6 27%, transparent 27%); }
          .rb-s1 { background: conic-gradient(from 0deg, var(--rb-base) 0%, var(--rb-base) 12%, transparent 12%, transparent 15%, #64748b 15%, #64748b 27%, transparent 27%); }
          .rb-s2 { background: conic-gradient(from 0deg, var(--rb-base) 0%, var(--rb-base) 12%, transparent 12%, transparent 15%, #64748b 15%, #64748b 27%, transparent 27%); }
          .rb-s3 { background: conic-gradient(from 0deg, var(--rb-base) 0%, var(--rb-base) 12%, transparent 12%, transparent 15%, #64748b 15%, #64748b 27%, transparent 27%); }
          .rb-s4 { background: conic-gradient(from 0deg, var(--rb-base) 0%, var(--rb-base) 12%, transparent 12%, transparent 15%, #64748b 15%, #64748b 27%, transparent 27%); }
          .rb-d1 { animation-delay:20s; } .rb-d2 { animation-delay:8s;  }
          .rb-d3 { animation-delay:24s; } .rb-d4 { animation-delay:12s;  }
          .rb-d5 { animation-delay:28s; } .rb-d6 { animation-delay:4s;  }
          .rb-d7 { animation-delay:16s; }
        `}</style>




        {/* Quick Access */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 px-1">Quick Access</h2>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-none p-5">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-3">

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => router.push("/dashboard/seller/upload")} className="flex flex-col items-center gap-2 group md:flex-row md:items-center md:justify-between md:gap-3 md:p-4 md:rounded-2xl bg-transparent md:bg-cyan-600/10 dark:md:bg-cyan-900/40 md:border md:border-cyan-200/60 dark:md:border-cyan-700/30 md:hover:bg-cyan-600/15 dark:md:hover:bg-cyan-900/60 transition-all w-full">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="rb-parent w-[56px] h-[56px] md:w-[50px] md:h-[50px] shrink-0">
                    <span className="rb-ring rb-cw rb-blue"></span>
                    <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/60 border border-cyan-200/50 dark:border-cyan-700/40 shadow-sm transition-all">
                      <span className="anim-wrapper anim-float inline-flex"><Upload className="w-6 h-6 text-cyan-700 dark:text-cyan-300" strokeWidth={1.5} /></span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Upload Product</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Add new content</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Upload</span>
                <ChevronRight className="hidden md:block w-4 h-4 text-cyan-400 dark:text-cyan-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => router.push("/dashboard/seller/products")} className="flex flex-col items-center gap-2 group md:flex-row md:items-center md:justify-between md:gap-3 md:p-4 md:rounded-2xl bg-transparent md:bg-blue-600/10 dark:md:bg-blue-900/40 md:border md:border-blue-200/60 dark:md:border-blue-700/30 md:hover:bg-blue-600/15 dark:md:hover:bg-blue-900/60 transition-all w-full">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="rb-parent w-[56px] h-[56px] md:w-[50px] md:h-[50px] shrink-0">
                    <span className="rb-ring rb-ccw rb-blue rb-d1"></span>
                    <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/60 border border-blue-200/50 dark:border-blue-700/40 shadow-sm transition-all">
                      <span className="anim-wrapper anim-wiggle delay-1 inline-flex"><Package className="w-6 h-6 text-blue-700 dark:text-blue-300" strokeWidth={1.5} /></span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">My Products</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Manage listings</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Products</span>
                <ChevronRight className="hidden md:block w-4 h-4 text-blue-400 dark:text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => router.push("/dashboard/seller/earnings")} className="flex flex-col items-center gap-2 group md:flex-row md:items-center md:justify-between md:gap-3 md:p-4 md:rounded-2xl bg-transparent md:bg-emerald-600/10 dark:md:bg-emerald-900/40 md:border md:border-emerald-200/60 dark:md:border-emerald-700/30 md:hover:bg-emerald-600/15 dark:md:hover:bg-emerald-900/60 transition-all w-full">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="rb-parent w-[56px] h-[56px] md:w-[50px] md:h-[50px] shrink-0">
                    <span className="rb-ring rb-cw rb-green rb-d2"></span>
                    <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200/50 dark:border-emerald-700/40 shadow-sm transition-all">
                      <span className="anim-wrapper anim-pulse delay-2 inline-flex"><IndianRupee className="w-6 h-6 text-emerald-700 dark:text-emerald-300" strokeWidth={1.5} /></span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Earnings</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Withdraw money</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Earnings</span>
                <ChevronRight className="hidden md:block w-4 h-4 text-emerald-400 dark:text-emerald-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => router.push("/dashboard/seller/bank-account")} className="flex flex-col items-center gap-2 group md:flex-row md:items-center md:justify-between md:gap-3 md:p-4 md:rounded-2xl bg-transparent md:bg-purple-600/10 dark:md:bg-purple-900/40 md:border md:border-purple-200/60 dark:md:border-purple-700/30 md:hover:bg-purple-600/15 dark:md:hover:bg-purple-900/60 transition-all w-full">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="rb-parent w-[56px] h-[56px] md:w-[50px] md:h-[50px] shrink-0">
                    <span className="rb-ring rb-ccw rb-violet rb-d3"></span>
                    <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/60 border border-purple-200/50 dark:border-purple-700/40 shadow-sm transition-all">
                      <span className="anim-wrapper anim-bounce delay-3 inline-flex"><Landmark className="w-6 h-6 text-purple-700 dark:text-purple-300" strokeWidth={1.5} /></span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Bank Accounts</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Manage accounts</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Bank</span>
                <ChevronRight className="hidden md:block w-4 h-4 text-purple-400 dark:text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

            </div>
          </div>
        </motion.div>


        {/* Overview */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 px-1">Overview</h2>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-none p-5">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-5">

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/seller/transactions")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="rb-parent w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                  <span className="rb-ring rb-ccw rb-s1 rb-d4"></span>
                  <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                    <span className="anim-wrapper anim-flip delay-4 inline-flex"><WalletCards className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Total Revenue</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{`₹${stats?.totalRevenue?.toLocaleString() || 0}`}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Revenue</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/seller/transactions?period=month")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="rb-parent w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                  <span className="rb-ring rb-cw rb-s2 rb-d5"></span>
                  <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                    <span className="anim-wrapper anim-float delay-5 inline-flex"><TrendingUp className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">This Month</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{`₹${stats?.thisMonthRevenue?.toLocaleString() || 0}`}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">This Month</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/seller/sales")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="rb-parent w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                  <span className="rb-ring rb-ccw rb-s3 rb-d6"></span>
                  <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                    <span className="anim-wrapper anim-bounce delay-6 inline-flex"><ShoppingBag className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Total Sales</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{stats?.totalSales ?? 0} Items</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Sales</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/seller/growth")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="rb-parent w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                  <span className="rb-ring rb-cw rb-s4 rb-d7"></span>
                  <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                    <span className="anim-wrapper anim-swing delay-7 inline-flex"><BarChart3 className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Growth</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{`${(stats?.revenueGrowth ?? 0).toFixed(1)}%`}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Growth</span>
              </motion.button>

            </div>
          </div>
        </motion.div>


        {/* Recent Sales */}
        <div>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-none p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-500" />
                Recent Sales
              </h2>
              <button 
                onClick={() => router.push("/dashboard/seller/transactions")}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center hover:underline"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-1">
              {recentSales && recentSales.length > 0 ? (
                recentSales.slice(0, 3).map((sale: any, index: number) => {
                  const formattedDate = new Date(sale.createdAt).toLocaleString();

                  return (
                    <div key={sale.id} className="flex flex-col">
                      <div 
                        onClick={() => {}}
                        className="flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                            {sale.productName.substring(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {sale.productName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {formattedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            {sale.amount.toString().includes("₹") ? sale.amount.replace('.', ',') : `₹${Number(sale.amount).toLocaleString("en-IN")}`}
                          </p>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors hidden sm:block" />
                        </div>
                      </div>
                      {index < Math.min(recentSales.length, 3) - 1 && (
                        <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-1"></div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">No recent sales yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your recent transactions will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Management */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }} className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 px-1">Management</h2>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-none p-5">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-5">
            
            <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/seller/promotions")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
              <div className="w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                  <span className="anim-wrapper anim-swing delay-4 inline-flex"><Megaphone className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-start text-left ml-3">
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Promotions</span>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Hero banner ads</span>
              </div>
              <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Promote</span>
            </motion.button>

            <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/seller/reports")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
              <div className="w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                  <span className="anim-wrapper anim-flip delay-5 inline-flex"><FileText className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-start text-left ml-3">
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Reports</span>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Data exports</span>
              </div>
              <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Reports</span>
            </motion.button>

            <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/seller/help-center")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
              <div className="w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                  <span className="anim-wrapper anim-float delay-6 inline-flex"><CircleHelp className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-start text-left ml-3">
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Help Center</span>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Support tickets</span>
              </div>
              <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Help</span>
            </motion.button>

            <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/settings")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
              <div className="w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                  <span className="anim-wrapper anim-spin delay-7 inline-flex"><Settings className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-start text-left ml-3">
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Settings</span>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Preferences</span>
              </div>
              <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Settings</span>
            </motion.button>

            </div>
          </div>
        </motion.div>

        {/* Analytics */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-1">Analytics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-none p-5 sm:p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Revenue Growth
              </h3>
              <BarMetricChart data={monthly} dataKey="revenue" />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-none p-5 sm:p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-emerald-500" />
                Sales Volume
              </h3>
              <BarMetricChart data={monthly} dataKey="sales" />
            </div>
          </div>
        </div>

      </section>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
      />
    </main>
  );
}

function SellerDashboardSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-40 bg-linear-to-r from-cyan-900/80 via-slate-900/80 to-indigo-900/80 backdrop-blur-xl border-b border-cyan-500/40">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="h-6 w-28 rounded-full bg-gradient-to-r from-cyan-400/70 via-purple-400/70 to-indigo-400/70 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 bg-slate-800/90 rounded-full animate-pulse" />
            <div className="h-9 w-9 bg-slate-800/90 rounded-xl animate-pulse" />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-slate-800/90 border border-emerald-500/40 shadow-md shadow-emerald-500/25 animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-slate-800/90 border border-indigo-500/40 shadow-md shadow-indigo-500/25 animate-pulse"
            />
          ))}
        </div>

        <div className="h-44 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-lg shadow-cyan-500/30 animate-pulse" />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-lg shadow-cyan-500/30 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-lg shadow-purple-500/30 animate-pulse" />
        </div>
      </section>
    </main>
  );
}
