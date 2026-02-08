"use client";

import Link from "next/link";

export default function AdminModerationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">Admin Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Content Moderation</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20">
            Admin Guides
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Content Moderation</h1>
          <p className="text-lg text-white/70">
            Review reports, enforce policies, and manage disputes on the ContentSellify platform.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Content Moderation</h2>
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">Enforce community guidelines, handle reports, and remove prohibited content.</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🚨</div>
                <p className="text-white font-semibold">Reports</p>
                <p className="text-white/60 text-sm">User-submitted flags</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🚫</div>
                <p className="text-white font-semibold">Violations</p>
                <p className="text-white/60 text-sm">Policy infractions</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-white font-semibold">Actions</p>
                <p className="text-white/60 text-sm">Warning/removal</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Prohibited Content</h2>
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">Content that must be removed immediately:</p>
            <ul className="space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>Pirated or copyrighted material without license</li>
              <li>Malware, viruses, or malicious code</li>
              <li>Adult/NSFW content (unless marketplace allows)</li>
              <li>Hate speech, harassment, or discriminatory content</li>
              <li>Scams, fraud, or misleading products</li>
              <li>Personal information or doxxing</li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Handling Reports</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="space-y-3 text-white/70 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">1.</span>
                <span>Review report details and evidence</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">2.</span>
                <span>Investigate reported content/user</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">3.</span>
                <span>Determine if policy violation occurred</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">4.</span>
                <span>Take action: warning, content removal, or account suspension</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">5.</span>
                <span>Notify reporter and affected parties</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Moderation Queue</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Access: <strong>Admin → Moderation → Reports Queue</strong></p>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-lg">
                <p className="text-white font-semibold mb-1">🟡 Priority: High</p>
                <p className="text-white/70 text-sm">Copyright claims, malware, dangerous content</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg">
                <p className="text-white font-semibold mb-1">🔵 Priority: Medium</p>
                <p className="text-white/70 text-sm">Misleading descriptions, quality issues</p>
              </div>
              <div className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 p-4 rounded-lg">
                <p className="text-white font-semibold mb-1">⚪ Priority: Low</p>
                <p className="text-white/70 text-sm">Minor guideline infractions, disputes</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/docs/admin/users" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
            <p className="text-white/60 text-sm">Manage user accounts</p>
          </Link>
          <Link href="/docs/admin/products" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="text-lg font-semibold text-white mb-2">Product Approval</h3>
            <p className="text-white/60 text-sm">Review submissions</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
