"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { getStoredUser } from "@/lib/cookies";

const BUYER_TABS = [
  "/dashboard/buyer",
  "/marketplace",
  "/dashboard/buyer/orders",
  "/dashboard/buyer/settings",
];

const isHorizontallyScrollable = (element: HTMLElement | null): boolean => {
  if (!element || element === document.body || element === document.documentElement) return false;
  
  const style = window.getComputedStyle(element);
  const isOverflow = style.overflowX === 'auto' || style.overflowX === 'scroll';
  
  if (isOverflow && element.scrollWidth > element.clientWidth) {
    return true;
  }
  
  if (element.classList.contains('no-swipe')) return true;
  
  return isHorizontallyScrollable(element.parentElement);
};

export default function BuyerSwipeNavigation({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prefetch all tabs for smooth transitions
    BUYER_TABS.forEach((path) => {
      router.prefetch(path);
    });
  }, [router]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: (e) => {
      if (e.event && isHorizontallyScrollable(e.event.target as HTMLElement)) return;
      
      const user = getStoredUser<{ role?: string }>();
      if (user?.role !== "buyer") return; // Only active for logged-in buyers
      
      const currentIndex = BUYER_TABS.indexOf(pathname);
      if (currentIndex !== -1 && currentIndex < BUYER_TABS.length - 1) {
        router.push(BUYER_TABS[currentIndex + 1]);
      }
    },
    onSwipedRight: (e) => {
      if (e.event && isHorizontallyScrollable(e.event.target as HTMLElement)) return;
      
      const user = getStoredUser<{ role?: string }>();
      if (user?.role !== "buyer") return; // Only active for logged-in buyers
      
      const currentIndex = BUYER_TABS.indexOf(pathname);
      if (currentIndex !== -1 && currentIndex > 0) {
        router.push(BUYER_TABS[currentIndex - 1]);
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
    delta: 30, // Make it responsive
  });

  if (!mounted) return <>{children}</>;

  // Only apply touch-pan-y if it's one of the main tabs (not child pages like order details)
  const isMainTab = BUYER_TABS.includes(pathname);

  return (
    <div
      {...swipeHandlers}
      className={`w-full h-full flex flex-col flex-1 min-h-screen ${isMainTab ? "touch-pan-y" : ""}`}
    >
      {children}
    </div>
  );
}
