"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminMobileNav from "../components/admin/AdminMobileNav";

const NAV_ROUTES = [
  "/dashboard/admin",
  "/dashboard/admin/products",
  "/dashboard/admin/promotions",
  "/dashboard/admin/security",
  "/dashboard/admin/reviews",
  "/dashboard/admin/inquiries",
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [touchStartPos, setTouchStartPos] = useState<number | null>(null);
  const [touchEndPos, setTouchEndPos] = useState<number | null>(null);

  const minSwipeDistance = 75; // px

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndPos(null);
    setTouchStartPos(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndPos(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = (e: React.TouchEvent) => {
    if (!touchStartPos || !touchEndPos) return;
    
    // Ignore horizontal scrolling elements
    if (isHorizontallyScrollable(e.target as HTMLElement)) return;
    
    const distance = touchStartPos - touchEndPos;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      let currentIndex = -1;
      
      // Determine current index based on pathname
      for (let i = 0; i < NAV_ROUTES.length; i++) {
        const route = NAV_ROUTES[i];
        if (pathname === route) {
          currentIndex = i;
          break;
        } else if (route !== "/dashboard/admin" && (pathname || "").startsWith(route)) {
          currentIndex = i;
          break;
        }
      }

      if (currentIndex !== -1) {
        if (isLeftSwipe && currentIndex < NAV_ROUTES.length - 1) {
          router.push(NAV_ROUTES[currentIndex + 1]);
        } else if (isRightSwipe && currentIndex > 0) {
          router.push(NAV_ROUTES[currentIndex - 1]);
        }
      }
    }
  };

  return (
    <div 
      className="relative min-h-screen pb-16 md:pb-0"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >
      {children}
      <AdminMobileNav />
    </div>
  );
}
