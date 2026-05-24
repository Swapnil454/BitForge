"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getStoredUser } from "@/lib/cookies";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

interface User {
  role: string;
}

interface DynamicHeaderProps {
  title: string;
}

export default function DynamicHeader({ title }: DynamicHeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser<User>());
    setLoading(false);
  }, []);

  if (loading) return <div className="fixed top-0 left-0 right-0 h-16 sm:h-20 z-40 bg-slate-50 dark:bg-[#05050a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10" />; 

  if (user) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50">
        <PageHeader 
          title={title} 
          backHref="/dashboard/settings?tab=main"
        />
      </div>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05050a]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/bitforge_logo1.png"
            alt="BitForge logo"
            width={256}
            height={256}
            className="h-10 w-auto sm:h-12 drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]"
            priority
          />
          <span className="-ml-3 text-lg font-bold tracking-tight sm:-ml-4 sm:text-2xl bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
            BitForge
          </span>
          <span className="hidden mt-2 items-center rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-white/60 sm:inline-flex">
            Digital Marketplace
          </span>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 dark:border-white/20 px-3 py-1.5 text-slate-700 dark:text-white/80 hover:border-cyan-400 hover:text-slate-900 dark:hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-cyan-400 to-indigo-500 px-3 py-1.5 font-semibold text-black shadow-[0_0_20px_rgba(56,189,248,0.6)]"
          >
            Join BitForge
          </Link>
        </div>
      </nav>
    </header>
  );
}
