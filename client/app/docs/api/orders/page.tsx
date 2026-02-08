"use client";

import { useState } from "react";
import Link from "next/link";

export default function OrdersAPIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">API Reference</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Orders API</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            API Reference
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Orders API</h1>
          <p className="text-lg text-white/70">
            Complete API reference for tracking purchases, sales history, and transaction details.
          </p>
        </div>

        {/* Base URL */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Base URL</h2>
          <CodeBlock code="http://localhost:5000/api/orders" />
        </section>

        {/* Authentication */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">All order endpoints require authentication:</p>
            <CodeBlock code="Authorization: Bearer YOUR_JWT_TOKEN" />
          </div>
        </section>

        {/* Get User Orders */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">GET /my-orders</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Get all orders (purchases) for authenticated user.</p>
            
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
                    <td className="py-3 pr-4">20</td>
                    <td className="py-3">Items per page (max: 100)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">status</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4">all</td>
                    <td className="py-3">completed, pending, failed</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock code={`curl -X GET "http://localhost:5000/api/orders/my-orders?page=1&limit=10" \\\\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock code={`{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ord_H8dN3K2mL9jP",
        "product": {
          "id": "507f1f77bcf86cd799439011",
          "title": "React Advanced Course",
          "thumbnail": "https://cdn.contentsellify.com/thumbnails/course1.jpg",
          "price": 1999
        },
        "seller": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Swapnil Shelke"
        },
        "amount": 1999,
        "status": "completed",
        "paymentId": "pay_ABC123XYZ789",
        "downloadUrl": "https://cdn.contentsellify.com/downloads/secure/abc123",
        "purchasedAt": "2026-02-05T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 28,
      "itemsPerPage": 10
    }
  }
}`} />
          </div>
        </section>

        {/* Get Seller Sales */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">GET /my-sales</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Get all sales for authenticated seller.</p>
            
            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock code={`curl -X GET "http://localhost:5000/api/orders/my-sales?page=1" \\\\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock code={`{
  "success": true,
  "data": {
    "sales": [
      {
        "id": "ord_H8dN3K2mL9jP",
        "product": {
          "id": "507f1f77bcf86cd799439011",
          "title": "React Advanced Course"
        },
        "buyer": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "amount": 1999,
        "platformFee": 200,
        "earnings": 1799,
        "status": "completed",
        "purchasedAt": "2026-02-05T10:30:00.000Z"
      }
    ],
    "summary": {
      "totalSales": 150,
      "totalRevenue": 299850,
      "totalEarnings": 269865
    }
  }
}`} />
          </div>
        </section>

        {/* Get Single Order */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">GET /:orderId</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Get detailed information about a specific order.</p>
            
            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock code={`curl -X GET http://localhost:5000/api/orders/ord_H8dN3K2mL9jP \\\\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock code={`{
  "success": true,
  "data": {
    "id": "ord_H8dN3K2mL9jP",
    "product": {
      "id": "507f1f77bcf86cd799439011",
      "title": "React Advanced Course",
      "price": 1999
    },
    "seller": {
      "name": "Swapnil Shelke",
      "email": "swapnil@example.com"
    },
    "pricing": {
      "amount": 1999,
      "platformFee": 200,
      "sellerEarnings": 1799
    },
    "payment": {
      "paymentId": "pay_ABC123XYZ789",
      "method": "upi",
      "status": "captured"
    },
    "download": {
      "url": "https://cdn.contentsellify.com/downloads/secure/abc123",
      "expiresAt": "2026-02-12T10:30:00.000Z"
    },
    "status": "completed",
    "purchasedAt": "2026-02-05T10:30:00.000Z"
  }
}`} />
          </div>
        </section>

        {/* Order Status Codes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Order Status Codes</h2>
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="text-white font-semibold">completed</h3>
              </div>
              <p className="text-white/60 text-sm">Payment successful, product accessible for download</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <h3 className="text-white font-semibold">pending</h3>
              </div>
              <p className="text-white/60 text-sm">Payment initiated but not yet confirmed</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 className="text-white font-semibold">failed</h3>
              </div>
              <p className="text-white/60 text-sm">Payment failed or declined</p>
            </div>
          </div>
        </section>

        {/* Related APIs */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Related APIs</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <NextStepCard
              title="Products API"
              description="Browse and purchase digital products"
              href="/docs/api/products"
              icon="📦"
            />
            <NextStepCard
              title="Payouts API"
              description="Manage seller earnings and withdrawals"
              href="/docs/api/payouts"
              icon="💸"
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Need Help?</h3>
          <p className="text-white/70 mb-6">
            Having trouble with order integration? Contact our API support team.
          </p>
          <Link
            href="/contact"
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Support
          </Link>
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
