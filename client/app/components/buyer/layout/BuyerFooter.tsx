"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

const footerLinks = {
  company: [
    { label: "About Us",    href: "/about" },
    { label: "Contact",     href: "/contact" },
    { label: "Careers",     href: "/careers" },
  ],
  legal: [
    { label: "Terms & Conditions",       href: "/legal/terms-and-conditions" },
    { label: "Privacy Policy",           href: "/legal/privacy-policy" },
    { label: "Refund & Cancellation",    href: "/legal/refund-cancellation-policy" },
    { label: "Trust Center",             href: "/trust-center" },
    { label: "Seller Terms",             href: "/seller-terms" },
  ],
  resources: [
    { label: "Docs",        href: "/docs" },
    { label: "Status",      href: "/status" },
    { label: "Marketplace", href: "/marketplace?collection=All" },
  ],
};

export default function BuyerFooter() {
  const { isAuthenticated, user } = useAuth();

  const helpCenterHref = isAuthenticated
    ? user?.role === "seller"
      ? "/dashboard/seller/help-center"
      : "/dashboard/buyer/help-center"
    : "/contact";

  return (
    <footer className="bg-white dark:bg-[#0A1628] border-t border-gray-100 dark:border-slate-800/60 pt-6 md:pt-12 pb-4 md:pb-6 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-6 md:gap-8 lg:gap-10 mb-6 md:mb-12">

          {/* Brand – spans 2 cols */}
          <div className="col-span-2 md:col-span-2 flex flex-col gap-3 md:gap-4">
            {/* Logo + wordmark */}
            <Link href="/marketplace" className="flex items-center w-fit group -ml-2">
              <div className="w-14 h-14 sm:w-20 sm:h-20 relative flex-shrink-0">
                <Image
                  src="/bitforge_logo1.png"
                  alt="Bitforge logo"
                  fill
                  className="object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.3)] scale-125"
                  priority
                />
              </div>
              <span className="text-xl sm:text-3xl -ml-2 sm:-ml-4 font-extrabold tracking-tight text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                BitForge
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-[11px] md:text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-[260px] md:max-w-xs -mt-2">
              Discover and purchase premium digital products. Build your skills,
              launch your projects, and grow faster.
            </p>

            {/* Trust badges — text only, no icons */}
            <div className="flex flex-wrap gap-2 mt-0.5">
              <span className="text-[9px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                Secure Checkout
              </span>
              <span className="text-[9px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                99.9% Uptime
              </span>
            </div>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-2 md:gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Company
            </h3>
            <ul className="flex flex-col gap-1.5 md:gap-3">
              {footerLinks.company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[11px] md:text-sm text-gray-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={helpCenterHref} className="text-[11px] md:text-sm text-gray-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2 md:gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Legal
            </h3>
            <ul className="flex flex-col gap-1.5 md:gap-3">
              {footerLinks.legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[11px] md:text-sm text-gray-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-2 md:gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Resources
            </h3>
            <ul className="flex flex-col gap-1.5 md:gap-3">
              {footerLinks.resources.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[11px] md:text-sm text-gray-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
              {isAuthenticated && (
                <li>
                  <Link href="/wishlist" className="text-[11px] md:text-sm text-gray-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    My Wishlist
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Socials */}
          <div className="flex flex-col gap-2 md:gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Socials
            </h3>
            <div className="flex items-center gap-3 md:gap-4 mt-1">
              <a
                href="https://github.com/Swapnil454"
                target="_blank"
                rel="noreferrer"
                aria-label="BitForge on GitHub"
                className="text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-110"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 md:h-6 md:w-6 fill-current">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.82.58C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0Z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/swapnil-shelke-178096366"
                target="_blank"
                rel="noreferrer"
                aria-label="BitForge on LinkedIn"
                className="text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-110"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 md:h-6 md:w-6 fill-current">
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.25 8.25h4.5V24h-4.5V8.25zM8.75 8.25h4.31v2.14h.06c.6-1.14 2.06-2.34 4.23-2.34 4.52 0 5.36 2.98 5.36 6.86V24h-4.5v-7.14c0-1.7-.03-3.88-2.36-3.88-2.36 0-2.72 1.84-2.72 3.75V24h-4.5V8.25z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/bitforge.in"
                target="_blank"
                rel="noreferrer"
                aria-label="BitForge on Instagram"
                className="text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-110"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 md:h-6 md:w-6 fill-current">
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
                className="text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-110"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 md:h-6 md:w-6 fill-current">
                  <path d="M3 3h4.9l4.6 6.2L18.1 3H21l-7.1 8.5L21.6 21h-4.9l-5-6.7L5.3 21H2.4l7.5-9L3 3Zm3.2 1.6 10.8 14.8h1.8L8 4.6H6.2Z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-gray-100 dark:border-slate-800/60 pt-3 md:pt-5 flex flex-col sm:flex-row justify-between items-center gap-2 md:gap-3">
          <p className="text-[10px] md:text-xs text-gray-400 dark:text-slate-500 text-center sm:text-left">
            © {new Date().getFullYear()} BitForge Technologies. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5">
            <Link href="/legal/privacy-policy"        className="text-[10px] md:text-xs text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacy</Link>
            <Link href="/legal/terms-and-conditions"  className="text-[10px] md:text-xs text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Terms</Link>
            <Link href="/status"                      className="text-[10px] md:text-xs text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Status</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
