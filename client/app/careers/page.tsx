"use client";

import Link from "next/link";
import Image from "next/image";

export default function CareersPage() {
  return (
    <main className="relative min-h-screen bg-[#05050a] text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 border-b border-white/10 bg-[#05050a]/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-6">
          <div className="flex items-center">
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
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-3 py-1.5 text-white/80 hover:border-cyan-400 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="hidden rounded-lg bg-linear-to-r from-cyan-400 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-black shadow-[0_0_26px_rgba(56,189,248,0.7)] sm:inline-flex"
            >
              Join BitForge
            </Link>
          </div>
        </nav>
      </header>

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-70">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-8rem] h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-24 sm:pt-28 md:pt-32 md:pb-28">
        {/* HERO */}
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            Careers
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-[40px]">
            Build the operating system
            <span className="mt-1 block bg-linear-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent leading-tight pb-0.5">
              for modern digital commerce
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
            BitForge is where product, engineering, and operations teams come together to
            reinvent how digital products are launched, sold, and supported. Join a fast-moving,
            remote-first team that ships globally and obsesses over customer trust.
          </p>

          <p className="mt-4 text-sm italic text-white/60">
            We're small, opinionated, and shipping fast.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/55">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-200/90">
              Remote-first · India time zone friendly
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Early-stage, well-funded product company
            </span>
          </div>
        </section>

        {/* WHY WORK HERE */}
        <section className="mt-12 grid gap-10 md:grid-cols-[1.1fr,0.9fr] md:items-start">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Why work at BitForge</h2>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              We are building critical payment and fulfillment infrastructure for creators and
              businesses selling digital products. The work you do here will ship to thousands of
              buyers and sellers, and you will see the impact of your decisions in real-time.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
                <h3 className="text-sm font-semibold">Ownership from day one</h3>
                <p className="mt-2 text-xs text-white/70">
                  Small, senior teams with clear problem areas. You&apos;ll own meaningful pieces of
                  product from week one and work directly with founders.
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
                <h3 className="text-sm font-semibold">Product-first culture</h3>
                <p className="mt-2 text-xs text-white/70">
                  We ship fast, talk to customers weekly, and measure ourselves against real
                  adoption, not vanity metrics.
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
                <h3 className="text-sm font-semibold">Remote, but not alone</h3>
                <p className="mt-2 text-xs text-white/70">
                  Remote-first with structured rituals — virtual standups, deep work blocks, and
                  quarterly in-person meetups for strategy and team-building.
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
                <h3 className="text-sm font-semibold">Real impact, no bureaucracy</h3>
                <p className="mt-2 text-xs text-white/70">
                  Minimal layers and lean processes. If you see a better way to serve customers,
                  you are empowered to ship it.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-500/10 to-indigo-500/10 p-5">
            <h3 className="text-sm font-semibold text-cyan-100">How we work</h3>
            <ul className="space-y-2 text-xs text-white/75">
              <li>• Remote-first with core collaboration hours overlapping IST.</li>
              <li>• Product releases every 2 weeks, with clear owners and post-launch reviews.</li>
              <li>• Transparent roadmap and metrics; everyone sees what we&apos;re building and why.</li>
              <li>• Strong documentation culture — decisions live in docs, not just meetings.</li>
            </ul>
            <div className="pt-2 text-[11px] text-white/55">
              We hire across India and select global locations for roles where time zone overlap
              is critical.
            </div>
          </div>
        </section>

        {/* TEAMS */}
        <section className="mt-14 border-t border-white/10 pt-10">
          <h2 className="text-xl font-semibold sm:text-2xl">Teams at BitForge</h2>
          <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            We bring together people from product, engineering, design, operations, and customer
            success — all focused on making digital commerce feel simple and trustworthy.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <h3 className="text-sm font-semibold">Product &amp; Engineering</h3>
              <p className="mt-2 text-xs text-white/70">
                Build the marketplace, payments, and trust tooling that power creators and buyers
                globally.
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <h3 className="text-sm font-semibold">Design &amp; Research</h3>
              <p className="mt-2 text-xs text-white/70">
                Craft interfaces that make complex financial flows feel simple, transparent, and
                safe.
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <h3 className="text-sm font-semibold">Operations &amp; Customer Experience</h3>
              <p className="mt-2 text-xs text-white/70">
                Ensure payouts, compliance, and customer support run like clockwork for every
                transaction.
              </p>
            </div>
          </div>
        </section>

        {/* OPEN ROLES */}
        <section className="mt-14 border-t border-white/10 pt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl">Open roles</h2>
              <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">
                We hire carefully and in small batches. If you don&apos;t see a role that matches your
                experience, you can still reach out — we review every application.
              </p>
            </div>
            <p className="text-xs text-emerald-300/90">
              No matching role? Write to us at careers@bitforge.in with your portfolio.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Senior Full Stack Engineer</h3>
                  <p className="mt-1 text-[11px] text-white/60">
                    Remote · India / EMEA · Engineering
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-200/90">
                  Actively hiring
                </span>
              </div>
              <p className="mt-3 text-xs text-white/70">
                Help design and build core marketplace flows, payments, and internal tools using
                modern TypeScript, Node.js, and cloud-native infrastructure.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/60">
                <span className="rounded-full bg-black/40 px-2.5 py-1">TypeScript</span>
                <span className="rounded-full bg-black/40 px-2.5 py-1">Node.js</span>
                <span className="rounded-full bg-black/40 px-2.5 py-1">Next.js</span>
                <span className="rounded-full bg-black/40 px-2.5 py-1">MongoDB</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-white/55">Full-time · Competitive compensation &amp; ESOPs</span>
                <Link
                  href="mailto:careers@bitforge.in?subject=Senior%20Full%20Stack%20Engineer%20-%20BitForge"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Apply →
                </Link>
              </div>
            </article>

            <article className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Product Designer</h3>
                  <p className="mt-1 text-[11px] text-white/60">
                    Remote · India / SE Asia · Design
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-200/90">
                  Open
                </span>
              </div>
              <p className="mt-3 text-xs text-white/70">
                Define the end-to-end experience for creators and buyers across marketplace,
                payouts, and support tooling.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/60">
                <span className="rounded-full bg-black/40 px-2.5 py-1">Product design</span>
                <span className="rounded-full bg-black/40 px-2.5 py-1">Design systems</span>
                <span className="rounded-full bg-black/40 px-2.5 py-1">User research</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-white/55">Full-time · Competitive compensation</span>
                <Link
                  href="mailto:careers@bitforge.in?subject=Product%20Designer%20-%20BitForge"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Apply →
                </Link>
              </div>
            </article>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-white/25 bg-black/40 p-4 text-xs text-white/70 sm:text-[13px]">
            Don&apos;t see a role that matches you? We&apos;re always happy to hear from exceptional
            people across product, engineering, design, and operations. Share your portfolio and a
            short note about what you&apos;d like to work on at
            <span className="ml-1 font-medium text-cyan-200">careers@bitforge.in</span>.
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 border-t border-white/10 pt-10">
          <div className="flex flex-col gap-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">Ready to build what powers creators?</h2>
              <p className="mt-2 text-sm text-white/75">
                Tell us about the hardest problem you&apos;ve solved and why you want to work on
                digital commerce. We read every message.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm sm:items-end">
              <Link
                href="mailto:careers@bitforge.in?subject=Joining%20BitForge"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_0_26px_rgba(56,189,248,0.6)] hover:bg-cyan-50"
              >
                Email the hiring team →
              </Link>
              <span className="text-[11px] text-white/60">
                Typical response time: within 3–5 business days.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
