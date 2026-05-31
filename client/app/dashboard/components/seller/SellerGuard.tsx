"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCookie, getStoredUser } from "@/lib/cookies";
import toast from "react-hot-toast";

// Root tab pages where double-back-to-exit is active
const SELLER_ROOTS = new Set([
  "/dashboard/seller",
  "/dashboard/seller/products",
  "/dashboard/seller/promotions",
  "/dashboard/seller/settings",
]);

/** Returns true only on mobile/touch devices */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(max-width: 768px)").matches
  );
}

/**
 * SellerGuard — mounted inside the seller layout.
 *
 * Responsibilities:
 * 1. Redirects unauthenticated users / non-sellers to the appropriate page.
 * 2. On MOBILE only — implements "press back twice to exit" on root tab pages.
 *    Desktop back button is never intercepted.
 */
export default function SellerGuard() {
  const router = useRouter();
  const pathname = usePathname();

  // ─── 1. Auth Guard ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getCookie("token");
    const user = getStoredUser() as any;

    if (!token) {
      const next = encodeURIComponent(pathname || "/dashboard/seller");
      router.replace(`/login?next=${next}`);
      return;
    }

    const role = user?.role || "buyer";
    if (role === "buyer") {
      router.replace("/marketplace");
    } else if (role === "admin") {
      router.replace("/dashboard/admin");
    }
    // role === "seller" → stay
  }, [pathname, router]);

  // ─── 2. Double-back-to-exit (MOBILE ONLY) ────────────────────────────────
  const backPressedRef = useRef(false);
  const toastIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only on root tab pages
    if (!SELLER_ROOTS.has(pathname || "")) return;

    // ⚡ removed mobile-only skip so desktop users can use mouse back-button to exit
    const handlePopState = () => {
      if (backPressedRef.current) {
        // Second press within window — let the browser navigate away naturally
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        backPressedRef.current = false;
        return;
      }

      // First press — block and show toast
      history.pushState(null, "", pathname);
      backPressedRef.current = true;

      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      toastIdRef.current = toast("Press back again to exit", {
        duration: 2000,
        icon: "↩",
        style: { fontSize: "14px" },
      }) as string;

      // Auto-reset after 2 s
      timeoutRef.current = setTimeout(() => {
        backPressedRef.current = false;
      }, 2000);
    };

    // Sentinel entry so the first popstate fires instead of leaving immediately
    history.pushState(null, "", pathname);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      backPressedRef.current = false;
    };
  }, [pathname]);

  return null;
}
