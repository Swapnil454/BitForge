"use client";

import Link from "next/link";

export default function ProductManagementPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
        <Link href="/docs" className="hover:text-white">
          Docs
        </Link>
        <span>/</span>
        <span className="text-white">Product Management</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          <span>📦</span>
          For Sellers
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          Product Management Guide
        </h1>
        <p className="text-lg text-white/70">
          Learn how to upload, manage, and update your digital products on BitForge.
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none space-y-12">
        {/* Overview */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Overview</h2>
          <p className="mb-4 text-white/70">
            As a seller on BitForge, you can list digital products including:
          </p>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>E-books, PDFs, and documents</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>Software, plugins, and code libraries</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>Digital art, graphics, and design assets</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>Templates, presets, and configurations</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>Video courses, audio files, and media</span>
            </li>
          </ul>
        </section>

        {/* Product Lifecycle */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Product Lifecycle</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-300">
                  1
                </span>
                <h3 className="text-lg font-semibold text-white">Upload & Submit</h3>
              </div>
              <p className="text-sm text-white/70">
                Create your product listing with details, pricing, and files. Status: <strong>Pending</strong>
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
                  2
                </span>
                <h3 className="text-lg font-semibold text-white">Admin Review</h3>
              </div>
              <p className="text-sm text-white/70">
                BitForge admins review for quality and policy compliance. Typically takes 24-48 hours.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                  3
                </span>
                <h3 className="text-lg font-semibold text-white">Approved & Live</h3>
              </div>
              <p className="text-sm text-white/70">
                Once approved, your product goes live on the marketplace. Status: <strong>Approved</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Creating a Product */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Creating Your First Product</h2>
          
          <h3 className="mb-3 text-lg font-semibold text-white">Step 1: Access Dashboard</h3>
          <ol className="space-y-2 text-white/70">
            <li>1. Sign in to your seller account</li>
            <li>2. Go to <strong>Dashboard → Products</strong></li>
            <li>3. Click <strong>Upload New Product</strong></li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Step 2: Fill Product Details</h3>
          <div className="space-y-4 text-white/70">
            <div>
              <strong className="text-white">Product Name</strong>
              <p className="mt-1 text-sm">Clear, descriptive name (50 characters max)</p>
            </div>
            <div>
              <strong className="text-white">Description</strong>
              <p className="mt-1 text-sm">Detailed description including features, requirements, and what's included</p>
            </div>
            <div>
              <strong className="text-white">Category</strong>
              <p className="mt-1 text-sm">Choose the most relevant category</p>
            </div>
            <div>
              <strong className="text-white">Price</strong>
              <p className="mt-1 text-sm">Set in INR (₹). Minimum ₹50, maximum ₹100,000</p>
            </div>
            <div>
              <strong className="text-white">Featured Image</strong>
              <p className="mt-1 text-sm">PNG or JPG, max 2MB, recommended 1200x630px</p>
            </div>
            <div>
              <strong className="text-white">Product File</strong>
              <p className="mt-1 text-sm">ZIP, PDF, or MP4 format, max 100MB</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="mb-2 font-semibold text-cyan-300">Best Practices</p>
                <ul className="space-y-1 text-sm text-white/70">
                  <li>• Use high-quality images that showcase your product</li>
                  <li>• Write clear, benefit-focused descriptions</li>
                  <li>• Include sample files or previews when possible</li>
                  <li>• Set competitive pricing based on market research</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Managing Products */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Managing Your Products</h2>
          
          <h3 className="mb-3 text-lg font-semibold text-white">View All Products</h3>
          <p className="mb-4 text-white/70">
            Access your dashboard to see all your products with their status:
          </p>
          <ul className="space-y-2 text-sm text-white/60">
            <li>• <strong className="text-yellow-300">Pending:</strong> Awaiting admin approval</li>
            <li>• <strong className="text-emerald-300">Approved:</strong> Live on marketplace</li>
            <li>• <strong className="text-red-300">Rejected:</strong> Needs revision (check feedback)</li>
          </ul>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Edit Product</h3>
          <p className="mb-4 text-white/70">
            To edit an approved product:
          </p>
          <ol className="space-y-2 text-white/70">
            <li>1. Go to <strong>Dashboard → Products</strong></li>
            <li>2. Click <strong>Edit</strong> on the product</li>
            <li>3. Make your changes and submit</li>
            <li>4. Changes go to <strong>Pending Changes</strong> queue</li>
            <li>5. Admin reviews and approves/rejects</li>
          </ol>

          <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
            <p className="text-sm text-white/70">
              <strong className="text-yellow-300">Note:</strong> Your product remains live with old content until changes are approved.
            </p>
          </div>
        </section>

        {/* Deleting Products */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Deleting Products</h2>
          <p className="mb-4 text-white/70">
            Product deletions require admin approval to protect buyer access:
          </p>
          <ol className="space-y-2 text-white/70">
            <li>1. Navigate to product details</li>
            <li>2. Click <strong>Delete Product</strong></li>
            <li>3. Provide a reason for deletion</li>
            <li>4. Admin reviews the request (usually within 24 hours)</li>
            <li>5. Once approved, product is removed from marketplace</li>
          </ol>

          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm text-white/70">
              <strong className="text-red-300">Important:</strong> Existing buyers retain access to purchased files even after deletion.
            </p>
          </div>
        </section>

        {/* File Requirements */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">File Requirements</h2>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-white">File Type</th>
                  <th className="px-4 py-3 text-left text-white">Formats</th>
                  <th className="px-4 py-3 text-left text-white">Max Size</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-b border-white/10">
                  <td className="px-4 py-3">Product Image</td>
                  <td className="px-4 py-3">JPG, PNG</td>
                  <td className="px-4 py-3">2MB</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-3">Product File</td>
                  <td className="px-4 py-3">ZIP, PDF, MP4</td>
                  <td className="px-4 py-3">100MB</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Additional Images</td>
                  <td className="px-4 py-3">JPG, PNG</td>
                  <td className="px-4 py-3">1MB each</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Analytics */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Track Performance</h2>
          <p className="mb-4 text-white/70">
            Monitor your product performance in the seller dashboard:
          </p>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">📊</span>
              <span><strong>Views:</strong> Track how many users view your product</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">💰</span>
              <span><strong>Sales:</strong> Monitor total sales and revenue</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">⭐</span>
              <span><strong>Ratings:</strong> See customer feedback and ratings</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">💬</span>
              <span><strong>Reviews:</strong> Read and respond to customer reviews</span>
            </li>
          </ul>
        </section>

        {/* Next Steps */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-white">Next Steps</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/docs/payout-system"
              className="group block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-cyan-400/40"
            >
              <div className="mb-2 text-2xl">💰</div>
              <h3 className="mb-1 font-semibold text-white group-hover:text-cyan-300">
                Payout System →
              </h3>
              <p className="text-sm text-white/60">Learn how you get paid for sales</p>
            </Link>
            <Link
              href="/docs/upload-solutions"
              className="group block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-cyan-400/40"
            >
              <div className="mb-2 text-2xl">📤</div>
              <h3 className="mb-1 font-semibold text-white group-hover:text-cyan-300">
                Upload Solutions →
              </h3>
              <p className="text-sm text-white/60">Troubleshoot upload issues</p>
            </Link>
          </div>
        </section>

        {/* Support */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 p-6">
          <h3 className="mb-2 text-lg font-semibold text-white">Need Help?</h3>
          <p className="mb-4 text-sm text-white/70">
            Questions about product management? Our support team is here to help.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
          >
            Contact Support
          </Link>
        </section>
      </div>
    </div>
  );
}
