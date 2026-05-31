"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { Rocket, DollarSign, Edit3, Upload, Trash2, Lock, Radio, ShoppingCart, AlertCircle, CreditCard, Shield, Users, Clock, TestTube, Wrench, MessageCircle, Network, Key, Building, Code, Gift, Building2, Bell, Palette, Pencil, LockKeyhole, Megaphone, Settings, Timer, FlaskConical, Search, Landmark, Briefcase, Book } from "lucide-react";
import { BackButton } from "./BackButton";

// Icon mapping function
// All documentation cards data
const allDocs = {
  sellers: [
    {
      title: "Product Management",
      description: "Upload, update, and manage your digital products with approval workflows.",
      icon: "",
      href: "/docs/product-management",
    },
    {
      title: "Payout System",
      description: "Understand how earnings are calculated, held, and transferred to your bank account.",
      icon: <DollarSign className="w-5 h-5 text-indigo-500" />,
      href: "/docs/payout-system",
    },
    {
      title: "Product Changes API",
      description: "Request modifications to live products with admin approval system.",
      icon: <Pencil className="w-5 h-5 text-indigo-500" />,
      href: "/docs/product-changes",
    },
    {
      title: "Upload Solutions",
      description: "Troubleshooting file uploads, format requirements, and error handling.",
      icon: <Upload className="w-5 h-5 text-indigo-500" />,
      href: "/docs/upload-solutions",
    },
    {
      title: "Seller Deletion",
      description: "Account termination process with admin approval and data retention policies.",
      icon: <Trash2 className="w-5 h-5 text-indigo-500" />,
      href: "/docs/seller-deletion",
    },
    {
      title: "Approved Changes",
      description: "Track and implement approved product modifications in your dashboard.",
      icon: "",
      href: "/docs/approved-changes",
    },
    {
      title: "Promotions & Coupons",
      description: "Create discount codes, set usage limits, and boost your product sales.",
      icon: <Gift className="w-5 h-5 text-indigo-500" />,
      href: "/docs/promotions",
    },
  ],
  developers: [
    {
      title: "OAuth Setup",
      description: "Integrate Google and GitHub OAuth authentication for seamless user login.",
      icon: <LockKeyhole className="w-5 h-5 text-indigo-500" />,
      href: "/docs/oauth-setup",
    },
    {
      title: "Admin Products API",
      description: "Complete API reference for product CRUD operations with role-based access.",
      icon: <Radio className="w-5 h-5 text-indigo-500" />,
      href: "/docs/api/products",
    },
    {
      title: "Payout API Reference",
      description: "Endpoints for manual payouts, balance checks, and transaction history.",
      icon: <DollarSign className="w-5 h-5 text-indigo-500" />,
      href: "/docs/api/payouts",
    },
    {
      title: "Orders API",
      description: "Track purchases, sales history, and transaction details.",
      icon: <ShoppingCart className="w-5 h-5 text-indigo-500" />,
      href: "/docs/api/orders",
    },
    {
      title: "Authentication API",
      description: "JWT tokens, OAuth flows, and session management.",
      icon: <Lock className="w-5 h-5 text-indigo-500" />,
      href: "/docs/api/authentication",
    },
    {
      title: "Webhooks",
      description: "Real-time notifications for payments, payouts, and status updates.",
      icon: <Megaphone className="w-5 h-5 text-indigo-500" />,
      href: "/docs/webhooks",
    },
  ],
  admins: [
    {
      title: "Admin Payout Guide",
      description: "Manage seller payouts, review holds, process manual disbursements, and reconcile transactions.",
      icon: <CreditCard className="w-5 h-5 text-indigo-500" />,
      href: "/docs/admin/payouts",
    },
    {
      title: "Product Management",
      description: "Approve/reject products, manage pending changes, and enforce content policies.",
      icon: <Shield className="w-5 h-5 text-indigo-500" />,
      href: "/docs/admin/products",
    },
    {
      title: "User Management",
      description: "Manage users, roles, permissions, and account actions.",
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      href: "/docs/admin/users",
    },
    {
      title: "Analytics Dashboard",
      description: "Platform metrics, revenue reports, and growth analytics.",
      icon: "",
      href: "/docs/admin/analytics",
    },
    {
      title: "Content Moderation",
      description: "Review reports, enforce policies, and manage disputes.",
      icon: <Shield className="w-5 h-5 text-indigo-500" />,
      href: "/docs/admin/moderation",
    },
    {
      title: "System Settings",
      description: "Platform configuration, fee structure, and feature flags.",
      icon: <Settings className="w-5 h-5 text-indigo-500" />,
      href: "/docs/admin/settings",
    },
    {
      title: "Careers Management",
      description: "Create job postings, manage applications, and grow your BitForge team.",
      icon: <Building2 className="w-5 h-5 text-indigo-500" />,
      href: "/docs/admin/careers",
    },
  ],
  platform: [
    {
      title: "Security Best Practices",
      description: "Guidelines for secure integration, data handling, and compliance.",
      icon: <Lock className="w-5 h-5 text-indigo-500" />,
      href: "/docs/security",
    },
    {
      title: "Rate Limits",
      description: "API rate limits, quotas, and best practices for optimization.",
      icon: <Timer className="w-5 h-5 text-indigo-500" />,
      href: "/docs/rate-limits",
    },
    {
      title: "Testing Guide",
      description: "Test mode, sample data, and integration testing strategies.",
      icon: <FlaskConical className="w-5 h-5 text-indigo-500" />,
      href: "/docs/testing",
    },
    {
      title: "Troubleshooting",
      description: "Common issues, debugging tips, and error resolution.",
      icon: <Wrench className="w-5 h-5 text-indigo-500" />,
      href: "/docs/troubleshooting",
    },
    {
      title: "Push Notifications",
      description: "Setup FCM tokens, manage user opt-ins, and broadcast messages.",
      icon: <Bell className="w-5 h-5 text-indigo-500" />,
      href: "/docs/push-notifications",
    },
    {
      title: "UI & Theming",
      description: "Learn about Dark/Light mode toggles, persistent preferences, and Glassmorphism.",
      icon: <Palette className="w-5 h-5 text-indigo-500" />,
      href: "/docs/ui-theming",
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
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white overflow-x-hidden">
      
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60 hidden dark:block">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-4 sm:pt-6 md:pt-8 md:pb-28">
        {/* HERO */}
        <section className="mb-16 mt-0 max-w-4xl">
          <p className="inline-block text-xl font-bold uppercase tracking-[0.1em] text-black dark:text-white bg-indigo-50 dark:bg-transparent px-3 py-1 rounded-full dark:px-0 dark:py-0">
            Documentation
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight leading-tight sm:text-4xl md:text-5xl">
            Build, sell, and scale
            <span className="mt-1 block bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 dark:from-cyan-400 dark:via-sky-400 dark:to-indigo-400 bg-clip-text text-transparent leading-tight pb-0.5">
              digital products on BitForge
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-600 dark:text-white/70 sm:text-base leading-relaxed">
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
                    className="w-full rounded-xl border border-slate-200/60 dark:border-white/20 bg-white dark:bg-white/5 px-4 py-3 pl-11 pr-16 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:border-indigo-400/50 dark:focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:focus:ring-cyan-400/20 shadow-sm"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </span>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
                        setIsSearchActive(false);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-white/50 hover:text-indigo-600 dark:hover:text-white/80 transition-colors"
                    >
                      Clear
                    </button>
                  )}

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0a0a0f] border border-slate-200/60 dark:border-white/20 rounded-xl shadow-lg overflow-hidden z-50">
                      <div className="p-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-white/40 px-3 py-2">
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
                            className="block px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-xl flex-shrink-0 text-indigo-500 dark:text-cyan-400">
                                {doc.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {doc.title}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-white/60 truncate">
                                  {doc.description}
                                </div>
                              </div>
                              <span className="text-slate-400 dark:text-white/40 text-xs flex-shrink-0">→</span>
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
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 disabled:bg-slate-200 dark:disabled:bg-white/10 disabled:text-slate-400 dark:disabled:text-white/40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm shadow-sm"
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
            <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Get Started in Minutes</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Link
                href="/docs/quick-start"
                className="group rounded-2xl border border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-transparent dark:bg-gradient-to-b dark:from-emerald-500/10 dark:to-cyan-500/10 p-6 transition-all hover:border-emerald-300 dark:hover:border-emerald-400/50 hover:shadow-lg dark:hover:shadow-emerald-500/10 shadow-sm"
              >
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-white">
                  <Rocket className="w-5 h-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Quick Start</h3>
                <p className="mb-4 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  Get up and running in 15 minutes with API keys, environment setup, and your first test transaction.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-emerald-600 dark:text-cyan-300 group-hover:text-emerald-700 dark:group-hover:text-cyan-700 dark:text-cyan-200">
                  Read guide →
                </span>
              </Link>

              <Link
                href="/docs/api-keys-setup"
                className="group rounded-2xl border border-cyan-200 dark:border-cyan-400/30 bg-cyan-50 dark:bg-transparent dark:bg-gradient-to-b dark:from-cyan-500/10 dark:to-indigo-500/10 p-6 transition-all hover:border-cyan-300 dark:hover:border-cyan-400/50 hover:shadow-lg dark:hover:shadow-cyan-500/10 shadow-sm"
              >
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-white">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">API Keys Setup</h3>
                <p className="mb-4 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  Step-by-step instructions to get Razorpay, RazorpayX, and OAuth credentials configured.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-cyan-600 dark:text-cyan-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-700 dark:text-cyan-200">
                  Read guide →
                </span>
              </Link>

              <Link
                href="/docs/bank-account-setup"
                className="group rounded-2xl border border-indigo-200 dark:border-indigo-400/30 bg-indigo-50 dark:bg-transparent dark:bg-gradient-to-b dark:from-indigo-500/10 dark:to-purple-500/10 p-6 transition-all hover:border-indigo-300 dark:hover:border-indigo-400/50 hover:shadow-lg dark:hover:shadow-indigo-500/10 shadow-sm"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                  <Landmark className="w-5 h-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">Bank Account Setup</h3>
                <p className="mb-4 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  Configure payment flows, seller payouts, and commission management with RazorpayX.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-cyan-300 group-hover:text-indigo-700 dark:group-hover:text-cyan-700 dark:text-cyan-200">
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Search Results for &quot;{searchQuery}&quot;
              </h2>
              <p className="text-slate-500 dark:text-white/60 text-sm">
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
                <div className="mb-3 inline-flex h-6 w-6 items-center justify-center text-indigo-600 dark:text-cyan-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">For Sellers</h2>
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
              <div className="mb-6 flex items-center gap-3 mt-10">
                <div className="mb-3 inline-flex h-6 w-6 items-center justify-center text-indigo-600 dark:text-cyan-400">
                  <Code className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">For Developers</h2>
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
              <div className="mb-6 flex items-center gap-3 mt-10">
                <div className="mb-3 inline-flex h-6 w-6 items-center justify-center text-indigo-600 dark:text-cyan-400">
                  <Settings className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">For Admins</h2>
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
              <div className="mb-6 flex items-center gap-3 mt-10">
                <div className="mb-3 inline-flex h-6 w-6 items-center justify-center text-indigo-600 dark:text-cyan-400">
                  <Book className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Guides</h2>
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
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-12 text-center shadow-sm">
                <div className="text-5xl mb-4 text-slate-300 dark:text-white/20"><Search className="w-5 h-5 text-indigo-500 dark:text-cyan-400" /></div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No results found</h3>
                <p className="text-slate-500 dark:text-white/60 mb-4 leading-relaxed">
                  No documentation matches &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchActive(false);
                  }}
                  className="text-indigo-600 dark:text-cyan-400 hover:text-indigo-700 dark:hover:text-cyan-300 underline text-sm transition-colors"
                >
                  Clear search and view all documentation
                </button>
              </div>
            )}
        </section>

        {/* SUPPORT CTA - Hide when search is active */}
        {!isSearchActive && (
          <section className="mt-16 rounded-2xl border border-indigo-200 dark:border-white/10 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-cyan-500/10 dark:to-indigo-500/10 p-8 md:p-10 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Can&apos;t find what you&apos;re looking for?</h2>
                <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  Our support team is here to help with technical questions, integration challenges, or custom use cases.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-xl bg-indigo-600 dark:bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors shadow-sm"
                >
                  Contact Support
                </Link>
                <a
                  href="https://github.com/yourusername/Bitforge/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-transparent px-5 py-2.5 text-sm font-medium text-slate-800 dark:text-white/90 hover:border-slate-300 dark:hover:border-white/40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm dark:shadow-none"
                >
                  Report Issue
                </a>
              </div>
            </div>
          </section>
        )}

        {/* HELPFUL RESOURCES */}
        <section className="mt-14 border-t border-slate-200 dark:border-white/10 pt-10">
          <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Helpful Resources</h2>
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
        <section className="mt-14 border-t border-slate-200 dark:border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <BackButton />
            <div className="flex flex-wrap gap-5 text-slate-600 dark:text-white/70">
              <Link href="/about" className="font-medium hover:text-indigo-600 dark:hover:text-white transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="font-medium hover:text-indigo-600 dark:hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/careers" className="font-medium hover:text-indigo-600 dark:hover:text-white transition-colors">
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
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-5 transition-all hover:border-indigo-400/40 dark:hover:border-cyan-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10 shadow-sm"
    >
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-cyan-500/10 text-indigo-600 dark:text-cyan-400 group-hover:bg-indigo-100 dark:group-hover:bg-cyan-500/20 transition-colors">
        {icon ? icon : <Rocket className="w-5 h-5" />}
      </div>
      <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-white/60 group-hover:text-slate-600 dark:group-hover:text-white/70 leading-relaxed transition-colors">{description}</p>
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
      className="group block rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-5 transition-all hover:border-indigo-400/40 dark:hover:border-white/20 hover:bg-indigo-50/50 dark:hover:bg-white/10 shadow-sm"
    >
      <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
        {title} →
      </h3>
      <p className="text-xs text-slate-500 dark:text-white/60 leading-relaxed transition-colors">{description}</p>
    </Link>
  );
}
