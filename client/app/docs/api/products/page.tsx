"use client";

import Link from "next/link";
import { useState } from "react";
import { Radio, ShoppingCart, Check } from "lucide-react";

export default function ProductsAPIPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-white/60">
        <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white">
          Docs
        </Link>
        <span>/</span>
        <Link href="/docs#api" className="hover:text-slate-900 dark:hover:text-white">
          API Reference
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">Products API</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          <Radio className="w-4 h-4" />
          API Reference
        </div>
        <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">
          Products API
        </h1>
        <p className="text-lg text-slate-600 dark:text-white/70">
          Complete API reference for managing products programmatically.
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none space-y-12">
        {/* Authentication */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Authentication</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            All API requests require authentication via JWT token in the Authorization header.
          </p>
          <CodeBlock
            title="Authorization Header"
            code={`Authorization: Bearer <your_jwt_token>`}
          />

          <div className="mt-4 rounded-lg border border-indigo-200 dark:border-cyan-500/30 bg-cyan-500/5 p-4">
            <p className="text-sm text-slate-600 dark:text-white/70">
              <strong className="text-cyan-300">Get Token:</strong> Login at <code>/auth/login</code> to receive JWT token
            </p>
          </div>
        </section>

        {/* Base URL */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Base URL</h2>
          <CodeBlock
            code={`https://api.bitforge.in/api/v1`}
          />
        </section>

        {/* Get All Products */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Get All Products</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Retrieve a paginated list of products. Supports filtering by category, price range, and search query.
          </p>

          <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                GET
              </span>
              <code className="text-sm text-slate-900 dark:text-white">/products</code>
            </div>
          </div>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Query Parameters</h3>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-white/5">
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="px-4 py-3 text-left text-slate-900 dark:text-white">Parameter</th>
                  <th className="px-4 py-3 text-left text-slate-900 dark:text-white">Type</th>
                  <th className="px-4 py-3 text-left text-slate-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 dark:text-white/70">
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <td className="px-4 py-3"><code>page</code></td>
                  <td className="px-4 py-3">integer</td>
                  <td className="px-4 py-3">Page number (default: 1)</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <td className="px-4 py-3"><code>limit</code></td>
                  <td className="px-4 py-3">integer</td>
                  <td className="px-4 py-3">Items per page (default: 20, max: 100)</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <td className="px-4 py-3"><code>category</code></td>
                  <td className="px-4 py-3">string</td>
                  <td className="px-4 py-3">Filter by category</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <td className="px-4 py-3"><code>search</code></td>
                  <td className="px-4 py-3">string</td>
                  <td className="px-4 py-3">Search in title and description</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code>sortBy</code></td>
                  <td className="px-4 py-3">string</td>
                  <td className="px-4 py-3">Sort by: price, createdAt, sales</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Example Request</h3>
          <CodeBlock
            language="bash"
            code={`curl -X GET "https://api.bitforge.in/api/v1/products?page=1&limit=10&category=ebooks" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
          />

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Example Response</h3>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Complete Web Development Guide",
        "description": "Comprehensive guide to modern web development",
        "price": 499,
        "category": "ebooks",
        "seller": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "John Doe"
        },
        "imageUrl": "https://cdn.bitforge.in/products/image.jpg",
        "rating": 4.8,
        "totalSales": 245,
        "status": "approved",
        "createdAt": "2026-02-01T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10
    }
  }
}`}
          />
        </section>

        {/* Get Single Product */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Get Product by ID</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Retrieve detailed information about a specific product.
          </p>

          <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                GET
              </span>
              <code className="text-sm text-slate-900 dark:text-white">/products/:productId</code>
            </div>
          </div>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Example Request</h3>
          <CodeBlock
            language="bash"
            code={`curl -X GET "https://api.bitforge.in/api/v1/products/507f1f77bcf86cd799439011" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
          />

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Example Response</h3>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Complete Web Development Guide",
    "description": "Comprehensive guide covering HTML, CSS, JavaScript, React, Node.js, and more.",
    "price": 499,
    "category": "ebooks",
    "seller": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://cdn.bitforge.in/avatars/john.jpg"
    },
    "imageUrl": "https://cdn.bitforge.in/products/image.jpg",
    "fileUrl": "https://cdn.bitforge.in/products/file.pdf",
    "fileSize": 15728640,
    "rating": 4.8,
    "totalSales": 245,
    "reviews": 58,
    "status": "approved",
    "tags": ["web", "development", "javascript", "react"],
    "createdAt": "2026-02-01T10:30:00.000Z",
    "updatedAt": "2026-02-07T08:15:00.000Z"
  }
}`}
          />
        </section>

        {/* Create Product */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Create Product</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Upload a new product. Requires seller role.
          </p>

          <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-indigo-100 dark:bg-cyan-500/20 px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-cyan-300">
                POST
              </span>
              <code className="text-sm text-slate-900 dark:text-white">/products</code>
            </div>
          </div>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Request Body</h3>
          <CodeBlock
            language="json"
            code={`{
  "title": "Complete Web Development Guide",
  "description": "Comprehensive guide to modern web development",
  "price": 499,
  "category": "ebooks",
  "tags": ["web", "development", "javascript"],
  "image": "<base64_encoded_image_or_file>",
  "file": "<base64_encoded_file>",
  "fileType": "pdf"
}`}
          />

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Example Request</h3>
          <CodeBlock
            language="bash"
            code={`curl -X POST "https://api.bitforge.in/api/v1/products" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Complete Web Development Guide",
    "description": "Comprehensive guide to modern web development",
    "price": 499,
    "category": "ebooks"
  }'`}
          />

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Example Response</h3>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "message": "Product created successfully and sent for approval",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Complete Web Development Guide",
    "status": "pending",
    "createdAt": "2026-02-07T10:30:00.000Z"
  }
}`}
          />
        </section>

        {/* Update Product */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Update Product</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Update an existing product. Requires seller role and ownership.
          </p>

          <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-yellow-500/20 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                PUT
              </span>
              <code className="text-sm text-slate-900 dark:text-white">/products/:productId</code>
            </div>
          </div>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Example Request</h3>
          <CodeBlock
            language="bash"
            code={`curl -X PUT "https://api.bitforge.in/api/v1/products/507f1f77bcf86cd799439011" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "price": 599,
    "description": "Updated description with more details"
  }'`}
          />

          <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 p-4">
            <p className="text-sm text-slate-600 dark:text-white/70">
              <strong className="text-amber-700 dark:text-amber-300">Note:</strong> Updates to approved products go through pending changes workflow and require admin approval.
            </p>
          </div>
        </section>

        {/* Delete Product */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Delete Product</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Request product deletion. Requires admin approval.
          </p>

          <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300">
                DELETE
              </span>
              <code className="text-sm text-slate-900 dark:text-white">/products/:productId</code>
            </div>
          </div>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Example Request</h3>
          <CodeBlock
            language="bash"
            code={`curl -X DELETE "https://api.bitforge.in/api/v1/products/507f1f77bcf86cd799439011" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
          />

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Example Response</h3>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "message": "Product deletion request sent for admin approval"
}`}
          />
        </section>

        {/* Error Responses */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Error Responses</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            The API returns standard HTTP status codes and error messages.
          </p>

          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-md bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300">
                  400
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">Bad Request</span>
              </div>
              <CodeBlock
                language="json"
                code={`{
  "success": false,
  "error": "Validation error",
  "message": "Price must be between 50 and 100000"
}`}
              />
            </div>

            <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-md bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300">
                  401
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">Unauthorized</span>
              </div>
              <CodeBlock
                language="json"
                code={`{
  "success": false,
  "error": "Authentication required",
  "message": "Please provide a valid JWT token"
}`}
              />
            </div>

            <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-md bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300">
                  404
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">Not Found</span>
              </div>
              <CodeBlock
                language="json"
                code={`{
  "success": false,
  "error": "Product not found",
  "message": "No product found with ID: 507f1f77bcf86cd799439011"
}`}
              />
            </div>
          </div>
        </section>

        {/* Promotions Integration */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-pink-500">🎁</span> Promotions Integration
          </h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Products may have active promotions (coupons) linked to them. The Products API typically returns the base price, but the actual discounted price can be validated at checkout using the Orders API. 
          </p>
          <div className="rounded-lg border border-indigo-200 dark:border-cyan-500/30 bg-cyan-500/5 p-4">
            <p className="text-sm text-slate-600 dark:text-white/70">
              <strong className="text-cyan-600 dark:text-cyan-300">Coupons:</strong> Discounts are applied when creating an order by passing a valid <code>couponCode</code> in the request payload to the Orders API.
            </p>
          </div>
        </section>

        {/* Related APIs */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Related APIs</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/docs/api/payouts"
              className="group block rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 transition-all hover:border-indigo-400/40 dark:hover:border-cyan-400/40"
            >
              <div className="mb-2 text-2xl"></div>
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
                Payouts API →
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/60">Manage seller payouts</p>
            </Link>
            <Link
              href="/docs/api/orders"
              className="group block rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 transition-all hover:border-indigo-400/40 dark:hover:border-cyan-400/40"
            >
              <ShoppingCart className="w-5 h-5 mb-2 text-yellow-400" />
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
                Orders API →
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/60">Track purchases and orders</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function CodeBlock({ code, language, title }: { code: string; language?: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      {title && (
        <div className="border-b border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm px-4 py-2 text-xs font-medium text-slate-600 dark:text-white/70">
          {title}
        </div>
      )}
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={handleCopy}
          className="rounded-lg bg-slate-200 dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-white/20"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-4 text-sm">
        <code className="text-indigo-600 dark:text-cyan-400">{code}</code>
      </pre>
    </div>
  );
}
