"use client";

import Link from "next/link";
import { DollarSign, Wrench, AlertCircle, FileText, BarChart3 } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="py-10 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-slate-500 dark:text-white/60">
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Admin Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">System Settings</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20">
            Admin Guides
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">System Settings</h1>
          <p className="text-lg text-slate-600 dark:text-white/70">
            Platform configuration, fee structure, and feature flags for administrators.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Platform Settings</h2>
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 mb-4">Configure platform-wide settings, fees, features, and policies.</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-lg text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
                <p className="text-slate-900 dark:text-white font-semibold">Fees</p>
                <p className="text-slate-500 dark:text-white/60 text-sm">Commission rates</p>
              </div>
              <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-lg text-center">
                <Wrench className="w-5 h-5 mx-auto mb-2 text-orange-400" />
                <p className="text-slate-900 dark:text-white font-semibold">Features</p>
                <p className="text-slate-500 dark:text-white/60 text-sm">Enable/disable</p>
              </div>
              <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2"><FileText className="w-8 h-8 mx-auto text-indigo-500 dark:text-cyan-400" /></div>
                <p className="text-slate-900 dark:text-white font-semibold">Policies</p>
                <p className="text-slate-500 dark:text-white/60 text-sm">Terms & guidelines</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Fee Configuration</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <h3 className="text-slate-900 dark:text-white font-semibold mb-3">Platform Commission:</h3>
            <div className="bg-indigo-50/50 dark:bg-transparent dark:bg-gradient-to-r dark:from-indigo-500/10 dark:to-cyan-500/10 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-900 dark:text-white">Seller Commission Rate:</span>
                <span className="text-cyan-400 font-bold">10%</span>
              </div>
              <p className="text-slate-500 dark:text-white/60 text-sm">Percentage taken from each sale. Adjust in Admin → Settings → Fees.</p>
            </div>
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <p className="text-yellow-700 dark:text-yellow-200 text-sm"> <strong>Note:</strong> Fee changes apply to new transactions only, not retroactively.</p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Feature Toggles</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 mb-4">Enable or disable platform features:</p>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-lg cursor-pointer">
                <span className="text-slate-900 dark:text-white">Product Reviews & Ratings</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-lg cursor-pointer">
                <span className="text-slate-900 dark:text-white">Seller Verification Required</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-lg cursor-pointer">
                <span className="text-slate-900 dark:text-white">Automatic Payout Approval</span>
                <input type="checkbox" />
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-lg cursor-pointer">
                <span className="text-slate-900 dark:text-white">Product Change Approval Required</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-lg cursor-pointer">
                <span className="text-slate-900 dark:text-white">Maintenance Mode</span>
                <input type="checkbox" />
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-lg cursor-pointer">
                <div>
                  <span className="block text-slate-900 dark:text-white">Global Push Notifications</span>
                  <span className="block text-xs text-slate-500 dark:text-white/50">Allow sending FCM broadcasts to all users</span>
                </div>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">UI & Preferences</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <h3 className="text-slate-900 dark:text-white font-semibold mb-3">Theming Engine:</h3>
            <p className="text-slate-700 dark:text-white/80 mb-4">
              The platform supports a robust Light and Dark mode toggle. User preferences are saved instantly to the database (<code>preferences.theme</code>) ensuring the chosen theme persists across sessions and devices.
            </p>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded">
              <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                <strong>Note:</strong> The Glassmorphism UI components automatically adapt their opacities and borders based on the active theme to ensure optimal accessibility.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Email Notifications</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 mb-4">Configure automated email notifications:</p>
            <ul className="space-y-2 text-slate-600 dark:text-white/70 text-sm list-disc list-inside">
              <li>New user registration welcome</li>
              <li>Product approval/rejection notifications</li>
              <li>Payout status updates</li>
              <li>Order confirmation emails</li>
              <li>Weekly seller performance reports</li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Security Settings</h2>
          <div className="bg-red-50 dark:bg-transparent dark:bg-gradient-to-r dark:from-red-500/10 dark:to-orange-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
            <h3 className="text-slate-900 dark:text-white font-semibold mb-3">Configure Security:</h3>
            <ul className="space-y-2 text-slate-600 dark:text-white/70 text-sm list-disc list-inside">
              <li>Two-factor authentication (2FA) requirement</li>
              <li>Password complexity rules</li>
              <li>Session timeout duration</li>
              <li>IP whitelisting for admin accounts</li>
              <li>API rate limits per tier</li>
            </ul>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/docs/admin/analytics" className="group block bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3"><BarChart3 className="w-8 h-8 text-indigo-500 dark:text-cyan-400" /></div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Analytics</h3>
            <p className="text-slate-500 dark:text-white/60 text-sm">Platform metrics</p>
          </Link>
          <Link href="/docs/security" className="group block bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 hover:border-purple-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10 transition-all">
            <AlertCircle className="w-5 h-5 mb-3 text-red-500 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Security</h3>
            <p className="text-slate-500 dark:text-white/60 text-sm">Best practices guide</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
