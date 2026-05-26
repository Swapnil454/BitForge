"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BriefcaseBusiness,
  CircleHelp,
  ClipboardList,
  LogOut,
  Package,
  FolderOpen,
  Settings,
  Shield,
  TriangleAlert,
  University,
  Users,
  Wallet,
  Megaphone,
  Moon,
  Sun,
  Monitor,
  UserRound,
  Menu,
  X,
  ChevronRight,
  WalletCards,
  TrendingUp,
  Receipt,
  FileText,
} from "lucide-react";
import { useTheme } from "next-themes";
import { clearAuthStorage, getStoredUser, setCookie, getCookie } from "@/lib/cookies";
import { notificationAPI, userAPI, adminAPI, chatAPI } from "@/lib/api";
import { useAdminDashboard, useInvalidateAdminCache, adminQueryKeys } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { KPI, Glass, MenuItem } from "../components/Cards";
import DashboardActionCard from "../components/DashboardActionCard";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import { AreaMetricChart} from "../components/charts/AreaMetricChart";
import { BarMetricChart } from "../components/charts/BarMetricChart";
import BitForgeBrand from "../components/logo/BitForgeBrand";
import LogoutModal from "../components/LogoutModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  icon: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalRevenue: number;
  platformRevenue: number;
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalProducts: number;
  userGrowth: number;
  pendingSellers: Array<{ id: string; name: string; email: string; appliedDate: string }>;
  recentTransactions: Array<{ id: string; orderId: string; user: string; productName: string; amount: string; date: string }>;
  platformAnalytics: Array<{ month: string; revenue: number; users: number }>;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

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

  // React Query hooks for cached data
  const { stats, notifications, unreadCount, chatUnread: chatUnreadCount, isInitialLoading, queries } = useAdminDashboard();
  const cacheInvalidator = useInvalidateAdminCache();
  const queryClient = useQueryClient();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored) {
      router.push("/login");
      return;
    }

    if (stored.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setUser(stored);
    // React Query handles data fetching automatically

    const syncProfile = async () => {
      try {
        const fresh = await userAPI.getCurrentUser();
        
        if (!fresh) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
          return;
        }
        
        setUser(fresh);
        setCookie("user", JSON.stringify(fresh), 7);
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("user", JSON.stringify(fresh));
        }
      } catch (err) {
        console.error("Failed to sync user profile", err);
        // If error getting user (likely deleted), redirect to register
        if (err instanceof Error && err.message.includes("401")) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
        }
      }
    };
    syncProfile();

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

    const outside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };

    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("mousedown", outside);
      clearInterval(deleteCheckInterval);
    };
  }, [router]);

  // Live unread chat updates via Socket.IO
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
        // Invalidate chat unread cache to trigger refetch
        cacheInvalidator.invalidateChatUnread();
      }
    });

    socket.on("notification:new", () => {
      cacheInvalidator.invalidateNotifications();
    });

    socket.on("connect_error", (err: any) => {
      console.error("Socket connect error (admin dashboard)", err?.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, cacheInvalidator]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      // Trigger refetch via React Query
      await queries.notifications.refetch();
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Optimistic update - immediately update UI
      queryClient.setQueryData(
        [...adminQueryKeys.notifications(), 5],
        (oldData: any) => {
          if (!oldData) return oldData;
          const notification = oldData.notifications.find((n: any) => n._id === notificationId);
          // Only decrement if notification exists and was unread
          const shouldDecrement = notification && !notification.isRead;
          return {
            ...oldData,
            notifications: oldData.notifications.map((n: any) =>
              n._id === notificationId ? { ...n, isRead: true } : n
            ),
            unreadCount: shouldDecrement 
              ? Math.max(0, (oldData.unreadCount || 0) - 1) 
              : oldData.unreadCount,
          };
        }
      );
      
      await notificationAPI.markAsRead(notificationId);
      // Don't invalidate immediately - let optimistic update stand
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert optimistic update on error
      cacheInvalidator.invalidateNotifications();
    }
  };

  if (!user) return null;

  if (isInitialLoading || !stats) {
    return <AdminDashboardSkeleton />;
  }

  const logout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white dark:bg-black/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <BitForgeBrand role="Admin" />
          <div className="flex items-center gap-3">
            { /* notification */}
            <NotificationDropdown
              role="admin"
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loadingNotifs}
              fetchNotifications={fetchNotifications}
              markAsRead={handleMarkAsRead}
            />

            { /* menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen(v => !v);
                  setNotifOpen(false);
                }}
                className={`relative p-2 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors grid place-items-center ${
                  profileOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''
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
                    className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-transparent dark:bg-linear-to-br dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-indigo-500/20 shadow-2xl shadow-gray-200 dark:shadow-indigo-500/20 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-linear-to-r from-indigo-500/10 to-purple-500/10 rounded-t-2xl">
                      <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Menu</p>
                    </div>
                    <MenuItem 
                      label="Profile" 
                      icon={<UserRound className="h-4 w-4" />}
                      onClick={() => { router.push("/dashboard/admin/settings?tab=profile"); setProfileOpen(false); }} 
                    />
                    <MenuItem 
                      label="Settings" 
                      icon={<Settings className="h-4 w-4" />}
                      onClick={() => { router.push("/dashboard/admin/settings"); setProfileOpen(false); }} 
                    />
                    <MenuItem 
                      label="Help Center" 
                      icon={<CircleHelp className="h-4 w-4" />}
                      badge={chatUnreadCount > 0 ? chatUnreadCount : undefined}
                      onClick={() => {
                        // Invalidate to reset unread count after viewing
                        cacheInvalidator.invalidateChatUnread();
                        router.push("/dashboard/admin/help-center");
                        setProfileOpen(false);
                      }} 
                    />
                    <MenuItem 
                      label="Careers Management" 
                      icon={<BriefcaseBusiness className="h-4 w-4" />}
                      onClick={() => {
                        router.push("/dashboard/admin/careers");
                        setProfileOpen(false);
                      }} 
                    />
                    <MenuItem 
                      label="Reports Management" 
                      icon={<ClipboardList className="h-4 w-4" />}
                      onClick={() => {
                        router.push("/dashboard/admin/reports");
                        setProfileOpen(false);
                      }} 
                    />
                    {mounted && (() => {
                      let nextTheme = resolvedTheme === "dark" ? "light" : "dark";
                      let label = resolvedTheme === "dark" ? "Light Mode" : "Dark Mode";
                      let icon = resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;

                      return (
                        <MenuItem 
                          label={label} 
                          icon={icon}
                          onClick={() => handleThemeChange(nextTheme)} 
                        />
                      );
                    })()}
                    <div className="h-px bg-linear-to-r from-transparent via-indigo-500/20 to-transparent" />
                    <MenuItem label="Logout" icon={<LogOut className="h-4 w-4" />} danger onClick={() => { setIsLogoutModalOpen(true); setProfileOpen(false); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

            <section className="max-w-7xl mx-auto px-4 py-6 space-y-6">
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
        {/* Overview */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 px-1">Overview</h2>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-none p-5">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-5">

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/admin/transactions")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="w-[52px] h-[52px] md:w-[48px] md:h-[48px] shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] transition-all duration-300 hover-shine overflow-hidden">
                  <span className="anim-wrapper anim-flip delay-4 inline-flex relative z-10"><WalletCards className="w-[22px] h-[22px] md:w-5 md:h-5 text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Total Revenue</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{`₹${stats?.totalRevenue?.toLocaleString() || 0}`}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Revenue</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/admin/users/buyers")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="w-[52px] h-[52px] md:w-[48px] md:h-[48px] shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] transition-all duration-300 hover-shine overflow-hidden">
                  <span className="anim-wrapper anim-float delay-5 inline-flex relative z-10"><Users className="w-[22px] h-[22px] md:w-5 md:h-5 text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Total Buyers</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{`${(stats?.totalBuyers || 0).toLocaleString()} Users`}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Buyers</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/admin/users/sellers")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="w-[52px] h-[52px] md:w-[48px] md:h-[48px] shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] transition-all duration-300 hover-shine overflow-hidden">
                  <span className="anim-wrapper anim-bounce delay-6 inline-flex relative z-10"><BriefcaseBusiness className="w-[22px] h-[22px] md:w-5 md:h-5 text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Total Sellers</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{`${(stats?.totalSellers || 0).toLocaleString()} Sellers`}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Sellers</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/admin/products-management")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="w-[52px] h-[52px] md:w-[48px] md:h-[48px] shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] transition-all duration-300 hover-shine overflow-hidden">
                  <span className="anim-wrapper anim-swing delay-7 inline-flex relative z-10"><FolderOpen className="w-[22px] h-[22px] md:w-5 md:h-5 text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Total Products</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{`${(stats?.totalProducts || 0).toLocaleString()} Items`}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Products</span>
              </motion.button>

            </div>
          </div>
        </motion.div>

        {/* Manage services */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 px-1 mt-6">Manage services</h2>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[28px] border border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-none p-6 py-8">
            <div className="grid grid-cols-4 gap-y-8 gap-x-2 md:grid-cols-2 lg:grid-cols-4 md:gap-3">

              {/* All Users */}
              <button onClick={() => router.push("/dashboard/admin/users")} className="flex flex-col items-center gap-2.5 group relative md:flex-row md:items-center md:gap-0 md:p-3 md:rounded-2xl md:bg-slate-50/70 md:dark:bg-slate-800/40 md:hover:bg-slate-100 md:dark:hover:bg-slate-800/80 md:border md:border-slate-200/60 md:dark:border-slate-700/50 md:transition-all md:duration-200 md:shadow-sm md:hover:shadow">
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[40px] md:h-[40px] md:shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] group-hover:scale-[1.08] md:group-hover:scale-100 transition-all duration-300 hover-shine overflow-hidden md:mr-3">
                  <span className="anim-wrapper anim-float delay-1 inline-flex relative z-10"><Users className="w-[22px] h-[22px] sm:w-6 sm:h-6 md:w-[18px] md:h-[18px] text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">All Users</span>
                <div className="hidden md:flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">All Users</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{(stats?.totalUsers || 0).toLocaleString()} total</span>
                </div>
              </button>

              {/* Pending Sellers */}
              <button onClick={() => router.push("/dashboard/admin/sellers")} className="flex flex-col items-center gap-2.5 group relative md:flex-row md:items-center md:gap-0 md:p-3 md:rounded-2xl md:bg-slate-50/70 md:dark:bg-slate-800/40 md:hover:bg-slate-100 md:dark:hover:bg-slate-800/80 md:border md:border-slate-200/60 md:dark:border-slate-700/50 md:transition-all md:duration-200 md:shadow-sm md:hover:shadow">
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[40px] md:h-[40px] md:shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] group-hover:scale-[1.08] md:group-hover:scale-100 transition-all duration-300 hover-shine overflow-hidden md:mr-3">
                  <span className="anim-wrapper anim-bounce delay-2 inline-flex relative z-10"><BriefcaseBusiness className="w-[22px] h-[22px] sm:w-6 sm:h-6 md:w-[18px] md:h-[18px] text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Pending<br/>Sellers</span>
                <div className="hidden md:flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">Pending Sellers</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{(stats?.pendingSellers?.length || 0).toLocaleString()} pending</span>
                </div>
              </button>

              {/* Pending Products */}
              <button onClick={() => router.push("/dashboard/admin/products")} className="flex flex-col items-center gap-2.5 group relative md:flex-row md:items-center md:gap-0 md:p-3 md:rounded-2xl md:bg-slate-50/70 md:dark:bg-slate-800/40 md:hover:bg-slate-100 md:dark:hover:bg-slate-800/80 md:border md:border-slate-200/60 md:dark:border-slate-700/50 md:transition-all md:duration-200 md:shadow-sm md:hover:shadow">
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[40px] md:h-[40px] md:shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] group-hover:scale-[1.08] md:group-hover:scale-100 transition-all duration-300 hover-shine overflow-hidden md:mr-3">
                  <span className="anim-wrapper anim-pulse delay-3 inline-flex relative z-10"><FolderOpen className="w-[22px] h-[22px] sm:w-6 sm:h-6 md:w-[18px] md:h-[18px] text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Pending<br/>Products</span>
                <div className="hidden md:flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">Pending Products</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting review</span>
                </div>
              </button>

              {/* Open Disputes */}
              <button onClick={() => router.push("/dashboard/admin/disputes")} className="flex flex-col items-center gap-2.5 group relative md:flex-row md:items-center md:gap-0 md:p-3 md:rounded-2xl md:bg-slate-50/70 md:dark:bg-slate-800/40 md:hover:bg-slate-100 md:dark:hover:bg-slate-800/80 md:border md:border-slate-200/60 md:dark:border-slate-700/50 md:transition-all md:duration-200 md:shadow-sm md:hover:shadow">
                <div className="absolute -top-1 right-1 sm:right-3 md:hidden bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md z-20">2</div>
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[40px] md:h-[40px] md:shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] group-hover:scale-[1.08] md:group-hover:scale-100 transition-all duration-300 hover-shine overflow-hidden md:mr-3">
                  <span className="anim-wrapper anim-wiggle delay-4 inline-flex relative z-10"><TriangleAlert className="w-[22px] h-[22px] sm:w-6 sm:h-6 md:w-[18px] md:h-[18px] text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Open<br/>Disputes</span>
                <div className="hidden md:flex flex-col items-start text-left flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Open Disputes</span>
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none">2</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Needs attention</span>
                </div>
              </button>

              {/* Pending Payouts */}
              <button onClick={() => router.push("/dashboard/admin/payouts")} className="flex flex-col items-center gap-2.5 group relative md:flex-row md:items-center md:gap-0 md:p-3 md:rounded-2xl md:bg-slate-50/70 md:dark:bg-slate-800/40 md:hover:bg-slate-100 md:dark:hover:bg-slate-800/80 md:border md:border-slate-200/60 md:dark:border-slate-700/50 md:transition-all md:duration-200 md:shadow-sm md:hover:shadow">
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[40px] md:h-[40px] md:shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] group-hover:scale-[1.08] md:group-hover:scale-100 transition-all duration-300 hover-shine overflow-hidden md:mr-3">
                  <span className="anim-wrapper anim-swing delay-5 inline-flex relative z-10"><Wallet className="w-[22px] h-[22px] sm:w-6 sm:h-6 md:w-[18px] md:h-[18px] text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Pending<br/>Payouts</span>
                <div className="hidden md:flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">Pending Payouts</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Review & approve</span>
                </div>
              </button>

              {/* Bank Accounts */}
              <button onClick={() => router.push("/dashboard/admin/bank-account")} className="flex flex-col items-center gap-2.5 group relative md:flex-row md:items-center md:gap-0 md:p-3 md:rounded-2xl md:bg-slate-50/70 md:dark:bg-slate-800/40 md:hover:bg-slate-100 md:dark:hover:bg-slate-800/80 md:border md:border-slate-200/60 md:dark:border-slate-700/50 md:transition-all md:duration-200 md:shadow-sm md:hover:shadow">
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[40px] md:h-[40px] md:shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] group-hover:scale-[1.08] md:group-hover:scale-100 transition-all duration-300 hover-shine overflow-hidden md:mr-3">
                  <span className="anim-wrapper anim-flip delay-6 inline-flex relative z-10"><University className="w-[22px] h-[22px] sm:w-6 sm:h-6 md:w-[18px] md:h-[18px] text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Bank<br/>Accounts</span>
                <div className="hidden md:flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">Bank Accounts</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Seller banking info</span>
                </div>
              </button>

              {/* Trust & Security */}
              <button onClick={() => router.push("/dashboard/admin/security")} className="flex flex-col items-center gap-2.5 group relative md:flex-row md:items-center md:gap-0 md:p-3 md:rounded-2xl md:bg-slate-50/70 md:dark:bg-slate-800/40 md:hover:bg-slate-100 md:dark:hover:bg-slate-800/80 md:border md:border-slate-200/60 md:dark:border-slate-700/50 md:transition-all md:duration-200 md:shadow-sm md:hover:shadow">
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[40px] md:h-[40px] md:shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] group-hover:scale-[1.08] md:group-hover:scale-100 transition-all duration-300 hover-shine overflow-hidden md:mr-3">
                  <span className="anim-wrapper anim-float delay-7 inline-flex relative z-10"><Shield className="w-[22px] h-[22px] sm:w-6 sm:h-6 md:w-[18px] md:h-[18px] text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Trust &<br/>Security</span>
                <div className="hidden md:flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">Trust & Security</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Platform integrity</span>
                </div>
              </button>

              {/* Promotions */}
              <button onClick={() => router.push("/dashboard/admin/promotions")} className="flex flex-col items-center gap-2.5 group relative md:flex-row md:items-center md:gap-0 md:p-3 md:rounded-2xl md:bg-slate-50/70 md:dark:bg-slate-800/40 md:hover:bg-slate-100 md:dark:hover:bg-slate-800/80 md:border md:border-slate-200/60 md:dark:border-slate-700/50 md:transition-all md:duration-200 md:shadow-sm md:hover:shadow">
                <div className="absolute -top-1 right-1 sm:right-3 md:hidden bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md z-20">New</div>
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[40px] md:h-[40px] md:shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] group-hover:scale-[1.08] md:group-hover:scale-100 transition-all duration-300 hover-shine overflow-hidden md:mr-3">
                  <span className="anim-wrapper anim-pulse delay-8 inline-flex relative z-10"><Megaphone className="w-[22px] h-[22px] sm:w-6 sm:h-6 md:w-[18px] md:h-[18px] text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Promotions</span>
                <div className="hidden md:flex flex-col items-start text-left flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Promotions</span>
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none">New</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ad campaigns</span>
                </div>
              </button>

            </div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <div>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-none p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-500" />
                Recent Transactions
              </h2>
              <button 
                onClick={() => router.push("/dashboard/admin/transactions")}
                className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 flex items-center hover:underline"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-1">
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.slice(0, 3).map((t: any, index: number) => {
                  const formattedDate = new Date(t.date).toLocaleString();

                  return (
                    <div key={t.id} className="flex flex-col">
                      <div 
                        onClick={() => {}}
                        className="flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-12 h-12 shrink-0 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                            {t.user.substring(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {t.user} — {t.productName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {formattedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            {t.amount.toString().includes("₹") ? t.amount.replace('.', '.') : `₹${Number(t.amount).toLocaleString("en-IN")}`}
                          </p>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors hidden sm:block" />
                        </div>
                      </div>
                      {index < Math.min(stats.recentTransactions.length, 3) - 1 && (
                        <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-1"></div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">No recent transactions</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Transactions will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System & Support */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 px-1 mt-6">System & Support</h2>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-none p-5 mb-6">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-5">

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/admin/careers")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="w-[52px] h-[52px] md:w-[48px] md:h-[48px] shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] transition-all duration-300 hover-shine overflow-hidden">
                  <span className="anim-wrapper anim-float delay-1 inline-flex relative z-10"><BriefcaseBusiness className="w-[22px] h-[22px] md:w-5 md:h-5 text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Career Management</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Manage jobs</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Careers</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/admin/help-center")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="w-[52px] h-[52px] md:w-[48px] md:h-[48px] shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] transition-all duration-300 hover-shine overflow-hidden">
                  <span className="anim-wrapper anim-bounce delay-2 inline-flex relative z-10"><CircleHelp className="w-[22px] h-[22px] md:w-5 md:h-5 text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Help Center</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Support & FAQs</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Help</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/admin/reports")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="w-[52px] h-[52px] md:w-[48px] md:h-[48px] shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] transition-all duration-300 hover-shine overflow-hidden">
                  <span className="anim-wrapper anim-pulse delay-3 inline-flex relative z-10"><ClipboardList className="w-[22px] h-[22px] md:w-5 md:h-5 text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Report Management</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">System reports</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Reports</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/admin/settings")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="w-[52px] h-[52px] md:w-[48px] md:h-[48px] shrink-0 rounded-full flex items-center justify-center bg-[#f0f4fa] dark:bg-[#1e2338] group-hover:bg-[#e4ebf5] dark:group-hover:bg-[#252a42] transition-all duration-300 hover-shine overflow-hidden">
                  <span className="anim-wrapper anim-spin delay-4 inline-flex relative z-10"><Settings className="w-[22px] h-[22px] md:w-5 md:h-5 text-slate-900 dark:text-white transition-colors" strokeWidth={1.7} /></span>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Settings</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">System preferences</span>
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
                Platform Revenue
              </h3>
              <AreaMetricChart data={stats.platformAnalytics} dataKey="revenue" emptyText="No revenue data" />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-none p-5 sm:p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-emerald-500" />
                User Growth ({`${stats?.userGrowth >= 0 ? "+" : ""}${stats?.userGrowth}%`})
              </h3>
              <BarMetricChart data={stats.platformAnalytics} dataKey="users" emptyText="No user data" />
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

function AdminDashboardSkeleton() {
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
