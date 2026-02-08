"use client";

import { useState } from "react";
import Link from "next/link";

export default function PayoutsAPIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">API Reference</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Payouts API</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            API Reference
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Payouts API</h1>
          <p className="text-lg text-white/70">
            Complete API reference for managing seller payouts, withdrawals, and transaction history.
          </p>
        </div>

        {/* Base URL */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Base URL</h2>
          <CodeBlock code="http://localhost:5000/api/payouts" />
        </section>

        {/* Authentication */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">All payout endpoints require authentication. Include JWT token in header:</p>
            <CodeBlock code="Authorization: Bearer YOUR_JWT_TOKEN" />
            <p className="text-white/60 text-sm mt-4">Only <strong className="text-white">seller</strong> and <strong className="text-white">admin</strong> roles can access payout endpoints.</p>
          </div>
        </section>

        {/* Get Payout Balance */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">GET /balance</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Get current payout balance and earnings breakdown for authenticated seller.</p>
            
            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock code={`curl -X GET http://localhost:5000/api/payouts/balance \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock code={`{
  "success": true,
  "data": {
    "availableBalance": 45000,
    "pendingBalance": 5000,
    "totalEarnings": 150000,
    "totalWithdrawn": 100000,
    "currency": "INR",
    "minimumPayout": 500,
    "earnings": {
      "thisMonth": 15000,
      "lastMonth": 12000,
      "totalSales": 150
    },
    "bankAccount": {
      "isVerified": true,
      "accountNumber": "****3456",
      "ifsc": "SBIN0001234"
    }
  }
}`} />
          </div>
        </section>

        {/* Request Payout */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">POST /request</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Request a payout to registered bank account.</p>
            
            <h3 className="text-white font-semibold mb-3">Request Body</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/80 py-2 pr-4">Parameter</th>
                    <th className="text-left text-white/80 py-2 pr-4">Type</th>
                    <th className="text-left text-white/80 py-2 pr-4">Required</th>
                    <th className="text-left text-white/80 py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">amount</code></td>
                    <td className="py-3 pr-4">number</td>
                    <td className="py-3 pr-4"><span className="text-green-400">Yes</span></td>
                    <td className="py-3">Amount to withdraw (min: 500)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">notes</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4"><span className="text-yellow-400">Optional</span></td>
                    <td className="py-3">Optional notes for payout</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock code={`curl -X POST http://localhost:5000/api/payouts/request \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "notes": "Monthly payout"
  }'`} />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (201 Created)</h3>
            <CodeBlock code={`{
  "success": true,
  "message": "Payout request created successfully",
  "data": {
    "payoutId": "pyt_H8dN3K2mL9jP",
    "amount": 10000,
    "status": "processing",
    "estimatedArrival": "2026-02-10T10:30:00.000Z",
    "accountNumber": "****3456",
    "requestedAt": "2026-02-07T10:30:00.000Z"
  }
}`} />

            <h3 className="text-white font-semibold mb-3 mt-6">Error Responses</h3>
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-2">400 Insufficient Balance</p>
                <CodeBlock code={`{
  "success": false,
  "error": "Insufficient balance. Available: ₹8000"
}`} />
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-2">400 Bank Account Not Verified</p>
                <CodeBlock code={`{
  "success": false,
  "error": "Bank account not verified. Please verify before requesting payout."
}`} />
              </div>
            </div>
          </div>
        </section>

        {/* Get Payout History */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">GET /history</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Get paginated list of all payout transactions.</p>
            
            <h3 className="text-white font-semibold mb-3">Query Parameters</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/80 py-2 pr-4">Parameter</th>
                    <th className="text-left text-white/80 py-2 pr-4">Type</th>
                    <th className="text-left text-white/80 py-2 pr-4">Default</th>
                    <th className="text-left text-white/80 py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">page</code></td>
                    <td className="py-3 pr-4">number</td>
                    <td className="py-3 pr-4">1</td>
                    <td className="py-3">Page number</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">limit</code></td>
                    <td className="py-3 pr-4">number</td>
                    <td className="py-3 pr-4">10</td>
                    <td className="py-3">Items per page (max: 50)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">status</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4">all</td>
                    <td className="py-3">processing, completed, failed</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock code={`curl -X GET "http://localhost:5000/api/payouts/history?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock code={`{
  "success": true,
  "data": {
    "payouts": [
      {
        "id": "pyt_H8dN3K2mL9jP",
        "amount": 10000,
        "status": "completed",
        "accountNumber": "****3456",
        "requestedAt": "2026-02-05T10:30:00.000Z",
        "completedAt": "2026-02-07T08:15:00.000Z",
        "utr": "026207123456"
      },
      {
        "id": "pyt_J9kM5N3pQ2rS",
        "amount": 25000,
        "status": "processing",
        "accountNumber": "****3456",
        "requestedAt": "2026-02-07T10:30:00.000Z",
        "estimatedArrival": "2026-02-10T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10
    }
  }
}`} />
          </div>
        </section>

        {/* Get Single Payout */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">GET /:payoutId</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Get detailed information about a specific payout.</p>
            
            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock code={`curl -X GET http://localhost:5000/api/payouts/pyt_H8dN3K2mL9jP \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock code={`{
  "success": true,
  "data": {
    "id": "pyt_H8dN3K2mL9jP",
    "sellerId": "507f1f77bcf86cd799439011",
    "amount": 10000,
    "fee": 50,
    "netAmount": 9950,
    "status": "completed",
    "bankAccount": {
      "accountNumber": "****3456",
      "ifsc": "SBIN0001234",
      "accountHolder": "Swapnil Shelke"
    },
    "requestedAt": "2026-02-05T10:30:00.000Z",
    "processedAt": "2026-02-05T11:00:00.000Z",
    "completedAt": "2026-02-07T08:15:00.000Z",
    "utr": "026207123456",
    "notes": "Monthly payout",
    "razorpayPayoutId": "pout_ABC123XYZ789"
  }
}`} />
          </div>
        </section>

        {/* Cancel Payout */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">POST /:payoutId/cancel</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Cancel a pending payout request (only if status is "processing").</p>
            
            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock code={`curl -X POST http://localhost:5000/api/payouts/pyt_J9kM5N3pQ2rS/cancel \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock code={`{
  "success": true,
  "message": "Payout cancelled successfully",
  "data": {
    "payoutId": "pyt_J9kM5N3pQ2rS",
    "status": "cancelled",
    "refundedAmount": 25000
  }
}`} />
          </div>
        </section>

        {/* Payout Status Codes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Payout Status Codes</h2>
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <h3 className="text-white font-semibold">processing</h3>
              </div>
              <p className="text-white/60 text-sm">Payout request submitted and being processed by payment gateway</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="text-white font-semibold">completed</h3>
              </div>
              <p className="text-white/60 text-sm">Payout successfully transferred to bank account</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 className="text-white font-semibold">failed</h3>
              </div>
              <p className="text-white/60 text-sm">Payout failed due to bank error or invalid account details</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <h3 className="text-white font-semibold">cancelled</h3>
              </div>
              <p className="text-white/60 text-sm">Payout request cancelled by seller or admin</p>
            </div>
          </div>
        </section>

        {/* Related APIs */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Related APIs</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <NextStepCard
              title="Orders API"
              description="Track purchases and transaction details"
              href="/docs/api/orders"
              icon="🛒"
            />
            <NextStepCard
              title="Products API"
              description="Manage digital products and listings"
              href="/docs/api/products"
              icon="📦"
            />
            <NextStepCard
              title="Payout System Guide"
              description="Learn how the payout system works"
              href="/docs/payout-system"
              icon="💸"
            />
            <NextStepCard
              title="Bank Account Setup"
              description="Configure bank account for payouts"
              href="/docs/bank-account-setup"
              icon="🏦"
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Need Help with Payouts?</h3>
          <p className="text-white/70 mb-6">
            Having trouble with payout integration? Contact our API support team.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/docs/payout-system"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/10 transition-colors"
            >
              View Payout System Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mb-4">
      <pre className="bg-slate-950/50 border border-white/10 rounded-lg p-4 overflow-x-auto">
        <code className="text-cyan-300 text-sm font-mono">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
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
