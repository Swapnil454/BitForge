"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sellerAPI, notificationAPI, chatAPI } from "@/lib/api";

// Query keys for cache management
export const sellerQueryKeys = {
  all: ["seller"] as const,
  stats: () => [...sellerQueryKeys.all, "stats"] as const,
  earnings: () => [...sellerQueryKeys.all, "earnings"] as const,
  transactions: () => [...sellerQueryKeys.all, "transactions"] as const,
  notifications: () => ["notifications"] as const,
  chatUnread: () => ["chat", "unread"] as const,
};

export interface SellerDashboardStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  totalSales: number;
  revenueGrowth: number;
  conversion: number | null;
}

export interface MonthlyPoint {
  month: string;
  revenue: number;
  sales: number;
}

export interface RecentSale {
  id: string;
  productName: string;
  amount: number;
  createdAt: string;
}

/**
 * Hook for fetching seller dashboard stats.
 * Returns main KPIs, monthly chart data, and recent sales.
 */
export function useSellerStats() {
  return useQuery({
    queryKey: sellerQueryKeys.stats(),
    queryFn: async () => {
      const data = await sellerAPI.getDashboardStats();
      return {
        stats: {
          totalRevenue: data.totalRevenue,
          thisMonthRevenue: data.thisMonthRevenue,
          totalSales: data.totalSales,
          revenueGrowth: data.revenueGrowth,
          conversion: data.conversion,
        } as SellerDashboardStats,
        monthly: (data.monthly || []) as MonthlyPoint[],
        recentSales: (data.recentSales || []) as RecentSale[],
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching seller earnings.
 */
export function useSellerEarnings() {
  return useQuery({
    queryKey: sellerQueryKeys.earnings(),
    queryFn: async () => {
      const data = await sellerAPI.getEarnings();
      return data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching seller transactions.
 */
export function useSellerTransactions() {
  return useQuery({
    queryKey: sellerQueryKeys.transactions(),
    queryFn: async () => {
      const data = await sellerAPI.getTransactions();
      return data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching notifications.
 * Private - use the one from useBuyerDashboard for external use.
 */
function _useNotifications(limit = 10) {
  return useQuery({
    queryKey: [...sellerQueryKeys.notifications(), limit],
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
    queryKey: sellerQueryKeys.chatUnread(),
    queryFn: async () => {
      const data = await chatAPI.getUnreadCount();
      return data.count as number;
    },
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Combined hook for all seller dashboard data.
 * Fetches all data in parallel with proper caching.
 */
export function useSellerDashboard() {
  const statsQuery = useSellerStats();
  const notifications = _useNotifications(5);
  const chatUnread = _useChatUnread();

  // Calculate overall loading state (only true if no cached data exists)
  const isInitialLoading = statsQuery.isLoading && !statsQuery.data;

  // Check if any query is currently fetching (for background refresh indicator)
  const isFetching = 
    statsQuery.isFetching || 
    notifications.isFetching ||
    chatUnread.isFetching;

  return {
    stats: statsQuery.data?.stats || null,
    monthly: statsQuery.data?.monthly || [],
    recentSales: statsQuery.data?.recentSales || [],
    notifications: notifications.data?.notifications || [],
    unreadCount: notifications.data?.unreadCount || 0,
    chatUnread: chatUnread.data || 0,
    isInitialLoading,
    isFetching,
    // Individual query states for fine-grained control
    queries: {
      stats: statsQuery,
      notifications,
      chatUnread,
    },
  };
}

/**
 * Hook to invalidate seller dashboard cache.
 * Call this when data changes (e.g., after a sale).
 */
export function useInvalidateSellerCache() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: sellerQueryKeys.all }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: sellerQueryKeys.stats() }),
    invalidateEarnings: () => queryClient.invalidateQueries({ queryKey: sellerQueryKeys.earnings() }),
    invalidateTransactions: () => queryClient.invalidateQueries({ queryKey: sellerQueryKeys.transactions() }),
    invalidateNotifications: () => queryClient.invalidateQueries({ queryKey: sellerQueryKeys.notifications() }),
    invalidateChatUnread: () => queryClient.invalidateQueries({ queryKey: sellerQueryKeys.chatUnread() }),
  };
}
