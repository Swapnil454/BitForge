import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact BitForge | Support, Sales & Partnerships",
  description:
    "Get in touch with the BitForge team for product support, sales and partnership enquiries, or general questions about the BitForge digital product marketplace.",
};

export default function ContactPage() {
  return (
    <main className="relative min-h-screen bg-[#05050a] text-white overflow-x-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-indigo-600/25 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[460px] w-[460px] rounded-full bg-cyan-500/20 blur-[180px]" />
      </div>

      {/* Header (fixed, same as About) */}
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
            <Link href="/login" className="hover:text-white">
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
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-24 pb-14 md:px-6 md:pt-28 md:pb-18 lg:pt-32 lg:pb-22">
        {/* Hero */}
        <section className="mb-12 md:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight leading-tight sm:text-4xl md:text-5xl">
            Talk to the BitForge team
            <span className="block pb-1 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Support, sales and partnership enquiries
            </span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/70 sm:max-w-2xl sm:text-base">
            Whether you are a creator selling your first product, a team consolidating your
            digital commerce stack, or a buyer who needs help with an order, we are here to help.
            Choose the most relevant option below and we will route your request to the right
            people internally.
          </p>
        </section>

        {/* Primary contact options */}
        <section className="mb-12 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7">
            <h2 className="text-base font-semibold sm:text-lg">Send us a message</h2>
            <p className="mt-2 text-[13px] text-white/65 sm:text-sm">
              Share a few details about what you need help with. Our team typically responds
              within one working day for support requests and within two working days for
              partnership enquiries.
            </p>

            <ContactForm />
          </div>

          {/* Direct channels */}
          <aside className="space-y-6 rounded-2xl border border-white/10 bg-black/50 p-5 text-[13px] text-white/75 sm:p-6 sm:text-sm">
            <div>
              <h2 className="text-sm font-semibold text-white">Support</h2>
              <p className="mt-2 text-white/65">
                For help with payments, access, or downloads, reach out to our support team.
              </p>
              <a
                href="mailto:help@bittforge.in"
                className="mt-2 inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200 hover:underline underline-offset-2"
              >
                help@bittforge.in
              </a>
              <p className="mt-1 text-[11px] text-white/45">
                Typical response time: under 24 hours on business days.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">Sales & partnerships</h2>
              <p className="mt-2 text-white/65">
                If you are evaluating BitForge for a team, or exploring integrations and
                co-marketing opportunities, our partnerships group can help.
              </p>
              <a
                href="mailto:partners@bittforge.in"
                className="mt-2 inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200 hover:underline underline-offset-2"
              >
                partners@bittforge.in
              </a>
              <p className="mt-1 text-[11px] text-white/45">
                Please include a short description of your company and use case.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">Press & legal</h2>
              <p className="mt-2 text-white/65">
                For media enquiries, platform policies, or legal notices, contact us via our
                dedicated mailbox.
              </p>
              <a
                href="mailto:legal@bittforge.in"
                className="mt-2 inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200 hover:underline underline-offset-2"
              >
                legal@bittforge.in
              </a>
            </div>
          </aside>
        </section>

        {/* Regional info / footer meta */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-[12px] text-white/65 sm:p-6 sm:text-[13px]">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Company & regional information
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="font-medium text-white/80">BitForge Platform</p>
              <p>India-first, remote-friendly team focused on digital product commerce.</p>
              <p className="text-white/45">
                For security disclosures, uptime, and policy details, visit our Trust Center.
              </p>
              <Link
                href="/trust-center"
                className="inline-flex text-xs font-medium text-cyan-300 hover:text-cyan-200 hover:underline underline-offset-2"
              >
                Open Trust Center
              </Link>
            </div>
            <div className="space-y-1.5">
              <p className="font-medium text-white/80">Operational hours</p>
              <p>Support coverage: Monday–Friday, 10:00–19:00 IST (excluding public holidays).</p>
              <p className="text-white/45">
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
