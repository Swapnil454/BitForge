"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import Link from "next/link";

export function BackButton() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <button
        onClick={() => router.back()}
        className="font-medium text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-white transition-colors"
      >
        ← Back to BitForge
      </button>
    );
  }

  return (
    <Link
      href="/"
      className="font-medium text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-white transition-colors"
    >
      ← Back to BitForge
    </Link>
  );
}
