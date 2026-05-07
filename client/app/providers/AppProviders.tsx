"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCookie, setCookie } from "@/lib/cookies";
import QueryProvider from "./QueryProvider";
import BannedModal from "@/app/components/BannedModal";
import ReactivationModal from "@/app/components/ReactivationModal";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper for the application.
 * Includes React Query and Global Account Status Guards.
 */
export default function AppProviders({ children }: AppProvidersProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [showBannedModal, setShowBannedModal] = useState(false);
  const [bannedReason, setBannedReason] = useState("");
  
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [reactivationEmail, setReactivationEmail] = useState("");

  // 1. Initial Page Load Check (from cookie)
  useEffect(() => {
    // Skip checking on public auth/report routes or the tracking dashboards
    if (
      pathname?.startsWith('/login') || 
      pathname?.startsWith('/register') || 
      pathname?.startsWith('/report') ||
      pathname === '/dashboard/buyer/reports' ||
      pathname === '/dashboard/seller/reports'
    ) {
      return;
    }

    try {
      const userStr = getCookie("user");
      if (userStr) {
        const user = JSON.stringify(userStr) === '""' ? null : JSON.parse(userStr as string);
        if (user?.accountStatus === 'banned') {
          setBannedReason(user.bannedReason || "Terms of service violation");
          setShowBannedModal(true);
        } else if (user?.accountStatus === 'deleted') {
          setReactivationEmail(user.email);
          setShowReactivationModal(true);
        }
      }
    } catch (e) {
      console.error("Error parsing user cookie:", e);
    }
  }, [pathname]);

  // 2. Global API Event Listeners (catch during active session)
  useEffect(() => {
    const handleBanned = (e: Event) => {
      const customEvent = e as CustomEvent;
      setBannedReason(customEvent.detail?.reason || "Terms of service violation");
      setShowBannedModal(true);
    };

    const handleDeleted = (e: Event) => {
      const customEvent = e as CustomEvent;
      setReactivationEmail(customEvent.detail?.email || "");
      setShowReactivationModal(true);
    };

    window.addEventListener('account-banned', handleBanned);
    window.addEventListener('account-deleted', handleDeleted);

    return () => {
      window.removeEventListener('account-banned', handleBanned);
      window.removeEventListener('account-deleted', handleDeleted);
    };
  }, []);

  const handleReactivationSuccess = (token: string, user: any) => {
    setShowReactivationModal(false);
    setCookie("token", token, 7);
    setCookie("user", JSON.stringify(user), 7);
    
    // Hard refresh to reload current page with active status
    window.location.reload();
  };

  return (
    <QueryProvider>
      {children}
      
      {showBannedModal && (
        <BannedModal 
          bannedReason={bannedReason} 
          onClose={() => setShowBannedModal(false)} 
        />
      )}
      
      {showReactivationModal && (
        <ReactivationModal 
          email={reactivationEmail} 
          onClose={() => setShowReactivationModal(false)} 
          onSuccess={handleReactivationSuccess}
        />
      )}
    </QueryProvider>
  );
}
