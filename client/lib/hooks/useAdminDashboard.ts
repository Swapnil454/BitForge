"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAPI, notificationAPI, chatAPI } from "@/lib/api";

// Query keys for cache management
export const adminQueryKeys = {
  all: ["admin"] as const,
  stats: () => [...adminQueryKeys.all, "stats"] as const,
  pendingSellers: () => [...adminQueryKeys.all, "pendingSellers"] as const,
  pendingProducts: () => [...adminQueryKeys.all, "pendingProducts"] as const,
  pendingPayouts: () => [...adminQueryKeys.all, "pendingPayouts"] as const,
  notifications: () => ["notifications"] as const,
  chatUnread: () => ["chat", "unread"] as const,
};

export interface AdminDashboardStats {
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

/**
 * Hook for fetching admin dashboard stats.
 * Returns all platform statistics and analytics.
 */
export function useAdminStats() {
  return useQuery({
    queryKey: adminQueryKeys.stats(),
    queryFn: async () => {
      const data = await adminAPI.getDashboardStats();
      return data as AdminDashboardStats;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching pending sellers.
 */
export function usePendingSellers() {
  return useQuery({
    queryKey: adminQueryKeys.pendingSellers(),
    queryFn: async () => {
      const data = await adminAPI.getPendingSellers();
      return data;
    },
    staleTime: 15 * 1000, // 15 seconds (pending items should be fresher)
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching pending products.
 */
export function usePendingProducts() {
  return useQuery({
    queryKey: adminQueryKeys.pendingProducts(),
    queryFn: async () => {
      const data = await adminAPI.getPendingProducts();
      return data;
    },
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching pending payouts.
 */
export function usePendingPayouts() {
  return useQuery({
    queryKey: adminQueryKeys.pendingPayouts(),
    queryFn: async () => {
      const data = await adminAPI.getPendingPayouts();
      return data;
    },
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching notifications.
 * Private - use the one from useBuyerDashboard for external use.
 */
function _useNotifications(limit = 10) {
  return useQuery({
    queryKey: [...adminQueryKeys.notifications(), limit],
    queryFn: async () => {
      const data = await notificationAPI.getNotifications(limit, 0);
      return {
        notifications: data.notifications as any[],
        unreadCount: data.unreadCount as number,
      };
    },
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching chat unread count.
 * Private - use the one from useBuyerDashboard for external use.
 */
function _useChatUnread() {
  return useQuery({
    queryKey: adminQueryKeys.chatUnread(),
    queryFn: async () => {
      const data = await chatAPI.getUnreadCount();
      return data.count as number;
    },
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Combined hook for all admin dashboard data.
 * Fetches all data in parallel with proper caching.
 */
export function useAdminDashboard() {
  const stats = useAdminStats();
  const notifications = _useNotifications(5);
  const chatUnread = _useChatUnread();

  // Calculate overall loading state (only true if no cached data exists)
  const isInitialLoading = stats.isLoading && !stats.data;

  // Check if any query is currently fetching (for background refresh indicator)
  const isFetching = 
    stats.isFetching || 
    notifications.isFetching ||
    chatUnread.isFetching;

  return {
    stats: stats.data || null,
    notifications: notifications.data?.notifications || [],
    unreadCount: notifications.data?.unreadCount || 0,
    chatUnread: chatUnread.data || 0,
    isInitialLoading,
    isFetching,
    // Individual query states for fine-grained control
    queries: {
      stats,
      notifications,
      chatUnread,
    },
  };
}

/**
 * Hook to invalidate admin dashboard cache.
 * Call this when data changes (e.g., after approving a seller).
 */
export function useInvalidateAdminCache() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.all }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats() }),
    invalidatePendingSellers: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.pendingSellers() }),
    invalidatePendingProducts: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.pendingProducts() }),
    invalidatePendingPayouts: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.pendingPayouts() }),
    invalidateNotifications: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications() }),
    invalidateChatUnread: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.chatUnread() }),
  };
}
