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
                      onClick={() => { router.push("/dashboard/settings?tab=profile"); setProfileOpen(false); }} 
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
                    <MenuItem label="Logout" icon={<LogOut className="h-4 w-4" />} danger onClick={() => { setIsLogoutModalOpen(true); setProfileOpen(false); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <button
            onClick={() => router.push("/dashboard/admin/transactions")}
            className="text-left"
          >
            <KPI compact title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} />
          </button>
          <button
            onClick={() => router.push("/dashboard/admin/users?role=buyer")}
            className="text-left"
          >
            <KPI compact title="Total Buyers" value={(stats.totalBuyers || 0).toLocaleString()} />
          </button>
          <button
            onClick={() => router.push("/dashboard/admin/users?role=seller")}
            className="text-left"
          >
            <KPI compact title="Total Sellers" value={stats.totalSellers.toLocaleString()} />
          </button>
          <button
            onClick={() => router.push("/dashboard/admin/products-management")}
            className="text-left"
          >
            <KPI compact title="Total Products" value={stats.totalProducts.toLocaleString()} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

          <DashboardActionCard
            variant="buyer"
            title="All Users"
            description="Manage platform users"
            icon={<Users className="h-8 w-8 md:h-9 md:w-9 text-cyan-600 dark:text-cyan-200" strokeWidth={2} />}
            href="/dashboard/admin/users"
            gradientFrom="from-cyan-600/20"
            gradientTo="to-blue-600/20"
            borderColor="border-cyan-500/40"
            hoverBorderColor="border-cyan-400/60"
            hoverShadow="hover:shadow-cyan-500/30"
            hoverTextColor="text-cyan-700 dark:text-cyan-200"
          />

          <DashboardActionCard
            variant="buyer"
            title="Pending Sellers"
            description="Review seller requests"
            icon={<BriefcaseBusiness className="h-8 w-8 md:h-9 md:w-9 text-purple-600 dark:text-purple-200" strokeWidth={2} />}
            href="/dashboard/admin/sellers"
            gradientFrom="from-purple-600/20"
            gradientTo="to-indigo-600/20"
            borderColor="border-purple-500/40"
            hoverBorderColor="border-purple-400/60"
            hoverShadow="hover:shadow-purple-500/30"
            hoverTextColor="text-purple-700 dark:text-purple-200"
          />

          <DashboardActionCard
            variant="buyer"
            title="Pending Products"
            description="Approve new listings"
            icon={<Package className="h-8 w-8 md:h-9 md:w-9 text-blue-600 dark:text-blue-200" strokeWidth={2} />}
            href="/dashboard/admin/products"
            gradientFrom="from-blue-600/20"
            gradientTo="to-sky-600/20"
            borderColor="border-blue-500/40"
            hoverBorderColor="border-blue-400/60"
            hoverShadow="hover:shadow-blue-500/30"
            hoverTextColor="text-blue-700 dark:text-blue-200"
          />

          <DashboardActionCard
            variant="buyer"
            title="Open Disputes"
            description="Resolve user issues"
            icon={<TriangleAlert className="h-8 w-8 md:h-9 md:w-9 text-red-600 dark:text-red-200" strokeWidth={2} />}
            href="/dashboard/admin/disputes"
            gradientFrom="from-red-600/20"
            gradientTo="to-rose-600/20"
            borderColor="border-red-500/40"
            hoverBorderColor="border-red-400/60"
            hoverShadow="hover:shadow-red-500/30"
            hoverTextColor="text-red-700 dark:text-red-200"
          />

          <DashboardActionCard
            variant="buyer"
            title="Pending Payouts"
            description="Approve withdrawals"
            icon={<Wallet className="h-8 w-8 md:h-9 md:w-9 text-emerald-600 dark:text-emerald-200" strokeWidth={2} />}
            href="/dashboard/admin/payouts"
            gradientFrom="from-emerald-600/20"
            gradientTo="to-green-600/20"
            borderColor="border-emerald-500/40"
            hoverBorderColor="border-emerald-400/60"
            hoverShadow="hover:shadow-emerald-500/30"
            hoverTextColor="text-emerald-700 dark:text-emerald-200"
          />

          <DashboardActionCard
            variant="buyer"
            title="Bank Accounts"
            description="Manage payout banks"
            icon={<University className="h-8 w-8 md:h-9 md:w-9 text-yellow-600 dark:text-yellow-200" strokeWidth={2} />}
            href="/dashboard/admin/bank-account"
            gradientFrom="from-yellow-600/20"
            gradientTo="to-amber-600/20"
            borderColor="border-yellow-500/40"
            hoverBorderColor="border-yellow-400/60"
            hoverShadow="hover:shadow-yellow-500/30"
            hoverTextColor="text-yellow-700 dark:text-yellow-200"
          />

          <DashboardActionCard
            variant="buyer"
            title="Trust & Security"
            description="Malware, reviews & identity"
            icon={<Shield className="h-8 w-8 md:h-9 md:w-9 text-red-600 dark:text-red-200" strokeWidth={2} />}
            href="/dashboard/admin/security"
            gradientFrom="from-red-600/20"
            gradientTo="to-orange-600/20"
            borderColor="border-red-500/40"
            hoverBorderColor="border-red-400/60"
            hoverShadow="hover:shadow-red-500/30"
            hoverTextColor="text-red-700 dark:text-red-200"
          />

          <DashboardActionCard
            variant="buyer"
            title="Help Center"
            description="Guides and support docs"
            icon={<CircleHelp className="h-8 w-8 md:h-9 md:w-9 text-indigo-600 dark:text-indigo-200" strokeWidth={2} />}
            href="/dashboard/admin/help-center"
            gradientFrom="from-indigo-600/20"
            gradientTo="to-violet-600/20"
            borderColor="border-indigo-500/40"
            hoverBorderColor="border-indigo-400/60"
            hoverShadow="hover:shadow-indigo-500/30"
            hoverTextColor="text-indigo-700 dark:text-indigo-200"
          />

          <DashboardActionCard
            variant="buyer"
            title="Promotions"
            description="Review paid ad requests"
            icon={<Megaphone className="h-8 w-8 md:h-9 md:w-9 text-amber-600 dark:text-amber-200" strokeWidth={2} />}
            href="/dashboard/admin/promotions"
            gradientFrom="from-amber-600/20"
            gradientTo="to-orange-600/20"
            borderColor="border-amber-500/40"
            hoverBorderColor="border-amber-400/60"
            hoverShadow="hover:shadow-amber-500/30"
            hoverTextColor="text-amber-700 dark:text-amber-200"
          />

        </div>
        {/* Tables */}
        <div
          onClick={() => router.push("/dashboard/admin/transactions")}
          className="w-full text-left group cursor-pointer"
        >
          <Glass title={<span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-cyan-600 dark:text-cyan-300" /> Recent Transactions</span>}>
            {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransactions.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between group-hover:bg-slate-100 dark:group-hover:bg-white/5 px-3 py-2.5 -mx-3 rounded-lg transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {t.user} — {t.productName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">
                        {new Date(t.date).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold text-lg text-emerald-400">
                        {t.amount.includes("₹") ? t.amount : `₹${Number(t.amount).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 dark:border-white/15 bg-slate-100 dark:bg-white/5 mb-2">
                  <ClipboardList className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
                </div>
                <p className="text-slate-500 dark:text-white/60 text-sm mb-3">
                  No transactions yet
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/dashboard/admin/transactions");
                  }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white rounded-lg font-semibold transition text-sm"
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
      <header className="sticky top-0 z-40 bg-white dark:bg-black/80 backdrop-blur-xl border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="h-6 w-32 rounded-full bg-gradient-to-r from-purple-500/60 via-indigo-500/60 to-cyan-400/60 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-700/80 animate-pulse" />
            <div className="h-9 w-9 rounded-xl bg-slate-700/80 animate-pulse" />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-slate-800/90 border border-purple-500/30 shadow-lg shadow-purple-500/25 animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
