"use client";

import { useState } from "react";
import Link from "next/link";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">Platform Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Security Best Practices</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            Platform Guides
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Security Best Practices</h1>
          <p className="text-lg text-white/70">
            Guidelines for secure integration, data handling, and compliance with ContentSellify.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              Security is our top priority at ContentSellify. This guide outlines best practices for keeping your account, products, and customer data safe.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="text-white font-semibold mb-2">API Security</h3>
                <p className="text-white/60 text-sm">Protect your API keys and tokens</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">💳</div>
                <h3 className="text-white font-semibold mb-2">Payment Security</h3>
                <p className="text-white/60 text-sm">PCI-compliant payment processing</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-white font-semibold mb-2">Data Protection</h3>
                <p className="text-white/60 text-sm">GDPR & data privacy compliance</p>
              </div>
            </div>
          </div>
        </section>

        {/* API Security */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">1.</span> API Security
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">Protect Your API Keys</h3>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-red-400">❌</span> Never Do This
                </h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>Commit API keys to Git repositories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>Hard-code keys in frontend JavaScript</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>Share keys in Slack, email, or chat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>Use production keys in development</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Best Practices
                </h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Store keys in environment variables (.env)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Use separate keys for development and production</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Rotate keys every 90 days or after team member leaves</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Use read-only keys when write access isn't needed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3">Environment Variable Example</h3>
            <CodeBlock
              code={`# .env (add to .gitignore)
CONTENTSELLIFY_API_KEY=csfy_live_abc123...
CONTENTSELLIFY_SECRET_KEY=sk_live_xyz789...
WEBHOOK_SECRET=whsec_def456...

# Never commit these!
# Add .env to your .gitignore:
echo ".env" >> .gitignore`}
              language="bash"
            />
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">2.</span> Authentication & Authorization
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">🔑</span> Use OAuth 2.0
                </h3>
                <p className="text-white/70 text-sm">
                  OAuth provides secure, token-based authentication without exposing user passwords. Always use OAuth for integrations.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">⏱️</span> Token Expiration
                </h3>
                <p className="text-white/70 text-sm">
                  Access tokens expire after 1 hour. Refresh tokens are valid for 30 days. Implement automatic token refresh in your application.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">🚫</span> Revoke Compromised Tokens
                </h3>
                <p className="text-white/70 text-sm">
                  If you suspect a token has been compromised, revoke it immediately from Dashboard → API Settings → Active Tokens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HTTPS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">3.</span> Transport Security
          </h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">🔒</span> Always Use HTTPS
              </h3>
              <p className="text-white/70 mb-4">
                All API requests must be made over HTTPS. HTTP requests are automatically rejected for security.
              </p>
              <CodeBlock
                code={`// ✓ Good - HTTPS
fetch('https://api.contentsellify.com/products', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
});

// ❌ Bad - HTTP (will fail)
fetch('http://api.contentsellify.com/products', ...)`}
                language="javascript"
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">📦</span> TLS 1.2+
              </h3>
              <p className="text-white/70 text-sm">
                Our API requires TLS 1.2 or higher. Older protocols (SSL, TLS 1.0, TLS 1.1) are disabled for security.
              </p>
            </div>
          </div>
        </section>

        {/* Payment Security */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">4.</span> Payment Security
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <div className="space-y-4 text-white/80">
              <p>
                <strong className="text-white">We handle PCI compliance for you.</strong> Customer payment information never touches your servers.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">✓ We Store</h4>
                  <ul className="space-y-1 text-white/70 text-sm">
                    <li>• Credit card numbers (encrypted)</li>
                    <li>• CVV codes (temporarily)</li>
                    <li>• Billing addresses</li>
                    <li>• Payment tokens</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">✓ You Receive</h4>
                  <ul className="space-y-1 text-white/70 text-sm">
                    <li>• Order confirmation</li>
                    <li>• Customer email</li>
                    <li>• Transaction ID</li>
                    <li>• Payment status</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">5.</span> Data Protection & Privacy
          </h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🇪🇺</span> GDPR Compliance
              </h3>
              <p className="text-white/60 text-sm">
                We are GDPR compliant. Users can request data exports or account deletion. Data is stored in encrypted databases with regular backups.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">📝</span> Data Minimization
              </h3>
              <p className="text-white/60 text-sm">
                Only collect customer data you need. Don't store sensitive information unnecessarily. Use ContentSellify's built-in customer management.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🗑️</span> Data Retention
              </h3>
              <p className="text-white/60 text-sm">
                Transaction records are kept for 7 years for legal compliance. User data is deleted within 30 days of account deletion request.
              </p>
            </div>
          </div>
        </section>

        {/* Webhook Security */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">6.</span> Webhook Security
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              Always verify webhook signatures to prevent spoofed events:
            </p>
            <CodeBlock
              code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  );
}

// Reject unverified webhooks
if (!verifyWebhook(req.body, req.headers['x-webhook-signature'], secret)) {
  return res.status(401).json({ error: 'Invalid signature' });
}`}
              language="javascript"
            />
          </div>
        </section>

        {/* Security Checklist */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Security Checklist</h2>
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1"/>
                <span className="text-white/80">API keys stored in environment variables, not in code</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1"/>
                <span className="text-white/80">Using HTTPS for all API requests</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1"/>
                <span className="text-white/80">Webhook signatures verified on all incoming webhooks</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1"/>
                <span className="text-white/80">Separate API keys for development and production</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1"/>
                <span className="text-white/80">OAuth tokens refresh automatically before expiration</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1"/>
                <span className="text-white/80">Customer data handled according to GDPR requirements</span>
              </label>
            </div>
          </div>
        </section>

        {/* Report Issues */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Report Security Issues</h2>
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="text-xl">🚨</span> Found a Vulnerability?
            </h3>
            <p className="text-white/70 mb-4">
              We take security seriously. If you discover a security vulnerability, please report it responsibly:
            </p>
            <div className="bg-black/30 p-4 rounded-lg">
              <p className="text-cyan-300 font-mono text-sm">security@bittforge.in</p>
            </div>
            <p className="text-white/60 text-sm mt-4">
              Please do not publicly disclose the issue until we've had a chance to address it. We typically respond within 24 hours.
            </p>
          </div>
        </section>

        {/* Related Resources */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Related Resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <NextStepCard
              title="API Keys Setup"
              description="Get your API credentials"
              href="/docs/api-keys-setup"
              icon="🔑"
            />
            <NextStepCard
              title="OAuth Setup"
              description="Implement OAuth authentication"
              href="/docs/oauth-setup"
              icon="🔐"
            />
            <NextStepCard
              title="Webhooks"
              description="Secure webhook implementation"
              href="/docs/webhooks"
              icon="🔔"
            />
            <NextStepCard
              title="Testing Guide"
              description="Test in sandbox environment"
              href="/docs/testing"
              icon="🧪"
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Questions About Security?</h3>
          <p className="text-white/70 mb-6">
            Our security team is here to help with implementation and compliance questions.
          </p>
          <Link
            href="/contact"
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors inline-block"
          >
            Contact Security Team
          </Link>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white/80 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-slate-950 border border-white/10 rounded-xl p-4 overflow-x-auto">
        <code className="text-sm text-cyan-300">{code}</code>
      </pre>
    </div>
  );
}

function NextStepCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-white/10 transition-all"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300">
        {title}
      </h3>
      <p className="text-white/60 text-sm group-hover:text-white/70">{description}</p>
      <span className="inline-block mt-3 text-cyan-400 text-sm group-hover:translate-x-1 transition-transform">
        Learn more →
      </span>
    </Link>
  );
}
