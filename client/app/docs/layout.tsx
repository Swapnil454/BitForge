"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Rocket, Briefcase, Radio, Settings, BookOpen } from "lucide-react";
import TableOfContents from "./components/TableOfContents";
import { getStoredUser } from "@/lib/cookies";

const docsSections = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "API Keys Setup", href: "/docs/api-keys-setup" },
      { title: "Bank Account Setup", href: "/docs/bank-account-setup" },
      { title: "OAuth Setup", href: "/docs/oauth-setup" },
    ],
  },
  {
    title: "For Sellers",
    icon: Briefcase,
    items: [
      { title: "Product Management", href: "/docs/product-management" },
      { title: "Payout System", href: "/docs/payout-system" },
      { title: "Product Changes", href: "/docs/product-changes" },
      { title: "Upload Solutions", href: "/docs/upload-solutions" },
      { title: "Approved Changes", href: "/docs/approved-changes" },
      { title: "Account Deletion", href: "/docs/seller-deletion" },
    ],
  },
  {
    title: "API Reference",
    icon: Radio,
    items: [
      { title: "Products API", href: "/docs/api/products" },
      { title: "Payouts API", href: "/docs/api/payouts" },
      { title: "Orders API", href: "/docs/api/orders" },
      { title: "Authentication", href: "/docs/api/authentication" },
      { title: "Webhooks", href: "/docs/webhooks" },
    ],
  },
  {
    title: "Admin Guides",
    icon: Settings,
    items: [
      { title: "Admin Payout Guide", href: "/docs/admin/payouts" },
      { title: "Product Management", href: "/docs/admin/products" },
      { title: "User Management", href: "/docs/admin/users" },
      { title: "Analytics", href: "/docs/admin/analytics" },
      { title: "Content Moderation", href: "/docs/admin/moderation" },
      { title: "System Settings", href: "/docs/admin/settings" },
    ],
  },
  {
    title: "Platform Guides",
    icon: BookOpen,
    items: [
      { title: "Security Best Practices", href: "/docs/security" },
      { title: "Rate Limits", href: "/docs/rate-limits" },
      { title: "Testing Guide", href: "/docs/testing" },
      { title: "Troubleshooting", href: "/docs/troubleshooting" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{ role?: string } | null>(null);

  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const isActive = (href: string) => normalizedPath === href;
  const docsHomeActive = normalizedPath === "/docs";
  const docsItemMatch = docsSections.flatMap((section) => section.items).find((item) => item.href === normalizedPath);
  const currentHeaderTitle =
    normalizedPath === "/docs"
      ? "Documentation"
      : docsItemMatch?.title ||
        (
          {
            "/contact": "Contact Support",
            "/trust-center": "Trust Center",
            "/status": "System Status",
          } as Record<string, string>
        )[normalizedPath] ||
        "Documentation";

  useEffect(() => {
    setUser(getStoredUser<{ role?: string }>());
    setAuthChecked(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 h-14 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05050a]/85 backdrop-blur-xl">
        <nav className="relative mx-auto flex h-full max-w-[1800px] items-center justify-between px-4 md:px-6">
          {authChecked && user ? (
            <>
              <button
                onClick={() => {
                  if (docsHomeActive) {
                    const role = user.role || "";
                    if (role === "admin") router.push("/dashboard/admin");
                    else if (role === "seller") router.push("/dashboard/seller");
                    else if (role === "buyer") router.push("/dashboard/buyer");
                    else router.push("/dashboard");
                    return;
                  }
                  router.push("/docs");
                }}
                className="inline-flex items-center gap-1 text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition"
                aria-label="Back"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Back</span>
              </button>

              <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-cyan-400 dark:via-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {currentHeaderTitle}
              </h1>

              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden"
                aria-label="Open docs menu"
                aria-expanded={sidebarOpen}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/bitforge_logo1.png"
                    alt="BitForge"
                    width={40}
                    height={40}
                    className="h-7 w-auto drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]"
                  />
                  <span className="-ml-2 text-lg font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                    BitForge
                  </span>
                </Link>
                <span className="hidden md:block text-sm text-slate-400 dark:text-white/40"><Link href="/docs">/ Docs</Link></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden"
                  aria-label="Open docs menu"
                  aria-expanded={sidebarOpen}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <Link
                  href="/"
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Home
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 dark:border-white/20 px-3 py-1.5 text-sm text-slate-700 dark:text-white/80 hover:border-cyan-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </nav>
      </header>

      <div className="mx-auto max-w-[1800px]">
        <div className="flex">
          {/* Left Sidebar - Navigation */}
          <aside
            className={`
              fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-72 overflow-y-auto border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05050a]/95 backdrop-blur-xl
              transition-transform duration-300 lg:sticky lg:translate-x-0
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20
            `}
          >
            <div className="p-4 space-y-6">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200/60 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-2 pl-9 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:border-indigo-400/50 dark:focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:focus:ring-cyan-400/20 shadow-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40">

                </span>
              </div>

              {/* Navigation */}
              {docsSections.map((section) => {
                // Filter items based on search query
                const filteredItems = section.items.filter((item) =>
                  item.title.toLowerCase().includes(searchQuery.toLowerCase())
                );

                // Only show section if it has matching items or search is empty
                if (filteredItems.length === 0 && searchQuery) return null;

                return (
                  <div key={section.title}>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/50">
                      {
                        (() => {
                          const IconComponent = section.icon;
                          return <IconComponent className="w-4 h-4" />;
                        })()
                      }
                      {section.title}
                    </h3>
                    <ul className="space-y-1">
                      {filteredItems.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              block rounded-lg px-3 py-2 text-sm transition-all
                              ${isActive(item.href)
                                ? "bg-indigo-50 dark:bg-cyan-500/10 text-indigo-600 dark:text-cyan-300 font-medium"
                                : "text-slate-600 dark:text-white/70 hover:bg-indigo-50/50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white"
                              }
                            `}
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {/* No results message */}
              {searchQuery && !docsSections.some(section =>
                section.items.some(item =>
                  item.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
              ) && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-white/50">No results found</p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-2 text-xs text-indigo-600 dark:text-cyan-400 hover:text-indigo-700 dark:hover:text-cyan-300 transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                )}

              {/* Quick Links */}
              <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/50">
                  Resources
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/contact"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-white/70 hover:bg-indigo-50/50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white"
                    >
                      Contact Support
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/trust-center"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-white/70 hover:bg-indigo-50/50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white"
                    >
                      Trust Center
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/status"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-white/70 hover:bg-indigo-50/50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white"
                    >
                      System Status
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Backdrop for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-white dark:bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
            {children}
          </main>

          {/* Table of Contents - Right Sidebar */}
          <aside className="hidden xl:block w-64 border-l border-slate-200 dark:border-white/10 h-[calc(100vh-3.5rem)] overflow-y-auto sticky top-14 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
            <div className="p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/50">
                On This Page
              </h3>
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
