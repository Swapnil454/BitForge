"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Package, Search, ClipboardList, UserRound } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import MobileSearchPage from "@/app/components/buyer/search/MobileSearchPage";
import { getStoredUser } from "@/lib/cookies";

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const user = getStoredUser<{ role?: string }>();
  const isAuthenticated = !!user;

  const handleSearch = (term: string) => {
    if (term) {
      router.push(`/marketplace?search=${encodeURIComponent(term)}`);
    } else {
      router.push(`/marketplace`);
    }
  };

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };
    
    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return (
    <>
    <nav className={`fixed bottom-0 left-0 right-0 z-[500] md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] dark:shadow-none safe-area-pb transition-transform duration-200 ${isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
      <div className="flex items-center justify-around h-[72px] px-2 relative max-w-md mx-auto">
        
        <button onClick={() => { setMobileSearchOpen(false); router.push(user?.role === "seller" ? "/dashboard/seller" : "/dashboard/buyer"); }} className="flex flex-col items-center justify-center w-16 h-full gap-1 group relative">
          <Home className={`w-6 h-6 transition-colors ${((pathname === "/dashboard/buyer" || pathname === "/dashboard/seller") && !isMobileSearchOpen) ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
          <span className={`text-[10px] transition-colors ${((pathname === "/dashboard/buyer" || pathname === "/dashboard/seller") && !isMobileSearchOpen) ? "font-semibold text-blue-600 dark:text-blue-400" : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>Home</span>
          {((pathname === "/dashboard/buyer" || pathname === "/dashboard/seller") && !isMobileSearchOpen) && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
        </button>

        <button 
          onClick={(e) => {
            e.preventDefault();
            setMobileSearchOpen(true);
          }} 
          onTouchEnd={(e) => {
            e.preventDefault();
            setMobileSearchOpen(true);
          }}
          className="flex flex-col items-center justify-center w-16 h-full gap-1 group relative"
        >
          <Search className={`w-6 h-6 transition-colors ${isMobileSearchOpen ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
          <span className={`text-[10px] transition-colors ${isMobileSearchOpen ? "font-semibold text-blue-600 dark:text-blue-400" : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>Search</span>
          {isMobileSearchOpen && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
        </button>

        {/* Market Floating Button */}
        <div className="w-16 flex items-center justify-center h-full relative">
          <button 
            onClick={() => { setMobileSearchOpen(false); router.push("/marketplace"); }}
            className={`absolute -top-7 flex flex-col items-center justify-center w-16 h-16 active:scale-95 transition-all ${(pathname === "/marketplace" && !isMobileSearchOpen) ? "scale-110 drop-shadow-[0_4px_10px_rgba(79,70,229,0.4)]" : "drop-shadow-lg hover:scale-105"}`}
          >
            <img src="/marketPlace_Logo.png" alt="Market" className="w-full h-full object-contain drop-shadow-sm" />
          </button>
          <span className={`text-[10px] absolute bottom-[15px] transition-colors ${(pathname === "/marketplace" && !isMobileSearchOpen) ? "font-semibold text-indigo-600 dark:text-indigo-400" : "font-medium text-slate-500 dark:text-slate-400"}`}>Market</span>
        </div>

        <button onClick={() => { setMobileSearchOpen(false); router.push(user?.role === "seller" ? "/dashboard/seller/products" : "/dashboard/buyer/orders"); }} className="flex flex-col items-center justify-center w-16 h-full gap-1 group relative">
          {user?.role === "seller" ? (
            <Package className={`w-6 h-6 transition-colors ${(pathname === "/dashboard/seller/products" && !isMobileSearchOpen) ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
          ) : (
            <ClipboardList className={`w-6 h-6 transition-colors ${(pathname === "/dashboard/buyer/orders" && !isMobileSearchOpen) ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
          )}
          <span className={`text-[10px] transition-colors ${((pathname === "/dashboard/buyer/orders" || pathname === "/dashboard/seller/products") && !isMobileSearchOpen) ? "font-semibold text-blue-600 dark:text-blue-400" : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>{user?.role === "seller" ? "Products" : "Orders"}</span>
          {((pathname === "/dashboard/buyer/orders" || pathname === "/dashboard/seller/products") && !isMobileSearchOpen) && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
        </button>

        <button onClick={() => { setMobileSearchOpen(false); router.push("/dashboard/settings"); }} className="flex flex-col items-center justify-center w-16 h-full gap-1 group relative">
          <UserRound className={`w-6 h-6 transition-colors ${(pathname === "/dashboard/settings" && !isMobileSearchOpen) ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
          <span className={`text-[10px] transition-colors ${(pathname === "/dashboard/settings" && !isMobileSearchOpen) ? "font-semibold text-blue-600 dark:text-blue-400" : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>Account</span>
          {(pathname === "/dashboard/settings" && !isMobileSearchOpen) && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
        </button>

      </div>
    </nav>
    {mounted && isMobileSearchOpen && createPortal(
      <MobileSearchPage
        isAuthenticated={isAuthenticated}
        onSearch={handleSearch}
        onClose={() => setMobileSearchOpen(false)}
      />,
      document.body
    )}
    </>
  );
}
