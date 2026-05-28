"use client";

import Link from "next/link";
import { Check, DollarSign, MessageCircle, Upload, Lightbulb, Star, Ticket, Hourglass } from "lucide-react";

const CheckIcon = () => <Check className="w-5 h-5" />;

export default function ProductManagementPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-white/60">
        <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white">
          Docs
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">Product Management</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          <span></span>
          For Sellers
        </div>
        <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">
          Product Management Guide
        </h1>
        <p className="text-lg text-slate-600 dark:text-white/70">
          Learn how to upload, manage, and update your digital products on BitForge.
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none space-y-12">
        {/* Overview */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Overview</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            As a seller on BitForge, you can list digital products including:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-white/70">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>E-books, PDFs, and documents</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Software, plugins, and code libraries</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Digital art, graphics, and design assets</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Templates, presets, and configurations</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Video courses, audio files, and media</span>
            </li>
          </ul>
        </section>

        {/* Product Lifecycle */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Product Lifecycle</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-amber-700 dark:text-amber-300">
                  1
                </span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload & Submit</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-white/70">
                Create your product listing with details, pricing, and files. Status: <strong>Pending</strong>
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20 text-sm font-bold text-indigo-600 dark:text-cyan-300">
                  2
                </span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Admin Review</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-white/70">
                BitForge admins review for quality and policy compliance. Typically takes 24-48 hours.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  3
                </span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Approved & Live</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-white/70">
                Once approved, your product goes live on the marketplace. Status: <strong>Approved</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Creating a Product */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Creating Your First Product</h2>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Step 1: Access Dashboard</h3>
          <ol className="space-y-2 text-slate-600 dark:text-white/70">
            <li>1. Sign in to your seller account</li>
            <li>2. Go to <strong>Dashboard → Products</strong></li>
            <li>3. Click <strong>Upload New Product</strong></li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Step 2: Fill Product Details</h3>
          <div className="space-y-4 text-slate-600 dark:text-white/70">
            <div>
              <strong className="text-slate-900 dark:text-white">Product Name</strong>
              <p className="mt-1 text-sm">Clear, descriptive name (50 characters max)</p>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">Description</strong>
              <p className="mt-1 text-sm">Detailed description including features, requirements, and what's included</p>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">Category</strong>
              <p className="mt-1 text-sm">Choose the most relevant category</p>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">Price</strong>
              <p className="mt-1 text-sm">Set in INR (₹). Minimum ₹50, maximum ₹100,000</p>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">Featured Image</strong>
              <p className="mt-1 text-sm">PNG or JPG, max 2MB, recommended 1200x630px</p>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">Product File</strong>
              <p className="mt-1 text-sm">ZIP, PDF, or MP4 format, max 100MB</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-indigo-200 dark:border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-6 h-6 text-indigo-500 dark:text-cyan-400" />
              <div>
                <p className="mb-2 font-semibold text-cyan-300">Best Practices</p>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-white/70">
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
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Managing Your Products</h2>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">View All Products</h3>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Access your dashboard to see all your products with their status:
          </p>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-white/60">
            <li>• <strong className="text-amber-700 dark:text-amber-300">Pending:</strong> Awaiting admin approval</li>
            <li>• <strong className="text-emerald-700 dark:text-emerald-300">Approved:</strong> Live on marketplace</li>
            <li>• <strong className="text-red-300">Rejected:</strong> Needs revision (check feedback)</li>
          </ul>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Edit Product</h3>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            To edit an approved product:
          </p>
          <ol className="space-y-2 text-slate-600 dark:text-white/70">
            <li>1. Go to <strong>Dashboard → Products</strong></li>
            <li>2. Click <strong>Edit</strong> on the product</li>
            <li>3. Make your changes and submit</li>
            <li>4. Changes go to <strong>Pending Changes</strong> queue</li>
            <li>5. Admin reviews and approves/rejects</li>
          </ol>

          <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 p-4">
            <p className="text-sm text-slate-600 dark:text-white/70">
              <strong className="text-amber-700 dark:text-amber-300">Note:</strong> Your product remains live with old content until changes are approved.
            </p>
          </div>
        </section>

        {/* Deleting Products */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Deleting Products</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Product deletions require admin approval to protect buyer access:
          </p>
          <ol className="space-y-2 text-slate-600 dark:text-white/70">
            <li>1. Navigate to product details</li>
            <li>2. Click <strong>Delete Product</strong></li>
            <li>3. Provide a reason for deletion</li>
            <li>4. Admin reviews the request (usually within 24 hours)</li>
            <li>5. Once approved, product is removed from marketplace</li>
          </ol>

          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm text-slate-600 dark:text-white/70">
              <strong className="text-red-300">Important:</strong> Existing buyers retain access to purchased files even after deletion.
            </p>
          </div>
        </section>

        {/* File Requirements */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">File Requirements</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-white/5">
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="px-4 py-3 text-left text-slate-900 dark:text-white">File Type</th>
                  <th className="px-4 py-3 text-left text-slate-900 dark:text-white">Formats</th>
                  <th className="px-4 py-3 text-left text-slate-900 dark:text-white">Max Size</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 dark:text-white/70">
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <td className="px-4 py-3">Product Image</td>
                  <td className="px-4 py-3">JPG, PNG</td>
                  <td className="px-4 py-3">2MB</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-white/10">
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
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Track Performance</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Monitor your product performance in the seller dashboard:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-white/70">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400"></span>
              <span><strong>Views:</strong> Track how many users view your product</span>
            </li>
            <li className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
              <span><strong>Sales:</strong> Monitor total sales and revenue</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400"><Star className="w-5 h-5 text-indigo-500 dark:text-cyan-400" /></span>
              <span><strong>Ratings:</strong> See customer feedback and ratings</span>
            </li>
            <li className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
              <span><strong>Reviews:</strong> Read and respond to customer reviews</span>
            </li>
          </ul>
        </section>

        {/* Promotions */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Promotions & Discounts</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Boost sales by creating custom discount codes (coupons) for your products:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-white/70">
            <li className="flex items-start gap-3">
              <span className="text-pink-500 mt-0.5 flex-shrink-0"><Ticket className="w-5 h-5 text-indigo-500 dark:text-cyan-400" /></span>
              <span><strong>Percentage Off:</strong> Offer a flat percentage discount (e.g., 20% off) on specific products.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-500 mt-0.5 flex-shrink-0"><DollarSign className="w-5 h-5 text-indigo-500 dark:text-cyan-400" /></span>
              <span><strong>Fixed Amount:</strong> Offer a specific monetary discount (e.g., $5 off).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-500 mt-0.5 flex-shrink-0"><Hourglass className="w-5 h-5 text-indigo-500 dark:text-cyan-400" /></span>
              <span><strong>Time-Limited:</strong> Set start and expiration dates for your promotions.</span>
            </li>
          </ul>
          <div className="mt-4">
            <Link
              href="/docs/promotions"
              className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-cyan-400 hover:text-indigo-700 dark:hover:text-cyan-300 transition-colors"
            >
              Read the full Promotions Guide →
            </Link>
          </div>
        </section>

        {/* Next Steps */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Next Steps</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/docs/payout-system"
              className="group block rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 transition-all hover:border-indigo-400/40 dark:hover:border-cyan-400/40"
            >
              <DollarSign className="w-5 h-5 mb-2 text-yellow-400" />
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
                Payout System →
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/60">Learn how you get paid for sales</p>
            </Link>
            <Link
              href="/docs/upload-solutions"
              className="group block rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 transition-all hover:border-indigo-400/40 dark:hover:border-cyan-400/40"
            >
              <Upload className="w-5 h-5 mb-2 text-emerald-500 dark:text-emerald-400" />
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
                Upload Solutions →
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/60">Troubleshoot upload issues</p>
            </Link>
          </div>
        </section>

        {/* Support */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-cyan-500/10 dark:to-indigo-500/10 shadow-sm p-6">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Need Help?</h3>
          <p className="mb-4 text-sm text-slate-600 dark:text-white/70">
            Questions about product management? Our support team is here to help.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-lg bg-indigo-600 dark:bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors shadow-sm"
          >
            Contact Support
          </Link>
        </section>
      </div>
    </div>
  );
}
