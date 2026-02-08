"use client";

import Link from "next/link";

export default function ProductChangesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">For Sellers</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Product Changes</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            For Sellers
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">Product Changes</h1>
          <p className="text-lg text-white/70">
            How to request changes to approved products and track approval status.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              Once a product is approved and published, any changes to core product details require admin approval to ensure quality and prevent fraud. This system protects buyers while giving sellers flexibility to improve their offerings.
            </p>
            <h3 className="text-white font-semibold mb-2">Changes Requiring Approval:</h3>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">•</span>
                <span>Product title or description</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">•</span>
                <span>Price increase or decrease over 10%</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">•</span>
                <span>Product category change</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">•</span>
                <span>Main product files or downloadables</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">•</span>
                <span>Thumbnail or preview images</span>
              </li>
            </ul>
          </div>
        </section>

        {/* How to Submit Changes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">1.</span> How to Submit Changes
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <ol className="space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  1
                </span>
                <div>
                  <p>Navigate to <strong className="text-white">Dashboard → My Products</strong></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  2
                </span>
                <div>
                  <p>Click <strong className="text-white">Edit</strong> on the product you want to modify</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  3
                </span>
                <div>
                  <p>Make your desired changes to the product details</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  4
                </span>
                <div>
                  <p>Add a <strong className="text-white">Change Note</strong> explaining why you're making these updates</p>
                  <p className="text-sm text-white/60 mt-2">Example: \"Updated course content with new React 19 features\"</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                  5
                </span>
                <div>
                  <p>Click <strong className="text-white">Submit for Review</strong></p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Review Process */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">2.</span> Review Process
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="text-white font-semibold mb-2">1. Submitted</h3>
              <p className="text-white/60 text-sm">Changes submitted for admin review</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-white font-semibold mb-2">2. Under Review</h3>
              <p className="text-white/60 text-sm">Admin reviewing your changes</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-white font-semibold mb-2">3. Approved</h3>
              <p className="text-white/60 text-sm">Changes go live automatically</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">❌</div>
              <h3 className="text-white font-semibold mb-2">4. Rejected</h3>
              <p className="text-white/60 text-sm">Feedback provided to revise</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-200 text-sm flex items-start gap-2">
              <span className="text-xl">ℹ️</span>
              <span>
                <strong>Review Time:</strong> Most changes are reviewed within 24-48 hours. You'll receive an email notification when your changes are approved or rejected.
              </span>
            </p>
          </div>
        </section>

        {/* Tracking Changes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">3.</span> Tracking Your Changes
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3">View Pending Changes</h3>
            <ol className="space-y-3 text-white/70 mb-6">
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">1.</span>
                <span>Go to <strong className="text-white">Dashboard → Pending Approvals</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">2.</span>
                <span>See all products with pending change requests</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">3.</span>
                <span>Click on a product to view detailed change history</span>
              </li>
            </ol>

            <h3 className="text-white font-semibold mb-3">Status Indicators</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-white font-semibold">Pending Review</p>
                  <p className="text-white/60 text-sm">Changes waiting for admin approval</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-white font-semibold">Approved</p>
                  <p className="text-white/60 text-sm">Changes applied and product updated</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-white font-semibold">Rejected</p>
                  <p className="text-white/60 text-sm">Changes not approved - requires revision</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instant Updates */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">⚡</span> Instant Updates (No Approval Needed)
          </h2>
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">Some changes can be made instantly without approval:</p>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Minor price adjustments (under 10% change)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Adding or removing tags/keywords</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Updating product availability (enable/disable)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Fixing typos in description (minor text edits)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Updating FAQ or additional information</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Best Practices</h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">💡</span> Be Transparent
              </h3>
              <p className="text-white/60 text-sm">
                Provide clear change notes explaining why you're updating the product. This helps admin reviewers approve changes faster.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">📸</span> Update Previews
              </h3>
              <p className="text-white/60 text-sm">
                When updating product content, also update screenshots or previews to match the new version.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🔔</span> Notify Existing Customers
              </h3>
              <p className="text-white/60 text-sm">
                Consider sending update notifications to existing customers when you make significant improvements.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">⏱️</span> Plan Ahead
              </h3>
              <p className="text-white/60 text-sm">
                Submit changes at least 2-3 days before you need them live to account for review time.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer">Why do changes need approval?</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p>The approval process protects buyers from misleading product descriptions or sudden major changes after purchase. It ensures all products maintain quality standards and match their marketing.</p>
              </div>
            </details>

            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer">How long does review take?</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p>Most changes are reviewed within 24-48 hours. Complex changes or file replacements may take up to 3-5 business days.</p>
              </div>
            </details>

            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer">What if my changes are rejected?</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p>You'll receive detailed feedback explaining why changes were rejected. You can revise and resubmit as many times as needed.</p>
              </div>
            </details>

            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer group">
              <summary className="text-white font-semibold list-none cursor-pointer">Can I cancel a pending change request?</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p>Yes! Go to Pending Approvals and click \"Cancel Request\" before it's reviewed. Once approved, changes go live immediately and can't be reversed (but you can submit new changes).</p>
              </div>
            </details>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Related Resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <NextStepCard
              title="Product Management"
              description="Complete guide to managing your products"
              href="/docs/product-management"
              icon="📦"
            />
            <NextStepCard
              title="Approved Changes"
              description="View history of approved changes"
              href="/docs/approved-changes"
              icon="✅"
            />
            <NextStepCard
              title="Upload Solutions"
              description="Fix common upload issues"
              href="/docs/upload-solutions"
              icon="🔧"
            />
            <NextStepCard
              title="Contact Support"
              description="Get help with your products"
              href="/contact"
              icon="💬"
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Need Help with Product Changes?</h3>
          <p className="text-white/70 mb-6">
            Have questions about the approval process? Our support team is here to help.
          </p>
          <Link
            href="/contact"
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors inline-block"
          >
            Contact Support
          </Link>
        </div>
      </div>
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
