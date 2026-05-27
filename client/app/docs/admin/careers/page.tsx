"use client";

import Link from "next/link";
import { BriefcaseBusiness, CheckCircle, Edit3, Settings } from "lucide-react";

export default function AdminCareersDocsPage() {
  return (
    <div className="py-10 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-slate-500 dark:text-white/60">
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Admin Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">Careers Management</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20">
            Admin Guides
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Careers Management</h1>
          <p className="text-lg text-slate-600 dark:text-white/70">
            Learn how to create, manage, and publish job postings on the BitForge platform.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Overview</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 leading-relaxed">
              The Careers Management system allows administrators to post job openings directly to the platform's public-facing Careers page. This system supports a complete lifecycle for job postings, including drafts, publishing, closing, and featuring specific roles to attract top talent.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Managing Jobs</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Creating & Editing Jobs</h3>
              </div>
              <p className="text-slate-600 dark:text-white/70 mb-4">
                Administrators can create new job postings by clicking the "Create Job" button on the Admin Careers dashboard. Key fields include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-white/70 ml-2">
                <li><strong>Title:</strong> The name of the role (e.g., "Senior Frontend Engineer").</li>
                <li><strong>Department:</strong> The team the role belongs to (e.g., "Engineering", "Marketing").</li>
                <li><strong>Location:</strong> Where the job is based (e.g., "Remote", "San Francisco, CA").</li>
                <li><strong>Employment Type:</strong> Full-time, Part-time, Contract, etc.</li>
                <li><strong>Salary Range:</strong> Optional minimum and maximum compensation values.</li>
                <li><strong>Description:</strong> A detailed overview of the responsibilities and requirements.</li>
                <li><strong>Status:</strong> Jobs can be created as a Draft or Published immediately.</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Job Statuses</h3>
              </div>
              <p className="text-slate-600 dark:text-white/70 mb-4">
                Every job posting has a status that dictates its visibility on the public Careers page:
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg dark:bg-amber-500/10 dark:border-amber-500/30">
                  <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded mb-2 dark:bg-amber-500/20 dark:text-amber-400">DRAFT</span>
                  <p className="text-sm text-slate-700 dark:text-white/70">Not visible to the public. Used for work-in-progress postings.</p>
                </div>
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-lg dark:bg-emerald-500/10 dark:border-emerald-500/30">
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded mb-2 dark:bg-emerald-500/20 dark:text-emerald-400">PUBLISHED</span>
                  <p className="text-sm text-slate-700 dark:text-white/70">Live and visible on the public Careers page. Candidates can apply.</p>
                </div>
                <div className="p-4 border border-slate-200 bg-slate-50 rounded-lg dark:bg-white/5 dark:border-white/10">
                  <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded mb-2 dark:bg-white/10 dark:text-white/60">CLOSED</span>
                  <p className="text-sm text-slate-700 dark:text-white/70">No longer visible to the public or accepting new applications.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Featured Roles & Indicators</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Featured Jobs</h3>
            <p className="text-slate-600 dark:text-white/70 mb-4">
              Administrators can toggle the "Featured" flag on any job posting. Featured jobs appear highlighted at the top of the public Careers page to attract more visibility.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Closing Soon Indicator</h3>
            <p className="text-slate-600 dark:text-white/70">
              The system automatically displays a "Closing Soon" badge on published roles when the remaining openings count drops to 1 or fewer. This creates urgency for potential applicants.
            </p>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
          <Link href="/docs/admin/users" className="group flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-indigo-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10 transition-all">
            <div>
              <p className="text-slate-500 dark:text-white/50 text-xs uppercase tracking-wider mb-1">Previous</p>
              <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">User Management</p>
            </div>
            <span className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">←</span>
          </Link>
          <Link href="/docs/admin/settings" className="group flex items-center justify-between text-right bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-indigo-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10 transition-all">
            <span className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">→</span>
            <div>
              <p className="text-slate-500 dark:text-white/50 text-xs uppercase tracking-wider mb-1">Next</p>
              <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">System Settings</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
