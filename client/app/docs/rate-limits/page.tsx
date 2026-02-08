"use client";

import Link from "next/link";

export default function RateLimitsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">Platform Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Rate Limits</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            Platform Guides
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">API Rate Limits</h1>
          <p className="text-lg text-white/70">
            API rate limits, quotas, and best practices for optimization.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Rate Limit Overview</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              Rate limits protect our API infrastructure and ensure fair usage across all users. When you exceed the limit, you'll receive a <code className="text-cyan-300">429 Too Many Requests</code> error.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">🏯</div>
                <h3 className="text-white font-semibold mb-2">100 req/min</h3>
                <p className="text-white/60 text-sm">Standard Tier</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="text-white font-semibold mb-2">500 req/min</h3>
                <p className="text-white/60 text-sm">Pro Tier</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">⭐</div>
                <h3 className="text-white font-semibold mb-2">Custom</h3>
                <p className="text-white/60 text-sm">Enterprise</p>
              </div>
            </div>
          </div>
        </section>

        {/* Limits by Tier */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Limits by Account Tier</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white font-semibold">Tier</th>
                    <th className="text-left p-4 text-white font-semibold">Requests/Minute</th>
                    <th className="text-left p-4 text-white font-semibold">Requests/Hour</th>
                    <th className="text-left p-4 text-white font-semibold">Requests/Day</th>
                  </tr>
                </thead>
                <tbody className="text-white/70 text-sm">
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-semibold text-white">Free</td>
                    <td className="p-4 text-cyan-400">60</td>
                    <td className="p-4">1,000</td>
                    <td className="p-4">10,000</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-semibold text-white">Standard</td>
                    <td className="p-4 text-cyan-400">100</td>
                    <td className="p-4">3,000</td>
                    <td className="p-4">50,000</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-semibold text-white">Pro</td>
                    <td className="p-4 text-cyan-400">500</td>
                    <td className="p-4">15,000</td>
                    <td className="p-4">250,000</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-semibold text-white">Enterprise</td>
                    <td className="p-4 text-cyan-400">Custom</td>
                    <td className="p-4">Custom</td>
                    <td className="p-4">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Headers */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Rate Limit Headers</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Every API response includes rate limit information in headers:</p>
            <div className="bg-slate-950 border border-white/10 rounded-lg p-4 space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-white/60">X-RateLimit-Limit:</span>
                <span className="text-cyan-300">100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">X-RateLimit-Remaining:</span>
                <span className="text-cyan-300">87</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">X-RateLimit-Reset:</span>
                <span className="text-cyan-300">1704123600</span>
              </div>
            </div>
          </div>
        </section>

        {/* Handling */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Handling Rate Limits</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3">Exponential Backoff Example</h3>
            <div className="bg-slate-950 border border-white/10 rounded-lg p-4">
              <pre className="text-cyan-300 text-sm overflow-x-auto"><code>{`async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status !== 429) {
      return response;
    }
    
    // Get retry-after from headers (in seconds)
    const retryAfter = response.headers.get('Retry-After');
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Max retries exceeded');
}`}</code></pre>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Optimization Tips</h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">📄</span> Cache Responses
              </h3>
              <p className="text-white/60 text-sm">Cache API responses locally. Product data, user profiles, and settings change infrequently.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🔔</span> Use Webhooks
              </h3>
              <p className="text-white/60 text-sm">Instead of polling for updates, use webhooks to receive real-time notifications without consuming API requests.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">📦</span> Batch Requests
              </h3>
              <p className="text-white/60 text-sm">Use batch endpoints when available: <code className="text-cyan-300">/products/batch</code> instead of individual product requests.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
