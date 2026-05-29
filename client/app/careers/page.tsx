"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

interface Career {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experience: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  benefits?: string[];
  salary?: {
    min: number | null;
    max: number | null;
    currency: string;
  };
  status: string;
  applyUrl?: string;
  applyEmail?: string;
  featured: boolean;
  openings: number;
}

export default function CareersPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const [effectiveDate, setEffectiveDate] = useState("January 1, 2026");
  const [lastUpdated, setLastUpdated] = useState("February 1, 2026");

  useEffect(() => {
    fetchCareers();
    api.get("/settings/legal-dates?pageId=careers").then(res => {
      if (res.data?.success && res.data?.data) {
        setEffectiveDate(res.data.data.legalEffectiveDate || "January 1, 2026");
        setLastUpdated(res.data.data.legalLastUpdatedDate || "February 1, 2026");
      }
    }).catch(err => console.error("Failed to fetch dates", err));
  }, []);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/careers");
      setCareers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching careers:", error);
    } finally {
      setLoading(false);
    }
  };

  const latestCareers = careers.slice(0, 2);

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05050a]/80 backdrop-blur-xl">
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
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 dark:border-white/20 px-3 py-1.5 text-slate-700 dark:text-white/80 hover:border-cyan-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="hidden rounded-lg bg-cyan-600 dark:bg-linear-to-r dark:from-cyan-400 dark:to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white dark:text-black shadow-md dark:shadow-[0_0_26px_rgba(56,189,248,0.7)] hover:bg-cyan-700 dark:hover:bg-transparent sm:inline-flex"
                >
                  Join BitForge
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-lg bg-cyan-600 dark:bg-linear-to-r dark:from-cyan-400 dark:to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white dark:text-black shadow-md dark:shadow-[0_0_26px_rgba(56,189,248,0.7)] hover:bg-cyan-700 dark:hover:bg-transparent"
              >
                Dashboard
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* BACKGROUND GLOW — dark mode only */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-70 hidden dark:block">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-8rem] h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-12 pt-20 sm:pt-24 md:pt-28 md:pb-16">
        {/* HERO */}
        <section className="max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-[40px] mb-1">
            Build the operating system
            <span className="mt-1 block bg-linear-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent leading-tight pb-0.5">
              for modern digital commerce
            </span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-white/60 mb-3">
            <strong className="text-slate-700 dark:text-white/80">Last Updated:</strong> {lastUpdated}
          </p>
          <p className="text-sm text-slate-600 dark:text-white/70 sm:text-base max-w-2xl">
            BitForge is where product, engineering, and operations teams come together to
            reinvent how digital products are launched, sold, and supported. Join a fast-moving,
            remote-first team that ships globally and obsesses over customer trust.
          </p>

          <p className="mt-3 text-sm italic text-slate-500 dark:text-white/60">
            We're small, opinionated, and shipping fast.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-white/55">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-600 dark:text-emerald-200/90">
              Remote-first · India time zone friendly
            </span>
            <span className="rounded-full border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1 shadow-sm dark:shadow-none">
              Early-stage, well-funded product company
            </span>
          </div>
        </section>

        {/* OPEN ROLES (LATEST TWO ONLY) */}
        <section className="mt-10 border-t border-slate-200 dark:border-white/10 pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl">Latest Open Roles</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-white/70 sm:text-base">
                Here are the most recently opened positions at BitForge. For the full list of roles,
                you can browse all openings on the next page.
              </p>
            </div>

          </div>

          {loading ? (
            <div className="mt-6 text-center py-12 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
              <div className="text-slate-500 dark:text-white/60">Loading open positions...</div>
            </div>
          ) : careers.length === 0 ? (
            <div className="mt-6 text-center py-12 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
              <p className="text-slate-500 dark:text-white/60 mb-2">No open positions at the moment.</p>
              <p className="text-gray-950 dark:text-white/50 text-sm">
                Check back soon or reach out at careers@bittforge.in.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {latestCareers.map((career) => {
                  const slug = career.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");

                  return (
                    <Link
                      key={career._id}
                      href={`/careers/${slug}`}
                      className="block rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 p-4 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm dark:shadow-none"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                            {career.title}
                          </h3>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-white/60">
                            {career.location} · {career.department}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-200/90 whitespace-nowrap">
                          {career.featured ? "⭐ Featured" : "Open"}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-slate-600 dark:text-white/70 line-clamp-2">
                        {career.description}
                      </p>
                      {career.requirements && career.requirements.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-white/60">
                          {career.requirements.slice(0, 3).map((req, idx) => (
                            <span key={idx} className="rounded-full bg-slate-100 dark:bg-black/40 px-2.5 py-1">
                              {req.length > 30 ? req.substring(0, 30) + "..." : req}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-white/55">
                          {career.employmentType}
                          {career.salary?.min && career.salary?.max && (
                            <>
                              {" "}· {career.salary.currency} {career.salary.min.toLocaleString()}-
                              {career.salary.max.toLocaleString()} LPA
                            </>
                          )}
                        </span>
                        <span className="text-cyan-600 dark:text-cyan-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-200 flex items-center gap-1">
                          View details
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/careers/openings"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-black shadow-md dark:shadow-[0_0_20px_rgba(56,189,248,0.5)] hover:bg-cyan-700 dark:hover:bg-cyan-50 transition-colors"
                >
                  <span>See all openings</span>
                  <span>→</span>
                </Link>
              </div>
            </>
          )}

          <div className="mt-6 rounded-2xl border border-dashed border-white/25 bg-white dark:bg-black/40 p-4 text-xs text-slate-600 dark:text-white/70 sm:text-[13px]">
            Don&apos;t see a role that matches you? We&apos;re always happy to hear from exceptional
            people across product, engineering, design, and operations. Share your portfolio and a
            short note about what you&apos;d like to work on at
            <Link href="mailto:careers@bittforge.in?subject=Joining%20BitForge" className="ml-1 font-bold  text-shadow-sky-950">careers@bittforge.in</Link>.
          </div>
        </section>

        {/* WHY WORK HERE */}
        <section className="mt-10 grid gap-8 md:grid-cols-[1.1fr,0.9fr] md:items-start">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Why work at BitForge</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-white/70 sm:text-base">
              We are building critical payment and fulfillment infrastructure for creators and
              businesses selling digital products. The work you do here will ship to thousands of
              buyers and sellers, and you will see the impact of your decisions in real-time.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 p-4 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-semibold">Ownership from day one</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-white/70">
                  Small, senior teams with clear problem areas. You&apos;ll own meaningful pieces of
                  product from week one and work directly with founders.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 p-4 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-semibold">Product-first culture</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-white/70">
                  We ship fast, talk to customers weekly, and measure ourselves against real
                  adoption, not vanity metrics.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 p-4 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-semibold">Remote, but not alone</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-white/70">
                  Remote-first with structured rituals — virtual standups, deep work blocks, and
                  quarterly in-person meetups for strategy and team-building.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 p-4 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-semibold">Real impact, no bureaucracy</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-white/70">
                  Minimal layers and lean processes. If you see a better way to serve customers,
                  you are empowered to ship it.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-500/5 dark:from-cyan-500/10 to-indigo-500/5 dark:to-indigo-500/10 p-5 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-semibold text-cyan-800 dark:text-cyan-100">How we work</h3>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-white/75">
              <li>• Remote-first with core collaboration hours overlapping IST.</li>
              <li>• Product releases every 2 weeks, with clear owners and post-launch reviews.</li>
              <li>• Transparent roadmap and metrics; everyone sees what we&apos;re building and why.</li>
              <li>• Strong documentation culture — decisions live in docs, not just meetings.</li>
            </ul>
            <div className="pt-2 text-[11px] text-slate-600 dark:text-white/55">
              We hire across India and select global locations for roles where time zone overlap
              is critical.
            </div>
          </div>
        </section>

        {/* TEAMS */}
        <section className="mt-10 border-t border-slate-200 dark:border-white/10 pt-8">
          <h2 className="text-xl font-semibold sm:text-2xl">Teams at BitForge</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-white/70 sm:text-base">
            We bring together people from product, engineering, design, operations, and customer
            success — all focused on making digital commerce feel simple and trustworthy.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 p-4 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-semibold">Product &amp; Engineering</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-white/70">
                Build the marketplace, payments, and trust tooling that power creators and buyers
                globally.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 p-4 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-semibold">Design &amp; Research</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-white/70">
                Craft interfaces that make complex financial flows feel simple, transparent, and
                safe.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 p-4 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-semibold">Operations &amp; Customer Experience</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-white/70">
                Ensure payouts, compliance, and customer support run like clockwork for every
                transaction.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-10 border-t border-slate-200 dark:border-white/10 pt-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/5 dark:from-cyan-500/15 to-indigo-500/5 dark:to-indigo-500/15 p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm dark:shadow-none">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">Ready to build what powers creators?</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-white/75">
                Tell us about the hardest problem you&apos;ve solved and why you want to work on
                digital commerce. We read every message.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm sm:items-end">
              <Link
                href="mailto:careers@bittforge.in?subject=Joining%20BitForge"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-black shadow-md dark:shadow-[0_0_26px_rgba(56,189,248,0.6)] hover:bg-cyan-700 dark:hover:bg-cyan-50"
              >
                Email the hiring team →
              </Link>
              <span className="text-[11px] text-slate-500 dark:text-white/60">
                Typical response time: within 3–5 business days.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
