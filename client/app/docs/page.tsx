"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";

// All documentation cards data
const allDocs = {
  sellers: [
    {
      title: "Product Management",
      description: "Upload, update, and manage your digital products with approval workflows.",
      icon: "📦",
      href: "/docs/product-management",
    },
    {
      title: "Payout System",
      description: "Understand how earnings are calculated, held, and transferred to your bank account.",
      icon: "💰",
      href: "/docs/payout-system",
    },
    {
      title: "Product Changes API",
      description: "Request modifications to live products with admin approval system.",
      icon: "✏️",
      href: "/docs/product-changes",
    },
    {
      title: "Upload Solutions",
      description: "Troubleshooting file uploads, format requirements, and error handling.",
      icon: "📤",
      href: "/docs/upload-solutions",
    },
    {
      title: "Seller Deletion",
      description: "Account termination process with admin approval and data retention policies.",
      icon: "🗑️",
      href: "/docs/seller-deletion",
    },
    {
      title: "Approved Changes",
      description: "Track and implement approved product modifications in your dashboard.",
      icon: "✅",
      href: "/docs/approved-changes",
    },
  ],
  developers: [
    {
      title: "OAuth Setup",
      description: "Integrate Google and GitHub OAuth authentication for seamless user login.",
      icon: "🔐",
      href: "/docs/oauth-setup",
    },
    {
      title: "Admin Products API",
      description: "Complete API reference for product CRUD operations with role-based access.",
      icon: "📡",
      href: "/docs/api/products",
    },
    {
      title: "Payout API Reference",
      description: "Endpoints for manual payouts, balance checks, and transaction history.",
      icon: "💸",
      href: "/docs/api/payouts",
    },
    {
      title: "Orders API",
      description: "Track purchases, sales history, and transaction details.",
      icon: "🛒",
      href: "/docs/api/orders",
    },
    {
      title: "Authentication API",
      description: "JWT tokens, OAuth flows, and session management.",
      icon: "🔒",
      href: "/docs/api/authentication",
    },
    {
      title: "Webhooks",
      description: "Real-time notifications for payments, payouts, and status updates.",
      icon: "📢",
      href: "/docs/webhooks",
    },
  ],
  admins: [
    {
      title: "Admin Payout Guide",
      description: "Manage seller payouts, review holds, process manual disbursements, and reconcile transactions.",
      icon: "💳",
      href: "/docs/admin/payouts",
    },
    {
      title: "Product Management",
      description: "Approve/reject products, manage pending changes, and enforce content policies.",
      icon: "🛡️",
      href: "/docs/admin/products",
    },
    {
      title: "User Management",
      description: "Manage users, roles, permissions, and account actions.",
      icon: "👥",
      href: "/docs/admin/users",
    },
    {
      title: "Analytics Dashboard",
      description: "Platform metrics, revenue reports, and growth analytics.",
      icon: "📊",
      href: "/docs/admin/analytics",
    },
    {
      title: "Content Moderation",
      description: "Review reports, enforce policies, and manage disputes.",
      icon: "🛡️",
      href: "/docs/admin/moderation",
    },
    {
      title: "System Settings",
      description: "Platform configuration, fee structure, and feature flags.",
      icon: "⚙️",
      href: "/docs/admin/settings",
    },
  ],
  platform: [
    {
      title: "Security Best Practices",
      description: "Guidelines for secure integration, data handling, and compliance.",
      icon: "🔒",
      href: "/docs/security",
    },
    {
      title: "Rate Limits",
      description: "API rate limits, quotas, and best practices for optimization.",
      icon: "⏱️",
      href: "/docs/rate-limits",
    },
    {
      title: "Testing Guide",
      description: "Test mode, sample data, and integration testing strategies.",
      icon: "🧪",
      href: "/docs/testing",
    },
    {
      title: "Troubleshooting",
      description: "Common issues, debugging tips, and error resolution.",
      icon: "🔧",
      href: "/docs/troubleshooting",
    },
  ],
};

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Get all docs as a flat array for suggestions
  const allDocsFlat = useMemo(() => {
    return [
      ...allDocs.sellers,
      ...allDocs.developers,
      ...allDocs.admins,
      ...allDocs.platform,
    ];
  }, []);

  // Get search suggestions (top 5 matches)
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return allDocsFlat
      .filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [searchQuery, allDocsFlat]);

  // Filter docs based on search query (for showing results when search is active)
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return allDocs;

    const query = searchQuery.toLowerCase();
    return {
      sellers: allDocs.sellers.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description.toLowerCase().includes(query)
      ),
      developers: allDocs.developers.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description.toLowerCase().includes(query)
      ),
      admins: allDocs.admins.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description.toLowerCase().includes(query)
      ),
      platform: allDocs.platform.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description.toLowerCase().includes(query)
      ),
    };
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearchActive(true);
      setShowSuggestions(false);
      // Scroll to results section
      document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };
  return (
    <main className="relative min-h-screen bg-[#05050a] text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 border-b border-white/10 bg-[#05050a]/80 backdrop-blur-xl">
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
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-3 py-1.5 text-white/80 hover:border-cyan-400 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-24 sm:pt-28 md:pt-32 md:pb-28">
        {/* HERO */}
        <section className="mb-16 -mt-24 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            Documentation
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Build, sell, and scale
            <span className="mt-1 block bg-linear-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent leading-tight pb-0.5">
              digital products on BitForge
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-white/70 sm:text-base">
            Everything you need to get started: setup guides, API references, seller workflows,
            admin tools, and best practices for building a successful digital product business.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                      setIsSearchActive(false);
                    }}
                    onFocus={() => {
                      if (searchQuery) setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 pl-11 pr-16 text-sm text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
                        setIsSearchActive(false);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white/80"
                    >
                      Clear
                    </button>
                  )}

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0f] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="p-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/40 px-3 py-2">
                          Suggestions
                        </div>
                        {suggestions.map((doc) => (
                          <Link
                            key={doc.href}
                            href={doc.href}
                            onClick={() => {
                              setShowSuggestions(false);
                              setSearchQuery("");
                            }}
                            className="block px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl flex-shrink-0">{doc.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                  {doc.title}
                                </div>
                                <div className="text-xs text-white/60 truncate">
                                  {doc.description}
                                </div>
                              </div>
                              <span className="text-white/40 text-xs flex-shrink-0">→</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
                >
                  Search
                </button>
              </div>

              {/* Click outside to close suggestions */}
              {showSuggestions && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSuggestions(false)}
                />
              )}
            </div>
          </div>
        </section>

        {/* QUICK START - Hide when search is active */}
        {!isSearchActive && (
          <section className="mb-14">
            <h2 className="mb-6 text-2xl font-semibold text-white">Get Started in Minutes</h2>
            <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/docs/quick-start"
              className="group rounded-2xl border border-emerald-400/30 bg-linear-to-b from-emerald-500/10 to-cyan-500/10 p-6 transition-all hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl">
                🚀
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Quick Start</h3>
              <p className="mb-4 text-sm text-white/70">
                Get up and running in 15 minutes with API keys, environment setup, and your first test transaction.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-cyan-300 group-hover:text-cyan-200">
                Read guide →
              </span>
            </Link>

            <Link
              href="/docs/api-keys-setup"
              className="group rounded-2xl border border-cyan-400/30 bg-linear-to-b from-cyan-500/10 to-indigo-500/10 p-6 transition-all hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-2xl">
                🔑
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">API Keys Setup</h3>
              <p className="mb-4 text-sm text-white/70">
                Step-by-step instructions to get Razorpay, RazorpayX, and OAuth credentials configured.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-cyan-300 group-hover:text-cyan-200">
                Read guide →
              </span>
            </Link>

            <Link
              href="/docs/bank-account-setup"
              className="group rounded-2xl border border-indigo-400/30 bg-linear-to-b from-indigo-500/10 to-purple-500/10 p-6 transition-all hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl">
                🏦
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Bank Account Setup</h3>
              <p className="mb-4 text-sm text-white/70">
                Configure payment flows, seller payouts, and commission management with RazorpayX.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-cyan-300 group-hover:text-cyan-200">
                Read guide →
              </span>
            </Link>
          </div>
        </section>
        )}

        {/* DOCUMENTATION CATEGORIES */}
        <section id="search-results" className="space-y-12">
          {/* Search Results Header */}
          {isSearchActive && searchQuery && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Search Results for &quot;{searchQuery}&quot;
              </h2>
              <p className="text-white/60 text-sm">
                Found {
                  filteredDocs.sellers.length +
                  filteredDocs.developers.length +
                  filteredDocs.admins.length +
                  filteredDocs.platform.length
                } results
              </p>
            </div>
          )}

          {/* For Sellers */}
          {filteredDocs.sellers.length > 0 && (!isSearchActive || searchQuery) && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">💼</span>
                <h2 className="text-2xl font-semibold text-white">For Sellers</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.sellers.map((doc) => (
                  <DocCard key={doc.href} {...doc} />
                ))}
              </div>
            </div>
          )}

          {/* For Developers */}
          {filteredDocs.developers.length > 0 && (!isSearchActive || searchQuery) && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">👨‍💻</span>
                <h2 className="text-2xl font-semibold text-white">For Developers</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.developers.map((doc) => (
                  <DocCard key={doc.href} {...doc} />
                ))}
              </div>
            </div>
          )}

          {/* For Admins */}
          {filteredDocs.admins.length > 0 && (!isSearchActive || searchQuery) && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <h2 className="text-2xl font-semibold text-white">For Admins</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.admins.map((doc) => (
                  <DocCard key={doc.href} {...doc} />
                ))}
              </div>
            </div>
          )}

          {/* Platform Guides */}
          {filteredDocs.platform.length > 0 && (!isSearchActive || searchQuery) && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <h2 className="text-2xl font-semibold text-white">Platform Guides</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.platform.map((doc) => (
                  <DocCard key={doc.href} {...doc} />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {isSearchActive &&
            searchQuery &&
            filteredDocs.sellers.length === 0 &&
            filteredDocs.developers.length === 0 &&
            filteredDocs.admins.length === 0 &&
            filteredDocs.platform.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                <p className="text-white/60 mb-4">
                  No documentation matches &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchActive(false);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 underline text-sm"
                >
                  Clear search and view all documentation
                </button>
              </div>
            )}
        </section>

        {/* SUPPORT CTA - Hide when search is active */}
        {!isSearchActive && (
          <section className="mt-16 rounded-2xl border border-white/10 bg-linear-to-r from-cyan-500/10 to-indigo-500/10 p-8 md:p-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="mb-2 text-2xl font-semibold text-white">Can&apos;t find what you&apos;re looking for?</h2>
                <p className="text-sm text-white/70">
                  Our support team is here to help with technical questions, integration challenges, or custom use cases.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-400"
                >
                  Contact Support
                </Link>
                <a
                  href="https://github.com/yourusername/contentSellify/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white/90 hover:border-white/40 hover:bg-white/5"
                >
                  Report Issue
                </a>
              </div>
            </div>
          </section>
        )}

        {/* HELPFUL RESOURCES */}
        <section className="mt-14 border-t border-white/10 pt-10">
          <h2 className="mb-6 text-xl font-semibold text-white">Helpful Resources</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ResourceLink
              title="Terms & Conditions"
              href="/legal/terms-and-conditions"
              description="Platform usage policies and legal agreements"
            />
            <ResourceLink
              title="Privacy Policy"
              href="/legal/privacy-policy"
              description="How we collect, use, and protect your data"
            />
            <ResourceLink
              title="Refund Policy"
              href="/legal/refund-cancellation-policy"
              description="Buyer protection and refund eligibility"
            />
            <ResourceLink
              title="Trust Center"
              href="/trust-center"
              description="Security practices and compliance certifications"
            />
          </div>
        </section>

        {/* Footer Links */}
        <section className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <Link href="/" className="text-white/70 hover:text-white">
              ← Back to BitForge
            </Link>
            <div className="flex flex-wrap gap-4 text-white/70">
              <Link href="/about" className="hover:text-white">
                About Us
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
              <Link href="/careers" className="hover:text-white">
                Careers
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// Reusable Doc Card Component
function DocCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-cyan-400/40 hover:bg-white/10"
    >
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-xl group-hover:bg-cyan-500/20">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-white group-hover:text-cyan-300">
        {title}
      </h3>
      <p className="text-sm text-white/60 group-hover:text-white/70">{description}</p>
    </Link>
  );
}

// Reusable Resource Link Component
function ResourceLink({
  title,
  href,
  description,
}: {
  title: string;
  href: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10"
    >
      <h3 className="mb-1 text-sm font-semibold text-white group-hover:text-cyan-300">
        {title} →
      </h3>
      <p className="text-xs text-white/60">{description}</p>
    </Link>
  );
}
