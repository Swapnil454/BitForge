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
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  TrendingUp,
  Upload,
  UserRound,
  X,
} from "lucide-react";
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
import RecentSalesModal from "./components/RecentSalesModel";
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
  const [showRecentSalesModal, setShowRecentSalesModal] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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
    <main className="min-h-screen bg-[#05050a] text-white">
      <header className="sticky top-0 z-50 bg-linear-to-r from-black via-slate-900 to-black backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/50">
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
                className={`relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 hover:border-indigo-500/50 hover:from-indigo-500/20 hover:to-indigo-600/20 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-indigo-500/50 ${
                  profileOpen
                    ? "border-indigo-500 from-indigo-500/20 to-indigo-600/20 shadow-indigo-500/50"
                    : ""
                }`}
                title="Menu"
              >
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 shadow-sm shadow-red-500" />
                )}
                {profileOpen ? (
                  <X className="h-5 w-5 text-white group-hover:text-indigo-300 transition-colors" />
                ) : (
                  <Menu className="h-5 w-5 text-white group-hover:text-indigo-300 transition-colors" />
                )}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <button
            onClick={() => router.push("/dashboard/seller/transactions")}
            className="text-left"
          >
            <KPI compact title="Total Revenue" value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`} />
          </button>
          <button
            onClick={() => router.push("/dashboard/seller/transactions?period=month")}
            className="text-left"
          >
            <KPI compact title="This Month" value={`₹${stats?.thisMonthRevenue?.toLocaleString() || 0}`} />
          </button>
          <button
            onClick={() => router.push("/dashboard/seller/sales")}
            className="text-left"
          >
            <KPI compact title="Total Sales" value={stats?.totalSales ?? 0} />
          </button>
          <button
            onClick={() => router.push("/dashboard/seller/growth")}
            className="text-left"
          >
            <KPI compact title="Revenue Growth" value={`${(stats?.revenueGrowth ?? 0).toFixed(1)}%`} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <DashboardActionCard
            variant="seller"
            title="Upload Product"
            description="Add new content to sell"
            icon={<Upload className="h-8 w-8 md:h-9 md:w-9 text-cyan-200" strokeWidth={2} />}
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
            icon={<Package className="h-8 w-8 md:h-9 md:w-9 text-blue-200" strokeWidth={2} />}
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
            icon={<IndianRupee className="h-8 w-8 md:h-9 md:w-9 text-emerald-200" strokeWidth={2} />}
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
            icon={<Landmark className="h-8 w-8 md:h-9 md:w-9 text-purple-200" strokeWidth={2} />}
            href="/dashboard/seller/bank-account"
            gradientFrom="from-purple-600/20"
            gradientTo="to-indigo-600/20"
            borderColor="border-purple-500/40"
            hoverBorderColor="border-purple-400/60"
            hoverShadow="hover:shadow-purple-500/30"
            hoverTextColor="text-purple-200"
          />
        </div>

        <button
          onClick={() => setShowRecentSalesModal(true)}
          className="w-full text-left group cursor-pointer"
        >
          <Glass title={<span className="inline-flex items-center gap-2"><Receipt className="h-4 w-4 text-cyan-300" /> Recent Sales</span>}>
            {recentSales.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 mb-2">
                  <ShoppingBag className="h-6 w-6 text-cyan-300" />
                </div>
                <p className="text-white/60 text-sm">No recent sales yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales.slice(0, 2).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between gap-3 group-hover:bg-white/5 px-3 py-2.5 -mx-3 rounded-lg transition flex-wrap sm:flex-nowrap"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10">
                        <CreditCard className="h-4 w-4 text-cyan-300" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {sale.productName}
                        </p>
                        <p className="text-xs text-white/60 mt-0.5">
                          {new Date(sale.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold text-lg text-green-400">
                        ₹{sale.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Glass>
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          <Glass title={<span className="inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-indigo-300" /> Revenue Growth</span>}>
            <BarMetricChart data={monthly} dataKey="revenue" />
          </Glass>
          <Glass title={<span className="inline-flex items-center gap-2"><Package className="h-4 w-4 text-emerald-300" /> Sales Volume</span>}>
            <BarMetricChart data={monthly} dataKey="sales" />
          </Glass>
        </div>
      </section>

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
