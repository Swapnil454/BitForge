"use client";

import Link from "next/link";

export default function TestingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">Platform Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Testing Guide</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            Platform Guides
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Testing Guide</h1>
          <p className="text-lg text-white/70">
            Test mode, sample data, and integration testing strategies for ContentSellify.
          </p>
        </div>

        {/* Test Mode */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Test Mode</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              Test mode allows you to simulate transactions, payouts, and workflows without processing real payments or affecting production data.
            </p>
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Enable Test Mode:</h3>
              <ol className="space-y-2 text-white/70 text-sm list-decimal list-inside">
                <li>Go to Dashboard → API Settings</li>
                <li>Toggle "Test Mode" switch</li>
                <li>Use test API keys (start with <code className="text-cyan-300">csfy_test_</code>)</li>
                <li>Transactions marked with 🧪 badge</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Test Cards */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Test Payment Cards</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white font-semibold">Card Number</th>
                    <th className="text-left p-4 text-white font-semibold">Brand</th>
                    <th className="text-left p-4 text-white font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody className="text-white/70 text-sm font-mono">
                  <tr className="border-t border-white/10">
                    <td className="p-4 text-cyan-400">4242 4242 4242 4242</td>
                    <td className="p-4">Visa</td>
                    <td className="p-4 text-green-400">Success</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 text-cyan-400">5555 5555 5555 4444</td>
                    <td className="p-4">Mastercard</td>
                    <td className="p-4 text-green-400">Success</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 text-cyan-400">4000 0000 0000 0002</td>
                    <td className="p-4">Visa</td>
                    <td className="p-4 text-red-400">Declined</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 text-cyan-400">4000 0000 0000 9995</td>
                    <td className="p-4">Visa</td>
                    <td className="p-4 text-yellow-400">Insufficient Funds</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-blue-500/10 border-t border-blue-500/30">
              <p className="text-blue-200 text-sm">
                <strong>Note:</strong> Use any future expiry date (e.g., 12/25) and any 3-digit CVV.
              </p>
            </div>
          </div>
        </section>

        {/* Sample Data */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Sample Data</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">👤</span> Test Users
              </h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white/5 p-3 rounded">
                  <p className="text-white font-mono text-xs">test-buyer@example.com</p>
                  <p className="text-white/60 text-xs">Pre-configured buyer account</p>
                </div>
                <div className="bg-white/5 p-3 rounded">
                  <p className="text-white font-mono text-xs">test-seller@example.com</p>
                  <p className="text-white/60 text-xs">Pre-configured seller with products</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">📦</span> Sample Products
              </h3>
              <p className="text-white/70 text-sm mb-2">Test mode includes sample products:</p>
              <ul className="space-y-1 text-white/60 text-sm list-disc list-inside">
                <li>React Course ($49.99)</li>
                <li>Design Assets Bundle ($29.99)</li>
                <li>Python Ebook ($19.99)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testing Workflows */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Testing Common Workflows</h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">🛍️ Purchase Flow</h3>
              <ol className="space-y-1 text-white/70 text-sm list-decimal list-inside">
                <li>Add product to cart</li>
                <li>Proceed to checkout</li>
                <li>Use test card: 4242 4242 4242 4242</li>
                <li>Complete purchase</li>
                <li>Verify order in dashboard</li>
              </ol>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">💸 Payout Testing</h3>
              <ol className="space-y-1 text-white/70 text-sm list-decimal list-inside">
                <li>Complete test purchases worth $50+</li>
                <li>Request payout in dashboard</li>
                <li>Simulate approval (auto-approved in test)</li>
                <li>Check payout status (completes instantly)</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Testing Best Practices</h2>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-white/80 text-sm flex items-start gap-2">
                <span className="text-xl">✅</span>
                <span><strong>Test both success and failure scenarios</strong> - Don't just test happy paths. Use declined cards, invalid data, and edge cases.</span>
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-white/80 text-sm flex items-start gap-2">
                <span className="text-xl">✅</span>
                <span><strong>Keep test and production keys separate</strong> - Never use production keys in development or test keys in production.</span>
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-white/80 text-sm flex items-start gap-2">
                <span className="text-xl">✅</span>
                <span><strong>Clean test data regularly</strong> - Reset test environment weekly to avoid clutter and ensure consistent results.</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
