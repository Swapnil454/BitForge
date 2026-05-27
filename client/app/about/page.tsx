import type { Metadata } from "next";
import Link from "next/link";
import DynamicHeader from "@/app/components/DynamicHeader";
import Image from "next/image";
import { getGlobalLegalDates } from "@/lib/getGlobalSettings";

export const metadata: Metadata = {
  title: "About BitForge | Digital Product Marketplace",
  description:
    "Learn how BitForge helps creators launch, manage, and scale digital products while giving buyers a secure, frictionless checkout and instant access experience.",
};

export default async function AboutPage() {
  const dates = await getGlobalLegalDates("about");
  const effectiveDate = dates?.legalEffectiveDate || "January 1, 2026";
  const lastUpdatedDate = dates?.legalLastUpdatedDate || "February 1, 2026";

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white overflow-x-hidden">
      {/* Subtle background glow to match landing aesthetics - Dark mode only */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-indigo-600/25 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[460px] w-[460px] rounded-full bg-cyan-500/20 blur-[180px]" />
      </div>

      <DynamicHeader title="About Us" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 sm:pt-20 pb-12 md:px-6 md:pb-16 lg:pb-24">
        {/* Hero */}
        <section className="mb-10 md:mb-16 text-center sm:text-left max-w-4xl pt-4">
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-cyan-300/80 bg-indigo-50 dark:bg-transparent px-3 py-1 rounded-full dark:px-0 dark:py-0">
              About us
            </p>
            <p className="text-xs text-slate-500 dark:text-white/60">
              <strong className="text-slate-700 dark:text-white/80">Effective Date:</strong> {effectiveDate}
              <span className="mx-3">·</span>
              <strong className="text-slate-700 dark:text-white/80">Last Updated:</strong> {lastUpdatedDate}
            </p>
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-[1.1] sm:text-5xl md:text-6xl text-slate-900 dark:text-white mb-6">
            Built for digital product teams{" "}
            <span className="block mt-2 bg-linear-to-r from-indigo-600 to-cyan-500 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              The operating system for modern commerce
            </span>
          </h1>
          <div className="flex flex-col gap-4 text-base text-slate-600 dark:text-white/70 sm:text-lg leading-relaxed max-w-3xl mx-auto sm:mx-0">
            <p>
              BitForge is a focused digital marketplace where creators ship downloads, licenses, and
              access-based products, and buyers get a clean, trustworthy checkout with instant access.
              We combine marketplace simplicity with infrastructure-grade reliability so you do not have
              to reinvent payments, delivery, or compliance.
            </p>
            <p>
              Our goal is to give small teams and independent builders the kind of tooling that
              traditionally sits behind large marketplaces: opinionated workflows, strong guardrails,
              and a buying experience that feels enterprise-grade even when a single creator is
              running the business.
            </p>
          </div>
        </section>

        {/* Snapshot */}
        <section className="mb-16 grid gap-6 sm:grid-cols-3">
          {[
            { title: "What we do", content: "We provide a full-stack marketplace for digital products: discovery, secure payments, automated payouts, license delivery, and post-purchase support routing." },
            { title: "Who we serve", content: "Individual creators, small studios, and niche SaaS teams who want to sell themes, templates, code, design assets, educational content, and access-based products without building a custom payments stack." },
            { title: "Where we operate", content: "India-first and global-ready. BitForge is designed around local payment methods, UPI-first experiences, and scalable payouts while supporting international buyers via trusted payment partners." }
          ].map((item, i) => (
            <div key={i} className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-white/60 mb-3">
                {item.title}
              </h2>
              <p className="text-[13px] sm:text-sm text-slate-600 dark:text-white/70 leading-relaxed font-medium">
                {item.content}
              </p>
            </div>
          ))}
        </section>

        {/* Vision & principles */}
        <section className="mb-16 grid gap-8 rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-6 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:p-10 shadow-sm">
          <div className="pr-0 sm:pr-8">
            <h2 className="text-2xl font-black sm:text-3xl text-slate-900 dark:text-white mb-5">Our vision</h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-white/70 sm:text-base leading-relaxed">
              We believe that digital products should be as easy to sell as they are to create.
              Instead of forcing builders to become experts in payment gateways, compliance,
              fraud signals, and fulfillment, BitForge abstracts that complexity into a single
              platform. If you can design, code, or teach, you should be able to start charging
              for your work in hours, not weeks.
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-white/70 sm:text-base leading-relaxed">
              Long term, BitForge aims to be the infrastructure layer behind thousands of
              creator-led brands and lean SaaS products — a neutral, reliable backbone for
              digital commerce across geographies.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-6 border border-slate-100 dark:border-transparent">
            <h3 className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-white/60 mb-5">
              Product principles
            </h3>
            <ul className="space-y-4 text-[13px] text-slate-700 dark:text-white/75 sm:text-sm">
              <li className="flex gap-3"><span className="text-indigo-500 font-bold">•</span> <div><span className="font-bold text-slate-900 dark:text-white">Trust first:</span> Every flow is designed so buyers and sellers clearly know what will happen next.</div></li>
              <li className="flex gap-3"><span className="text-indigo-500 font-bold">•</span> <div><span className="font-bold text-slate-900 dark:text-white">Default secure:</span> Guardrails, approvals, and access controls are built-in, not optional.</div></li>
              <li className="flex gap-3"><span className="text-indigo-500 font-bold">•</span> <div><span className="font-bold text-slate-900 dark:text-white">Fast iterations:</span> Creators can change pricing, packaging, and messaging without touching infrastructure.</div></li>
              <li className="flex gap-3"><span className="text-indigo-500 font-bold">•</span> <div><span className="font-bold text-slate-900 dark:text-white">API-ready:</span> As the platform evolves, we design for integration into existing tooling and back offices.</div></li>
            </ul>
          </div>
        </section>

        {/* Story + Problem */}
        <section className="mb-20 grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
          <div className="pr-4 md:pr-8">
            <h2 className="text-2xl font-black sm:text-3xl text-slate-900 dark:text-white mb-2">Our story</h2>
            <p className="text-sm italic font-medium text-indigo-600 dark:text-white/55 mb-5">
              BitForge started as a tool we built for ourselves.
            </p>
            <p className="text-sm text-slate-600 dark:text-white/70 sm:text-base leading-relaxed mb-4">
              BitForge started as an internal toolkit for shipping side‑projects. We repeatedly
              hit the same bottlenecks: setting up payment gateways, handling GST and invoices,
              managing download links, protecting files, and routing support. Each new project
              required the same undifferentiated heavy lifting.
            </p>
            <p className="text-sm text-slate-600 dark:text-white/70 sm:text-base leading-relaxed">
              We turned that toolkit into a product so other builders do not have to solve the
              same infrastructure problems. BitForge now focuses on one thing: making it safe and
              simple to sell digital products at scale, with an experience that feels as polished
              as large consumer marketplaces but stays creator‑friendly.
            </p>
          </div>

          <div className="space-y-6 rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm sm:p-8">
            <h3 className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-white/60">
              The problem we solve
            </h3>
            <ul className="space-y-4 text-[13px] sm:text-sm text-slate-700 dark:text-white/75">
              <li className="flex gap-3"><span className="text-rose-500 font-bold shrink-0">✕</span> <span>Creators spend weeks integrating payments, tax, and delivery instead of shipping content.</span></li>
              <li className="flex gap-3"><span className="text-rose-500 font-bold shrink-0">✕</span> <span>Buyers worry about failed payments, broken download links, and refund ambiguity.</span></li>
              <li className="flex gap-3"><span className="text-rose-500 font-bold shrink-0">✕</span> <span>Payouts, reconciliation, and basic reporting become painful as sales grow.</span></li>
            </ul>
            <div className="pt-5 border-t border-slate-100 dark:border-white/10 mt-6">
              <p className="text-[13px] text-slate-600 dark:text-white/65 sm:text-sm font-medium">
                BitForge abstracts these concerns into a single, opinionated flow: verified products,
                reliable checkout, instant access, and clear payout rules.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-20 rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-white/5 dark:to-white/[0.03] p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-50 dark:bg-white/5 rounded-full blur-3xl pointer-events-none hidden sm:block" />
          
          <div className="mb-10 flex flex-col gap-3 relative z-10 max-w-2xl mx-auto text-center sm:text-left sm:mx-0">
            <h2 className="text-2xl font-black sm:text-3xl text-slate-900 dark:text-white">How BitForge works</h2>
            <p className="max-w-3xl text-[13px] text-slate-600 dark:text-white/65 sm:text-base leading-relaxed">
              Under the hood, BitForge stitches together product catalog, entitlement, payments,
              and delivery into one cohesive flow. For you, it looks like a marketplace; internally,
              it behaves like a modern commerce platform.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 relative z-10">
            <div className="space-y-5 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 p-6 transition hover:bg-slate-50 dark:hover:bg-black/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-white/10 flex items-center justify-center text-indigo-600 dark:text-white/80">1</span>
                For buyers
              </h3>
              <ul className="space-y-3 text-[13px] text-slate-600 dark:text-white/75 sm:text-sm font-medium">
                <li className="flex gap-2"><span>•</span> <span>Curated product listings with clear pricing, discounts, and entitlements.</span></li>
                <li className="flex gap-2"><span>•</span> <span>Secure checkout with trusted payment partners and clear error handling.</span></li>
                <li className="flex gap-2"><span>•</span> <span>Instant access to downloads or license keys after successful payment.</span></li>
                <li className="flex gap-2"><span>•</span> <span>Human support via help@bittforge.in for billing or access issues.</span></li>
              </ul>
            </div>

            <div className="space-y-5 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 p-6 transition hover:bg-slate-50 dark:hover:bg-black/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-white/10 flex items-center justify-center text-cyan-600 dark:text-white/80">2</span>
                For creators & sellers
              </h3>
              <ul className="space-y-3 text-[13px] text-slate-600 dark:text-white/75 sm:text-sm font-medium">
                <li className="flex gap-2"><span>•</span> <span>A single dashboard to publish, price, and iterate on products.</span></li>
                <li className="flex gap-2"><span>•</span> <span>Automated payout flows with transparent fees and clear timelines.</span></li>
                <li className="flex gap-2"><span>•</span> <span>Built-in guardrails for product changes, approvals, and access control.</span></li>
                <li className="flex gap-2"><span>•</span> <span>Tools to manage discounts, bundles, and limited‑time launches safely.</span></li>
                <li className="flex gap-2"><span>•</span> <span>Operational views that make it easy to reconcile orders, refunds, and payouts.</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Trust & compliance */}
        <section className="mb-24 grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center">
          <div className="order-2 md:order-1 pr-0 sm:pr-6">
            <h2 className="text-2xl font-black sm:text-3xl text-slate-900 dark:text-white mb-4">Trust, security & payouts</h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-white/70 sm:text-base leading-relaxed">
              Trust is the core of any marketplace. BitForge is built with a security‑first mindset:
              role‑based access for internal tools, clear approval workflows for product changes,
              and auditable payout flows for sellers.
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-white/70 sm:text-base leading-relaxed">
              We integrate with established, PCI‑DSS‑compliant payment gateways and follow strong
              encryption practices for sensitive data. Payouts are driven by explicit rules so that
              creators always know when and why funds are released.
            </p>
          </div>

          <div className="order-1 md:order-2 space-y-5 rounded-3xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-200/50 dark:bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-200/90 relative z-10 mb-4">
              What this means in practice
            </h3>
            <ul className="space-y-4 relative z-10">
              <li className="flex gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-50"><span className="text-emerald-600 dark:text-emerald-400">✓</span> <span>Clear separation between buyer payments and creator payouts.</span></li>
              <li className="flex gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-50"><span className="text-emerald-600 dark:text-emerald-400">✓</span> <span>Manual and automated review flows for high‑risk product changes.</span></li>
              <li className="flex gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-50"><span className="text-emerald-600 dark:text-emerald-400">✓</span> <span>Structured logs for product approvals, deletions, and refunds.</span></li>
              <li className="flex gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-50"><span className="text-emerald-600 dark:text-emerald-400">✓</span> <span>A dedicated Trust Center for policies, uptime, and security notes.</span></li>
            </ul>
            <div className="pt-4 mt-4 border-t border-emerald-200/50 dark:border-emerald-500/20 relative z-10">
              <Link
                href="/trust-center"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors group"
              >
                Visit Trust Center <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Platform pillars / enterprise readiness */}
        <section className="mb-24">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-black sm:text-4xl text-slate-900 dark:text-white mb-4">Platform pillars</h2>
            <p className="text-sm text-slate-600 dark:text-white/65 sm:text-base leading-relaxed">
              BitForge is designed to feel familiar to individual creators on day one and
              structured enough to plug into more mature teams as they scale.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Reliability",
                content: "Opinionated flows for product publishing, approvals, and payouts reduce unexpected edge cases and keep both sides of the marketplace aligned on how the system behaves."
              },
              {
                title: "Observability",
                content: "Activity history, pending approvals, and structured audit trails give creators and operators the visibility they need to understand what changed and why."
              },
              {
                title: "Scalability",
                content: "From the first download to thousands of orders, BitForge focuses on predictable flows rather than bespoke integrations, so teams can grow without rewriting their commerce stack."
              }
            ].map((pillar, i) => (
              <div key={i} className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-6 sm:p-8 text-center shadow-sm hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-white/10 flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-white">
                  <span className="font-black text-2xl">{i+1}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{pillar.title}</h3>
                <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed font-medium">
                  {pillar.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-cyan-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-8 text-center sm:p-14 shadow-xl shadow-indigo-100 dark:shadow-none">
          {/* Light mode specific background decorations */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-50/50 via-indigo-50/50 to-purple-50/50 dark:hidden" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black sm:text-4xl text-slate-900 dark:text-white mb-5">
              Ready to launch your next digital product?
            </h2>
            <p className="text-sm text-slate-600 dark:text-white/75 sm:text-lg leading-relaxed mb-8">
              Create a BitForge account, publish your first product, and start collecting payments
              with an experience that feels enterprise‑grade but stays creator‑friendly.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <Link
                href="/register?role=seller"
                className="inline-flex rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 dark:from-cyan-400 dark:to-indigo-500 px-8 py-4 text-sm font-bold text-white dark:text-black shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow w-full sm:w-auto justify-center"
              >
                Start selling on BitForge
              </Link>
              <Link
                href="/login"
                className="inline-flex rounded-xl bg-white dark:bg-transparent border border-slate-200 dark:border-white/20 px-8 py-4 text-sm font-bold text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:border-cyan-400 dark:hover:text-white shadow-sm transition-colors w-full sm:w-auto justify-center"
              >
                Explore the marketplace
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
