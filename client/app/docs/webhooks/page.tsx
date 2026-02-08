"use client";

import { useState } from "react";
import Link from "next/link";

export default function WebhooksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">For Developers</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Webhooks</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            For Developers
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Webhooks</h1>
          <p className="text-lg text-white/70">
            Real-time notifications for payments, payouts, orders, and product updates via webhooks.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              Webhooks allow your application to receive real-time notifications when events occur on ContentSellify. Instead of polling our API, webhooks push data to your endpoint automatically.
            </p>
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Base Webhook URL</h3>
              <div className="font-mono text-cyan-300 text-sm">https://api.contentsellify.com/webhooks</div>
            </div>
          </div>
        </section>

        {/* Event Types */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Event Types</h2>
          <div className="space-y-4">
            {/* Payment Events */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">💰</span> Payment Events
              </h3>
              <div className="space-y-2 text-white/70 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">payment.completed</span>
                  <span>- Customer payment processed successfully</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">payment.failed</span>
                  <span>- Payment processing failed</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">payment.refunded</span>
                  <span>- Payment refunded to customer</span>
                </div>
              </div>
            </div>

            {/* Order Events */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">📦</span> Order Events
              </h3>
              <div className="space-y-2 text-white/70 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">order.created</span>
                  <span>- New order placed</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">order.completed</span>
                  <span>- Order fulfilled and delivered</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">order.cancelled</span>
                  <span>- Order cancelled by user or system</span>
                </div>
              </div>
            </div>

            {/* Payout Events */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">💸</span> Payout Events
              </h3>
              <div className="space-y-2 text-white/70 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">payout.processing</span>
                  <span>- Payout request initiated</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">payout.completed</span>
                  <span>- Funds transferred to seller account</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">payout.failed</span>
                  <span>- Payout failed (invalid bank details, etc.)</span>
                </div>
              </div>
            </div>

            {/* Product Events */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">🛍️</span> Product Events
              </h3>
              <div className="space-y-2 text-white/70 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">product.approved</span>
                  <span>- Product approved and published</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">product.rejected</span>
                  <span>- Product submission rejected</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400">product.updated</span>
                  <span>- Product changes approved and applied</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Webhook Payload */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Webhook Payload Structure</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/70 mb-4">All webhook events follow this structure:</p>
            <CodeBlock 
              code={`{
  "id": "evt_1234567890",
  "type": "payment.completed",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "ord_abc123",
    "amount": 4999,
   "currency": "usd",
    "customer": {
      "id": "cus_xyz789",
      "email": "customer@example.com"
    },
    "product": {
      "id": "prod_456",
      "title": "React Master Course",
      "seller_id": "sel_def456"
    }
  }
}`}
              language="json"
            />
          </div>
        </section>

        {/* Setup */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Setup Webhooks</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <ol className="space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  1
                </span>
                <div>
                  <p>Go to <strong className="text-white">Dashboard → API Settings → Webhooks</strong></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  2
                </span>
                <div>
                  <p>Click <strong className="text-white">Create Webhook Endpoint</strong></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  3
                </span>
                <div>
                  <p>Enter your endpoint URL (must be HTTPS)</p>
                  <p className="text-sm text-white/60 mt-2">Example: https://yourapp.com/api/webhooks</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  4
                </span>
                <div>
                  <p>Select which events you want to receive</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  5
                </span>
                <div>
                  <p>Save your <strong className="text-white">Signing Secret</strong> - you'll need this to verify webhooks</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Verify Signature */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Verify Webhook Signature</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/70 mb-4">
              Always verify webhook signatures to ensure requests come from ContentSellify:
            </p>
            <CodeBlock 
              code={`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  );
}

// Example usage in Express.js
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhookSignature(
    req.body,
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook event
  const { type, data } = req.body;
  
  switch (type) {
    case 'payment.completed':
      handlePaymentCompleted(data);
      break;
    case 'order.created':
      handleOrderCreated(data);
      break;
    // ... handle other events
  }
  
  res.status(200).json({ received: true });
});`}
              language="javascript"
            />
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Best Practices</h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">⚡</span> Respond Quickly
              </h3>
              <p className="text-white/60 text-sm">
                Return a 200 OK response within 5 seconds. Process heavy tasks asynchronously in the background.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🔄</span> Handle Retries
              </h3>
              <p className="text-white/60 text-sm">
                We retry failed webhooks up to 3 times with exponential backoff. Make your endpoint idempotent to handle duplicate events.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🔒</span> Always Verify Signatures
              </h3>
              <p className="text-white/60 text-sm">
                Never trust webhook payloads without verifying the signature. This prevents attackers from sending fake events.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">📝</span> Log All Events
              </h3>
              <p className="text-white/60 text-sm">
                Keep detailed logs of received webhooks for debugging and audit trails.
              </p>
            </div>
          </div>
        </section>

        {/* Testing */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Testing Webhooks</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Test webhooks using our CLI or dashboard:</p>
            <CodeBlock 
              code={`# Install ContentSellify CLI
npm install -g @contentsellify/cli

# Forward webhooks to local development server
contentsellify webhooks listen --forward-to http://localhost:3000/api/webhooks

# Send test webhook
contentsellify webhooks test --event payment.completed`}
              language="bash"
            />
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-sm flex items-start gap-2">
                <span className="text-xl">💡</span>
                <span>
                  <strong>Tip:</strong> Use tools like ngrok to expose your local server for webhook testing during development.
                </span>
              </p>
            </div>
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
              title="Authentication API"
              description="Learn about API authentication"
              href="/docs/api/authentication"
              icon="🔐"
            />
            <NextStepCard
              title="Testing Guide"
              description="Test mode and sample data"
              href="/docs/testing"
              icon="🧪"
            />
            <NextStepCard
              title="Contact Support"
              description="Get help with webhooks"
              href="/contact"
              icon="💬"
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Need Help with Webhooks?</h3>
          <p className="text-white/70 mb-6">
            Have questions about webhook implementation? Our developer support team is here to assist.
          </p>
          <Link
            href="/contact"
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors inline-block"
          >
            Contact Support
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
