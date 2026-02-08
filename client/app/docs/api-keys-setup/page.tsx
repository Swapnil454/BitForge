"use client";

import Link from "next/link";
import { useState } from "react";

export default function APIKeysSetupPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
        <Link href="/docs" className="hover:text-white">
          Docs
        </Link>
        <span>/</span>
        <span className="text-white">API Keys Setup</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
          <span>🔑</span>
          Getting Started
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          API Keys Setup
        </h1>
        <p className="text-lg text-white/70">
          Configure Razorpay payments, RazorpayX payouts, and OAuth authentication for Google and GitHub.
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none space-y-12">
        {/* Razorpay Setup */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Razorpay Payment Gateway</h2>
          <p className="mb-4 text-white/70">
            Razorpay handles all payment processing for buyer purchases.
          </p>

          <h3 className="mb-3 text-lg font-semibold text-white">Step 1: Create Razorpay Account</h3>
          <ol className="space-y-3 text-white/70">
            <li>
              1. Visit{" "}
              <a
                href="https://razorpay.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-cyan-200 underline"
              >
                razorpay.com
              </a>{" "}
              and sign up for a free account
            </li>
            <li>2. Complete KYC verification (required for live mode)</li>
            <li>3. For testing, you can use test mode without KYC</li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Step 2: Get API Keys</h3>
          <ol className="space-y-3 text-white/70">
            <li>1. Log in to Razorpay Dashboard</li>
            <li>2. Go to <strong>Settings → API Keys</strong></li>
            <li>3. Click <strong>Generate Test Keys</strong> or <strong>Generate Live Keys</strong></li>
            <li>4. Copy both <code>Key ID</code> and <code>Key Secret</code></li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Step 3: Add to Environment Variables</h3>
          <p className="mb-3 text-sm text-white/60">Add to <code>server/.env</code>:</p>
          <CodeBlock
            code={`# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret`}
          />

          <div className="mt-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="mb-2 font-semibold text-cyan-300">Test Card Numbers</p>
                <CodeBlock
                  code={`Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/28
Name: Test User`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* RazorpayX Payouts */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">RazorpayX Payout System</h2>
          <p className="mb-4 text-white/70">
            RazorpayX enables automated bank transfers for seller payouts.
          </p>

          <h3 className="mb-3 text-lg font-semibold text-white">Step 1: Activate RazorpayX</h3>
          <ol className="space-y-3 text-white/70">
            <li>1. In Razorpay Dashboard, go to <strong>RazorpayX</strong> section</li>
            <li>2. Click <strong>Get Started</strong></li>
            <li>3. Complete business verification</li>
            <li>4. Create a Current Account or use Payout Links</li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Step 2: Get RazorpayX Credentials</h3>
          <ol className="space-y-3 text-white/70">
            <li>1. Go to <strong>Settings → API Keys</strong> in RazorpayX dashboard</li>
            <li>2. Generate API keys for RazorpayX</li>
            <li>3. Note your <strong>Account Number</strong> from Current Account section</li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Step 3: Configure Environment</h3>
          <p className="mb-3 text-sm text-white/60">Add to <code>server/.env</code>:</p>
          <CodeBlock
            code={`# RazorpayX Payouts
RAZORPAYX_ACCOUNT_NUMBER=your_account_number
RAZORPAYX_KEY_ID=rzp_test_your_razorpayx_key
RAZORPAYX_KEY_SECRET=your_razorpayx_secret`}
          />

          <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="mb-2 font-semibold text-yellow-300">Important</p>
                <p className="text-sm text-white/70">
                  RazorpayX requires business verification and may take 2-3 days to activate. Use test mode for development.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Google OAuth */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Google OAuth Setup</h2>
          
          <h3 className="mb-3 text-lg font-semibold text-white">Step 1: Create Google Cloud Project</h3>
          <ol className="space-y-3 text-white/70">
            <li>1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200 underline">Google Cloud Console</a></li>
            <li>2. Create a new project or select existing one</li>
            <li>3. Enable <strong>Google+ API</strong></li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Step 2: Create OAuth Credentials</h3>
          <ol className="space-y-3 text-white/70">
            <li>1. Go to <strong>APIs & Services → Credentials</strong></li>
            <li>2. Click <strong>Create Credentials → OAuth Client ID</strong></li>
            <li>3. Select <strong>Web Application</strong></li>
            <li>4. Add authorized redirect URI: <code>http://localhost:5000/auth/google/callback</code></li>
            <li>5. Copy <strong>Client ID</strong> and <strong>Client Secret</strong></li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Step 3: Configure OAuth</h3>
          <p className="mb-3 text-sm text-white/60">Add to <code>server/.env</code>:</p>
          <CodeBlock
            code={`# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback`}
          />
        </section>

        {/* GitHub OAuth */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">GitHub OAuth Setup</h2>
          
          <h3 className="mb-3 text-lg font-semibold text-white">Step 1: Create OAuth App</h3>
          <ol className="space-y-3 text-white/70">
            <li>1. Go to GitHub <strong>Settings → Developer settings</strong></li>
            <li>2. Click <strong>OAuth Apps → New OAuth App</strong></li>
            <li>3. Fill in application details:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• Application name: <strong>BitForge</strong></li>
                <li>• Homepage URL: <code>http://localhost:3000</code></li>
                <li>• Authorization callback URL: <code>http://localhost:5000/auth/github/callback</code></li>
              </ul>
            </li>
            <li>4. Click <strong>Register Application</strong></li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Step 2: Get Credentials</h3>
          <ol className="space-y-3 text-white/70">
            <li>1. Copy the <strong>Client ID</strong></li>
            <li>2. Generate a new <strong>Client Secret</strong></li>
            <li>3. Save both securely</li>
          </ol>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Step 3: Update Environment</h3>
          <p className="mb-3 text-sm text-white/60">Add to <code>server/.env</code>:</p>
          <CodeBlock
            code={`# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5000/auth/github/callback`}
          />
        </section>

        {/* SendGrid (Optional) */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">SendGrid Email (Optional)</h2>
          <p className="mb-4 text-white/70">
            Configure SendGrid for transactional emails like purchase confirmations and payout notifications.
          </p>

          <h3 className="mb-3 text-lg font-semibold text-white">Setup Steps</h3>
          <ol className="space-y-3 text-white/70">
            <li>1. Sign up at <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200 underline">sendgrid.com</a></li>
            <li>2. Verify your sender email</li>
            <li>3. Go to <strong>Settings → API Keys</strong></li>
            <li>4. Create API key with <strong>Full Access</strong></li>
          </ol>

          <CodeBlock
            code={`# SendGrid (Optional)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL='BitForge <no-reply@bittforge.in>'`}
          />
        </section>

        {/* Verification */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">Verify Configuration</h2>
          <p className="mb-4 text-white/70">
            Test your API keys to ensure everything is configured correctly:
          </p>

          <CodeBlock
            code={`cd server
node test-api.js`}
          />

          <p className="mt-4 text-sm text-white/60">
            This script will test all API connections and report any issues.
          </p>
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
              <p className="text-sm text-white/60">Configure payout bank accounts</p>
            </Link>
            <Link
              href="/docs/oauth-setup"
              className="group block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-cyan-400/40"
            >
              <div className="mb-2 text-2xl">🔐</div>
              <h3 className="mb-1 font-semibold text-white group-hover:text-cyan-300">
                OAuth Detail Guide →
              </h3>
              <p className="text-sm text-white/60">Deep dive into OAuth configuration</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={handleCopy}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-white/20"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-sm">
        <code className="text-cyan-300">{code}</code>
      </pre>
    </div>
  );
}
