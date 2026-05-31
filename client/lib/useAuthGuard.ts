"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie, getStoredUser } from "./cookies";

type GuardMode =
  | "require-auth"        // Redirect to login if not authenticated
  | "redirect-if-auth";   // Redirect to dashboard if already authenticated

interface UseAuthGuardOptions {
  mode: GuardMode;
  /** 
   * Only relevant for "redirect-if-auth" — which roles to redirect away.
   * Defaults to all roles.
   */
  roles?: string[];
}

/**
 * Auth guard hook for client components.
 *
 * - "redirect-if-auth": Use on login/register/homepage to push authenticated users to their dashboard.
 * - "require-auth": Use on protected pages to push unauthenticated users to login.
 */
export function useAuthGuard({ mode, roles }: UseAuthGuardOptions) {
  const router = useRouter();

  useEffect(() => {
    const token = getCookie("token");
    const user = getStoredUser();
    const role = (user as any)?.role || "buyer";

    if (mode === "redirect-if-auth") {
      if (!token) return; // Not logged in — stay on page
      const targetRoles = roles ?? ["buyer", "seller", "admin"];
      if (!targetRoles.includes(role)) return;

      // Redirect to appropriate dashboard
      if (role === "buyer") {
        router.replace("/marketplace");
      } else {
        router.replace(`/dashboard/${role}`);
      }
    }

    if (mode === "require-auth") {
      if (token) return; // Logged in — stay on page
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }, [mode, roles, router]);
}
