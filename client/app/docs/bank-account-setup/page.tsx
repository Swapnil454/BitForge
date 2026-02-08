"use client";

import { useState } from "react";
import Link from "next/link";

export default function BankAccountSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">
            Documentation
          </Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">
            Getting Started
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Bank Account Setup</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            Getting Started
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">
            Bank Account Setup
          </h1>
          <p className="text-lg text-white/70">
            Connect your bank account to receive payouts from ContentSellify. Follow this guide to link your account securely and start receiving earnings.
          </p>
        </div>

        {/* Prerequisites */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">📋</span> Prerequisites
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-white/80">
                  <strong className="text-white">Seller Account:</strong> Registered and verified on ContentSellify
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-white/80">
                  <strong className="text-white">Bank Account:</strong> Active savings or current account in your name
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-white/80">
                  <strong className="text-white">Account Details:</strong> Account number, IFSC code, and account holder name
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-white/80">
                  <strong className="text-white">Verification:</strong> Cancelled cheque or bank statement (for verification)
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Step 1: Navigate to Settings */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">1.</span> Navigate to Bank Settings
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <ol className="space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  1
                </span>
                <div>
                  <p>Log in to your ContentSellify seller account</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  2
                </span>
                <div>
                  <p>Go to <strong className="text-white">Dashboard</strong> → <strong className="text-white">Settings</strong></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  3
                </span>
                <div>
                  <p>Click on <strong className="text-white">Bank Account</strong> tab</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Step 2: Add Bank Account Details */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">2.</span> Add Bank Account Details
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-6">Fill in the following information carefully:</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-2">Account Holder Name</h3>
                <p className="text-white/60 text-sm mb-2">Full name as per bank records (must match bank statement)</p>
                <CodeBlock code="Swapnil Shelke" />
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">Account Number</h3>
                <p className="text-white/60 text-sm mb-2">Your bank account number (10-18 digits)</p>
                <CodeBlock code="1234567890123456" />
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">IFSC Code</h3>
                <p className="text-white/60 text-sm mb-2">11-character code found on your cheque or bank statement</p>
                <CodeBlock code="SBIN0001234" />
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">Account Type</h3>
                <p className="text-white/60 text-sm mb-2">Select account type</p>
                <div className="flex gap-4 mt-2">
                  <div className="bg-white/5 px-4 py-2 rounded-lg border border-cyan-500/30">
                    <span className="text-white">Savings</span>
                  </div>
                  <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <span className="text-white/60">Current</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">Bank Name</h3>
                <p className="text-white/60 text-sm mb-2">Your bank name (auto-filled from IFSC code)</p>
                <CodeBlock code="State Bank of India" />
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <span>
                  <strong>Important:</strong> Ensure all details match your bank records exactly. Incorrect information will cause payout failures.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Step 3: Verification */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">3.</span> Account Verification
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-6">
              ContentSellify uses RazorpayX to verify bank accounts. Verification happens automatically:
            </p>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-cyan-400">🔄</span> Penny Drop Verification
                </h3>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>A small amount (₹1 or less) is deposited to your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>System verifies account holder name matches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Verification typically completes in 30 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>You can keep the deposit amount (not deducted)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Verification Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-white/80"><strong className="text-white">Verified:</strong> Account is ready to receive payouts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-white/80"><strong className="text-white">Pending:</strong> Verification in progress (wait 30-60 seconds)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-white/80"><strong className="text-white">Failed:</strong> Details incorrect or account inactive</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 4: Payout Preferences */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">4.</span> Configure Payout Preferences
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Minimum Payout Amount</h3>
                <p className="text-white/70 text-sm mb-3">Set the minimum balance required before requesting a payout:</p>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white w-32" 
                    placeholder="₹500"
                    disabled
                  />
                  <span className="text-white/60 text-sm">Default: ₹500</span>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-3">Auto-Payout Settings</h3>
                <p className="text-white/70 text-sm mb-3">Enable automatic payouts when balance reaches threshold:</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 accent-cyan-500" disabled />
                    <span className="text-white/80">Enable auto-payout (coming soon)</span>
                  </label>
                  <p className="text-white/50 text-xs ml-7">
                    When enabled, payouts will be processed automatically on the 1st of every month if balance ≥ minimum amount
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testing Your Setup */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">🧪</span> Testing Your Setup
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              Verify your bank account setup is working correctly:
            </p>
            <ol className="space-y-3 text-white/70">
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">1.</span>
                <span>Make a test sale (or upload a product and purchase it with a test account)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">2.</span>
                <span>Wait for the sale to complete (instant for digital products)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">3.</span>
                <span>Check your earnings in <strong className="text-white">Dashboard → Earnings</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">4.</span>
                <span>Request a payout (if balance meets minimum threshold)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">5.</span>
                <span>Check bank account for deposit (test payouts arrive in 1-3 business days)</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">🔧</span> Troubleshooting
          </h2>
          <div className="space-y-4">
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer">
              <summary className="text-white font-semibold">Verification Failed - Name Mismatch</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p><strong className="text-white">Problem:</strong> Account holder name doesn't match bank records</p>
                <p><strong className="text-white">Solution:</strong></p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Check for typos or extra spaces in name</li>
                  <li>Use full name as per bank records (avoid nicknames)</li>
                  <li>Match capitalization and spacing exactly</li>
                  <li>Check your bank statement or passbook for correct spelling</li>
                </ul>
              </div>
            </details>

            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer">
              <summary className="text-white font-semibold">Invalid IFSC Code</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p><strong className="text-white">Problem:</strong> IFSC code is invalid or not recognized</p>
                <p><strong className="text-white">Solution:</strong></p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Verify IFSC code from your bank cheque or statement</li>
                  <li>Use the <a href="https://ifsc.razorpay.com/" target="_blank" className="text-cyan-400 hover:underline">Razorpay IFSC lookup</a> tool</li>
                  <li>Ensure it's 11 characters (no spaces or special characters)</li>
                  <li>Contact your bank if IFSC is still invalid</li>
                </ul>
              </div>
            </details>

            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer">
              <summary className="text-white font-semibold">Payout Not Received</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p><strong className="text-white">Problem:</strong> Payout was processed but amount not received</p>
                <p><strong className="text-white">Solution:</strong></p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Wait 1-3 business days (standard processing time)</li>
                  <li>Check transaction status in <strong>Dashboard → Payouts</strong></li>
                  <li>Verify bank account is active and not frozen</li>
                  <li>Check with your bank for pending deposits</li>
                  <li>Contact support with transaction ID if issue persists</li>
                </ul>
              </div>
            </details>

            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer">
              <summary className="text-white font-semibold">Can I Update Bank Account?</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p><strong className="text-white">Answer:</strong> Yes, you can update or change your bank account anytime.</p>
                <p><strong className="text-white">Steps:</strong></p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Go to <strong>Dashboard → Settings → Bank Account</strong></li>
                  <li>Click <strong>"Update Bank Account"</strong></li>
                  <li>Enter new bank details and verify</li>
                  <li>Note: Pending payouts will still go to old account</li>
                  <li>New payouts will use updated account after verification</li>
                </ul>
              </div>
            </details>
          </div>
        </section>

        {/* Security Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">🛡️</span> Security Best Practices
          </h2>
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-6">
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Never share:</strong> Bank account details, OTPs, or passwords with anyone</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Only use:</strong> Your own bank account (not friend's or relative's)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Verify URL:</strong> Always check you're on the official ContentSellify domain</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Enable 2FA:</strong> Add two-factor authentication to your account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Monitor transactions:</strong> Regularly check payout history for unauthorized activity</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Next Steps</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <NextStepCard
              title="Request Your First Payout"
              description="Learn how to withdraw your earnings once you've made sales"
              href="/docs/payout-system"
              icon="💸"
            />
            <NextStepCard
              title="Upload Products"
              description="Start selling digital content and earning money"
              href="/docs/product-management"
              icon="📦"
            />
            <NextStepCard
              title="Payment Testing"
              description="Test the full payment flow with Razorpay test cards"
              href="/docs/quick-start#test-payments"
              icon="🧪"
            />
            <NextStepCard
              title="Dashboard Overview"
              description="Track earnings, sales, and manage your products"
              href="/dashboard"
              icon="📊"
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Need Help?</h3>
          <p className="text-white/70 mb-6">
            Having trouble setting up your bank account? Our support team is here to help.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/docs/troubleshooting"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/10 transition-colors"
            >
              View All FAQs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-slate-950/50 border border-white/10 rounded-lg p-4 overflow-x-auto">
        <code className="text-cyan-300 text-sm font-mono">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

function NextStepCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-white/10 transition-all"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300">
        {title}
      </h3>
      <p className="text-white/60 text-sm group-hover:text-white/70">{description}</p>
      <span className="inline-block mt-3 text-cyan-400 text-sm group-hover:translate-x-1 transition-transform">
        Learn more →
      </span>
    </Link>
  );
}
