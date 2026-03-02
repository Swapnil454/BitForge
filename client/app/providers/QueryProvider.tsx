"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query Provider with optimal settings for dashboard UX.
 * 
 * Features:
 * - 30 second stale time: Data stays fresh for 30s, preventing refetches on navigation
 * - Background refetch on window focus: Silently updates stale data when user returns
 * - 5 minute cache time: Keeps unused data in cache for fast re-access
 * - No retry on 401: Avoids hammering API when logged out
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data considered fresh for 30 seconds - no refetch during this time
            staleTime: 30 * 1000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Silently refetch when window regains focus (for real-time feel)
            refetchOnWindowFocus: true,
            // Don't refetch on remount if data is still fresh
            refetchOnMount: false,
            // Retry failed requests (except 401s)
            retry: (failureCount, error: any) => {
              // Don't retry on auth errors
              if (error?.response?.status === 401) return false;
              // Retry up to 2 times for other errors
              return failureCount < 2;
            },
            // Exponential backoff for retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Don't retry mutations by default
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
