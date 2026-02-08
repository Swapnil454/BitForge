"use client";

import Link from "next/link";

export default function ApprovedChangesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">For Sellers</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Approved Changes</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            For Sellers
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Approved Changes</h1>
          <p className="text-lg text-white/70">
            View history of approved product changes and modifications.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              Track the complete history of approved changes to your products. View what was modified, when it was approved, and who approved it for full transparency and audit trail.
            </p>
          </div>
        </section>

        {/* Access History */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Viewing Approved Changes</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Two Ways to Access:</h3>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-cyan-400">1.</span> Product-Specific History
                </h4>
                <ol className="space-y-2 text-white/70 text-sm ml-6">
                  <li>Go to Dashboard → My Products</li>
                  <li>Click on any product</li>
                  <li>Select "Change History" tab</li>
                  <li>See all approved modifications for that product</li>
                </ol>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-cyan-400">2.</span> All Changes Overview
                </h4>
                <ol className="space-y-2 text-white/70 text-sm ml-6">
                  <li>Go to Dashboard → Approved Changes</li>
                  <li>View chronological list of all approved changes</li>
                  <li>Filter by product, date range, or change type</li>
                  <li>Export history as CSV for records</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Change Details */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">What's Tracked</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">📋</span> Change Information
              </h3>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>What was changed (field name)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Previous value (before)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>New value (after)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Your change note/reason</span>
                </li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">📅</span> Timestamps & Approval
              </h3>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>When submitted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>When approved</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Who approved (admin name)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Admin review notes</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Example */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Example Change Record</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <div className="bg-white/5 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">React Master Course - Price Update</h3>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Approved</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/60">Field Changed:</p>
                  <p className="text-white font-mono">price</p>
                </div>
                <div>
                  <p className="text-white/60">Submitted:</p>
                  <p className="text-white">Jan 15, 2024 - 10:30 AM</p>
                </div>
                <div>
                  <p className="text-white/60">Previous Value:</p>
                  <p className="text-white font-mono">$39.99</p>
                </div>
                <div>
                  <p className="text-white/60">New Value:</p>
                  <p className="text-white font-mono">$49.99</p>
                </div>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Your Note:</p>
                <p className="text-white/80 text-sm italic">"Price increase to reflect new React 19 content added"</p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Approved by: <span className="text-white">Admin John</span></span>
                  <span className="text-white/60">Jan 15, 2024 - 2:45 PM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Export */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Filtering & Export</h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🔍</span> Filter Options
              </h3>
              <p className="text-white/60 text-sm mb-3">
                Narrow down your change history using filters:
              </p>
              <ul className="space-y-1 text-white/70 text-sm list-disc list-inside">
                <li>Date range (last 7 days, 30 days, custom)</li>
                <li>Product name</li>
                <li>Change type (price, description, files, images)</li>
                <li>Approved by (specific admin)</li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">📥</span> Export Records
              </h3>
              <p className="text-white/60 text-sm mb-3">
                Export your change history for record-keeping:
              </p>
              <ul className="space-y-1 text-white/70 text-sm list-disc list-inside">
                <li>CSV format for Excel/Sheets</li>
                <li>PDF report with detailed diff</li>
                <li>JSON for programmatic access</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Why It Matters */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Why Track Changes?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-white font-semibold mb-2">Transparency</h3>
              <p className="text-white/60 text-sm">Full audit trail of product modifications</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-2">Analytics</h3>
              <p className="text-white/60 text-sm">Understand product evolution over time</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-white font-semibold mb-2">Compliance</h3>
              <p className="text-white/60 text-sm">Proof of approval for audits</p>
            </div>
          </div>
        </section>

        {/* Related */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/docs/product-changes" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300">Product Changes</h3>
            <p className="text-white/60 text-sm">How to submit changes</p>
          </Link>
          <Link href="/docs/product-management" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300">Product Management</h3>
            <p className="text-white/60 text-sm">Complete management guide</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
