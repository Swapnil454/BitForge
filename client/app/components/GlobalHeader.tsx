"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/cookies";

export default function GlobalHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const user = getStoredUser<{ role?: string }>();
    if (user) setCurrentUser(user);

    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    checkMobile();
    handleScroll();
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (isMobile) {
    return (
      <header
        className="
          fixed top-4 left-4 right-4 z-[100]
          h-16
          backdrop-blur-xl
          border border-slate-200 dark:border-white/10
          rounded-2xl
          bg-white/95 dark:bg-[rgba(5,5,10,0.95)]
          shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.75)]
        "
      >
        <nav className="h-full px-5 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              BitForge
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href={currentUser.role === 'buyer' ? '/marketplace' : `/dashboard/${currentUser.role}`}
                className="rounded-full border border-slate-200 dark:border-white/20 bg-transparent px-4 py-1.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200 dark:border-white/20 bg-transparent px-4 py-1.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-1.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:from-cyan-300 hover:to-indigo-400 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header
      className={`
        fixed left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-[100]
        transition-all duration-300
        rounded-2xl
        ${isScrolled 
          ? "top-4 h-16 bg-white/90 dark:bg-black/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]" 
          : "top-6 h-20 bg-transparent border border-transparent"}
      `}
    >
      <nav className="h-full px-6 flex items-center justify-between relative">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            BitForge
          </Link>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          <Link href="/marketplace" className="text-sm font-semibold text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">Marketplace</Link>
          <Link href="/about" className="text-sm font-semibold text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors">About Us</Link>
          <Link href="/careers" className="text-sm font-semibold text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors">Careers</Link>
          <Link href="/docs" className="text-sm font-semibold text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">Resource</Link>
          <Link href="/contact" className="text-sm font-semibold text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link>
          <Link href="/trust-center" className="text-sm font-semibold text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors">Trust Center</Link>
        </div>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <Link
              href={currentUser.role === 'buyer' ? '/marketplace' : `/dashboard/${currentUser.role}`}
              className="rounded-full border border-slate-200 dark:border-white/20 bg-transparent px-5 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 dark:border-white/20 bg-transparent px-5 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:from-cyan-300 hover:to-indigo-400 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
