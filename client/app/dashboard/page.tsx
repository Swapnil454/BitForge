"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/cookies";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser<{ role?: string }>();

    if (!user) {
      router.push("/login");
      return;
    }

    const role = user.role || "buyer";
    router.push(`/dashboard/${role}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
