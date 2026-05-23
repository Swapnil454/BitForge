"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "next-themes";
import {
  BarChart3,
  CircleHelp,
  ClipboardList,
  Heart,
  LogOut,
  Flag,
  FileText,
  Package,
  Scale,
  Settings,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Moon,
  Sun,
  Monitor,
  UserRound,
  Search,
  Home,
  MessageSquare,
  Ticket,
  ChevronRight,
  ChevronLeft,
  Download,
  Bell,
  ChevronDown,
  Files,
  ShoppingBag,
  ShieldAlert,
  Bookmark,
  CreditCard,
  FolderOpen,
  CloudDownload,
  Receipt,
  WalletCards,
  ClipboardCheck
} from "lucide-react";
import { clearAuthStorage, getStoredUser, setCookie, getCookie } from "@/lib/cookies";
import { notificationAPI, userAPI } from "@/lib/api";
import { useBuyerDashboard, useInvalidateBuyerCache, buyerQueryKeys } from "@/lib/hooks/useBuyerDashboard";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import MobileBottomNav from "@/app/components/buyer/layout/MobileBottomNav";
import SearchDropdown from "@/app/components/buyer/search/SearchDropdown";
import MobileSearchPage from "@/app/components/buyer/search/MobileSearchPage";

import PurchasesModal from "./components/PurchasesModal";
import { MenuItem } from "../components/Cards";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import BitForgeBrand from "../components/logo/BitForgeBrand";
import LogoutModal from "../components/LogoutModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: "buyer";
  isVerified: boolean;
}

/* ================= PAGE ================= */

export default function BuyerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
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

  const router = useRouter();
  
  // React Query hook for dashboard data with caching
  const {
    stats,
    spending: spendingData,
    notifications,
    unreadCount,
    cartCount,
    chatUnread: chatUnreadCount,
    isInitialLoading,
    isFetching,
    queries,
  } = useBuyerDashboard();
  
  const cacheInvalidator = useInvalidateBuyerCache();
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored) {
      router.push("/login");
      return;
    }

    if (stored.role !== "buyer") {
      router.push("/dashboard");
      return;
    }

    setUser(stored);

    const outside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node))
        setDesktopDropdownOpen(false);
    };

    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const syncProfile = async () => {
      try {
        const fresh = await userAPI.getCurrentUser();
        if (!fresh) {
          clearAuthStorage();
          toast.error("Your account has been deleted by an administrator");
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
        if (err instanceof Error && err.message.includes("401")) {
          clearAuthStorage();
          toast.error("Your account has been deleted by an administrator");
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
          toast.error("Your account has been deleted by an administrator");
          router.push("/register");
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("401")) {
          clearAuthStorage();
          toast.error("Your account has been deleted by an administrator");
          router.push("/register");
        }
      }
    }, 5000);

    return () => clearInterval(deleteCheckInterval);
  }, [user?.id, router]);

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
        cacheInvalidator.invalidateChatUnread();
      }
    });

    socket.on("notification:new", () => {
      cacheInvalidator.invalidateNotifications();
    });

    socket.on("connect_error", (err: any) => {
      console.error("Socket connect error (buyer dashboard)", err?.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      await queries.notifications.refetch();
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    try {
      queryClient.setQueryData(
        [...buyerQueryKeys.notifications(), 5],
        (oldData: any) => {
          if (!oldData) return oldData;
          const notification = oldData.notifications.find((n: any) => n._id === notifId);
          const shouldDecrement = notification && !notification.isRead;
          return {
            ...oldData,
            notifications: oldData.notifications.map((n: any) =>
              n._id === notifId ? { ...n, isRead: true } : n
            ),
            unreadCount: shouldDecrement 
              ? Math.max(0, (oldData.unreadCount || 0) - 1) 
              : oldData.unreadCount,
          };
        }
      );
      await notificationAPI.markAsRead(notifId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      cacheInvalidator.invalidateNotifications();
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("wishlist");
    if (saved) {
      try {
        const wishlist = JSON.parse(saved);
        setWishlistCount(wishlist.length);
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
  }, []);

  const logout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  const commitSearch = (term?: string) => {
    const q = (term ?? searchTerm).trim();
    if (term) setSearchTerm(term);
    setDesktopDropdownOpen(false);
    if (q) {
      router.push(`/marketplace?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/marketplace");
    }
  };

  if (!user) return null;

  if (isInitialLoading) {
    return <BuyerDashboardSkeleton />;
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-28 md:pb-8 transition-colors duration-300">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto h-16 px-4 flex items-center justify-between gap-4">
          {/* Logo and Back */}
          <div className="shrink-0 flex items-center gap-0 sm:gap-1">
            <button
              onClick={() => router.push('/marketplace')}
              className="flex h-10 w-10 z-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all shadow-sm"
              aria-label="Back to Marketplace"
              title="Back to Marketplace"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="-ml-2 sm:-ml-4">
              <BitForgeBrand role="Buyer" />
            </div>
          </div>

          {/* Middle: Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto items-center relative" ref={desktopSearchRef}>
            <div className="flex w-full relative group shadow-sm rounded-2xl transition-all duration-200 hover:shadow-md hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10 bg-gray-50 dark:bg-[#0d1320] border border-slate-300 dark:border-white/20 focus-within:border-violet-500 dark:focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/20">
              <div className="hidden lg:flex items-center relative border-r border-gray-200 dark:border-white/10">
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "all") router.push("/marketplace");
                    else router.push(`/marketplace?category=${encodeURIComponent(val)}`);
                  }}
                  className="h-full px-5 py-2.5 bg-transparent text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-pointer appearance-none outline-none focus:ring-0 pr-9 rounded-l-2xl"
                >
                  <option value="all">All</option>
                  <option value="Course">Courses</option>
                  <option value="eBook">eBooks</option>
                  <option value="Template">Templates</option>
                  <option value="Software">Software</option>
                  <option value="Design Asset">Design Assets</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-slate-500">
                  <ChevronDown size={14} />
                </div>
              </div>

              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDesktopDropdownOpen(true);
                }}
                onFocus={() => setDesktopDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitSearch();
                  if (e.key === "Escape") setDesktopDropdownOpen(false);
                }}
                className="w-full px-5 py-2.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none z-10 transition-colors rounded-2xl md:rounded-l-2xl lg:rounded-none font-medium"
              />
              <button
                onClick={() => commitSearch()}
                className="px-7 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-r-2xl font-bold transition-all flex items-center justify-center shrink-0 border border-transparent shadow-sm"
              >
                <Search size={18} />
              </button>
            </div>

            {/* Desktop dropdown */}
            {desktopDropdownOpen && (
              <SearchDropdown
                query={searchTerm}
                isAuthenticated={true}
                onSelect={commitSearch}
                onClose={() => setDesktopDropdownOpen(false)}
              />
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Cart Icon */}
            <button
              onClick={() => router.push('/cart')}
              className="relative h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              title="View cart"
            >
              <ShoppingCart className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md shadow-blue-500/30">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            <NotificationDropdown
              role="buyer"
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loadingNotifs}
              fetchNotifications={fetchNotifications}
              markAsRead={handleMarkAsRead}
            />

            {/* Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen(v => !v);
                  setNotifOpen(false);
                }}
                className={`relative h-10 w-10 flex flex-col items-center justify-center gap-[4px] rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm ${profileOpen ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
                title="Menu"
              >
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
                )}
                <span className={`w-4 h-[2px] rounded-full bg-slate-700 dark:bg-slate-300 transition-all origin-center ${profileOpen ? 'rotate-45 translate-y-[6px]' : ''}`}></span>
                <span className={`w-4 h-[2px] rounded-full bg-slate-700 dark:bg-slate-300 transition-all ${profileOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-4 h-[2px] rounded-full bg-slate-700 dark:bg-slate-300 transition-all origin-center ${profileOpen ? '-rotate-45 -translate-y-[6px]' : ''}`}></span>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</p>
                    </div>
                    <MenuItem 
                      label="Profile" 
                      icon={<UserRound className="h-4 w-4" />}
                      onClick={() => { router.push("/dashboard/settings?tab=profile"); setProfileOpen(false); }} 
                    />
                    <MenuItem 
                      label="Wishlist" 
                      icon={<Heart className="h-4 w-4" />}
                      badge={wishlistCount > 0 ? wishlistCount : undefined}
                      onClick={() => { 
                        router.push("/wishlist"); 
                        setProfileOpen(false); 
                      }} 
                    />
                    <MenuItem 
                      label="Settings" 
                      icon={<Settings className="h-4 w-4" />}
                      onClick={() => { router.push("/dashboard/settings"); setProfileOpen(false); }} 
                    />
                    <MenuItem 
                      label="Help Center" 
                      icon={<CircleHelp className="h-4 w-4" />}
                      badge={chatUnreadCount > 0 ? chatUnreadCount : undefined}
                      onClick={() => { router.push("/dashboard/buyer/help-center"); setProfileOpen(false); }} 
                    />
                    <MenuItem 
                      label="Submit Report" 
                      icon={<Flag className="h-4 w-4" />}
                      onClick={() => { router.push("/report"); setProfileOpen(false); }} 
                    />
                    <MenuItem 
                      label="My Reports" 
                      icon={<FileText className="h-4 w-4" />}
                      onClick={() => { router.push("/dashboard/buyer/reports"); setProfileOpen(false); }} 
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
                    <div className="h-px bg-slate-100 dark:bg-slate-800" />
                    <MenuItem label="Logout" icon={<LogOut className="h-4 w-4" />} danger onClick={() => { setIsLogoutModalOpen(true); setProfileOpen(false); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
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

              {/* Purchases */}
              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => router.push("/dashboard/buyer/purchases")} className="flex flex-col items-center gap-2 group md:flex-row md:items-center md:justify-between md:gap-3 md:p-4 md:rounded-2xl bg-transparent md:bg-blue-600/10 dark:md:bg-blue-900/40 md:border md:border-blue-200/60 dark:md:border-blue-700/30 md:hover:bg-blue-600/15 dark:md:hover:bg-blue-900/60 transition-all w-full">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="rb-parent w-[56px] h-[56px] md:w-[50px] md:h-[50px] shrink-0">
                    <span className="rb-ring rb-cw rb-blue"></span>
                    <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/60 border border-blue-200/50 dark:border-blue-700/40 shadow-sm transition-all">
                      <span className="anim-wrapper anim-float inline-flex"><FolderOpen className="w-6 h-6 text-blue-700 dark:text-blue-300" strokeWidth={1.5} /></span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">My Purchases</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">View order history</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Purchases</span>
                <ChevronRight className="hidden md:block w-4 h-4 text-blue-400 dark:text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              {/* Cart */}
              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => router.push("/cart")} className="flex flex-col items-center gap-2 group md:flex-row md:items-center md:justify-between md:gap-3 md:p-4 md:rounded-2xl bg-transparent md:bg-emerald-600/10 dark:md:bg-emerald-900/40 md:border md:border-emerald-200/60 dark:md:border-emerald-700/30 md:hover:bg-emerald-600/15 dark:md:hover:bg-emerald-900/60 transition-all w-full">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="rb-parent w-[56px] h-[56px] md:w-[50px] md:h-[50px] shrink-0">
                    <span className="rb-ring rb-ccw rb-green rb-d1"></span>
                    <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200/50 dark:border-emerald-700/40 shadow-sm transition-all">
                      <span className="anim-wrapper anim-wiggle delay-1 inline-flex"><ShoppingCart className="w-6 h-6 text-emerald-700 dark:text-emerald-300" strokeWidth={1.5} /></span>
                    </div>
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 z-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 font-bold shadow-sm ring-2 ring-white dark:ring-slate-900">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Shopping Cart</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} waiting` : 'Pending checkout'}</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Cart</span>
                <ChevronRight className="hidden md:block w-4 h-4 text-emerald-400 dark:text-emerald-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              {/* Disputes */}
              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => router.push("/dashboard/buyer/disputes")} className="flex flex-col items-center gap-2 group md:flex-row md:items-center md:justify-between md:gap-3 md:p-4 md:rounded-2xl bg-transparent md:bg-rose-600/10 dark:md:bg-rose-900/40 md:border md:border-rose-200/60 dark:md:border-rose-700/30 md:hover:bg-rose-600/15 dark:md:hover:bg-rose-900/60 transition-all w-full">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="rb-parent w-[56px] h-[56px] md:w-[50px] md:h-[50px] shrink-0">
                    <span className="rb-ring rb-cw rb-rose rb-d2"></span>
                    <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-rose-100 dark:bg-rose-900/60 border border-rose-200/50 dark:border-rose-700/40 shadow-sm transition-all">
                      <span className="anim-wrapper anim-pulse delay-2 inline-flex"><ShieldAlert className="w-6 h-6 text-rose-700 dark:text-rose-300" strokeWidth={1.5} /></span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">My Disputes</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Track dispute status</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Disputes</span>
                <ChevronRight className="hidden md:block w-4 h-4 text-rose-400 dark:text-rose-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              {/* Wishlist */}
              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => router.push("/wishlist")} className="flex flex-col items-center gap-2 group md:flex-row md:items-center md:justify-between md:gap-3 md:p-4 md:rounded-2xl bg-transparent md:bg-violet-600/10 dark:md:bg-violet-900/40 md:border md:border-violet-200/60 dark:md:border-violet-700/30 md:hover:bg-violet-600/15 dark:md:hover:bg-violet-900/60 transition-all w-full">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="rb-parent w-[56px] h-[56px] md:w-[50px] md:h-[50px] shrink-0">
                    <span className="rb-ring rb-ccw rb-violet rb-d3"></span>
                    <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-violet-100 dark:bg-violet-900/60 border border-violet-200/50 dark:border-violet-700/40 shadow-sm transition-all">
                      <span className="anim-wrapper anim-bounce delay-3 inline-flex"><Heart className="w-6 h-6 text-violet-700 dark:text-violet-300" strokeWidth={1.5} /></span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Wishlist</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Saved products</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Wishlist</span>
                <ChevronRight className="hidden md:block w-4 h-4 text-violet-400 dark:text-violet-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

            </div>
          </div>
        </motion.div>

        {/* Overview */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 px-1">Overview</h2>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-none p-5">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-5">

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/buyer/transactions")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="rb-parent w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                  <span className="rb-ring rb-ccw rb-s1 rb-d4"></span>
                  <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                    <span className="anim-wrapper anim-flip delay-4 inline-flex"><WalletCards className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Total Spent</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Lifetime value</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Total Spent</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/buyer/purchases")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="rb-parent w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                  <span className="rb-ring rb-cw rb-s2 rb-d5"></span>
                  <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                    <span className="anim-wrapper anim-float delay-5 inline-flex"><FolderOpen className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Purchases</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Track your items</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Purchases</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/buyer/downloads")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="rb-parent w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                  <span className="rb-ring rb-ccw rb-s3 rb-d6"></span>
                  <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                    <span className="anim-wrapper anim-bounce delay-6 inline-flex"><CloudDownload className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Downloads</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Digital assets</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Downloads</span>
              </motion.button>

              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/dashboard/buyer/orders")} className="flex flex-col items-center gap-2 group md:flex-row md:justify-start md:p-3 bg-transparent md:bg-slate-50/50 md:dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 transition-all w-full">
                <div className="rb-parent w-[56px] h-[56px] md:w-[48px] md:h-[48px] shrink-0">
                  <span className="rb-ring rb-cw rb-s4 rb-d7"></span>
                  <div className="relative z-[1] w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-[1.05] group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300">
                    <span className="anim-wrapper anim-swing delay-7 inline-flex"><ClipboardCheck className="w-6 h-6 md:w-5 md:h-5 text-slate-900 dark:text-white" strokeWidth={1.5} /></span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left ml-3">
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Orders</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Order history</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight md:hidden">Orders</span>
              </motion.button>

            </div>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <div>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-none p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-500" />
                Recent Orders
              </h2>
              <button 
                onClick={() => router.push("/dashboard/buyer/orders")}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center hover:underline"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-1">
              {stats && stats.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.slice(0, 3).map((o, index) => {
                  const orderDate = o.date || o.createdAt || o.requestedAt;
                  const formattedDate = orderDate
                    ? new Date(orderDate).toLocaleString()
                    : "Date unavailable";

                  return (
                    <div key={o.id} className="flex flex-col">
                      <div 
                        onClick={() => router.push("/dashboard/buyer/purchases")}
                        className="flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                            {o.product.substring(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {o.product}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {formattedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            {o.amount.toString().includes("₹") ? o.amount.replace('.', ',') : `₹${Number(o.amount).toLocaleString("en-IN")}`}
                          </p>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors hidden sm:block" />
                        </div>
                      </div>
                      {index < Math.min(stats.recentOrders.length, 3) - 1 && (
                        <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-1"></div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">No recent orders yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Explore digital products and start learning today.</p>
                  <button 
                    onClick={() => router.push("/marketplace")}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    Browse Marketplace
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-1">Analytics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-none p-5 sm:p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Purchases Per Month
              </h3>
              <ChartBar data={spendingData} keyName="amount" />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-none p-5 sm:p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Wallet className="w-5 h-5 text-emerald-500" />
                Spending Over Time
              </h3>
              <ChartArea data={spendingData} keyName="amount" />
            </div>

          </div>
        </div>

        {/* Support & Settings */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.32 }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 px-1">Support & Settings</h2>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-none p-5">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-5">

              <motion.button whileHover={{ y: -6, scale: 1.03 }} whileTap={{ scale: 0.92, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} onClick={() => router.push("/dashboard/buyer/help-center")} className="flex flex-col items-center gap-3 group md:flex-row md:justify-start md:p-4 md:bg-slate-50 md:dark:bg-slate-800/40 md:hover:bg-white md:dark:hover:bg-slate-800 md:rounded-[20px] md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 md:shadow-none md:hover:shadow-lg transition-all w-full">
                <div className="anim-wrapper anim-spin delay-8 hover-shine w-[64px] h-[64px] rounded-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-500/20 dark:to-blue-500/5 hover:from-blue-100 hover:to-blue-200/80 shadow-[inset_0_2px_8px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_8px_rgba(255,255,255,0.05)] ring-1 ring-blue-100/50 dark:ring-blue-500/20 transition-all duration-300 md:w-[56px] md:h-[56px] shrink-0">
                  <CircleHelp className="w-7 h-7 md:w-6 md:h-6 text-blue-600 dark:text-blue-300 drop-shadow-md" strokeWidth={1.75} />
                </div>
                
                <div className="hidden md:flex flex-col items-start text-left ml-2">
                  <span className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Support</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Get Help</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 md:hidden">
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">Support</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center">Get Help</span>
                </div>
              </motion.button>

              <motion.button whileHover={{ y: -6, scale: 1.03 }} whileTap={{ scale: 0.92, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} onClick={() => router.push("/dashboard/buyer/reports")} className="flex flex-col items-center gap-3 group md:flex-row md:justify-start md:p-4 md:bg-slate-50 md:dark:bg-slate-800/40 md:hover:bg-white md:dark:hover:bg-slate-800 md:rounded-[20px] md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 md:shadow-none md:hover:shadow-lg transition-all w-full">
                <div className="anim-wrapper anim-wiggle delay-2 hover-shine w-[64px] h-[64px] rounded-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100/60 dark:from-orange-500/20 dark:to-orange-500/5 hover:from-orange-100 hover:to-orange-200/80 shadow-[inset_0_2px_8px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_8px_rgba(255,255,255,0.05)] ring-1 ring-orange-100/50 dark:ring-orange-500/20 transition-all duration-300 md:w-[56px] md:h-[56px] shrink-0">
                  <Ticket className="w-7 h-7 md:w-6 md:h-6 text-orange-600 dark:text-orange-300 drop-shadow-md" strokeWidth={1.75} />
                </div>
                
                <div className="hidden md:flex flex-col items-start text-left ml-2">
                  <span className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-tight">My Tickets</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Track Status</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 md:hidden">
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">My Tickets</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center">Track Status</span>
                </div>
              </motion.button>

              <motion.button whileHover={{ y: -6, scale: 1.03 }} whileTap={{ scale: 0.92, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} onClick={() => router.push("/dashboard/buyer/help-center?tab=messages")} className="flex flex-col items-center gap-3 group md:flex-row md:justify-start md:p-4 md:bg-slate-50 md:dark:bg-slate-800/40 md:hover:bg-white md:dark:hover:bg-slate-800 md:rounded-[20px] md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 md:shadow-none md:hover:shadow-lg transition-all w-full">
                <div className="anim-wrapper anim-pulse delay-4 hover-shine w-[64px] h-[64px] rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-500/20 dark:to-indigo-500/5 hover:from-indigo-100 hover:to-indigo-200/80 shadow-[inset_0_2px_8px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_8px_rgba(255,255,255,0.05)] ring-1 ring-indigo-100/50 dark:ring-indigo-500/20 transition-all duration-300 md:w-[56px] md:h-[56px] shrink-0">
                  <MessageSquare className="w-7 h-7 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-300 drop-shadow-md" strokeWidth={1.75} />
                </div>
                
                <div className="hidden md:flex flex-col items-start text-left ml-2">
                  <span className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Messages</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">View All</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 md:hidden">
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">Messages</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center">View All</span>
                </div>
              </motion.button>

              <motion.button whileHover={{ y: -6, scale: 1.03 }} whileTap={{ scale: 0.92, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} onClick={() => router.push("/dashboard/settings")} className="flex flex-col items-center gap-3 group md:flex-row md:justify-start md:p-4 md:bg-slate-50 md:dark:bg-slate-800/40 md:hover:bg-white md:dark:hover:bg-slate-800 md:rounded-[20px] md:border md:border-transparent md:hover:border-slate-200 md:dark:hover:border-slate-700 md:shadow-none md:hover:shadow-lg transition-all w-full">
                <div className="anim-wrapper anim-spin delay-6 hover-shine w-[64px] h-[64px] rounded-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-700/50 dark:to-slate-800/50 hover:from-slate-200 hover:to-slate-300/80 shadow-[inset_0_2px_8px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_8px_rgba(255,255,255,0.05)] ring-1 ring-slate-200/50 dark:ring-slate-600/50 transition-all duration-300 md:w-[56px] md:h-[56px] shrink-0">
                  <Settings className="w-7 h-7 md:w-6 md:h-6 text-slate-600 dark:text-slate-300 drop-shadow-md" strokeWidth={1.75} />
                </div>
                
                <div className="hidden md:flex flex-col items-start text-left ml-2">
                  <span className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Settings</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Manage</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 md:hidden">
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">Settings</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center">Manage</span>
                </div>
              </motion.button>

            </div>
          </div>
        </motion.div>

      </section>

      {/* ================= BOTTOM NAVIGATION (MOBILE) ================= */}
      <MobileBottomNav />

      {/* Purchases Modal */}
      <AnimatePresence>
        {showPurchasesModal && (
          <PurchasesModal onClose={() => setShowPurchasesModal(false)} />
        )}
      </AnimatePresence>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={logout} 
      />
      
      {/* Mobile Search Page */}
      {mobileSearchOpen && mounted && (
        <div className="fixed inset-0 z-50">
          <MobileSearchPage
            isAuthenticated={true}
            onSearch={(term) => commitSearch(term)}
            onClose={() => setMobileSearchOpen(false)}
          />
        </div>
      )}

    </main>
  );
}

function BuyerDashboardSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-28 md:pb-8">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />

        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse mb-3" />
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse mb-2" />
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 h-64 animate-pulse" />
      </section>
    </main>
  );
}

function ChartArea({ data, keyName }: any) {
  const hasData = data && data.length > 0 && data.some((d: any) => d[keyName] > 0);
  
  if (!hasData) {
    return (
      <div style={{ height: "220px" }} className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3">
          <Wallet className="h-6 w-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-white mb-1">Not enough data yet</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Your spending analytics will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ height: "220px", width: "100%", outline: "none" }} className="recharts-container">
      <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} style={{ outline: 'none' }}>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} 
            dy={10} 
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '12px',
              color: 'white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              outline: 'none'
            }}
            itemStyle={{ color: '#10b981', fontWeight: 600, textTransform: 'capitalize' }}
            cursor={false}
            formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, keyName]}
            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
          />
          <Area 
            dataKey={keyName} 
            type="monotone"
            stroke="#10b981" 
            fill="url(#colorSpent)" 
            strokeWidth={3}
            activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
          />
          <defs>
            <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartBar({ data, keyName }: any) {
  const hasData = data && data.length > 0 && data.some((d: any) => d[keyName] > 0);
  
  if (!hasData) {
    return (
      <div style={{ height: "220px" }} className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3">
          <BarChart3 className="h-6 w-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-white mb-1">Not enough data yet</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Your purchase analytics will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ height: "220px", width: "100%", outline: "none" }} className="recharts-container">
      <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} style={{ outline: 'none' }}>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} 
            dy={10} 
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '12px',
              color: 'white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              outline: 'none'
            }}
            itemStyle={{ color: '#818cf8', fontWeight: 600, textTransform: 'capitalize' }}
            cursor={false}
            formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, keyName]}
            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
          />
          <Bar 
            dataKey={keyName} 
            fill="url(#colorPurchases)" 
            radius={[4, 4, 0, 0]}
            barSize={16}
            style={{ outline: 'none' }}
          />
          <defs>
            <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
