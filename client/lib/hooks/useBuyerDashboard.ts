"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buyerAPI, notificationAPI, cartAPI, chatAPI } from "@/lib/api";

// Query keys for cache management
export const buyerQueryKeys = {
  all: ["buyer"] as const,
  stats: () => [...buyerQueryKeys.all, "stats"] as const,
  spending: () => [...buyerQueryKeys.all, "spending"] as const,
  notifications: () => ["notifications"] as const,
  cartCount: () => ["cart", "count"] as const,
  chatUnread: () => ["chat", "unread"] as const,
};

export interface BuyerStats {
  totalSpent: number;
  totalPurchases: number;
  downloads: number;
  recentOrders: any[];
}

/**
 * Hook for fetching buyer dashboard stats.
 * Data is cached for 30 seconds, preventing refetches on navigation.
 */
export function useBuyerStats() {
  return useQuery({
    queryKey: buyerQueryKeys.stats(),
    queryFn: async () => {
      const data = await buyerAPI.getStats();
      return data as BuyerStats;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching buyer spending over time chart data.
 */
export function useBuyerSpending() {
  return useQuery({
    queryKey: buyerQueryKeys.spending(),
    queryFn: async () => {
      const data = await buyerAPI.getSpendingOverTime();
      return data as { month: string; amount: number }[];
    },
    staleTime: 60 * 1000, // 1 minute (chart data changes less frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching notifications.
 * Shared across all dashboards.
 */
export function useNotifications(limit = 10) {
  return useQuery({
    queryKey: [...buyerQueryKeys.notifications(), limit],
    queryFn: async () => {
      const data = await notificationAPI.getNotifications(limit, 0);
      return {
        notifications: data.notifications as any[],
        unreadCount: data.unreadCount as number,
      };
    },
    staleTime: 15 * 1000, // 15 seconds (notifications should be fresher)
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching cart item count.
 */
export function useCartCount() {
  return useQuery({
    queryKey: buyerQueryKeys.cartCount(),
    queryFn: async () => {
      const data = await cartAPI.getCartCount();
      return data.count as number;
    },
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching chat unread count.
 * Shared across all dashboards.
 */
export function useChatUnread() {
  return useQuery({
    queryKey: buyerQueryKeys.chatUnread(),
    queryFn: async () => {
      const data = await chatAPI.getUnreadCount();
      return data.count as number;
    },
    staleTime: 10 * 1000, // 10 seconds (chat messages should update quickly)
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Combined hook for all buyer dashboard data.
 * Fetches all data in parallel with proper caching.
 */
export function useBuyerDashboard() {
  const stats = useBuyerStats();
  const spending = useBuyerSpending();
  const notifications = useNotifications(5);
  const cartCount = useCartCount();
  const chatUnread = useChatUnread();

  // Calculate overall loading state (only true if no cached data exists)
  const isInitialLoading = 
    stats.isLoading && !stats.data ||
    spending.isLoading && !spending.data;

  // Check if any query is currently fetching (for background refresh indicator)
  const isFetching = 
    stats.isFetching || 
    spending.isFetching || 
    notifications.isFetching ||
    cartCount.isFetching ||
    chatUnread.isFetching;

  return {
    stats: stats.data,
    spending: spending.data || [],
    notifications: notifications.data?.notifications || [],
    unreadCount: notifications.data?.unreadCount || 0,
    cartCount: cartCount.data || 0,
    chatUnread: chatUnread.data || 0,
    isInitialLoading,
    isFetching,
    // Individual query states for fine-grained control
    queries: {
      stats,
      spending,
      notifications,
      cartCount,
      chatUnread,
    },
  };
}

/**
 * Hook to invalidate buyer dashboard cache.
 * Call this when data changes (e.g., after adding to cart).
 */
export function useInvalidateBuyerCache() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: buyerQueryKeys.all }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: buyerQueryKeys.stats() }),
    invalidateSpending: () => queryClient.invalidateQueries({ queryKey: buyerQueryKeys.spending() }),
    invalidateCartCount: () => queryClient.invalidateQueries({ queryKey: buyerQueryKeys.cartCount() }),
    invalidateNotifications: () => queryClient.invalidateQueries({ queryKey: buyerQueryKeys.notifications() }),
    invalidateChatUnread: () => queryClient.invalidateQueries({ queryKey: buyerQueryKeys.chatUnread() }),
  };
}
