"use client";

import Link from "next/link";

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">Admin Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-white">User Management</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20">
            Admin Guides
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">User Management</h1>
          <p className="text-lg text-white/70">
            Admin guide for managing users, roles, permissions, and account actions.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">User Management Overview</h2>
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">Manage user accounts, roles, permissions, and handle account-related issues.</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <p className="text-white font-semibold">Buyers</p>
                <p className="text-white/60 text-sm">Purchase products</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <p className="text-white font-semibold">Sellers</p>
                <p className="text-white/60 text-sm">Create & sell products</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <p className="text-white font-semibold">Admins</p>
                <p className="text-white/60 text-sm">Platform management</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">User Actions</h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">🚫 Suspend Account</h3>
              <p className="text-white/70 text-sm">Temporarily disable account for policy violations. User can appeal suspension.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">🗑️ Delete Account</h3>
              <p className="text-white/70 text-sm">Permanently remove account and data. Cannot be undone. Requires approval.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">🔄 Reset Password</h3>
              <p className="text-white/70 text-sm">Send password reset email to user. Use when user has account access issues.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">✅ Verify Account</h3>
              <p className="text-white/70 text-sm">Manually verify seller account if automated verification fails.</p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Role Management</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Assign and modify user roles:</p>
            <div className="space-y-3 text-white/70 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">1.</span>
                <span>Select user from Admin → Users list</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">2.</span>
                <span>Click "Edit Roles" button</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">3.</span>
                <span>Assign: Buyer, Seller, or Admin</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">4.</span>
                <span>Save changes and notify user</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/docs/admin/analytics" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
            <p className="text-white/60 text-sm">User metrics & insights</p>
          </Link>
          <Link href="/docs/admin/moderation" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Moderation</h3>
            <p className="text-white/60 text-sm">Handle reports & abuse</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
