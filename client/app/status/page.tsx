"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type StatusLevel = "operational" | "degraded" | "partial" | "major" | "maintenance";

type SystemComponent = {
  name: string;
  status: StatusLevel;
  description: string;
};

type Incident = {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  timestamp: string;
  updates: {
    time: string;
    message: string;
    status: string;
  }[];
};

type UptimeDay = {
  date: string;
  uptime: number; // 0-100
  incidents: number;
};

export default function StatusPage() {
  // System Status
  const overallStatus: StatusLevel = "operational";

  const systemComponents: SystemComponent[] = [
    {
      name: "API Gateway",
      status: "operational",
      description: "REST API endpoints for all platform operations",
    },
    {
      name: "Payment Processing",
      status: "operational",
      description: "Razorpay payment gateway integration",
    },
    {
      name: "Payout System",
      status: "operational",
      description: "RazorpayX seller payout disbursements",
    },
    {
      name: "Database",
      status: "operational",
      description: "MongoDB primary and replica sets",
    },
    {
      name: "File Storage",
      status: "operational",
      description: "Product file uploads and CDN delivery",
    },
    {
      name: "Authentication",
      status: "operational",
      description: "User login, OAuth, and session management",
    },
    {
      name: "Email Notifications",
      status: "operational",
      description: "Transaction confirmations and system alerts",
    },
    {
      name: "Admin Portal",
      status: "operational",
      description: "Product approval and payout management dashboard",
    },
  ];

  // Recent Incidents (last 7 days)
  const recentIncidents: Incident[] = [
    // Example resolved incident
    // {
    //   id: "inc-001",
    //   title: "Intermittent API timeouts on product listings",
    //   status: "resolved",
    //   severity: "minor",
    //   timestamp: "Feb 5, 2026 14:20 IST",
    //   updates: [
    //     {
    //       time: "14:45 IST",
    //       message: "Issue has been resolved. API response times have returned to normal.",
    //       status: "Resolved",
    //     },
    //     {
    //       time: "14:30 IST",
    //       message: "We've identified a caching layer misconfiguration and are deploying a fix.",
    //       status: "Identified",
    //     },
    //     {
    //       time: "14:20 IST",
    //       message: "We're investigating reports of slow API responses on marketplace listings.",
    //       status: "Investigating",
    //     },
    //   ],
    // },
  ];

  // Scheduled Maintenance
  const scheduledMaintenance: Array<{
    title: string;
    scheduledFor: string;
    impact: string;
  }> = [
      // {
      //   title: "Database maintenance and optimization",
      //   scheduledFor: "Feb 15, 2026 02:00 - 04:00 IST",
      //   impact: "Minimal - Read-only mode for 5-10 minutes during cutover",
      // },
    ];

  // Uptime data (last 90 days)
  const generateUptimeData = (): UptimeDay[] => {
    const data: UptimeDay[] = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        uptime: i === 85 ? 98.5 : 100, // Simulated incident on day 85
        incidents: i === 85 ? 1 : 0,
      });
    }
    return data;
  };

  const uptimeData = generateUptimeData();
  const averageUptime = (
    uptimeData.reduce((sum, day) => sum + day.uptime, 0) / uptimeData.length
  ).toFixed(2);

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#05050a]/80 backdrop-blur-xl shadow-sm dark:shadow-none">
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
            <span className="-ml-3 text-lg font-bold tracking-tight sm:-ml-4 sm:text-2xl bg-linear-to-r from-indigo-600 to-cyan-500 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent leading-tight">
              BitForge
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/docs" className="hidden text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-white sm:inline-flex transition-colors">
              Docs
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-transparent px-3 py-1.5 text-slate-700 dark:text-white/80 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:border-cyan-400 hover:text-indigo-700 dark:hover:text-white transition-all shadow-sm dark:shadow-none"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* BACKGROUND GLOW (Dark Mode Only) */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60 hidden dark:block">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-12 pt-24 sm:pt-28">
        {/* HERO */}
        <section className="mb-8">
          <div className="mb-2">
            <p className="text-xl font-bold uppercase tracking-[0.1em] text-black">
              System Status
            </p>
          </div>

          {/* Overall Status Banner */}
          <div className={`mt-4 rounded-xl border p-5 shadow-sm dark:shadow-none ${getStatusBorderColor(overallStatus)} ${getStatusBgColor(overallStatus)}`}>
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${getStatusDotColor(overallStatus)}`} />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {getStatusText(overallStatus)}
                </h1>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-white/70">
                  Last updated: {new Date().toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })} IST
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM COMPONENTS */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">System Components</h2>
          <div className="grid gap-2">
            {systemComponents.map((component) => (
              <div
                key={component.name}
                className="flex items-center justify-between rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 hover:border-indigo-200 dark:hover:border-white/20 transition shadow-sm dark:shadow-none"
              >
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{component.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-white/60">{component.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getStatusDotColor(component.status)}`} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-white/80 capitalize">
                    {component.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SCHEDULED MAINTENANCE */}
        {scheduledMaintenance.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Scheduled Maintenance</h2>
            <div className="grid gap-3">
              {scheduledMaintenance.map((maintenance, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-500/5 p-4 shadow-sm dark:shadow-none"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🛠️</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{maintenance.title}</h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-white/70">
                        <strong className="text-slate-800 dark:text-white/90">Scheduled:</strong> {maintenance.scheduledFor}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-white/70">
                        <strong className="text-slate-800 dark:text-white/90">Expected Impact:</strong> {maintenance.impact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RECENT INCIDENTS */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white flex items-center">
            Recent Incidents
            <span className="ml-2 text-xs font-medium text-slate-500 dark:text-white/60 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">Last 7 days</span>
          </h2>

          {recentIncidents.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/5 p-5 text-center shadow-sm dark:shadow-none">
              <span className="text-2xl text-emerald-600 dark:text-emerald-400">✓</span>
              <p className="mt-2 text-sm font-bold text-emerald-800 dark:text-white">No incidents reported</p>
              <p className="text-xs text-emerald-600 dark:text-white/60">All systems have been operational for the past 7 days</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`rounded-lg border p-5 shadow-sm dark:shadow-none ${incident.severity === "critical"
                      ? "border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-500/5"
                      : incident.severity === "major"
                        ? "border-orange-200 dark:border-orange-400/30 bg-orange-50 dark:bg-orange-500/5"
                        : "border-amber-200 dark:border-yellow-400/30 bg-amber-50 dark:bg-yellow-500/5"
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${incident.severity === "critical"
                              ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300"
                              : incident.severity === "major"
                                ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300"
                                : "bg-amber-100 dark:bg-yellow-500/20 text-amber-700 dark:text-yellow-300"
                            }`}
                        >
                          {incident.severity}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${incident.status === "resolved"
                              ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : incident.status === "monitoring"
                                ? "bg-indigo-100 dark:bg-cyan-500/20 text-indigo-700 dark:text-cyan-300"
                                : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            }`}
                        >
                          {incident.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{incident.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">{incident.timestamp}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-slate-200/60 dark:border-white/10 pt-3">
                    {incident.updates.map((update, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-cyan-400 mt-1" />
                          {idx < incident.updates.length - 1 && (
                            <div className="w-px flex-1 bg-slate-200 dark:bg-white/20 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{update.status}</span>
                            <span className="text-xs text-slate-300 dark:text-white/30">•</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-white/60">{update.time}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-white/70 mt-0.5">{update.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* UPTIME HISTORY */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white flex items-center">
            Uptime History
            <span className="ml-2 text-xs font-medium text-slate-500 dark:text-white/60 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">Last 90 days</span>
          </h2>

          <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm dark:shadow-none">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{averageUptime}%</p>
                <p className="text-xs font-medium text-slate-500 dark:text-white/60">Average uptime</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {uptimeData.filter((d) => d.uptime === 100).length}/90
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-white/60">Days with 100% uptime</p>
              </div>
            </div>

            {/* Uptime Bar Chart */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 dark:text-white/50 uppercase tracking-wider">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
              <div className="flex gap-0.5 h-10 items-end">
                {uptimeData.map((day, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-sm transition-all hover:opacity-80 cursor-pointer ${day.uptime === 100
                        ? "bg-emerald-500"
                        : day.uptime >= 99
                          ? "bg-amber-500 dark:bg-yellow-500"
                          : day.uptime >= 95
                            ? "bg-orange-500"
                            : "bg-red-500"
                      }`}
                    style={{ height: `${day.uptime}%` }}
                    title={`${day.date}: ${day.uptime}% uptime ${day.incidents > 0 ? `(${day.incidents} incident${day.incidents > 1 ? "s" : ""})` : ""}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500 dark:text-white/60 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span>100% uptime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-amber-500 dark:bg-yellow-500" />
                  <span>99-99.9%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-orange-500" />
                  <span>95-99%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                  <span>&lt;95%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUPPORT & RESOURCES */}
        <section className="rounded-lg border border-indigo-100 dark:border-white/10 bg-indigo-50/50 dark:bg-white/5 p-6 shadow-sm dark:shadow-none mt-10">
          <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Need Help?</h2>
          <p className="mb-5 text-xs text-slate-600 dark:text-white/70">
            If you're experiencing issues not reflected on this page, please contact our support team.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg bg-indigo-600 dark:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 dark:hover:bg-cyan-400 shadow-sm dark:shadow-none transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-transparent px-4 py-2 text-xs font-semibold text-slate-800 dark:text-white/90 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:border-white/40 dark:hover:bg-white/5 shadow-sm dark:shadow-none transition-colors"
            >
              View Documentation
            </Link>
            <Link
              href="/trust-center"
              className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-transparent px-4 py-2 text-xs font-semibold text-slate-800 dark:text-white/90 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:border-white/40 dark:hover:bg-white/5 shadow-sm dark:shadow-none transition-colors"
            >
              Trust Center
            </Link>
          </div>
        </section>

        {/* Footer Links */}
        <section className="mt-10 border-t border-slate-200 dark:border-white/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
            <Link href="/" className="text-slate-500 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors">
              ← Back to BitForge
            </Link>
            <div className="flex flex-wrap gap-4 text-slate-500 dark:text-white/60">
              <a
                href="https://github.com/Swapnil454/BitForge/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 dark:hover:text-white transition-colors"
              >
                Report Issue
              </a>
              <Link href="/about" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
                About Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// Helper functions for status styling
function getStatusText(status: StatusLevel): string {
  switch (status) {
    case "operational":
      return "All Systems Operational";
    case "degraded":
      return "Degraded Performance";
    case "partial":
      return "Partial Outage";
    case "major":
      return "Major Outage";
    case "maintenance":
      return "Scheduled Maintenance";
    default:
      return "Unknown Status";
  }
}

function getStatusBorderColor(status: StatusLevel): string {
  switch (status) {
    case "operational":
      return "border-emerald-200 dark:border-emerald-400/30";
    case "degraded":
      return "border-amber-200 dark:border-yellow-400/30";
    case "partial":
      return "border-orange-200 dark:border-orange-400/30";
    case "major":
      return "border-red-200 dark:border-red-400/30";
    case "maintenance":
      return "border-indigo-200 dark:border-cyan-400/30";
    default:
      return "border-slate-200 dark:border-white/10";
  }
}

function getStatusBgColor(status: StatusLevel): string {
  switch (status) {
    case "operational":
      return "bg-emerald-50 dark:bg-emerald-500/5";
    case "degraded":
      return "bg-amber-50 dark:bg-yellow-500/5";
    case "partial":
      return "bg-orange-50 dark:bg-orange-500/5";
    case "major":
      return "bg-red-50 dark:bg-red-500/5";
    case "maintenance":
      return "bg-indigo-50 dark:bg-cyan-500/5";
    default:
      return "bg-white dark:bg-white/5";
  }
}

function getStatusDotColor(status: StatusLevel): string {
  switch (status) {
    case "operational":
      return "bg-emerald-500";
    case "degraded":
      return "bg-amber-500 dark:bg-yellow-500";
    case "partial":
      return "bg-orange-500";
    case "major":
      return "bg-red-500";
    case "maintenance":
      return "bg-indigo-500 dark:bg-cyan-500";
    default:
      return "bg-slate-300 dark:bg-white/50";
  }
}
