"use client";

import { ReactNode } from "react";
import QueryProvider from "./QueryProvider";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper for the application.
 * Includes React Query for data caching and state management.
 */
export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
