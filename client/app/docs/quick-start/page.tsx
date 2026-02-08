"use client";

import Link from "next/link";
import { useState } from "react";

export default function QuickStartPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
        <Link href="/docs" className="hover:text-white">
          Docs
        </Link>
        <span>/</span>
        <span className="text-white">Quick Start</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <span>🚀</span>
          Getting Started
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          Quick Start Guide
        </h1>
        <p className="text-lg text-white/70">
          Get BitForge up and running in 15 minutes. This guide walks you through project setup,
          environment configuration, and your first test transaction.
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none">
        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-white">Prerequisites</h2>
          <p className="mb-4 text-white/70">
            Before you begin, make sure you have the following installed:
          </p>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span><strong>Node.js 18+</strong> and npm/yarn package manager</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span><strong>MongoDB</strong> (local or MongoDB Atlas)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span><strong>Git</strong> for version control</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span>
                <strong>Razorpay Account</strong> for payments (
                <a
                  href="https://razorpay.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 underline"
                >
                  Sign up here
                </a>
                )
              </span>
            </li>
          </ul>
        </section>

        {/* Step 1: Clone Repository */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
              1
            </span>
            Clone the Repository
          </h2>
          <p className="mb-4 text-white/70">
            Start by cloning the BitForge repository to your local machine:
          </p>
          <CodeBlock
            language="bash"
            code={`git clone https://github.com/yourusername/contentSellify.git
cd contentSellify`}
          />
        </section>

        {/* Step 2: Install Dependencies */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
              2
            </span>
            Install Dependencies
          </h2>
          <p className="mb-4 text-white/70">
            Install dependencies for both the server and client:
          </p>
          
          <h3 className="mb-3 text-lg font-semibold text-white">Server Dependencies</h3>
          <CodeBlock
            language="bash"
            code={`cd server
npm install`}
          />

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Client Dependencies</h3>
          <CodeBlock
            language="bash"
            code={`cd ../client
npm install`}
          />
        </section>

        {/* Step 3: Environment Variables */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
              3
            </span>
            Configure Environment Variables
          </h2>
          <p className="mb-4 text-white/70">
            Create environment files for both server and client:
          </p>

          <h3 className="mb-3 text-lg font-semibold text-white">Server Environment (.env)</h3>
          <p className="mb-3 text-sm text-white/60">Create <code>server/.env</code> file:</p>
          <CodeBlock
            language="bash"
            code={`# Database
MONGO_URI=mongodb://localhost:27017/bitforge

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# RazorpayX Payouts
RAZORPAYX_ACCOUNT_NUMBER=your_account_number
RAZORPAYX_KEY_ID=rzp_test_your_key_id
RAZORPAYX_KEY_SECRET=your_razorpayx_secret

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5000/auth/github/callback

# Client URL
CLIENT_URL=http://localhost:3000

# SendGrid (Optional for emails)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL='BitForge <no-reply@bittforge.in>'`}
          />

          <h3 className="mb-3 mt-8 text-lg font-semibold text-white">Client Environment (.env.local)</h3>
          <p className="mb-3 text-sm text-white/60">Create <code>client/.env.local</code> file:</p>
          <CodeBlock
            language="bash"
            code={`NEXT_PUBLIC_API_URL=http://localhost:5000`}
          />

          <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="mb-2 font-semibold text-yellow-300">Important</p>
                <p className="text-sm text-white/70">
                  Replace the placeholder values with your actual credentials. Never commit sensitive keys to version control.
                  See our <Link href="/docs/api-keys-setup" className="text-cyan-300 hover:text-cyan-200 underline">API Keys Setup guide</Link> for detailed instructions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Step 4: Database Setup */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
              4
            </span>
            Set Up Database
          </h2>
          <p className="mb-4 text-white/70">
            Ensure MongoDB is running. If using local MongoDB:
          </p>
          <CodeBlock
            language="bash"
            code={`# Start MongoDB service
# On Mac (Homebrew):
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod

# On Windows:
# MongoDB runs as a service by default after installation`}
          />
          <p className="mt-4 text-sm text-white/60">
            Or use <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200 underline">MongoDB Atlas</a> for a hosted solution.
          </p>
        </section>

        {/* Step 5: Run the Application */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
              5
            </span>
            Run the Application
          </h2>
          
          <h3 className="mb-3 text-lg font-semibold text-white">Start the Server</h3>
          <CodeBlock
            language="bash"
            code={`cd server
npm run dev`}
          />
          <p className="mt-3 text-sm text-white/60">Server will start on <code>http://localhost:5000</code></p>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Start the Client</h3>
          <p className="mb-3 text-white/70">In a new terminal:</p>
          <CodeBlock
            language="bash"
            code={`cd client
npm run dev`}
          />
          <p className="mt-3 text-sm text-white/60">Client will start on <code>http://localhost:3000</code></p>

          <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="mb-2 font-semibold text-emerald-300">Success!</p>
                <p className="text-sm text-white/70">
                  Your BitForge instance should now be running. Open{" "}
                  <a href="http://localhost:3000" className="text-cyan-300 hover:text-cyan-200 underline">
                    http://localhost:3000
                  </a>{" "}
                  in your browser.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Step 6: Create Admin Account */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
              6
            </span>
            Create an Admin Account
          </h2>
          <p className="mb-4 text-white/70">
            Run the test user creation script to set up admin and test accounts:
          </p>
          <CodeBlock
            language="bash"
            code={`cd server
node scripts/createTestUsers.js`}
          />
          <p className="mt-4 text-sm text-white/70">This creates three test accounts:</p>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li>👤 <strong>Admin:</strong> admin@bitforge.com / password123</li>
            <li>💼 <strong>Seller:</strong> seller@bitforge.com / password123</li>
            <li>🛒 <strong>Buyer:</strong> buyer@bitforge.com / password123</li>
          </ul>
        </section>

        {/* Step 7: Test Payment Flow */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
              7
            </span>
            Test Your First Transaction
          </h2>
          <p className="mb-4 text-white/70">
            Let's test the complete purchase flow:
          </p>
          <ol className="space-y-4 text-white/70">
            <li>
              <strong className="text-white">1.</strong> Sign in as a seller and upload a test product
            </li>
            <li>
              <strong className="text-white">2.</strong> Sign in as admin and approve the product
            </li>
            <li>
              <strong className="text-white">3.</strong> Sign in as a buyer and make a purchase using Razorpay test mode
            </li>
            <li>
              <strong className="text-white">4.</strong> Use Razorpay test card numbers:
              <CodeBlock
                language="text"
                code={`Card Number: 4111 1111 1111 1111
                  CVV: Any 3 digits
                  Expiry: Any future date
                  Name: Any name`}
              />
            </li>
          </ol>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-white">Next Steps</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <NextStepCard
              icon="🔑"
              title="API Keys Setup"
              description="Configure Razorpay, OAuth, and other integrations"
              href="/docs/api-keys-setup"
            />
            <NextStepCard
              icon="🏦"
              title="Bank Account Setup"
              description="Set up RazorpayX for seller payouts"
              href="/docs/bank-account-setup"
            />
            <NextStepCard
              icon="📦"
              title="Product Management"
              description="Learn how to manage products as a seller"
              href="/docs/product-management"
            />
            <NextStepCard
              icon="💰"
              title="Payout System"
              description="Understand how earnings and payouts work"
              href="/docs/payout-system"
            />
          </div>
        </section>

        {/* Need Help */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 p-6">
          <h3 className="mb-2 text-lg font-semibold text-white">Need Help?</h3>
          <p className="mb-4 text-sm text-white/70">
            Running into issues? Our support team is here to help.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
            >
              Contact Support
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/90 hover:border-white/40"
            >
              Browse All Docs
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

// Code Block Component
function CodeBlock({ language, code }: { language: string; code: string }) {
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

// Next Step Card Component
function NextStepCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-cyan-400/40 hover:bg-white/10"
    >
      <div className="mb-2 text-2xl">{icon}</div>
      <h3 className="mb-1 font-semibold text-white group-hover:text-cyan-300">
        {title} →
      </h3>
      <p className="text-sm text-white/60">{description}</p>
    </Link>
  );
}
