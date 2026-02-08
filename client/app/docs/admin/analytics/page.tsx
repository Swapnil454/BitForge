"use client";

import Link from "next/link";

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">Admin Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Analytics Dashboard</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20">
            Admin Guides
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Analytics Dashboard</h1>
          <p className="text-lg text-white/70">
            Platform metrics, revenue reports, and growth analytics for administrators.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Platform Analytics</h2>
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">Monitor platform health, revenue, user growth, and marketplace trends.</p>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-2xl mb-2">💰</div>
                <p className="text-white font-semibold">Revenue</p>
                <p className="text-white/60 text-sm">Platform earnings</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-2xl mb-2">👥</div>
                <p className="text-white font-semibold">Users</p>
                <p className="text-white/60 text-sm">Growth metrics</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-2xl mb-2">📦</div>
                <p className="text-white font-semibold">Products</p>
                <p className="text-white/60 text-sm">Catalog health</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-white font-semibold">Sales</p>
                <p className="text-white/60 text-sm">Transaction volume</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Key Metrics</h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">📈 Revenue Metrics</h3>
              <ul className="space-y-1 text-white/70 text-sm list-disc list-inside">
                <li>Gross Merchandise Value (GMV)</li>
                <li>Platform fee revenue (commission)</li>
                <li>Month-over-month growth</li>
                <li>Average order value</li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">👤 User Metrics</h3>
              <ul className="space-y-1 text-white/70 text-sm list-disc list-inside">
                <li>Total active users (buyers + sellers)</li>
                <li>New registrations per day/week/month</li>
                <li>User retention rate</li>
                <li>Seller conversion rate</li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">🛍️ Transaction Metrics</h3>
              <ul className="space-y-1 text-white/70 text-sm list-disc list-inside">
                <li>Total transactions processed</li>
                <li>Success rate (completed vs failed)</li>
                <li>Refund rate</li>
                <li>Average transaction time</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Reports & Exports</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Generate reports for analysis:</p>
            <ul className="space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>Monthly revenue report (PDF/CSV)</li>
              <li>Top sellers & products leaderboard</li>
              <li>User growth charts</li>
              <li>Custom date range reports</li>
            </ul>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/docs/admin/settings" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
            <p className="text-white/60 text-sm">Platform configuration</p>
          </Link>
          <Link href="/docs/admin/payouts" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">💸</div>
            <h3 className="text-lg font-semibold text-white mb-2">Payouts</h3>
            <p className="text-white/60 text-sm">Manage disbursements</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
