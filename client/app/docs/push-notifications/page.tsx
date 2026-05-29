"use client";

import Link from "next/link";

export default function PushNotificationsDocsPage() {
  return (
    <div className="py-10 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-slate-500 dark:text-white/60">
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Documentation</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">Push Notifications</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            Features
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Push Notifications</h1>
          <p className="text-lg text-slate-600 dark:text-white/70">
            Learn how to set up and manage push notifications for real-time updates.
          </p>
        </div>

        {/* Content Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Overview</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 mb-4">
              Push notifications allow you to keep users engaged by sending them real-time updates on orders, product approvals, and important account activity.
            </p>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">More Information</h2>
          <div className="bg-indigo-50/50 dark:bg-transparent dark:bg-gradient-to-r dark:from-indigo-500/10 dark:to-cyan-500/10 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80">
              Detailed setup instructions and API endpoints for Push Notifications will be available here soon. Stay tuned!
            </p>
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-cyan-500/10 dark:to-indigo-500/10 shadow-sm border border-indigo-200 dark:border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Need Help?</h3>
          <p className="text-slate-600 dark:text-white/70 mb-6">
            Have questions about push notifications? Our support team is here to help.
          </p>
          <Link
            href="/contact"
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors inline-block"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
