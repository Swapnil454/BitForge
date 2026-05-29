"use client";

import Link from "next/link";
import { Gift, Percent, Tag, ShieldCheck } from "lucide-react";

export default function PromotionsDocsPage() {
  return (
    <div className="py-10 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-slate-500 dark:text-white/60">
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">For Sellers</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">Promotions & Coupons</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-pink-500 bg-pink-500/10 rounded-full border border-pink-500/20">
            For Sellers
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Promotions & Coupons</h1>
          <p className="text-lg text-slate-600 dark:text-white/70">
            Create discount codes, set usage limits, and boost your product sales with the Promotions system.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Overview</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 leading-relaxed">
              The Promotions system allows sellers to create custom discount codes (coupons) for their products. You can specify discount types (percentage or fixed amount), set start and expiration dates, and limit the maximum number of times a coupon can be used. Buyers can then apply these codes during checkout to receive the specified discount.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Creating a Promotion</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Configuration Options</h3>
              </div>
              <p className="text-slate-600 dark:text-white/70 mb-4">
                When creating a new promotion from the Seller Dashboard, you can configure the following fields:
              </p>
              <ul className="list-disc list-inside space-y-3 text-sm text-slate-600 dark:text-white/70 ml-2">
                <li><strong>Code:</strong> The actual text buyers will enter at checkout (e.g., "SUMMER24"). Must be uppercase and alphanumeric.</li>
                <li><strong>Discount Type:</strong> Choose between a <code className="bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded text-slate-800 dark:text-white/90">percentage</code> discount (e.g., 20% off) or a <code className="bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded text-slate-800 dark:text-white/90">fixed_amount</code> discount (e.g., $10 off).</li>
                <li><strong>Discount Value:</strong> The amount or percentage to deduct.</li>
                <li><strong>Start & End Dates:</strong> Determine the active window for the promotion. If an end date is not set, the coupon remains valid indefinitely.</li>
                <li><strong>Usage Limit:</strong> Restrict how many times the coupon can be used across all buyers. Leave blank for unlimited uses.</li>
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Percent className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Percentage Off</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  Ideal for store-wide sales. A 20% discount on a $100 product reduces the price to $80. Maximum discount is 100%.
                </p>
              </div>

              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Fixed Amount Off</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  A flat deduction. A $10 discount on a $50 product reduces the price to $40. Cannot exceed the product's total price.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Buyer Experience</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6">
            <p className="text-slate-700 dark:text-white/80 mb-4 leading-relaxed">
              When a buyer proceeds to the checkout page, they will see a field to enter a coupon code. Upon applying the code, the system performs real-time validation to ensure:
            </p>
            <ul className="list-none space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-white/70">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                The code is currently active and within the start/end dates.
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-white/70">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                The usage limit has not been reached.
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-white/70">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                The coupon applies to the specific product or seller (if restricted).
              </li>
            </ul>
            <p className="mt-4 text-sm text-slate-600 dark:text-white/70 italic">
              Note: The discounted amount is automatically reflected in your Seller Earnings analytics, subtracting the platform fee from the final discounted price.
            </p>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
          <Link href="/docs/product-management" className="group flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-indigo-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10 transition-all">
            <div>
              <p className="text-slate-500 dark:text-white/50 text-xs uppercase tracking-wider mb-1">Previous</p>
              <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">Product Management</p>
            </div>
            <span className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">←</span>
          </Link>
          <Link href="/docs/payout-system" className="group flex items-center justify-between text-right bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-indigo-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10 transition-all">
            <span className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">→</span>
            <div>
              <p className="text-slate-500 dark:text-white/50 text-xs uppercase tracking-wider mb-1">Next</p>
              <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">Payout System</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
