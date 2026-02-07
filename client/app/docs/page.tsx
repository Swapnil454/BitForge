import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Documentation | BitForge",
  description: "Complete guides, API references, and step-by-step tutorials to help you build, sell, and manage digital products on BitForge.",
};

export default function DocsPage() {
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
        <section className="mb-16 max-w-4xl">
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

          {/* Search Bar (Visual) */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 pl-11 text-sm text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                disabled
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
                Coming soon
              </span>
            </div>
          </div>
        </section>

        {/* QUICK START */}
        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-semibold text-white">Get Started in Minutes</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="group rounded-2xl border border-emerald-400/30 bg-linear-to-b from-emerald-500/10 to-cyan-500/10 p-6 transition-all hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl">
                🚀
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Quick Start</h3>
              <p className="mb-4 text-sm text-white/70">
                Get up and running in 15 minutes with API keys, environment setup, and your first test transaction.
              </p>
              <a
                href="https://github.com/yourusername/contentSellify/blob/main/docs/QUICK_START.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-cyan-300 hover:text-cyan-200"
              >
                Read guide →
              </a>
            </div>

            <div className="group rounded-2xl border border-cyan-400/30 bg-linear-to-b from-cyan-500/10 to-indigo-500/10 p-6 transition-all hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-2xl">
                🔑
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">API Keys Setup</h3>
              <p className="mb-4 text-sm text-white/70">
                Step-by-step instructions to get Razorpay, RazorpayX, and OAuth credentials configured.
              </p>
              <a
                href="https://github.com/yourusername/contentSellify/blob/main/docs/API_KEYS_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-cyan-300 hover:text-cyan-200"
              >
                Read guide →
              </a>
            </div>

            <div className="group rounded-2xl border border-indigo-400/30 bg-linear-to-b from-indigo-500/10 to-purple-500/10 p-6 transition-all hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/10">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl">
                🏦
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Bank Account Setup</h3>
              <p className="mb-4 text-sm text-white/70">
                Configure payment flows, seller payouts, and commission management with RazorpayX.
              </p>
              <a
                href="https://github.com/yourusername/contentSellify/blob/main/docs/BANK_ACCOUNT_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-cyan-300 hover:text-cyan-200"
              >
                Read guide →
              </a>
            </div>
          </div>
        </section>

        {/* DOCUMENTATION CATEGORIES */}
        <section className="space-y-12">
          {/* For Sellers */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl">💼</span>
              <h2 className="text-2xl font-semibold text-white">For Sellers</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DocCard
                title="Product Management"
                description="Upload, update, and manage your digital products with approval workflows."
                icon="📦"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/ADMIN_PRODUCT_MANAGEMENT_GUIDE.md"
              />
              <DocCard
                title="Payout System"
                description="Understand how earnings are calculated, held, and transferred to your bank account."
                icon="💰"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/QUICK_START_PAYOUTS.md"
              />
              <DocCard
                title="Product Changes API"
                description="Request modifications to live products with admin approval system."
                icon="✏️"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/PRODUCT_CHANGES_API.md"
              />
              <DocCard
                title="Upload Solutions"
                description="Troubleshooting file uploads, format requirements, and error handling."
                icon="📤"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/UPLOAD_COMPLETE_SOLUTION.md"
              />
              <DocCard
                title="Seller Deletion"
                description="Account termination process with admin approval and data retention policies."
                icon="🗑️"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/SELLER_DELETION_WITH_APPROVAL.md"
              />
              <DocCard
                title="Approved Changes"
                description="Track and implement approved product modifications in your dashboard."
                icon="✅"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/APPROVED_PRODUCT_CHANGES.md"
              />
            </div>
          </div>

          {/* For Developers */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl">👨‍💻</span>
              <h2 className="text-2xl font-semibold text-white">For Developers</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DocCard
                title="OAuth Setup"
                description="Integrate Google and GitHub OAuth authentication for seamless user login."
                icon="🔐"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/OAUTH_SETUP.md"
              />
              <DocCard
                title="Admin Products API"
                description="Complete API reference for product CRUD operations with role-based access."
                icon="📡"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/ADMIN_PRODUCTS_API.md"
              />
              <DocCard
                title="Payout API Reference"
                description="Endpoints for manual payouts, balance checks, and transaction history."
                icon="💸"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/PAYOUT_API_REFERENCE.md"
              />
              <DocCard
                title="Workflow Diagrams"
                description="Visual flowcharts for payment flows, approval processes, and system architecture."
                icon="📊"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/WORKFLOW_DIAGRAMS.md"
              />
              <DocCard
                title="Implementation Summary"
                description="Technical overview of features, database models, and integration points."
                icon="🏗️"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/IMPLEMENTATION_SUMMARY.md"
              />
              <DocCard
                title="Migration Summary"
                description="Database migrations, schema changes, and version upgrade guides."
                icon="🔄"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/MIGRATION_SUMMARY.md"
              />
            </div>
          </div>

          {/* For Admins */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <h2 className="text-2xl font-semibold text-white">For Admins</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DocCard
                title="Admin Payout Guide"
                description="Manage seller payouts, review holds, process manual disbursements, and reconcile transactions."
                icon="💳"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/ADMIN_PAYOUT_GUIDE.md"
              />
              <DocCard
                title="Product Management"
                description="Approve/reject products, manage pending changes, and enforce content policies."
                icon="🛡️"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/ADMIN_PRODUCT_MANAGEMENT_COMPLETE.md"
              />
              <DocCard
                title="Manual Payout System"
                description="Step-by-step process for triggering payouts, validating bank accounts, and error handling."
                icon="⚡"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/MANUAL_PAYOUT_SYSTEM.md"
              />
              <DocCard
                title="Complete Checklist"
                description="Pre-launch verification checklist covering security, compliance, and platform readiness."
                icon="✓"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/COMPLETE_CHECKLIST.md"
              />
              <DocCard
                title="Feature Implementation"
                description="Roadmap of completed features, pending enhancements, and technical debt."
                icon="🎯"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/FEATURE_IMPLEMENTATION_COMPLETE.md"
              />
              <DocCard
                title="Changelog"
                description="Version history, bug fixes, feature additions, and breaking changes."
                icon="📝"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/CHANGELOG.md"
              />
            </div>
          </div>

          {/* Platform Guides */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <h2 className="text-2xl font-semibold text-white">Platform Guides</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DocCard
                title="Flow Diagrams"
                description="End-to-end process visualizations for buyer purchases, seller onboarding, and dispute resolution."
                icon="🔀"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/FLOW_DIAGRAM.md"
              />
              <DocCard
                title="Visual Summary"
                description="Infographics and screenshots of key platform features and user journeys."
                icon="🖼️"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/VISUAL_SUMMARY.md"
              />
              <DocCard
                title="Upload Visual Summary"
                description="Image-based guide to file upload UI, validation, and progress tracking."
                icon="📸"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/UPLOAD_VISUAL_SUMMARY.md"
              />
              <DocCard
                title="README Changes"
                description="Project documentation updates, setup improvements, and contribution guidelines."
                icon="📄"
                href="https://github.com/yourusername/contentSellify/blob/main/docs/README_CHANGES.md"
              />
            </div>
          </div>
        </section>

        {/* SUPPORT CTA */}
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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-cyan-400/40 hover:bg-white/10"
    >
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-xl group-hover:bg-cyan-500/20">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-white group-hover:text-cyan-300">
        {title}
      </h3>
      <p className="text-sm text-white/60 group-hover:text-white/70">{description}</p>
    </a>
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
