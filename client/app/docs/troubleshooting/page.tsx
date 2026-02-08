"use client";

import Link from "next/link";

export default function TroubleshootingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">Platform Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Troubleshooting</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            Platform Guides
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Troubleshooting</h1>
          <p className="text-lg text-white/70">
            Common issues, debugging tips, and error resolution for ContentSellify.
          </p>
        </div>

        {/* Common Issues */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Common Issues & Solutions</h2>
          <div className="space-y-4">
            {/* API Keys */}
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer flex items-center gap-2">
                <span className="text-xl">🔑</span> API Authentication Errors (401 Unauthorized)
              </summary>
              <div className="mt-4 space-y-3 text-white/70 text-sm">
                <p><strong className="text-white">Symptom:</strong> Getting 401 errors when calling API endpoints.</p>
                <p><strong className="text-white">Common Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Missing or invalid API key</li>
                  <li>Using test key in production (or vice versa)</li>
                  <li>API key not in Authorization header</li>
                  <li>Expired OAuth token</li>
                </ul>
                <p><strong className="text-white">Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Verify API key: Dashboard → API Settings → Keys</li>
                  <li>Use correct format: <code className="text-cyan-300">Authorization: Bearer YOUR_API_KEY</code></li>
                  <li>Regenerate key if compromised</li>
                  <li>Implement token refresh for OAuth</li>
                </ul>
              </div>
            </details>

            {/* Upload Errors */}
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer flex items-center gap-2">
                <span className="text-xl">📤</span> File Upload Failures
              </summary>
              <div className="mt-4 space-y-3 text-white/70 text-sm">
                <p><strong className="text-white">Symptom:</strong> Files fail to upload or upload gets stuck.</p>
                <p><strong className="text-white">Common Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>File size exceeds 500MB limit</li>
                  <li>Unsupported file type</li>
                  <li>Poor network connection</li>
                  <li>Browser timeout</li>
                </ul>
                <p><strong className="text-white">Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Compress files under 500MB</li>
                  <li>Use supported formats: PDF, ZIP, MP4, MP3, JPG, PNG</li>
                  <li>Use chunked uploads for large files</li>
                  <li>Try different browser or clear cache</li>
                </ul>
              </div>
            </details>

            {/* Payment Issues */}
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer flex items-center gap-2">
                <span className="text-xl">💳</span> Payment Processing Errors
              </summary>
              <div className="mt-4 space-y-3 text-white/70 text-sm">
                <p><strong className="text-white">Symptom:</strong> Payments failing or getting declined.</p>
                <p><strong className="text-white">Common Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Card declined by bank</li>
                  <li>Insufficient funds</li>
                  <li>3D Secure authentication failed</li>
                  <li>Card expired or blocked</li>
                </ul>
                <p><strong className="text-white">Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Try different payment method</li>
                  <li>Contact bank to verify card status</li>
                  <li>Enable 3D Secure in settings</li>
                  <li>Use test cards for development</li>
                </ul>
              </div>
            </details>

            {/* Payout Issues */}
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer flex items-center gap-2">
                <span className="text-xl">💸</span> Payout Delays or Failures
              </summary>
              <div className="mt-4 space-y-3 text-white/70 text-sm">
                <p><strong className="text-white">Symptom:</strong> Payouts not arriving or showing as failed.</p>
                <p><strong className="text-white">Common Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Incorrect bank account details</li>
                  <li>Minimum payout amount not met ($10)</li>
                  <li>Account verification pending</li>
                  <li>Bank processing delays</li>
                </ul>
                <p><strong className="text-white">Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Verify bank details: Dashboard → Settings → Bank Account</li>
                  <li>Wait until balance reaches $10 minimum</li>
                  <li>Complete account verification</li>
                  <li>Allow 3-5 business days for processing</li>
                </ul>
              </div>
            </details>

            {/* Product Approval */}
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer flex items-center gap-2">
                <span className="text-xl">📦</span> Product Not Approved
              </summary>
              <div className="mt-4 space-y-3 text-white/70 text-sm">
                <p><strong className="text-white">Symptom:</strong> Product submission rejected or pending for days.</p>
                <p><strong className="text-white">Common Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Low-quality product description or images</li>
                  <li>Copyrighted content without license</li>
                  <li>Missing required information</li>
                  <li>Quality review backlog</li>
                </ul>
                <p><strong className="text-white">Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Read rejection feedback carefully</li>
                  <li>Use high-quality screenshots/previews</li>
                  <li>Provide detailed, accurate descriptions</li>
                  <li>Check Pending Approvals for status</li>
                </ul>
              </div>
            </details>

            {/* API Rate Limits */}
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer flex items-center gap-2">
                <span className="text-xl">⚡</span> Rate Limit Exceeded (429 Error)
              </summary>
              <div className="mt-4 space-y-3 text-white/70 text-sm">
                <p><strong className="text-white">Symptom:</strong> Getting 429 "Too Many Requests" errors.</p>
                <p><strong className="text-white">Common Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Exceeded 100 requests per minute</li>
                  <li>No rate limit handling in code</li>
                  <li>Burst of concurrent requests</li>
                </ul>
                <p><strong className="text-white">Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Implement exponential backoff</li>
                  <li>Cache frequently accessed data</li>
                  <li>Use webhooks instead of polling</li>
                  <li>Upgrade to higher tier for more requests</li>
                </ul>
              </div>
            </details>
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">HTTP Error Codes Reference</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white font-semibold">Code</th>
                    <th className="text-left p-4 text-white font-semibold">Meaning</th>
                    <th className="text-left p-4 text-white font-semibold">Typical Cause</th>
                  </tr>
                </thead>
                <tbody className="text-white/70 text-sm">
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-mono text-cyan-400">400</td>
                    <td className="p-4">Bad Request</td>
                    <td className="p-4">Invalid parameters or malformed JSON</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-mono text-cyan-400">401</td>
                    <td className="p-4">Unauthorized</td>
                    <td className="p-4">Invalid or missing API key</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-mono text-cyan-400">403</td>
                    <td className="p-4">Forbidden</td>
                    <td className="p-4">Insufficient permissions</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-mono text-cyan-400">404</td>
                    <td className="p-4">Not Found</td>
                    <td className="p-4">Resource doesn't exist</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-mono text-cyan-400">429</td>
                    <td className="p-4">Too Many Requests</td>
                    <td className="p-4">Rate limit exceeded</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-mono text-cyan-400">500</td>
                    <td className="p-4">Internal Server Error</td>
                    <td className="p-4">Server-side issue (contact support)</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="p-4 font-mono text-cyan-400">503</td>
                    <td className="p-4">Service Unavailable</td>
                    <td className="p-4">Maintenance or temporary outage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Debug Mode */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Enable Debug Mode</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              Get detailed error information by enabling debug mode during development:
            </p>
            <div className="bg-slate-950 border border-white/10 rounded-lg p-4">
              <pre className="text-cyan-300 text-sm"><code>{`// Add to your API requests
headers: {
  'X-Debug-Mode': 'true'
}`}</code></pre>
            </div>
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <span><strong>Warning:</strong> Never enable debug mode in production. It may expose sensitive information.</span>
              </p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">If you're still experiencing issues, contact our support team:</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">📧 Email Support</h3>
                <p className="text-cyan-300 text-sm">support@bittforge.in</p>
                <p className="text-white/60 text-xs mt-2">Response within 24 hours</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">💬 Live Chat</h3>
                <p className="text-white/70 text-sm">Available in dashboard</p>
                <p className="text-white/60 text-xs mt-2">9 AM - 6 PM EST, Mon-Fri</p>
              </div>
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Related Resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/docs/quick-start" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300">Quick Start</h3>
              <p className="text-white/60 text-sm">Get started with ContentSellify</p>
            </Link>
            <Link href="/docs/api-keys-setup" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">🔑</div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300">API Keys</h3>
              <p className="text-white/60 text-sm">Setup authentication</p>
            </Link>
            <Link href="/docs/security" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300">Security</h3>
              <p className="text-white/60 text-sm">Best practices guide</p>
            </Link>
            <Link href="/contact" className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300">Contact</h3>
              <p className="text-white/60 text-sm">Get help from support</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
