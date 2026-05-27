import type { Metadata } from "next";
import Link from "next/link";
import DynamicHeader from "@/app/components/DynamicHeader";
import Image from "next/image";
import { ContactForm } from "./ContactForm";
import { getGlobalLegalDates } from "@/lib/getGlobalSettings";

export const metadata: Metadata = {
  title: "Contact BitForge | Support, Sales & Partnerships",
  description:
    "Get in touch with the BitForge team for product support, sales and partnership enquiries, or general questions about the BitForge digital product marketplace.",
};

export default async function ContactPage() {
  const dates = await getGlobalLegalDates("contact");
  const effectiveDate = dates?.legalEffectiveDate || "January 1, 2026";
  const lastUpdatedDate = dates?.legalLastUpdatedDate || "February 1, 2026";

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white overflow-x-hidden">
      {/* Background glow - Dark mode only */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-indigo-600/25 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[460px] w-[460px] rounded-full bg-cyan-500/20 blur-[180px]" />
      </div>

      <DynamicHeader title="Contact Us" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 sm:pt-20 pb-12 md:px-6 md:pb-16 lg:pb-24">
        {/* Hero */}
        <section className="mb-10 md:mb-16 text-center sm:text-left max-w-4xl pt-4">
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-cyan-300/80 bg-indigo-50 dark:bg-transparent px-3 py-1 rounded-full dark:px-0 dark:py-0">
              Contact
            </p>
            <p className="text-xs text-slate-500 dark:text-white/60">
              <strong className="text-slate-700 dark:text-white/80">Effective Date:</strong> {effectiveDate}
              <span className="mx-3">·</span>
              <strong className="text-slate-700 dark:text-white/80">Last Updated:</strong> {lastUpdatedDate}
            </p>
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-[1.1] sm:text-5xl md:text-6xl text-slate-900 dark:text-white mb-6">
            Talk to the BitForge team{" "}
            <span className="block mt-2 bg-linear-to-r from-indigo-600 to-cyan-500 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Support, sales and partnership enquiries
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 dark:text-white/70 sm:text-lg leading-relaxed mx-auto sm:mx-0">
            Whether you are a creator selling your first product, a team consolidating your
            digital commerce stack, or a buyer who needs help with an order, we are here to help.
            Choose the most relevant option below and we will route your request to the right
            people internally.
          </p>
        </section>

        {/* Primary contact options */}
        <section className="mb-16 grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Form */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-6 sm:p-10 shadow-sm">
            <h2 className="text-xl font-bold sm:text-2xl text-slate-900 dark:text-white mb-3">Send us a message</h2>
            <p className="mb-8 text-sm text-slate-600 dark:text-white/65 leading-relaxed">
              Share a few details about what you need help with. Our team typically responds
              within one working day for support requests and within two working days for
              partnership enquiries.
            </p>

            <ContactForm />
          </div>

          {/* Direct channels */}
          <aside className="space-y-8 rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-black/50 p-6 sm:p-10 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Support</h2>
              <p className="text-sm text-slate-600 dark:text-white/65 leading-relaxed">
                For help with payments, access, or downloads, reach out to our support team.
              </p>
              <a
                href="mailto:help@bittforge.in"
                className="mt-3 inline-flex text-sm font-bold text-indigo-600 dark:text-cyan-300 hover:text-indigo-800 dark:hover:text-cyan-200 hover:underline underline-offset-2 transition-colors"
              >
                help@bittforge.in
              </a>
              <p className="mt-2 text-xs text-slate-500 dark:text-white/45 font-medium">
                Typical response time: under 24 hours on business days.
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-white/10 pt-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Sales & partnerships</h2>
              <p className="text-sm text-slate-600 dark:text-white/65 leading-relaxed">
                If you are evaluating BitForge for a team, or exploring integrations and
                co-marketing opportunities, our partnerships group can help.
              </p>
              <a
                href="mailto:partners@bittforge.in"
                className="mt-3 inline-flex text-sm font-bold text-indigo-600 dark:text-cyan-300 hover:text-indigo-800 dark:hover:text-cyan-200 hover:underline underline-offset-2 transition-colors"
              >
                partners@bittforge.in
              </a>
              <p className="mt-2 text-xs text-slate-500 dark:text-white/45 font-medium">
                Please include a short description of your company and use case.
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-white/10 pt-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Press & legal</h2>
              <p className="text-sm text-slate-600 dark:text-white/65 leading-relaxed">
                For media enquiries, platform policies, or legal notices, contact us via our
                dedicated mailbox.
              </p>
              <a
                href="mailto:legal@bittforge.in"
                className="mt-3 inline-flex text-sm font-bold text-indigo-600 dark:text-cyan-300 hover:text-indigo-800 dark:hover:text-cyan-200 hover:underline underline-offset-2 transition-colors"
              >
                legal@bittforge.in
              </a>
            </div>
          </aside>
        </section>

        {/* Regional info / footer meta */}
        <section className="mt-8 rounded-3xl border border-slate-200/60 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-white/60 mb-6">
            Company & regional information
          </h2>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-base font-bold text-slate-900 dark:text-white/90">BitForge Platform</p>
              <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">India-first, remote-friendly team focused on digital product commerce.</p>
              <p className="text-sm text-slate-500 dark:text-white/45 leading-relaxed">
                For security disclosures, uptime, and policy details, visit our Trust Center.
              </p>
              <Link
                href="/trust-center"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-cyan-300 hover:text-indigo-800 dark:hover:text-cyan-200 transition-colors group"
              >
                Open Trust Center <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-base font-bold text-slate-900 dark:text-white/90">Operational hours</p>
              <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">Support coverage: Monday–Friday, 10:00–19:00 IST (excluding public holidays).</p>
              <p className="text-sm text-slate-500 dark:text-white/45 leading-relaxed">
                Messages received outside these hours are queued and answered on the next
                business day.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
