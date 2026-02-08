"use client";

import Link from "next/link";

export default function AdminPayoutsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">Admin Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Payout Management</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20">
            Admin Guides
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Payout Management</h1>
          <p className="text-lg text-white/70">
            Admin guide for managing seller payouts, reviewing holds, and processing manual disbursements.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Payout Management Overview</h2>
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              As an admin, you oversee all seller payouts, review payout requests, manage holds, and handle manual disbursements when needed.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">💵</div>
                <p className="text-white font-semibold">Review Requests</p>
                <p className="text-white/60 text-sm">Approve or hold payouts</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-white font-semibold">Monitor Transactions</p>
                <p className="text-white/60 text-sm">Track all payout activity</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">⚠️</div>
                <p className="text-white font-semibold">Handle Issues</p>
                <p className="text-white/60 text-sm">Resolve failed payouts</p>
              </div>
            </div>
          </div>
        </section>

        {/* Review Process */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Payout Review Process</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3">Access Pending Payouts:</h3>
            <ol className="space-y-3 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">1.</span>
                <span>Navigate to <strong className="text-white">Admin Dashboard → Payouts → Pending</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">2.</span>
                <span>Review seller details, payout amount, and bank information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">3.</span>
                <span>Check for fraud indicators or policy violations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">4.</span>
                <span>Click <strong className="text-white">Approve</strong> or <strong className="text-white">Hold</strong> with reason</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Manual Payouts */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Manual Payout Processing</h2>
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">For failed automatic payouts or special cases:</p>
            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Steps:</h4>
              <ol className="space-y-2 text-white/70 text-sm list-decimal list-inside">
                <li>Go to Admin → Payouts → Failed</li>
                <li>Select payout to process manually</li>
                <li>Verify bank details are correct</li>
                <li>Click "Process Manually"</li>
                <li>Confirm transaction in admin logs</li>
              </ol>
            </div>
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
              <p className="text-red-200 text-sm">⚠️ <strong>Warning:</strong> Manual payouts bypass automated fraud checks. Use with caution.</p>
            </div>
          </div>
        </section>

        {/* Holds & Disputes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Managing Holds & Disputes</h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🚫</span> When to Hold Payouts
              </h3>
              <ul className="space-y-1 text-white/70 text-sm list-disc list-inside">
                <li>Suspicious activity or fraud indicators</li>
                <li>Multiple chargebacks or refund requests</li>
                <li>Seller account under investigation</li>
                <li>Policy violations (copyright, prohibited content)</li>
                <li>Unverified bank account information</li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">📝</span> Adding Hold Notes
              </h3>
              <p className="text-white/70 text-sm mb-2">Always document why a payout is held:</p>
              <ul className="space-y-1 text-white/70 text-sm list-disc list-inside">
                <li>Provide clear, specific reason</li>
                <li>Include evidence or reference tickets</li>
                <li>Set expected resolution timeline</li>
                <li>Notify seller via email automatically</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Analytics */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Payout Analytics</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Monitor payout health and trends:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2">📊 Key Metrics</h4>
                <ul className="space-y-1 text-white/70 text-sm">
                  <li>• Total payouts processed this month</li>
                  <li>• Average payout amount</li>
                  <li>• Success rate (%)</li>
                  <li>• Average processing time</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2">🚨 Alert Conditions</h4>
                <ul className="space-y-1 text-white/70 text-sm">
                  <li>• Payout failure rate &gt; 5%</li>
                  <li>• Processing time &gt; 7 days</li>
                  <li>• Unusual payout patterns</li>
                  <li>• High hold volume</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/docs/payout-system" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">💸</div>
            <h3 className="text-lg font-semibold text-white mb-2">Seller Payout System</h3>
            <p className="text-white/60 text-sm">How payouts work for sellers</p>
          </Link>
          <Link href="/docs/api/payouts" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">🔌</div>
            <h3 className="text-lg font-semibold text-white mb-2">Payouts API</h3>
            <p className="text-white/60 text-sm">API reference documentation</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
