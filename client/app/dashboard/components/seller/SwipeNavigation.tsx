"use client";

import { useSwipeable } from "react-swipeable";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

const SELLER_TABS = [
  "/dashboard/seller",
  "/dashboard/seller/products",
  "/dashboard/seller/promotions",
  "/dashboard/seller/reviews",
  "/dashboard/seller/settings",
];

const isHorizontallyScrollable = (element: HTMLElement | null): boolean => {
  if (!element || element === document.body || element === document.documentElement) return false;
  
  const style = window.getComputedStyle(element);
  const isOverflow = style.overflowX === 'auto' || style.overflowX === 'scroll';
  
  // Also check if it's a wrapper like a button or link with overflow hidden that we want to ignore? No, standard overflowX check is fine.
  if (isOverflow && element.scrollWidth > element.clientWidth) {
    return true;
  }
  
  // Custom escape hatch via class if we need it
  if (element.classList.contains('no-swipe')) return true;
  
  return isHorizontallyScrollable(element.parentElement);
};

export default function SwipeNavigation({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Prefetch routes so that swipe navigation feels instant
  useEffect(() => {
    SELLER_TABS.forEach((tab) => {
      router.prefetch(tab);
    });
  }, [router]);

  const handlers = useSwipeable({
    onSwipedLeft: (e) => {
      if (window.innerWidth >= 768) return;
      if (e.event && isHorizontallyScrollable(e.event.target as HTMLElement)) return;
      const currentIndex = SELLER_TABS.indexOf(pathname || "");
      if (currentIndex !== -1 && currentIndex < SELLER_TABS.length - 1) {
        router.push(SELLER_TABS[currentIndex + 1]);
      }
    },
    onSwipedRight: (e) => {
      if (window.innerWidth >= 768) return;
      if (e.event && isHorizontallyScrollable(e.event.target as HTMLElement)) return;
      const currentIndex = SELLER_TABS.indexOf(pathname || "");
      if (currentIndex !== -1 && currentIndex > 0) {
        router.push(SELLER_TABS[currentIndex - 1]);
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
    delta: 30, // Lower delta for faster triggering
    swipeDuration: 500, // Prevent slow drags from triggering a swipe
  });

  return (
    <div 
      {...handlers} 
      className="w-full h-full min-h-screen" 
      style={{ touchAction: 'pan-y' }} // Prevent browser default horizontal swipe actions (e.g. back/forward)
    >
      {children}
    </div>
  );
}
