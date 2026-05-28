"use client";

import Link from "next/link";

export default function UIThemingDocsPage() {
  return (
    <div className="py-10 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-slate-500 dark:text-white/60">
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Documentation</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">UI Theming</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20">
            Design
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">UI Theming</h1>
          <p className="text-lg text-slate-600 dark:text-white/70">
            Guidelines and instructions for modifying the user interface theme, dark mode, and styling.
          </p>
        </div>

        {/* Content Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Overview</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 mb-4">
              Our application uses Tailwind CSS for all styling, making it incredibly easy to adapt the color scheme, typography, and component design across light and dark modes.
            </p>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Customization Options</h2>
          <div className="bg-indigo-50/50 dark:bg-transparent dark:bg-gradient-to-r dark:from-indigo-500/10 dark:to-cyan-500/10 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80">
              Detailed guidelines on customizing CSS variables, defining new Tailwind utility classes, and modifying the default design system will be available here soon.
            </p>
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-cyan-500/10 dark:to-indigo-500/10 shadow-sm border border-indigo-200 dark:border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Need Help?</h3>
          <p className="text-slate-600 dark:text-white/70 mb-6">
            Have questions about modifying the UI theme? Our support team is here to help.
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
