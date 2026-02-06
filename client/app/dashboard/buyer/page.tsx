

"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { clearAuthStorage, getStoredUser, setCookie, getCookie } from "@/lib/cookies";
import { buyerAPI, notificationAPI, userAPI, cartAPI, chatAPI } from "@/lib/api";
import toast from "react-hot-toast";

import ProfileModal from "../components/ProfileModal";
import SettingsModal from "../components/SettingModal";
import RecentOrdersModal from "./components/RecentOrderModal";
import SpendingHistoryModal from "./components/SpendingHistoryModal";
import PurchasesModal from "./components/PurchasesModal";
import DownloadsModal from "./components/DownloadsModal";
import { KPI, Glass, MenuItem } from "../components/Cards";
import DashboardActionCard from "../components/DashboardActionCard";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import { BarMetricChart } from "../components/charts/BarMetricChart";
import { AreaMetricChart } from "../components/charts/AreaMetricChart";
import BitForgeBrand from "../components/logo/BitForgeBrand";


interface User {
  id: string;
  name: string;
  email: string;
  role: "buyer";
  isVerified: boolean;
}

interface BuyerStats {
  totalSpent: number;
  totalPurchases: number;
  downloads: number;
  recentOrders: any[];
}

/* ================= PAGE ================= */

export default function BuyerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSpendingHistoryModal, setShowSpendingHistoryModal] = useState(false);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);
  const [showDownloadsModal, setShowDownloadsModal] = useState(false);
  const [showRecentOrdersModal, setShowRecentOrdersModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const router = useRouter();

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
    };

    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [router]);

  // Always refresh the latest profile (ensures profilePictureUrl persists after logout/login)
  useEffect(() => {
    if (!user) return;

    const syncProfile = async () => {
      try {
        const fresh = await userAPI.getCurrentUser();
        
        // Check if user account was deleted
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
        // If error getting user (likely deleted), redirect to register
        if (err instanceof Error && err.message.includes("401")) {
          clearAuthStorage();
          toast.error("Your account has been deleted by an administrator");
          router.push("/register");
        }
      }
    };

    syncProfile();

    // Periodic check to see if account was deleted by admin
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
    }, 5000); // Check every 5 seconds

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
        setChatUnreadCount((prev) => prev + 1);
      }
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
      const data = await notificationAPI.getNotifications(10, 0);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await notificationAPI.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const data = await cartAPI.getCartCount();
      setCartCount(data.count || 0);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  // Fetch buyer stats and spending data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, spendingData, notificationsData, cartData, chatUnread] = await Promise.all([
          buyerAPI.getStats(),
          buyerAPI.getSpendingOverTime(),
          notificationAPI.getNotifications(5, 0),
          cartAPI.getCartCount(),
          chatAPI.getUnreadCount(),
        ]);

        setStats(statsData);
        setSpendingData(spendingData);
        setNotifications(notificationsData.notifications);
        setUnreadCount(notificationsData.unreadCount);
        setCartCount(cartData.count || 0);
        setChatUnreadCount(chatUnread.count || 0);

        // Get wishlist count from localStorage
        const saved = localStorage.getItem("wishlist");
        if (saved) {
          try {
            const wishlist = JSON.parse(saved);
            setWishlistCount(wishlist.length);
          } catch (e) {
            console.error("Failed to parse wishlist", e);
          }
        }
      } catch (error: any) {
        console.error("Error fetching buyer data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const logout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  if (!user) return null;

  if (loading) {
    return <BuyerDashboardSkeleton />;
  }

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-linear-to-r from-black via-slate-900 to-black backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          {/* Logo */}
          <BitForgeBrand role="Buyer" />

          <div className="flex items-center gap-2 md:gap-3">
            {/* Cart Icon */}
            <button
              onClick={() => router.push('/cart')}
              className="relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 hover:border-purple-500/50 hover:from-purple-500/20 hover:to-purple-600/20 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-purple-500/50"
              title="View cart"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-linear-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg shadow-purple-500/50 animate-pulse">
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
                      label="Wishlist" 
                      icon="❤️"
                      badge={wishlistCount > 0 ? wishlistCount : undefined}
                      onClick={() => { 
                        router.push("/wishlist"); 
                        setProfileOpen(false); 
                      }} 
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
                      onClick={() => { router.push("/dashboard/buyer/help-center"); setProfileOpen(false); }} 
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
      <section className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Browse Marketplace - Top Banner */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push("/marketplace")}
          className="w-full group relative overflow-hidden bg-linear-to-r from-purple-600/30 via-blue-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:via-blue-600/40 hover:to-indigo-600/40 border-2 border-purple-500/50 hover:border-purple-400/70 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl hover:shadow-purple-500/30"
        >
          <div className="absolute inset-0 bg-linear-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">🛍️</div>
              <div className="text-left">
                <div className="text-2xl md:text-3xl font-black text-white mb-1 group-hover:text-purple-200 transition-colors">Browse Marketplace</div>
                <div className="text-sm md:text-base text-white/70 group-hover:text-white/90 transition-colors">Discover amazing digital content & products</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/80 group-hover:text-white group-hover:translate-x-2 transition-all">
              <span className="font-semibold">Explore Now</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </motion.button>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <button
            onClick={() => setShowSpendingHistoryModal(true)}
            className="text-left"
          >
            <KPI title="Total Spent" value={stats ? `₹${stats.totalSpent.toLocaleString()}` : "₹0"} />
          </button>
          <button
            onClick={() => setShowPurchasesModal(true)}
            className="text-left"
          >
            <KPI title="Purchases" value={stats ? stats.totalPurchases : "0"} />
          </button>
          <button
            onClick={() => setShowDownloadsModal(true)}
            className="text-left"
          >
            <KPI title="Downloads" value={stats ? stats.downloads : "0"} />
          </button>
          <button
            onClick={() => router.push("/wishlist")}
            className="text-left"
          >
            <KPI title="Wishlist" value={wishlistCount} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <DashboardActionCard
            variant="buyer"
            title="My Purchases"
            description="View order history"
            icon="📦"
            href="/dashboard/buyer/purchases"
            gradientFrom="from-blue-600/20"
            gradientTo="to-cyan-600/20"
            borderColor="border-blue-500/40"
            hoverBorderColor="border-blue-400/60"
            hoverShadow="hover:shadow-blue-500/30"
            hoverTextColor="text-blue-200"
          />

          <DashboardActionCard
            variant="buyer"
            title="Shopping Cart"
            description={
              cartCount > 0
                ? `${cartCount} item${cartCount !== 1 ? "s" : ""} waiting`
                : "Cart is empty"
            }
            href="/cart"
            icon={
              <div className="flex items-center gap-1 md:gap-2">
                🛒
                {cartCount > 0 && (
                  <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-lg">
                    {cartCount}
                  </span>
                )}
              </div>
            }
            gradientFrom="from-emerald-600/20"
            gradientTo="to-green-600/20"
            borderColor="border-emerald-500/40"
            hoverBorderColor="border-emerald-400/60"
            hoverShadow="hover:shadow-emerald-500/30"
            hoverTextColor="text-emerald-200"
          />

        </div>

        {/* Orders */}
        <div
          onClick={() => setShowRecentOrdersModal(true)}
          className="w-full text-left group cursor-pointer"
        >
          <Glass title="📋 Recent Orders">
            {stats && stats.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.slice(0, 2).map(o => (
                  <div key={o.id} className="flex items-center justify-between group-hover:bg-white/5 px-3 py-2.5 -mx-3 rounded-lg transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{o.product}</p>
                      <p className="text-xs text-white/60 mt-0.5">{new Date(o.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg text-green-400">₹{o.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-white/60 text-sm mb-3">No orders yet</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/marketplace");
                  }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </Glass>
        </div>

        {/* Charts - Moved to Bottom with Reordered Sequence */}
        <div className="grid md:grid-cols-2 gap-6">
          <Glass title="📈 Purchases Per Month">
            <BarMetricChart
              data={spendingData}
              dataKey="purchases"
              emptyText="No purchases yet"
            />
          </Glass>

          <Glass title="💰 Spending Over Time" >
            <AreaMetricChart
              data={spendingData}
              dataKey="spent"
              emptyText="No spending yet"
            />
          </Glass>
        </div>

      </section>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdate={setUser} />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <SettingsModal user={user} onClose={() => setShowSettingsModal(false)} />
        )}
      </AnimatePresence>

      {/* Spending History Modal */}
      <AnimatePresence>
        {showSpendingHistoryModal && (
          <SpendingHistoryModal onClose={() => setShowSpendingHistoryModal(false)} />
        )}
      </AnimatePresence>

      {/* Purchases Modal */}
      <AnimatePresence>
        {showPurchasesModal && (
          <PurchasesModal onClose={() => setShowPurchasesModal(false)} />
        )}
      </AnimatePresence>

      {/* Downloads Modal */}
      <AnimatePresence>
        {showDownloadsModal && (
          <DownloadsModal onClose={() => setShowDownloadsModal(false)} />
        )}
      </AnimatePresence>

      {/* Recent Orders Modal */}
      <AnimatePresence>
        {showRecentOrdersModal && (
          <RecentOrdersModal 
            orders={stats?.recentOrders || []} 
            onClose={() => setShowRecentOrdersModal(false)}
            onViewAll={() => {
              setShowRecentOrdersModal(false);
              router.push("/dashboard/buyer/orders");
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function BuyerDashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <header className="sticky top-0 z-40 bg-linear-to-r from-purple-900/80 via-indigo-900/80 to-cyan-900/80 backdrop-blur-xl border-b border-purple-500/40">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-28 rounded-full bg-gradient-to-r from-cyan-400/70 via-purple-400/70 to-indigo-400/70 animate-pulse" />
            <div className="hidden md:block h-6 w-32 bg-slate-700/80 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 bg-slate-800/90 rounded-full animate-pulse" />
            <div className="h-9 w-9 bg-slate-800/90 rounded-xl animate-pulse" />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="h-28 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-lg shadow-purple-500/30 animate-pulse" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-slate-800/90 border border-cyan-500/40 shadow-md shadow-cyan-500/25 animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-slate-800/90 border border-indigo-500/40 shadow-md shadow-indigo-500/25 animate-pulse"
            />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-lg shadow-purple-500/30 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-lg shadow-cyan-500/30 animate-pulse" />
        </div>
      </section>
    </main>
  );
}

function ChartArea({ data, keyName }: any) {
  const hasData = data && data.length > 0 && data.some((d: any) => d[keyName] > 0);
  
  if (!hasData) {
    return (
      <div style={{ height: "180px" }} className="flex flex-col items-center justify-center rounded-lg bg-linear-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/10">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-white/60 text-center text-sm">
          <span className="block font-semibold text-white mb-1">No spending yet</span>
          <span className="text-xs">Start exploring the marketplace</span>
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "180px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="month" hide />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Area 
            dataKey={keyName} 
            stroke="#38bdf8" 
            fill="url(#colorSpent)" 
            strokeWidth={2}
          />
          <defs>
            <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
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
      <div style={{ height: "180px" }} className="flex flex-col items-center justify-center rounded-lg bg-linear-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10">
        <div className="text-4xl mb-2">📈</div>
        <p className="text-white/60 text-center text-sm">
          <span className="block font-semibold text-white mb-1">No purchases yet</span>
          <span className="text-xs">Your purchase history will appear here</span>
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "180px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="month" hide />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Bar 
            dataKey={keyName} 
            fill="url(#colorPurchases)" 
            radius={[8, 8, 0, 0]}
          />
          <defs>
            <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.6}/>
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
