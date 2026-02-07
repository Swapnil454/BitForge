import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About BitForge | Digital Product Marketplace",
  description:
    "Learn how BitForge helps creators launch, manage, and scale digital products while giving buyers a secure, frictionless checkout and instant access experience.",
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-[#05050a] text-white overflow-x-hidden">
      {/* Subtle background glow to match landing aesthetics */}
        <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-indigo-600/25 blur-[160px]" />
            <div className="absolute top-1/3 -right-40 h-[460px] w-[460px] rounded-full bg-cyan-500/20 blur-[180px]" />
        </div>

      {/* Top band (fixed like landing page) */}
        <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-[rgba(5,5,10,0.9)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/bitforge_logo1.png"
                alt="BitForge logo"
                width={256}
                height={256}
                className="h-9 w-auto object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.45)] sm:h-11"
                priority
              />
              <span className="text-xl -ml-6 font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                BitForge
              </span>
              <span className="hidden mt-2 items-center rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60 sm:inline-flex">
                Digital Marketplace
              </span>
            </Link>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-white/70">
              <Link
                href="/login"
                className="hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-cyan-400 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-black shadow-[0_0_20px_rgba(56,189,248,0.6)]"
              >
                Join BitForge
              </Link>
            </div>
          </div>
        </header>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-24 pb-12 md:px-6 md:pt-28 md:pb-16 lg:pt-32 lg:pb-20">
        {/* Hero */}
        <section className="mb-12 md:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            About us
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight leading-tight sm:text-4xl md:text-5xl">
            Built for digital product teams
            <span className="block pb-1 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              The operating system for modern commerce
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-white/70 sm:text-base">
            BitForge is a focused digital marketplace where creators ship downloads, licenses, and
            access-based products, and buyers get a clean, trustworthy checkout with instant access.
            We combine marketplace simplicity with infrastructure-grade reliability so you do not have
            to reinvent payments, delivery, or compliance.
          </p>
          <p className="mt-4 max-w-3xl text-sm text-white/65 sm:text-base">
            Our goal is to give small teams and independent builders the kind of tooling that
            traditionally sits behind large marketplaces: opinionated workflows, strong guardrails,
            and a buying experience that feels enterprise-grade even when a single creator is
            running the business.
          </p>
        </section>

        {/* Snapshot */}
        <section className="mb-10 grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70 sm:grid-cols-3 sm:p-7">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/60">
              What we do
            </h2>
            <p className="mt-2 text-[13px] sm:text-sm">
              We provide a full-stack marketplace for digital products: discovery, secure payments,
              automated payouts, license delivery, and post-purchase support routing.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Who we serve
            </h2>
            <p className="mt-2 text-[13px] sm:text-sm">
              Individual creators, small studios, and niche SaaS teams who want to sell themes,
              templates, code, design assets, educational content, and access-based products without
              building a custom payments stack.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Where we operate
            </h2>
            <p className="mt-2 text-[13px] sm:text-sm">
              India-first and global-ready. BitForge is designed around local payment methods,
              UPI-first experiences, and scalable payouts while supporting international buyers via
              trusted payment partners.
            </p>
          </div>
        </section>

        {/* Vision & principles */}
        <section className="mb-12 grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:p-7">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Our vision</h2>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              We believe that digital products should be as easy to sell as they are to create.
              Instead of forcing builders to become experts in payment gateways, compliance,
              fraud signals, and fulfillment, BitForge abstracts that complexity into a single
              platform. If you can design, code, or teach, you should be able to start charging
              for your work in hours, not weeks.
            </p>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              Long term, BitForge aims to be the infrastructure layer behind thousands of
              creator-led brands and lean SaaS products — a neutral, reliable backbone for
              digital commerce across geographies.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Product principles
            </h3>
            <ul className="mt-3 space-y-2 text-[13px] text-white/75 sm:text-sm">
              <li>• <span className="font-medium">Trust first:</span> Every flow is designed so buyers and sellers clearly know what will happen next.</li>
              <li>• <span className="font-medium">Default secure:</span> Guardrails, approvals, and access controls are built-in, not optional.</li>
              <li>• <span className="font-medium">Fast iterations:</span> Creators can change pricing, packaging, and messaging without touching infrastructure.</li>
              <li>• <span className="font-medium">API-ready:</span> As the platform evolves, we design for integration into existing tooling and back offices.</li>
            </ul>
          </div>
        </section>

        {/* Story + Problem */}
        <section className="mb-12 grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Our story</h2>
            <p className="mt-1 text-xs italic text-white/55 sm:text-[13px]">
              BitForge started as a tool we built for ourselves.
            </p>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              BitForge started as an internal toolkit for shipping side‑projects. We repeatedly
              hit the same bottlenecks: setting up payment gateways, handling GST and invoices,
              managing download links, protecting files, and routing support. Each new project
              required the same undifferentiated heavy lifting.
            </p>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              We turned that toolkit into a product so other builders do not have to solve the
              same infrastructure problems. BitForge now focuses on one thing: making it safe and
              simple to sell digital products at scale, with an experience that feels as polished
              as large consumer marketplaces but stays creator‑friendly.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/75 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
              The problem we solve
            </h3>
            <ul className="space-y-2 text-[13px] sm:text-sm">
              <li>
                • Creators spend weeks integrating payments, tax, and delivery instead of shipping
                content.
              </li>
              <li>
                • Buyers worry about failed payments, broken download links, and refund ambiguity.
              </li>
              <li>
                • Payouts, reconciliation, and basic reporting become painful as sales grow.
              </li>
            </ul>
            <p className="pt-1 text-[13px] text-white/65 sm:text-sm">
              BitForge abstracts these concerns into a single, opinionated flow: verified products,
              reliable checkout, instant access, and clear payout rules.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.03] p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-lg font-semibold sm:text-xl">How BitForge works</h2>
            <p className="max-w-2xl text-[13px] text-white/65 sm:text-sm">
              Under the hood, BitForge stitches together product catalog, entitlement, payments,
              and delivery into one cohesive flow. For you, it looks like a marketplace; internally,
              it behaves like a modern commerce platform.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-5">
              <h3 className="text-sm font-semibold text-white">For buyers</h3>
              <ul className="space-y-2 text-[13px] text-white/75 sm:text-sm">
                <li>• Curated product listings with clear pricing, discounts, and entitlements.</li>
                <li>• Secure checkout with trusted payment partners and clear error handling.</li>
                <li>• Instant access to downloads or license keys after successful payment.</li>
                <li>• Human support via help@bitforge.in for billing or access issues.</li>
              </ul>
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-5">
              <h3 className="text-sm font-semibold text-white">For creators & sellers</h3>
              <ul className="space-y-2 text-[13px] text-white/75 sm:text-sm">
                <li>• A single dashboard to publish, price, and iterate on products.</li>
                <li>• Automated payout flows with transparent fees and clear timelines.</li>
                <li>• Built-in guardrails for product changes, approvals, and access control.</li>
                <li>• Tools to manage discounts, bundles, and limited‑time launches safely.</li>
                <li>• Operational views that make it easy to reconcile orders, refunds, and payouts.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Trust & compliance */}
        <section className="mb-14 grid gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Trust, security & payouts</h2>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              Trust is the core of any marketplace. BitForge is built with a security‑first mindset:
              role‑based access for internal tools, clear approval workflows for product changes,
              and auditable payout flows for sellers.
            </p>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              We integrate with established, PCI‑DSS‑compliant payment gateways and follow strong
              encryption practices for sensitive data. Payouts are driven by explicit rules so that
              creators always know when and why funds are released.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-5 text-[13px] text-emerald-50 sm:p-6 sm:text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
              What this means in practice
            </h3>
            <ul className="space-y-1.5">
              <li>• Clear separation between buyer payments and creator payouts.</li>
              <li>• Manual and automated review flows for high‑risk product changes.</li>
              <li>• Structured logs for product approvals, deletions, and refunds.</li>
              <li>• A dedicated Trust Center for policies, uptime, and security notes.</li>
            </ul>
            <Link
              href="/trust-center"
              className="mt-2 inline-flex text-xs font-medium text-emerald-200 hover:text-emerald-100 hover:underline underline-offset-2"
            >
              Visit Trust Center
            </Link>
          </div>
        </section>

        {/* Platform pillars / enterprise readiness */}
        <section className="mb-14 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-lg font-semibold sm:text-xl">Platform pillars</h2>
            <p className="max-w-2xl text-[13px] text-white/65 sm:text-sm">
              BitForge is designed to feel familiar to individual creators on day one and
              structured enough to plug into more mature teams as they scale.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2 text-[13px] text-white/75 sm:text-sm">
              <h3 className="text-sm font-semibold text-white">Reliability</h3>
              <p>
                Opinionated flows for product publishing, approvals, and payouts reduce unexpected
                edge cases and keep both sides of the marketplace aligned on how the system behaves.
              </p>
            </div>
            <div className="space-y-2 text-[13px] text-white/75 sm:text-sm">
              <h3 className="text-sm font-semibold text-white">Observability</h3>
              <p>
                Activity history, pending approvals, and structured audit trails give creators and
                operators the visibility they need to understand what changed and why.
              </p>
            </div>
            <div className="space-y-2 text-[13px] text-white/75 sm:text-sm">
              <h3 className="text-sm font-semibold text-white">Scalability</h3>
              <p>
                From the first download to thousands of orders, BitForge focuses on predictable
                flows rather than bespoke integrations, so teams can grow without rewriting their
                commerce stack.
              </p>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-purple-500/15 p-6 text-center sm:p-8">
          <h2 className="text-xl font-semibold sm:text-2xl">
            Ready to launch your next digital product?
          </h2>
          <p className="mt-3 text-sm text-white/75 sm:text-base">
            Create a BitForge account, publish your first product, and start collecting payments
            with an experience that feels enterprise‑grade but stays creator‑friendly.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/register?role=seller"
              className="inline-flex rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-black shadow-[0_0_32px_rgba(56,189,248,0.7)] hover:brightness-110"
            >
              Start selling on BitForge
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-cyan-400 hover:text-white"
            >
              Explore the marketplace
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
