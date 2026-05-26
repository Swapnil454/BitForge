"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/cookies";

/**
 * Smart redirect: /dashboard/settings → role-specific settings page
 * This ensures any old links or bookmarks still work correctly.
 */
export default function SettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser<{ role: string }>();
    if (!user) {
      router.replace("/login");
      return;
    }

    switch (user.role) {
      case "seller":
        router.replace("/dashboard/seller/settings");
        break;
      case "admin":
        router.replace("/dashboard/admin/settings");
        break;
      default:
        router.replace("/dashboard/buyer/settings");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
