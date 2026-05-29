"use client";

import Link from "next/link";
import { useState } from "react";
import { Rocket, Check, Key, Building, DollarSign, Briefcase, ShoppingCart, Palette, Bell } from "lucide-react";

export default function QuickStartPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-white/60">
        <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white">
          Docs
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">Quick Start</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-700 dark:text-emerald-300">
          <Rocket className="w-4 h-4" />
          Getting Started
        </div>
        <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">
          Quick Start Guide
        </h1>
        <p className="text-lg text-slate-600 dark:text-white/70">
          Get BitForge up and running in 15 minutes. This guide walks you through project setup,
          environment configuration, and your first test transaction.
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none">
        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Prerequisites</h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Before you begin, make sure you have the following installed:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-white/70">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span><strong>Node.js 18+</strong> and npm/yarn package manager</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span><strong>MongoDB</strong> (local or MongoDB Atlas)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span><strong>Git</strong> for version control</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Razorpay Account</strong> for payments (
                <a
                  href="https://razorpay.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-cyan-300 hover:text-indigo-700 dark:hover:text-cyan-700 dark:text-cyan-200 underline transition-colors"
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
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20 text-sm font-bold text-indigo-600 dark:text-cyan-300">
              1
            </span>
            Clone the Repository
          </h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Start by cloning the BitForge repository to your local machine:
          </p>
          <CodeBlock
            language="bash"
            code={`git clone https://github.com/Swapnil454/BitForge.git
              cd BitForge`
            }
          />
        </section>

        {/* Step 2: Install Dependencies */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20 text-sm font-bold text-indigo-600 dark:text-cyan-300">
              2
            </span>
            Install Dependencies
          </h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Install dependencies for both the server and client:
          </p>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Server Dependencies</h3>
          <CodeBlock
            language="bash"
            code={`cd server
npm install`}
          />

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Client Dependencies</h3>
          <CodeBlock
            language="bash"
            code={`cd ../client
npm install`}
          />
        </section>

        {/* Step 3: Environment Variables */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20 text-sm font-bold text-indigo-600 dark:text-cyan-300">
              3
            </span>
            Configure Environment Variables
          </h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Create environment files for both server and client:
          </p>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Server Environment (.env)</h3>
          <p className="mb-3 text-sm text-slate-500 dark:text-white/60">Create <code>server/.env</code> file:</p>
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

# Resend (Optional for emails)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL='BitForge <no-reply@bittforge.in>'`}
          />

          <h3 className="mb-3 mt-8 text-lg font-semibold text-slate-900 dark:text-white">Client Environment (.env.local)</h3>
          <p className="mb-3 text-sm text-slate-500 dark:text-white/60">Create <code>client/.env.local</code> file:</p>
          <CodeBlock
            language="bash"
            code={`NEXT_PUBLIC_API_URL=http://localhost:5000`}
          />

          <div className="mt-6 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl"></span>
              <div>
                <p className="mb-2 font-semibold text-amber-700 dark:text-amber-300">Important</p>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  Replace the placeholder values with your actual credentials. Never commit sensitive keys to version control.
                  See our <Link href="/docs/api-keys-setup" className="text-indigo-600 dark:text-cyan-300 hover:text-indigo-700 dark:hover:text-cyan-700 dark:text-cyan-200 underline transition-colors">API Keys Setup guide</Link> for detailed instructions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Step 4: Database Setup */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20 text-sm font-bold text-indigo-600 dark:text-cyan-300">
              4
            </span>
            Set Up Database
          </h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
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
          <p className="mt-4 text-sm text-slate-500 dark:text-white/60">
            Or use <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-cyan-300 hover:text-indigo-700 dark:hover:text-cyan-700 dark:text-cyan-200 underline transition-colors">MongoDB Atlas</a> for a hosted solution.
          </p>
        </section>

        {/* Step 5: Run the Application */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20 text-sm font-bold text-indigo-600 dark:text-cyan-300">
              5
            </span>
            Run the Application
          </h2>

          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Start the Server</h3>
          <CodeBlock
            language="bash"
            code={`cd server
npm run dev`}
          />
          <p className="mt-3 text-sm text-slate-500 dark:text-white/60">Server will start on <code>http://localhost:5000</code></p>

          <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Start the Client</h3>
          <p className="mb-3 text-slate-600 dark:text-white/70">In a new terminal:</p>
          <CodeBlock
            language="bash"
            code={`cd client
npm run dev`}
          />
          <p className="mt-3 text-sm text-slate-500 dark:text-white/60">Client will start on <code>http://localhost:3000</code></p>

          <div className="mt-6 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl"></span>
              <div>
                <p className="mb-2 font-semibold text-emerald-700 dark:text-emerald-300">Success!</p>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  Your BitForge instance should now be running. Open{" "}
                  <a href="http://localhost:3000" className="text-indigo-600 dark:text-cyan-300 hover:text-indigo-700 dark:hover:text-cyan-700 dark:text-cyan-200 underline transition-colors">
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
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20 text-sm font-bold text-indigo-600 dark:text-cyan-300">
              6
            </span>
            Create an Admin Account
          </h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Run the test user creation script to set up admin and test accounts:
          </p>
          <CodeBlock
            language="bash"
            code={`cd server
node scripts/createTestUsers.js`}
          />
          <p className="mt-4 text-sm text-slate-600 dark:text-white/70">This creates three test accounts:</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-white/60">
            <li> <strong>Admin:</strong> admin@bitforge.com / password123</li>
            <li><Briefcase className="w-5 h-5 inline-block mr-2 text-indigo-500 dark:text-cyan-400" /> <strong>Seller:</strong> seller@bitforge.com / password123</li>
            <li><ShoppingCart className="w-5 h-5 inline-block mr-2 text-indigo-500 dark:text-cyan-400" /> <strong>Buyer:</strong> buyer@bitforge.com / password123</li>
          </ul>
        </section>

        {/* Step 7: Test Payment Flow */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20 text-sm font-bold text-indigo-600 dark:text-cyan-300">
              7
            </span>
            Test Your First Transaction
          </h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Let's test the complete purchase flow:
          </p>
          <ol className="space-y-4 text-slate-600 dark:text-white/70">
            <li>
              <strong className="text-slate-900 dark:text-white">1.</strong> Sign in as a seller and upload a test product
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">2.</strong> Sign in as admin and approve the product
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">3.</strong> Sign in as a buyer and make a purchase using Razorpay test mode
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">4.</strong> Use Razorpay test card numbers:
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

        {/* Step 8: Explore New Features */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20 text-sm font-bold text-indigo-600 dark:text-cyan-300">
              8
            </span>
            Explore UI & Features
          </h2>
          <p className="mb-4 text-slate-600 dark:text-white/70">
            Once running, take a moment to explore some of the latest built-in features:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-white/70">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 mt-0.5 flex-shrink-0"><Palette className="w-5 h-5 text-indigo-500 dark:text-cyan-400" /></span>
              <span><strong>Theming:</strong> Toggle between Light and Dark mode using the button in the top navigation. Your preference is saved to your account.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 mt-0.5 flex-shrink-0"><Bell className="w-5 h-5 text-indigo-500 dark:text-cyan-400" /></span>
              <span><strong>Push Notifications:</strong> Allow notifications when prompted by your browser to test FCM push messages sent by the admin.</span>
            </li>
          </ul>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Next Steps</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <NextStepCard
              icon={<Key className="w-6 h-6" />}
              title="API Keys Setup"
              description="Configure Razorpay, OAuth, and other integrations"
              href="/docs/api-keys-setup"
            />
            <NextStepCard
              icon={<Building className="w-6 h-6" />}
              title="Bank Account Setup"
              description="Set up RazorpayX for seller payouts"
              href="/docs/bank-account-setup"
            />
            <NextStepCard
              icon={<Rocket className="w-6 h-6" />}
              title="Product Management"
              description="Learn how to manage products as a seller"
              href="/docs/product-management"
            />
            <NextStepCard
              icon={<DollarSign className="w-6 h-6" />}
              title="Payout System"
              description="Understand how earnings and payouts work"
              href="/docs/payout-system"
            />
          </div>
        </section>

        {/* Need Help */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-cyan-500/10 dark:to-indigo-500/10 shadow-sm p-6">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Need Help?</h3>
          <p className="mb-4 text-sm text-slate-600 dark:text-white/70">
            Running into issues? Our support team is here to help.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg bg-indigo-600 dark:bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors shadow-sm"
            >
              Contact Support
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-transparent px-4 py-2 text-sm font-medium text-slate-800 dark:text-white/90 hover:border-slate-300 dark:hover:border-white/40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm dark:shadow-none"
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
          className="rounded-lg bg-slate-200 dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-white/20"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-4 text-sm">
        <code className="text-indigo-600 dark:text-cyan-400">{code}</code>
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
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 transition-all hover:border-indigo-400/40 dark:hover:border-cyan-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10"
    >
      <div className="mb-2 text-2xl text-indigo-600 dark:text-cyan-400">{icon}</div>
      <h3 className="mb-1 font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
        {title} →
      </h3>
      <p className="text-sm text-slate-500 dark:text-white/60">{description}</p>
    </Link>
  );
}
