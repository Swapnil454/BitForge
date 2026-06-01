"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
import { useEffect, useState, useMemo, type MouseEvent, type ReactNode } from "react";
import { marketplaceAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import GlobalHeader from "../components/GlobalHeader";
import TrendingProductsMarquee from "../components/TrendingProductsMarquee";
import FaqSection from "../components/FaqSection";

type MarketplaceProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  category?: string;
  thumbnailUrl?: string;
};

/* ================= MOBILE DETECTION HOOK ================= */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for mobile via media query and touch capability
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsMobile(isTouchDevice || isSmallScreen || prefersReducedMotion);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/* ================= MAGNETIC BUTTON ================= */

function MagneticButton({
  children,
  className,
  isMobile = false,
}: {
  children: ReactNode;
  className: string;
  isMobile?: boolean;
}) {
  const x = useSpring(0, { stiffness: 300, damping: 20 });
  const y = useSpring(0, { stiffness: 300, damping: 20 });

  function onMove(e: MouseEvent<HTMLButtonElement>) {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.25);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.25);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  // On mobile, render a simple button without motion
  if (isMobile) {
    return (
      <button className={className}>
        {children}
      </button>
    );
  }

  return (
    <motion.button
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x, y }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ================= PAGE ================= */

export default function LandingPage() {
  const { scrollY } = useScroll();
  const [activePlan, setActivePlan] = useState("Pro");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    const user = getStoredUser<{ role?: string }>();
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  }, []);

  /* header visuals - only compute on desktop */
  const headerBg = useTransform(
    scrollY,
    [0, 60],
    ["rgba(5,5,10,0.7)", "rgba(5,5,10,0.95)"]
  );
  const headerShadow = useTransform(
    scrollY,
    [0, 60],
    ["0 0 0 rgba(0,0,0,0)", "0 10px 40px rgba(0,0,0,0.75)"]
  );

  /* cursor glow - disabled on mobile */
  const mouseX = useSpring(0, { stiffness: 120, damping: 30 });
  const mouseY = useSpring(0, { stiffness: 120, damping: 30 });

  /* cursor glow background - computed unconditionally to satisfy hooks rules */
  const cursorGlowBg = useTransform(
    [mouseX, mouseY],
    ([x, y]) =>
      `radial-gradient(420px at ${x}px ${y}px, rgba(99,102,241,0.15), transparent 70%)`
  );

  useEffect(() => {
    if (isMobile) return; // Skip mouse tracking on mobile
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move as any);
    return () => window.removeEventListener("mousemove", move as any);
  }, [mouseX, mouseY, isMobile]);



  const handleFooterMarketplaceClick = () => {
    const target = "/marketplace";
    const user = getStoredUser<{ role?: string }>();

    if (!user) {
      const next = encodeURIComponent(target);
      router.push(`/login?next=${next}`);
      return;
    }

    const role = user.role || "buyer";

    if (role !== "buyer") {
      router.push(`/dashboard/${role}`);
      return;
    }

    router.push(target);
  };

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white overflow-x-hidden">
      {/* CURSOR GLOW - Only on desktop */}
      {!isMobile && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: cursorGlowBg }}
        />
      )}

      <ParallaxBackground scrollY={scrollY} isMobile={isMobile} />

      <GlobalHeader />

      <section className="relative z-10 max-w-4xl mx-auto px-5 md:px-6 pt-24 pb-10 md:pt-28 md:pb-12 flex flex-col items-center text-center">
        {/* Trust Badge */}
        <div className="mt-4 mb-5 inline-flex flex-row items-center gap-2 sm:gap-3 rounded-full border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-medium shadow-sm backdrop-blur-md whitespace-nowrap">
          <div className="flex -space-x-2">
            <Image src="https://randomuser.me/api/portraits/women/44.jpg" alt="Creator" width={24} height={24} unoptimized className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white dark:border-[#05050a] object-cover" />
            <Image src="https://randomuser.me/api/portraits/men/32.jpg" alt="Creator" width={24} height={24} unoptimized className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white dark:border-[#05050a] object-cover" />
            <Image src="https://randomuser.me/api/portraits/women/68.jpg" alt="Creator" width={24} height={24} unoptimized className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white dark:border-[#05050a] object-cover" />
            <Image src="https://randomuser.me/api/portraits/men/46.jpg" alt="Creator" width={24} height={24} unoptimized className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white dark:border-[#05050a] object-cover" />
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border-2 border-white dark:border-[#05050a] bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-600 dark:text-white">
              +
            </div>
          </div>
          <span className="text-slate-600 dark:text-white/80 pr-1">Over 500+ creators trust BitForge.</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-black leading-tight tracking-tight mb-6 flex flex-col items-center">
          <span className="text-[32px] sm:text-[44px] md:text-[56px] text-slate-900 dark:text-white mb-1">
            Meet the Best
          </span>
          <span className="text-[44px] sm:text-[56px] md:text-[72px] leading-tight text-center">
            <span className="text-cyan-400">BitForge </span>
            <span className="text-indigo-400">
              digital product marketplace.
            </span>
          </span>
        </h1>

        {/* Checkmarks */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mb-12 text-sm sm:text-base font-medium text-slate-600 dark:text-white/80">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            Low platform fees
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            Instant delivery
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            Secure payments
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            Creator analytics
          </div>
        </div>

        {/* Primary CTA */}
        <Link
          href="/marketplace"
          className="inline-block rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-bold text-white shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:from-cyan-300 hover:to-indigo-400 hover:shadow-[0_0_40px_rgba(56,189,248,0.6)] hover:-translate-y-1 transition-all duration-300"
        >
          Start exploring now
        </Link>
      </section>

      <TrendingProductsMarquee />

      <section className="relative z-10 py-16 sm:py-20">
        <h2 className="text-center text-3xl md:text-4xl font-black mb-10 sm:mb-12">
          Built for Buyers & Sellers
        </h2>

        <div className="max-w-5xl mx-auto px-5 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* BUYER CARD */}
          <div className="flex flex-col rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#12121a] backdrop-blur-xl hover:border-cyan-400/50 transition-all duration-300 md:hover:-translate-y-1.5 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Buyers</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-white/60 mb-5 sm:mb-6">
              Discover and access digital products with zero friction.
            </p>
            <ul className="space-y-3 text-sm sm:text-base text-slate-700 dark:text-white/80">
              <li className="flex items-center gap-3"><span className="text-indigo-500 font-bold text-lg leading-none">✔</span> 800+ products available right now</li>
              <li className="flex items-center gap-3"><span className="text-indigo-500 font-bold text-lg leading-none">✔</span> 4,200+ successful purchases</li>
              <li className="flex items-center gap-3"><span className="text-indigo-500 font-bold text-lg leading-none">✔</span> Instant Access</li>
              <li className="flex items-center gap-3"><span className="text-indigo-500 font-bold text-lg leading-none">✔</span> Verified Products</li>
            </ul>
            <div className="mt-auto pt-8">
              <p className="text-cyan-400 text-sm mb-4 font-medium">
                Browse as guest — no account needed to explore
              </p>
              <Link href="/marketplace" className="block w-full text-center rounded-xl bg-slate-800 dark:bg-white/10 hover:bg-slate-700 dark:hover:bg-white/20 px-6 py-4 text-sm font-bold text-white transition-all">
                Browse Marketplace →
              </Link>
              <p className="text-center text-xs opacity-0 mt-3 font-medium pointer-events-none select-none">
                Placeholder
              </p>
            </div>
          </div>

          {/* SELLER CARD */}
          <div className="flex flex-col rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#12121a] backdrop-blur-xl hover:border-indigo-400/50 transition-all duration-300 md:hover:-translate-y-1.5 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Sellers</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-white/60 mb-5 sm:mb-6">
              Launch, sell, and scale your digital products with ease.
            </p>
            <ul className="space-y-3 text-sm sm:text-base text-slate-700 dark:text-white/80">
              <li className="flex items-center gap-3"><span className="text-indigo-500 font-bold text-lg leading-none">✔</span> ₹12L+ paid out to sellers</li>
              <li className="flex items-center gap-3"><span className="text-indigo-500 font-bold text-lg leading-none">✔</span> Avg seller earns ₹4,200/month</li>
              <li className="flex items-center gap-3"><span className="text-indigo-500 font-bold text-lg leading-none">✔</span> Low Platform Fees</li>
              <li className="flex items-center gap-3"><span className="text-indigo-500 font-bold text-lg leading-none">✔</span> Instant Publishing</li>
            </ul>
            <div className="mt-auto pt-8">
              <p className="text-indigo-400 text-sm mb-4 font-medium">
                First product live in under 10 minutes
              </p>
              <Link href="/register?role=seller" className="block w-full text-center rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 px-6 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all">
                Start Selling Free →
              </Link>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
                1,200 Creators Already Selling
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 -mt-28">
        <h2 className="text-center text-3xl md:text-4xl font-black mb-12">
          Loved by Creators
        </h2>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-5 md:px-6">
          {testimonials.map((t, i) =>
            isMobile ? (
              <div
                key={i}
                className="rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 backdrop-blur-xl animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <p className="text-slate-600 dark:text-white/70">“{t.quote}”</p>
                <p className="mt-4 font-semibold">{t.name}</p>
                <p className="text-sm text-white/50">{t.role}</p>
              </div>
            ) : (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 backdrop-blur-xl"
              >
                <p className="text-slate-600 dark:text-white/70">“{t.quote}”</p>
                <p className="mt-4 font-semibold">{t.name}</p>
                <p className="text-sm text-white/50">{t.role}</p>
              </motion.div>
            )
          )}
        </div>
      </section>

      <FaqSection />

      <section className="relative z-10 pt-6 pb-24 text-center px-5">
        <h2 className="text-4xl md:text-5xl font-black">
          Ready to turn your skills into<br className="hidden sm:block" /> income?
        </h2>
        <p className="mt-4 text-slate-600 dark:text-white/70 max-w-2xl mx-auto">
          Join 800+ creators building their digital empire on BitForge. Start selling your digital products to a global audience today.
        </p>

        <MagneticButton isMobile={isMobile} className="mt-8 rounded-xl bg-linear-to-r from-cyan-400 to-indigo-500 px-9 py-4 text-lg font-bold text-black shadow-[0_0_60px_rgba(56,189,248,0.6)]">
          <Link href={"/register?role=seller"}>Create Your Free Store</Link>
        </MagneticButton>
      </section>

      <footer className="-mt-12 relative z-10 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur">
        {/* subtle top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

        <div className="mx-auto max-w-6xl px-4 md:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 space-y-8 sm:space-y-10">
          {/* Top row: columns */}
          <div className="flex flex-col md:flex-row gap-8 sm:gap-10 md:gap-16 justify-between">
            {/* BitForge column */}
            <div className="md:max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-semibold tracking-tight">BitForge</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500 dark:text-white/60">
                  Digital Marketplace
                </span>
              </div>
              {/* Mobile: short one-liner for better scanability */}
              <p className="text-[13px] text-slate-500 dark:text-white/60 sm:hidden">
                A secure digital marketplace for creators and buyers.
              </p>
              {/* Desktop / tablet: full trust-focused paragraph */}
              <p className="hidden text-sm text-slate-500 dark:text-white/60 sm:block">
                A modern digital marketplace where creators sell and buyers securely purchase digital products with instant access and transparent payouts.
              </p>

              {/* Mobile-only socials directly under brand for early trust */}
              <div className="mt-4 flex items-center gap-3 text-slate-500 dark:text-white/60 sm:hidden">
                <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-white/40">
                  Socials
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/Swapnil454"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on GitHub"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.82.58C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0Z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/swapnil-shelke-178096366"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on LinkedIn"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.25 8.25h4.5V24h-4.5V8.25zM8.75 8.25h4.31v2.14h.06c.6-1.14 2.06-2.34 4.23-2.34 4.52 0 5.36 2.98 5.36 6.86V24h-4.5v-7.14c0-1.7-.03-3.88-2.36-3.88-2.36 0-2.72 1.84-2.72 3.75V24h-4.5V8.25z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com/bitforge.in"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on Instagram"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M12 2.16c3.2 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.4.61.24 1.04.53 1.49.98.45.45.74.88.98 1.49.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.01 3.584-.07 4.85c-.05 1.17-.24 1.97-.4 2.43-.24.61-.53 1.04-.98 1.49-.45.45-.88.74-1.49.98-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.584-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4-.61-.24-1.04-.53-1.49-.98-.45-.45-.74-.88-.98-1.49-.16-.46-.35-1.26-.4-2.43C2.17 15.78 2.16 15.4 2.16 12s.01-3.584.07-4.85c.05-1.17.24-1.97.4-2.43.24-.61.53-1.04.98-1.49.45-.45.88-.74 1.49-.98.46-.16 1.26-.35 2.43-.4C8.42 2.17 8.8 2.16 12 2.16m0-2.16C8.74 0 8.332.012 7.052.07 5.77.129 4.78.322 3.96.65 3.11.99 2.39 1.46 1.68 2.17.97 2.88.5 3.6.16 4.45c-.33.82-.52 1.81-.58 3.09C-.01 8.82 0 9.23 0 12c0 2.77-.01 3.18.08 4.46.06 1.28.25 2.27.58 3.09.34.85.81 1.57 1.52 2.28.71.71 1.43 1.18 2.28 1.52.82.33 1.81.52 3.09.58C8.82 23.99 9.23 24 12 24s3.18-.01 4.46-.08c1.28-.06 2.27-.25 3.09-.58.85-.34 1.57-.81 2.28-1.52.71-.71 1.18-1.43 1.52-2.28.33-.82.52-1.81.58-3.09.07-1.28.08-1.69.08-4.46s-.01-3.18-.08-4.46c-.06-1.28-.25-2.27-.58-3.09-.34-.85-.81-1.57-1.52-2.28C21.63 1.46 20.91.99 20.06.65 19.24.32 18.25.13 16.97.07 15.69.01 15.26 0 12 0z" />
                      <path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.15 6.15 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z" />
                      <circle cx="18.4" cy="5.6" r="1.44" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/me_swapnailed_"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on X"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-110"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M3 3h4.9l4.6 6.2L18.1 3H21l-7.1 8.5L21.6 21h-4.9l-5-6.7L5.3 21H2.4l7.5-9L3 3Zm3.2 1.6 10.8 14.8h1.8L8 4.6H6.2Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 sm:gap-12 text-[13px] sm:text-sm">
              <div>
                <h4 className="mb-2 sm:mb-3 text-[11px] sm:text-xs font-bold tracking-wide text-slate-500 dark:text-white/60 uppercase">
                  Product
                </h4>
                <ul className="space-y-3 text-slate-500 dark:text-white/60">
                  <li>
                    <Link href="/marketplace" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      Marketplace
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      For Buyers
                    </Link>
                  </li>
                  <li>
                    <Link href="/register?role=seller" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      For Sellers
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 sm:mb-3 text-[11px] sm:text-xs font-bold tracking-wide text-slate-500 dark:text-white/60 uppercase">
                  Company
                </h4>
                <ul className="space-y-3 text-slate-500 dark:text-white/60">
                  <li>
                    <Link href="/about" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 sm:mb-3 text-[11px] sm:text-xs font-bold tracking-wide text-slate-500 dark:text-white/60 uppercase">
                  Legal
                </h4>
                <ul className="space-y-3 text-slate-500 dark:text-white/60">
                  <li>
                    <Link href="/legal/terms-and-conditions" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      Terms &amp; Conditions
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/privacy-policy" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/refund-cancellation-policy" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      Refund &amp; Cancellation Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/trust-center" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      Trust Center
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 sm:mb-3 text-[11px] sm:text-xs font-bold tracking-wide text-slate-500 dark:text-white/60 uppercase">
                  Resources
                </h4>
                <ul className="space-y-3 text-slate-500 dark:text-white/60">
                  <li>
                    <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      Docs
                    </Link>
                  </li>
                  <li>
                    <Link href="/status" className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-2 transition">
                      Status
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-3 text-xs sm:text-[13px] text-white/50">
            <p className="text-[11px] text-slate-400 dark:text-white/40">
              Secure payments powered by trusted payment partners.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <a
                  href="mailto:help@bittforge.in"
                  className="text-[13px] font-medium text-slate-700 dark:text-white/80 hover:text-cyan-400 hover:underline underline-offset-2 cursor-pointer transition"
                >
                  help@bittforge.in
                </a>
                <span className="text-[11px] text-white/45">
                  © {new Date().getFullYear()} BitForge. All rights reserved.
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-slate-500 dark:text-white/60">
                <span className="text-[14px] uppercase tracking-wide text-slate-400 dark:text-white/40">
                  Socials
                </span>
                <div className="flex items-center gap-4">
                  <a
                    href="https://github.com/Swapnil454"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on GitHub"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 fill-current"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.82.58C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0Z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/swapnil-shelke-178096366"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on LinkedIn"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 fill-current"
                    >
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.25 8.25h4.5V24h-4.5V8.25zM8.75 8.25h4.31v2.14h.06c.6-1.14 2.06-2.34 4.23-2.34 4.52 0 5.36 2.98 5.36 6.86V24h-4.5v-7.14c0-1.7-.03-3.88-2.36-3.88-2.36 0-2.72 1.84-2.72 3.75V24h-4.5V8.25z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com/bitforge.in"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on Instagram"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 fill-current"
                    >
                      <path d="M12 2.16c3.2 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.4.61.24 1.04.53 1.49.98.45.45.74.88.98 1.49.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.01 3.584-.07 4.85c-.05 1.17-.24 1.97-.4 2.43-.24.61-.53 1.04-.98 1.49-.45.45-.88.74-1.49.98-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.584-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4-.61-.24-1.04-.53-1.49-.98-.45-.45-.74-.88-.98-1.49-.16-.46-.35-1.26-.4-2.43C2.17 15.78 2.16 15.4 2.16 12s.01-3.584.07-4.85c.05-1.17.24-1.97.4-2.43.24-.61.53-1.04.98-1.49.45-.45.88-.74 1.49-.98.46-.16 1.26-.35 2.43-.4C8.42 2.17 8.8 2.16 12 2.16m0-2.16C8.74 0 8.332.012 7.052.07 5.77.129 4.78.322 3.96.65 3.11.99 2.39 1.46 1.68 2.17.97 2.88.5 3.6.16 4.45c-.33.82-.52 1.81-.58 3.09C-.01 8.82 0 9.23 0 12c0 2.77-.01 3.18.08 4.46.06 1.28.25 2.27.58 3.09.34.85.81 1.57 1.52 2.28.71.71 1.43 1.18 2.28 1.52.82.33 1.81.52 3.09.58C8.82 23.99 9.23 24 12 24s3.18-.01 4.46-.08c1.28-.06 2.27-.25 3.09-.58.85-.34 1.57-.81 2.28-1.52.71-.71 1.18-1.43 1.52-2.28.33-.82.52-1.81.58-3.09.07-1.28.08-1.69.08-4.46s-.01-3.18-.08-4.46c-.06-1.28-.25-2.27-.58-3.09-.34-.85-.81-1.57-1.52-2.28C21.63 1.46 20.91.99 20.06.65 19.24.32 18.25.13 16.97.07 15.69.01 15.26 0 12 0z" />
                      <path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.15 6.15 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z" />
                      <circle cx="18.4" cy="5.6" r="1.44" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/me_swapnailed_"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on X"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-110"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 fill-current"
                    >
                      <path d="M3 3h4.9l4.6 6.2L18.1 3H21l-7.1 8.5L21.6 21h-4.9l-5-6.7L5.3 21H2.4l7.5-9L3 3Zm3.2 1.6 10.8 14.8h1.8L8 4.6H6.2Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}

function ParallaxBackground({ scrollY, isMobile }: { scrollY: any; isMobile: boolean }) {
  const y1 = useTransform(scrollY, [0, 600], [0, 160]);
  const y2 = useTransform(scrollY, [0, 600], [0, -160]);

  // On mobile, render static elements without parallax animation
  if (isMobile) {
    return (
      <>
        <div className="absolute -top-40 -left-40 w-125 h-125 rounded-full bg-indigo-600/25 blur-[160px] z-0" />
        <div className="absolute top-1/3 -right-40 w-145 h-145 rounded-full bg-cyan-500/20 blur-[180px] z-0" />
      </>
    );
  }

  return (
    <>
      <motion.div
        style={{ y: y1 }}
        className="absolute -top-40 -left-40 w-125 h-125 rounded-full bg-indigo-600/25 blur-[160px] z-0"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute top-1/3 -right-40 w-145 h-145 rounded-full bg-cyan-500/20 blur-[180px] z-0"
      />
    </>
  );
}

const testimonials = [
  {
    name: "Aarav Patel",
    role: "Buyer",
    quote: "As a buyer, BitForge feels incredibly smooth — from payment to instant download.",
  },
  {
    name: "Neha Sharma",
    role: "UI Designer",
    quote: "I launched my first product in a day. The experience is unreal.",
  },
  {
    name: "Rohit Verma",
    role: "Full-stack Developer",
    quote: "Payments, payouts, downloads — everything just works.",
  },
];