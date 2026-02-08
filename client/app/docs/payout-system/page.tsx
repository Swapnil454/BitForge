"use client";

import Link from "next/link";

export default function PayoutSystemPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
        <Link href="/docs" className="hover:text-white">
          Docs
        </Link>
        <span>/</span>
        <span className="text-white">Payout System</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <span>💰</span>
          For Sellers
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          Payout System
        </h1>
        <p className="text-lg text-white/70">
          Understand how earnings work, when you get paid, and how to manage your bank account for payouts.
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none space-y-12">
        {/* How It Works */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">How Payouts Work</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-lg">
                  🛒
                </span>
                <h3 className="text-lg font-semibold text-white">1. Customer Purchases</h3>
              </div>
              <p className="text-sm text-white/70">
                When someone buys your product, payment is collected through Razorpay.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-lg">
                  💳
                </span>
                <h3 className="text-lg font-semibold text-white">2. Platform Fee Deducted</h3>
              </div>
              <p className="text-sm text-white/70">
                BitForge takes a <strong>10% commission</strong> from each sale. The remaining 90% is added to your earnings balance.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-lg">
                  ⏰
                </span>
                <h3 className="text-lg font-semibold text-white">3. Holding Period</h3>
              </div>
              <p className="text-sm text-white/70">
                Earnings are held for <strong>7 days</strong> from the sale date to allow for refunds or disputes.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-lg">
                  🏦
                </span>
                <h3 className="text-lg font-semibold text-white">4. Available for Payout</h3>
              </div>
              <p className="text-sm text-white/70">
                After 7 days, funds become available. Request a payout to your bank account anytime (minimum ₹500).
              </p>
            </div>
          </div>
        </section>

        {/* Earnings Breakdown */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Earnings Breakdown</h2>
          <div className="rounded-lg border border-white/10 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 p-6">
            <p className="mb-6 text-white/70">Example for a ₹1,000 product sale:</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-white/70">Product Price</span>
                <span className="font-semibold text-white">₹1,000.00</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-white/70">Platform Fee (10%)</span>
                <span className="font-semibold text-red-300">- ₹100.00</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-white/70">Payment Gateway Fee (~2%)</span>
                <span className="font-semibold text-red-300">- ₹20.00</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-white">Your Earnings</span>
                <span className="font-bold text-emerald-300 text-lg">₹880.00</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
            <p className="text-sm text-white/70">
              <strong className="text-cyan-300">Note:</strong> Payment gateway fees are deducted by Razorpay before BitForge receives funds.
            </p>
          </div>
        </section>

        {/* Bank Account Setup */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Bank Account Setup</h2>
          <p className="mb-4 text-white/70">
            To receive payouts, you must add your bank account details:
          </p>

          <h3 className="mb-3 text-lg font-semibold text-white">Add Bank Account</h3>
          <ol className="space-y-2 text-white/70">
            <li>1. Go to <strong>Dashboard → Payouts → Bank Accounts</strong></li>
            <li>2. Click <strong>Add Bank Account</strong></li>
            <li>3. Enter your bank details:
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• Account holder name (must match your profile)</li>
                <li>• Account number</li>
                <li>• IFSC code</li>
                <li>• Account type (Savings/Current)</li>
              </ul>
            </li>
            <li>4. Verify via penny drop (₹1 test transfer)</li>
            <li>5. Once verified, set as default payout account</li>
          </ol>

          <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="mb-2 font-semibold text-yellow-300">Important</p>
                <p className="text-sm text-white/70">
                  Account holder name must exactly match your registered name on BitForge for security compliance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Requesting Payouts */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Requesting a Payout</h2>
          
          <h3 className="mb-3 text-lg font-semibold text-white">Payout Requirements</h3>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>Minimum balance: <strong>₹500</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>Verified bank account</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>KYC verification completed (for amounts over ₹10,000)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>No pending disputes or refunds</span>
            </li>
          </ul>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">How to Request</h3>
          <ol className="space-y-2 text-white/70">
            <li>1. Navigate to <strong>Dashboard → Payouts</strong></li>
            <li>2. Check your <strong>Available Balance</strong></li>
            <li>3. Click <strong>Request Payout</strong></li>
            <li>4. Select or add bank account</li>
            <li>5. Enter amount (or use "Request All")</li>
            <li>6. Confirm the transfer</li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Processing Time</h3>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <ul className="space-y-2 text-sm text-white/70">
              <li>• <strong className="text-white">Initiated:</strong> Request submitted to RazorpayX</li>
              <li>• <strong className="text-white">Processing:</strong> Transfer in progress (1-3 business days)</li>
              <li>• <strong className="text-white">Completed:</strong> Funds credited to your account</li>
              <li>• <strong className="text-white">Failed:</strong> Issue with bank details (contact support)</li>
            </ul>
          </div>
        </section>

        {/* Payout Schedule */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Payout Schedule</h2>
          <p className="mb-4 text-white/70">
            You can choose between two payout options:
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
              <h3 className="mb-3 text-lg font-semibold text-white">Manual Payouts</h3>
              <p className="mb-3 text-sm text-white/70">
                Request payouts on your own schedule whenever you reach the minimum balance.
              </p>
              <ul className="space-y-1 text-sm text-white/60">
                <li>✓ Full control over timing</li>
                <li>✓ No automatic processing</li>
                <li>✓ Request anytime</li>
              </ul>
            </div>

            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-5">
              <h3 className="mb-3 text-lg font-semibold text-white">Auto Payouts</h3>
              <p className="mb-3 text-sm text-white/70">
                Automatically transfer available funds every Friday (minimum ₹500 balance).
              </p>
              <ul className="space-y-1 text-sm text-white/60">
                <li>✓ Set it and forget it</li>
                <li>✓ Weekly processing</li>
                <li>✓ Enable in settings</li>
              </ul>
              <p className="mt-3 text-xs text-cyan-300">Coming soon!</p>
            </div>
          </div>
        </section>

        {/* Transaction History */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">View Transaction History</h2>
          <p className="mb-4 text-white/70">
            Track all your earnings and payouts in the dashboard:
          </p>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">📊</span>
              <span><strong>Sales Report:</strong> View all product sales with dates and amounts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">💸</span>
              <span><strong>Payout History:</strong> Track all completed and pending payouts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">📈</span>
              <span><strong>Analytics:</strong> Monthly earnings breakdown and trends</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">🧾</span>
              <span><strong>Export:</strong> Download CSV reports for accounting</span>
            </li>
          </ul>
        </section>

        {/* Troubleshooting */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Troubleshooting</h2>
          
          <div className="space-y-4">
            <details className="group rounded-lg border border-white/10 bg-white/5 p-4">
              <summary className="cursor-pointer font-semibold text-white list-none flex items-center justify-between">
                <span>Why is my payout pending?</span>
                <span className="text-white/40 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-sm text-white/70">
                Payouts typically take 1-3 business days to process. Check your payout status in the dashboard. If pending for more than 3 days, contact support.
              </p>
            </details>

            <details className="group rounded-lg border border-white/10 bg-white/5 p-4">
              <summary className="cursor-pointer font-semibold text-white list-none flex items-center justify-between">
                <span>Why was my payout failed?</span>
                <span className="text-white/40 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-sm text-white/70">
                Common reasons include incorrect bank details, invalid IFSC code, or account name mismatch. Verify your bank account information and try again.
              </p>
            </details>

            <details className="group rounded-lg border border-white/10 bg-white/5 p-4">
              <summary className="cursor-pointer font-semibold text-white list-none flex items-center justify-between">
                <span>Can I request a payout before 7 days?</span>
                <span className="text-white/40 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-sm text-white/70">
                No, the 7-day holding period is mandatory to protect against fraud and allow time for refunds or disputes.
              </p>
            </details>

            <details className="group rounded-lg border border-white/10 bg-white/5 p-4">
              <summary className="cursor-pointer font-semibold text-white list-none flex items-center justify-between">
                <span>Are there any withdrawal fees?</span>
                <span className="text-white/40 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-sm text-white/70">
                BitForge does not charge withdrawal fees. However, your bank may charge fees for incoming transfers.
              </p>
            </details>
          </div>
        </section>

        {/* Next Steps */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-white">Next Steps</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/docs/bank-account-setup"
              className="group block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-cyan-400/40"
            >
              <div className="mb-2 text-2xl">🏦</div>
              <h3 className="mb-1 font-semibold text-white group-hover:text-cyan-300">
                Bank Account Setup →
              </h3>
              <p className="text-sm text-white/60">Configure your payout bank account</p>
            </Link>
            <Link
              href="/docs/api/payouts"
              className="group block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-cyan-400/40"
            >
              <div className="mb-2 text-2xl">📡</div>
              <h3 className="mb-1 font-semibold text-white group-hover:text-cyan-300">
                Payouts API →
              </h3>
              <p className="text-sm text-white/60">API reference for developers</p>
            </Link>
          </div>
        </section>

        {/* Support */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 p-6">
          <h3 className="mb-2 text-lg font-semibold text-white">Payout Issues?</h3>
          <p className="mb-4 text-sm text-white/70">
            Contact our support team for help with failed payouts or account verification.
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
