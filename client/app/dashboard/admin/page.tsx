"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { clearAuthStorage, getStoredUser, setCookie, getCookie } from "@/lib/cookies";
import { notificationAPI, userAPI, adminAPI, chatAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { KPI, Glass, MenuItem } from "../components/Cards";
import DashboardActionCard from "../components/DashboardActionCard";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import ProfileModal from "../components/ProfileModal";
import SettingsModal from "../components/SettingModal";
import { AreaMetricChart} from "../components/charts/AreaMetricChart";
import { BarMetricChart } from "../components/charts/BarMetricChart";
import BitForgeBrand from "../components/logo/BitForgeBrand";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const socketRef = useRef<Socket | null>(null);

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
    fetchNotifications();
    fetchDashboardStats();
    fetchChatUnread();

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
        setChatUnreadCount((prev) => prev + 1);
      }
    });

    socket.on("connect_error", (err: any) => {
      console.error("Socket connect error (admin dashboard)", err?.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const response = await notificationAPI.getNotifications(5, 0);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const data = await adminAPI.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      console.error("Failed to fetch dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchChatUnread = async () => {
    try {
      const data = await chatAPI.getUnreadCount();
      setChatUnreadCount(data.count || 0);
    } catch (error) {
      console.error("Failed to fetch chat unread count", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  if (!user) return null;

  if (loadingStats || !stats) {
    return <AdminDashboardSkeleton />;
  }

  const logout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
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
                className={`h-10 w-10 md:h-11 md:w-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 hover:border-indigo-500/50 hover:from-indigo-500/20 hover:to-indigo-600/20 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-indigo-500/50 ${profileOpen ? 'border-indigo-500 from-indigo-500/20 to-indigo-600/20 shadow-indigo-500/50' : ''}`}
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
                        router.push("/dashboard/admin/help-center");
                        setProfileOpen(false);
                      }} 
                    />
                    <MenuItem 
                      label="Careers Management" 
                      icon="💼"
                      onClick={() => {
                        router.push("/dashboard/admin/careers");
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

      <section className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/dashboard/admin/transactions")}
            className="text-left"
          >
            <KPI title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} />
          </button>
          <button
            onClick={() => router.push("/dashboard/admin/users?role=buyer")}
            className="text-left"
          >
            <KPI title="Total Buyers" value={(stats.totalBuyers || 0).toLocaleString()} />
          </button>
          <button
            onClick={() => router.push("/dashboard/admin/users?role=seller")}
            className="text-left"
          >
            <KPI title="Total Sellers" value={stats.totalSellers.toLocaleString()} />
          </button>
          <button
            onClick={() => router.push("/dashboard/admin/products-management")}
            className="text-left"
          >
            <KPI title="Total Products" value={stats.totalProducts.toLocaleString()} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">

          <DashboardActionCard
            title="All Users"
            description="Manage platform users"
            icon="👥"
            href="/dashboard/admin/users"
            gradientFrom="from-cyan-600/20"
            gradientTo="to-blue-600/20"
            borderColor="border-cyan-500/40"
            hoverBorderColor="border-cyan-400/60"
            hoverShadow="hover:shadow-cyan-500/30"
            hoverTextColor="text-cyan-200"
          />

          <DashboardActionCard
            title="Pending Sellers"
            description="Review seller requests"
            icon="👔"
            href="/dashboard/admin/sellers"
            gradientFrom="from-purple-600/20"
            gradientTo="to-indigo-600/20"
            borderColor="border-purple-500/40"
            hoverBorderColor="border-purple-400/60"
            hoverShadow="hover:shadow-purple-500/30"
            hoverTextColor="text-purple-200"
          />

          <DashboardActionCard
            title="Pending Products"
            description="Approve new listings"
            icon="📦"
            href="/dashboard/admin/products"
            gradientFrom="from-blue-600/20"
            gradientTo="to-sky-600/20"
            borderColor="border-blue-500/40"
            hoverBorderColor="border-blue-400/60"
            hoverShadow="hover:shadow-blue-500/30"
            hoverTextColor="text-blue-200"
          />

          <DashboardActionCard
            title="Open Disputes"
            description="Resolve user issues"
            icon="⚠️"
            href="/dashboard/admin/disputes"
            gradientFrom="from-red-600/20"
            gradientTo="to-rose-600/20"
            borderColor="border-red-500/40"
            hoverBorderColor="border-red-400/60"
            hoverShadow="hover:shadow-red-500/30"
            hoverTextColor="text-red-200"
          />

          <DashboardActionCard
            title="Pending Payouts"
            description="Approve withdrawals"
            icon="💰"
            href="/dashboard/admin/payouts"
            gradientFrom="from-emerald-600/20"
            gradientTo="to-green-600/20"
            borderColor="border-emerald-500/40"
            hoverBorderColor="border-emerald-400/60"
            hoverShadow="hover:shadow-emerald-500/30"
            hoverTextColor="text-emerald-200"
          />

          <DashboardActionCard
            title="Bank Accounts"
            description="Manage payout banks"
            icon="🏦"
            href="/dashboard/admin/bank-account"
            gradientFrom="from-yellow-600/20"
            gradientTo="to-amber-600/20"
            borderColor="border-yellow-500/40"
            hoverBorderColor="border-yellow-400/60"
            hoverShadow="hover:shadow-yellow-500/30"
            hoverTextColor="text-yellow-200"
          />

        </div>
        {/* Tables */}
        <div
          onClick={() => router.push("/dashboard/admin/transactions")}
          className="w-full text-left group cursor-pointer"
        >
          <Glass title="📋 Recent Transactions">
            {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransactions.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between group-hover:bg-white/5 px-3 py-2.5 -mx-3 rounded-lg transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">
                        {t.user} — {t.productName}
                      </p>
                      <p className="text-xs text-white/60 mt-0.5">
                        {new Date(t.date).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold text-lg text-emerald-400">
                        ₹{t.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-white/60 text-sm mb-3">
                  No transactions yet
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/dashboard/admin/transactions");
                  }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm"
                >
                  View Transactions
                </button>
              </div>
            )}
          </Glass>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Glass title="Platform Revenue">
            <AreaMetricChart
              data={stats.platformAnalytics}
              dataKey="revenue"
              emptyText="No revenue data"
            />
          </Glass>

          <Glass
            title={`User Growth (${stats.userGrowth >= 0 ? "+" : ""}${stats.userGrowth}%)`}
          >
            <BarMetricChart
              data={stats.platformAnalytics}
              dataKey="users"
              emptyText="No user data"
            />
          </Glass>
        </div>

      </section>

      {/* Modals */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdate={setUser} />
        )}
        {showSettingsModal && (
          <SettingsModal user={user} allowDelete={false} onClose={() => setShowSettingsModal(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function AdminDashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="h-6 w-32 rounded-full bg-gradient-to-r from-purple-500/60 via-indigo-500/60 to-cyan-400/60 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-700/80 animate-pulse" />
            <div className="h-9 w-9 rounded-xl bg-slate-700/80 animate-pulse" />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-slate-800/90 border border-purple-500/30 shadow-lg shadow-purple-500/25 animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-slate-800/90 border border-indigo-500/30 shadow-md shadow-indigo-500/25 animate-pulse"
            />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/25 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/25 animate-pulse" />
        </div>
      </section>
    </main>
  );
}
