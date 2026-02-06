
"use client";

import { useEffect, useState, useRef  } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { clearAuthStorage, getStoredUser, setCookie, getCookie } from "@/lib/cookies";
import { sellerAPI, notificationAPI, userAPI, chatAPI } from "@/lib/api";
import toast from "react-hot-toast";

import SettingsModal from "../components/SettingModal";
import { KPI, Glass, MenuItem, ChartArea, ChartBar} from "../components/Cards";
import ProfileModal from "../components/ProfileModal";
import RecentSalesModal from "./components/RecentSalesModel";
import DashboardActionCard from "../components/DashboardActionCard";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import { BarMetricChart } from "../components/charts/BarMetricChart";
import { AreaMetricChart } from "../components/charts/AreaMetricChart";
import BitForgeBrand from "../components/logo/BitForgeBrand";
/* ================= TYPES ================= */

interface User {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  isVerified: boolean;
  approvalStatus?: string;
  isApproved?: boolean;
}

interface DashboardStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  totalSales: number;
  revenueGrowth: number;
  conversion: number | null;
}

interface MonthlyPoint {
  month: string;
  revenue: number;
  sales: number;
}

interface RecentSale {
  id: string;
  productName: string;
  amount: number;
  createdAt: string;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  icon: string;
  isRead: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecentSalesModal, setShowRecentSalesModal] = useState(false);
  const router = useRouter();

  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);


  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored) {
      router.push("/login");
      return;
    }

    // Check if seller is approved
    if (stored.role === "seller") {
      const isApproved = stored.approvalStatus === "approved" || stored.isApproved;
      if (!isApproved) {
        router.push("/pending-approval");
        return;
      }
    }

    setUser(stored);

    // Sync profile on mount
    const syncProfile = async () => {
      try {
        const fresh = await userAPI.getCurrentUser();
        
        // Check if user account was deleted
        if (!fresh) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
          return;
        }
        
        // Check approval status from fresh data
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
        // If error getting user (likely deleted), redirect to register
        if (err instanceof Error && err.message.includes("401")) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
        }
      }
    };
    syncProfile();
    // preload notifications & chat unread so badges are accurate
    fetchNotifications();
    fetchChatUnread();

    const closeOnOutside = (e: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
        setMenuOpen(false);
      }
    };

    // Periodic check to see if account was deleted
    const deleteCheckInterval = setInterval(async () => {
      try {
        const fresh = await userAPI.getCurrentUser();
        if (!fresh) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
        }
      } catch (err) {
        // If error getting user (likely deleted/unauthorized), redirect
        if (err instanceof Error && err.message.includes("401")) {
          clearAuthStorage();
          toast.error("Your account has been deleted");
          router.push("/register");
        }
      }
    }, 5000); // Check every 5 seconds

    document.addEventListener("mousedown", closeOnOutside);
    window.addEventListener("keydown", esc);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      window.removeEventListener("keydown", esc);
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
        setChatUnreadCount((prev) => prev + 1);
      }
    });

    socket.on("connect_error", (err: any) => {
      console.error("Socket connect error (seller dashboard)", err?.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await sellerAPI.getDashboardStats();
        setStats({
          totalRevenue: data.totalRevenue,
          thisMonthRevenue: data.thisMonthRevenue,
          totalSales: data.totalSales,
          revenueGrowth: data.revenueGrowth,
          conversion: data.conversion,
        });
        setMonthly(data.monthly || []);
        setRecentSales(data.recentSales || []);
      } catch (error) {
        console.error("Failed to load seller stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const response = await notificationAPI.getNotifications(5, 0);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const fetchChatUnread = async () => {
    try {
      const data = await chatAPI.getUnreadCount();
      setChatUnreadCount(data.count || 0);
    } catch (error) {
      console.error("Failed to load chat unread count", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  if (!user) return null;

  if (loading) {
    return <SellerDashboardSkeleton />;
  }

  const logout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-linear-to-r from-black via-slate-900 to-black backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          {/* Logo */}
          <BitForgeBrand role="Seller" />

          {/* RIGHT */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* 🔔 NOTIFICATIONS */}
            <NotificationDropdown
              role="seller"
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
                className={`relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 hover:border-indigo-500/50 hover:from-indigo-500/20 hover:to-indigo-600/20 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-indigo-500/50 ${profileOpen ? 'border-indigo-500 from-indigo-500/20 to-indigo-600/20 shadow-indigo-500/50' : ''}`}
                title="Menu"
              >
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 shadow-sm shadow-red-500" />
                )}
                <span className={`w-4 h-0.5 bg-white group-hover:bg-indigo-300 transition-all origin-center ${profileOpen ? 'rotate-45 translate-y-2 bg-indigo-300' : ''}`}></span>
                <span className={`w-4 h-0.5 bg-white group-hover:bg-indigo-300 transition-all ${profileOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-4 h-0.5 bg-white group-hover:bg-indigo-300 transition-all origin-center ${profileOpen ? '-rotate-45 -translate-y-2 bg-indigo-300' : ''}`}></span>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl bg-linear-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-2 border-indigo-500/20 shadow-2xl shadow-indigo-500/20"
                  >
                    <div className="px-4 py-3 border-b border-white/10 bg-linear-to-r from-indigo-500/10 to-purple-500/10 rounded-t-2xl">
                      <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Menu</p>
                    </div>
                    <MenuItem 
                      label="Profile" 
                      icon="👤"
                      onClick={() => { setShowProfileModal(true); setProfileOpen(false); }} 
                    />
                    <MenuItem 
                      label="Settings" 
                      icon="⚙️"
                      onClick={() => { setShowSettingsModal(true); setProfileOpen(false); }} 
                    />
                    <MenuItem 
                      label="Help Center" 
                      icon="❓"
                      badge={chatUnreadCount > 0 ? chatUnreadCount : undefined}
                      onClick={() => {
                        setChatUnreadCount(0);
                        router.push("/dashboard/seller/help-center");
                        setProfileOpen(false);
                      }} 
                    />
                    <div className="h-px bg-linear-to-r from-transparent via-indigo-500/20 to-transparent" />
                    <MenuItem label="Logout" icon="🚪" danger onClick={logout} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      

      {/* ================= CONTENT ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <button
            onClick={() => router.push("/dashboard/seller/transactions")}
            className="text-left"
          >
            <KPI title="Total Revenue" value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`} />
          </button>
          <button
            onClick={() => router.push("/dashboard/seller/transactions?period=month")}
            className="text-left"
          >
            <KPI title="This Month" value={`₹${stats?.thisMonthRevenue?.toLocaleString() || 0}`} />
          </button>
          <button
            onClick={() => router.push("/dashboard/seller/sales")}
            className="text-left"
          >
            <KPI title="Total Sales" value={stats?.totalSales ?? 0} />
          </button>
          <button
            onClick={() => router.push("/dashboard/seller/growth")}
            className="text-left"
          >
            <KPI title="Revenue Growth" value={`${(stats?.revenueGrowth ?? 0).toFixed(1)}%`} />
          </button>
        </div>

        {/* Quick Actions - match buyer dashboard style */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <DashboardActionCard
            variant="seller"
            title="Upload Product"
            description="Add new content to sell"
            icon="📤"
            href="/dashboard/seller/upload"
            gradientFrom="from-cyan-600/20"
            gradientTo="to-blue-600/20"
            borderColor="border-cyan-500/40"
            hoverBorderColor="border-cyan-400/60"
            hoverShadow="hover:shadow-cyan-500/30"
            hoverTextColor="text-cyan-200"
          />

          <DashboardActionCard
            variant="seller"
            title="My Products"
            description="Manage your listings"
            icon="📦"
            href="/dashboard/seller/products"
            gradientFrom="from-blue-600/20"
            gradientTo="to-purple-600/20"
            borderColor="border-blue-500/40"
            hoverBorderColor="border-blue-400/60"
            hoverShadow="hover:shadow-blue-500/30"
            hoverTextColor="text-blue-200"
          />

          <DashboardActionCard
            variant="seller"
            title="Earnings"
            description="Withdraw your money"
            icon="💰"
            href="/dashboard/seller/earnings"
            gradientFrom="from-emerald-600/20"
            gradientTo="to-green-600/20"
            borderColor="border-emerald-500/40"
            hoverBorderColor="border-emerald-400/60"
            hoverShadow="hover:shadow-emerald-500/30"
            hoverTextColor="text-emerald-200"
          />

          <DashboardActionCard
            variant="seller"
            title="Bank Accounts"
            description="Manage withdrawal accounts"
            icon="🏦"
            href="/dashboard/seller/bank-account"
            gradientFrom="from-purple-600/20"
            gradientTo="to-indigo-600/20"
            borderColor="border-purple-500/40"
            hoverBorderColor="border-purple-400/60"
            hoverShadow="hover:shadow-purple-500/30"
            hoverTextColor="text-purple-200"
          />

        </div>

        {/* Recent Sales - moved below buttons */}
        <button
          onClick={() => setShowRecentSalesModal(true)}
          className="w-full text-left group cursor-pointer"
        >
          <div className="bg-linear-to-br from-white/10 via-white/5 to-transparent border border-white/20 hover:border-cyan-400/40 rounded-2xl p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl md:text-2xl bg-linear-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">💸</span>
              <h3 className="font-bold text-sm text-white flex items-center gap-2 tracking-wide">Recent Sales</h3>
              <span className="ml-auto text-xs text-cyan-400 group-hover:text-cyan-300 transition">View All</span>
            </div>
            {recentSales.length === 0 ? (
              <div className="text-center py-3">
                <div className="text-2xl mb-1">🛒</div>
                <p className="text-white/60 text-xs mb-1">No recent sales yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSales.slice(0, 2).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between bg-white/5 hover:bg-cyan-400/10 px-2 py-2 rounded-lg transition-all duration-200 shadow-sm group-hover:shadow-md">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs truncate flex items-center gap-1">
                        <span className="text-base">🛍️</span>{sale.productName}
                      </p>
                      <p className="text-[10px] text-white/50 mt-0.5">{new Date(sale.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-base text-green-400">₹{sale.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </button>

        {/* Charts — now in separate horizontal lines for clarity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Glass title="📈 Revenue Growth" >
            <BarMetricChart 
              data={monthly}
              dataKey="revenue"
            />
          </Glass>
          <Glass title="📊 Sales Volume" >
            <BarMetricChart 
              data={monthly}
              dataKey="sales"
            />
          </Glass>
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdate={setUser} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsModal && (
          <SettingsModal user={user} onClose={() => setShowSettingsModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRecentSalesModal && (
          <RecentSalesModal 
            sales={recentSales} 
            onClose={() => setShowRecentSalesModal(false)}
            onViewAll={() => {
              setShowRecentSalesModal(false);
              router.push("/dashboard/seller/transactions");
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function SellerDashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <header className="sticky top-0 z-40 bg-linear-to-r from-cyan-900/80 via-slate-900/80 to-indigo-900/80 backdrop-blur-xl border-b border-cyan-500/40">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="h-6 w-28 rounded-full bg-gradient-to-r from-cyan-400/70 via-purple-400/70 to-indigo-400/70 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 bg-slate-800/90 rounded-full animate-pulse" />
            <div className="h-9 w-9 bg-slate-800/90 rounded-xl animate-pulse" />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-slate-800/90 border border-emerald-500/40 shadow-md shadow-emerald-500/25 animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-slate-800/90 border border-indigo-500/40 shadow-md shadow-indigo-500/25 animate-pulse"
            />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-lg shadow-cyan-500/30 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-lg shadow-purple-500/30 animate-pulse" />
        </div>
      </section>
    </main>
  );
}
