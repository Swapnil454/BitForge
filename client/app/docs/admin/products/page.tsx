"use client";

import Link from "next/link";

export default function AdminProductsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">Admin Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Product Management</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20">
            Admin Guides
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Product Management</h1>
          <p className="text-lg text-white/70">
            Admin guide for approving/rejecting products, managing pending changes, and enforcing content policies.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Product Approval Workflow</h2>
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">Review and approve seller product submissions to maintain marketplace quality.</p>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">📝</div>
                <p className="text-white font-semibold text-sm">Submitted</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-white font-semibold text-sm">Reviewing</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-white font-semibold text-sm">Approved</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">❌</div>
                <p className="text-white font-semibold text-sm">Rejected</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Review Checklist</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1"/>
                <div>
                  <p className="text-white font-semibold">Title & Description</p>
                  <p className="text-white/60 text-sm">Clear, accurate, no misleading claims</p>
                </div>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1"/>
                <div>
                  <p className="text-white font-semibold">Content Quality</p>
                  <p className="text-white/60 text-sm">High-quality files, proper formatting</p>
                </div>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1"/>
                <div>
                  <p className="text-white font-semibold">Copyright & Licensing</p>
                  <p className="text-white/60 text-sm">Seller owns rights or has proper license</p>
                </div>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1"/>
                <div>
                  <p className="text-white font-semibold">Preview Materials</p>
                  <p className="text-white/60 text-sm">Screenshots/samples representative of product</p>
                </div>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1"/>
                <div>
                  <p className="text-white font-semibold">Policy Compliance</p>
                  <p className="text-white/60 text-sm">No prohibited content, follows guidelines</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Bulk Actions</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Efficiently manage multiple products:</p>
            <ul className="space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>Select multiple pending products</li>
              <li>Approve all selected (if quality verified)</li>
              <li>Flag for additional review</li>
              <li>Export product list for audit</li>
            </ul>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/docs/product-management" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="text-lg font-semibold text-white mb-2">Product Management</h3>
            <p className="text-white/60 text-sm">Seller product guide</p>
          </Link>
          <Link href="/docs/admin/moderation" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Moderation</h3>
            <p className="text-white/60 text-sm">Content moderation policies</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
