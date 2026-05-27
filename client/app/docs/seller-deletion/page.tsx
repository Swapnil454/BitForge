"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

export default function SellerDeletionPage() {
  return (
    <div className="py-10 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-slate-500 dark:text-white/60">
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">For Sellers</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">Seller Deletion</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            For Sellers
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Seller Deletion</h1>
          <p className="text-lg text-slate-600 dark:text-white/70">
            How to request account deletion and the approval process.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Account Deletion Process</h2>
          <div className="bg-red-50 dark:bg-transparent dark:bg-gradient-to-r dark:from-red-500/10 dark:to-orange-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 mb-4">
              Deleting your seller account is a serious action that requires admin approval. This process ensures all pending transactions are settled and customer obligations are fulfilled.
            </p>
            <div className="bg-white dark:bg-black/30 p-4 rounded-lg">
              <p className="text-yellow-200 text-sm flex items-start gap-2">
                <Trash2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Warning:</strong> Account deletion is permanent and irreversible. All your products will be removed from the marketplace.</span>
              </p>
            </div>
          </div>
        </section>

        {/* Before You Delete */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Before Requesting Deletion</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4">Complete These Steps:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold">Resolve all pending support tickets</p>
                  <p className="text-slate-500 dark:text-white/60 text-sm">Address customer inquiries and refund requests</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold">Wait for pending payouts to complete</p>
                  <p className="text-slate-500 dark:text-white/60 text-sm">All payouts must be processed (3-5 business days)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold">Download your sales records</p>
                  <p className="text-slate-500 dark:text-white/60 text-sm">Export transaction history for tax purposes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold">Notify existing customers</p>
                  <p className="text-slate-500 dark:text-white/60 text-sm">Inform buyers about product support discontinuation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold">Backup your product files</p>
                  <p className="text-slate-500 dark:text-white/60 text-sm">Files will be permanently deleted with your account</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deletion Steps */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">How to Request Account Deletion</h2>
          <div className="bg-indigo-50/50 dark:bg-transparent dark:bg-gradient-to-r dark:from-indigo-500/10 dark:to-cyan-500/10 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <ol className="space-y-4 text-slate-700 dark:text-white/80">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">1</span>
                <div>
                  <p>Go to <strong className="text-slate-900 dark:text-white">Dashboard → Settings → Account</strong></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">2</span>
                <div>
                  <p>Scroll to <strong className="text-slate-900 dark:text-white">Danger Zone</strong> section</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">3</span>
                <div>
                  <p>Click <strong className="text-slate-900 dark:text-white">Request Account Deletion</strong></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">4</span>
                <div>
                  <p>Provide a reason for deletion (helps us improve)</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">5</span>
                <div>
                  <p>Type <strong className="text-slate-900 dark:text-white">DELETE</strong> to confirm</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">6</span>
                <div>
                  <p>Submit request and wait for admin review (3-7 days)</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* What Gets Deleted */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">What Gets Deleted</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-50 dark:bg-transparent dark:bg-gradient-to-r dark:from-red-500/10 dark:to-orange-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Permanently Removed
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 dark:text-red-400">•</span>
                  <span>All product listings and files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 dark:text-red-400">•</span>
                  <span>Profile and bio information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 dark:text-red-400">•</span>
                  <span>API keys and access tokens</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 dark:text-red-400">•</span>
                  <span>Unpaid earnings (must withdraw first)</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl"></span> Retained (Legal Requirements)
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Transaction history (7 years)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Tax documents and invoices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Anonymized analytics data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Customer order receipts</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Customer Impact */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Impact on Customers</h2>
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 mb-4">
              <strong className="text-slate-900 dark:text-white">Important:</strong> Existing customers who purchased your products will be affected:
            </p>
            <ul className="space-y-3 text-slate-600 dark:text-white/70">
              <li className="flex items-start gap-3">
                <span className="text-orange-400"></span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Download Access</p>
                  <p className="text-sm">Customers can download for 90 days after deletion, then access is lost</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-400"></span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Product Updates</p>
                  <p className="text-sm">No future updates or bug fixes will be provided</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-400"></span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Support</p>
                  <p className="text-sm">Customer support for your products will be discontinued</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Alternatives */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Alternatives to Deletion</h2>
          <div className="space-y-4">
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">⏸️</span> Temporarily Pause Account
              </h3>
              <p className="text-slate-500 dark:text-white/60 text-sm">
                Deactivate your account temporarily without losing data. Products hidden from marketplace, can be reactivated anytime.
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl"></span> Unpublish Products
              </h3>
              <p className="text-slate-500 dark:text-white/60 text-sm">
                Hide individual products from the marketplace while keeping your account active for future use.
              </p>
            </div>
          </div>
        </section>

        {/* Support */}
        <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-cyan-500/10 dark:to-indigo-500/10 shadow-sm border border-indigo-200 dark:border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Need Help?</h3>
          <p className="text-slate-600 dark:text-white/70 mb-6">
            Have questions about account deletion? Our support team can help you explore alternatives.
          </p>
          <Link href="/contact" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors inline-block">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
