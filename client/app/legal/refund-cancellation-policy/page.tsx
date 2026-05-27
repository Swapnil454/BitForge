import Link from "next/link";
import DynamicHeader from "@/app/components/DynamicHeader";
import { BackButton } from "./BackButton";
import { getGlobalLegalDates } from "@/lib/getGlobalSettings";

export const metadata = {
  title: "Refund & Cancellation Policy | BitForge",
  description: "Refund and Cancellation Policy for digital products on BitForge marketplace.",
};

export default async function RefundCancellationPolicyPage() {
  const dates = await getGlobalLegalDates("refund-cancellation-policy");
  const effectiveDate = dates?.legalEffectiveDate || "January 1, 2026";
  const lastUpdatedDate = dates?.legalLastUpdatedDate || "February 1, 2026";

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white overflow-x-hidden">
      <DynamicHeader title="Refund Policy" />

      {/* BACKGROUND GLOW — dark mode only */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60 hidden dark:block">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-8rem] h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 pb-20 pt-16 sm:pt-20 md:pb-28">

        {/* HERO */}
        <section className="mb-8 border-b border-slate-200 dark:border-white/10 pb-6 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-cyan-300/80 mb-4 inline-block bg-indigo-50 dark:bg-transparent px-3 py-1 rounded-full dark:px-0 dark:py-0">
            Legal
          </p>
          <h1 className="text-3xl font-black tracking-tight leading-tight sm:text-4xl md:text-[42px] text-slate-900 dark:text-white">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="mt-4 text-sm text-slate-500 dark:text-white/60">
            <strong className="text-slate-700 dark:text-white/80">Effective Date:</strong> {effectiveDate}
            <span className="mx-3">·</span>
            <strong className="text-slate-700 dark:text-white/80">Last Updated:</strong> {lastUpdatedDate}
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed max-w-2xl">
            This Refund &amp; Cancellation Policy outlines the terms and conditions for refunds,
            cancellations, and returns on the BitForge platform. Due to the digital nature of products
            sold on our marketplace, special considerations apply.
          </p>
        </section>

        {/* TABLE OF CONTENTS */}
        <section className="mb-8 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-5 sm:p-7 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-white/60">
            Table of Contents
          </h2>
          <nav className="grid gap-2 text-sm text-slate-600 dark:text-white/70 sm:grid-cols-2">
            <a href="#overview"           className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">1. Policy Overview</a>
            <a href="#digital-nature"     className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">2. Digital Product Nature</a>
            <a href="#refund-eligibility" className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">3. Refund Eligibility</a>
            <a href="#non-refundable"     className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">4. Non-Refundable Purchases</a>
            <a href="#refund-process"     className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">5. Refund Request Process</a>
            <a href="#refund-timeline"    className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">6. Refund Processing Timeline</a>
            <a href="#cancellation"       className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">7. Order Cancellation</a>
            <a href="#seller-refunds"     className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">8. Seller-Initiated Refunds</a>
            <a href="#payment-methods"    className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">9. Refund Payment Methods</a>
            <a href="#chargebacks"        className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">10. Chargebacks and Disputes</a>
            <a href="#consumer-rights"    className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">11. Consumer Rights (India)</a>
            <a href="#contact"            className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">12. Contact for Refunds</a>
          </nav>
        </section>

        {/* CONTENT */}
        <div className="space-y-8 text-sm text-slate-600 dark:text-white/70">

          {/* 1. Overview */}
          <section id="overview" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">1. Policy Overview</h2>
            <p className="mb-3 leading-relaxed">
              This Refund &amp; Cancellation Policy applies to all purchases made on the BitForge platform.
              It governs refunds for digital products, licenses, software, and other intangible goods sold
              by Sellers to Buyers through the marketplace.
            </p>
            <p className="mb-3 leading-relaxed">
              By making a purchase on BitForge, you acknowledge and agree to this policy. This policy
              should be read in conjunction with our Terms &amp; Conditions and Privacy Policy.
            </p>
            <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
              <p className="text-sm text-amber-900 dark:text-amber-200/80 leading-relaxed">
                <strong>Important:</strong> In the event of any conflict between this policy and summaries
                or descriptions elsewhere on the platform, this Refund &amp; Cancellation Policy shall prevail.
              </p>
            </div>
          </section>

          {/* 2. Digital Nature */}
          <section id="digital-nature" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">2. Nature of Digital Products</h2>
            <p className="mb-3 leading-relaxed">All products sold on BitForge are digital goods, including but not limited to:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Software applications and tools;</li>
              <li>Digital downloads (ebooks, templates, design files, etc.);</li>
              <li>License keys and access codes;</li>
              <li>Subscription-based services;</li>
              <li>Digital content (videos, audio, documents);</li>
              <li>Online courses and educational materials.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Because these products are delivered instantly and electronically, traditional return and
              exchange processes do not apply. Once a digital product is delivered and accessed, it cannot
              be &quot;returned&quot; in the conventional sense.
            </p>
            <div className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3">
              <p className="text-sm text-indigo-900 dark:text-indigo-200/80 leading-relaxed">
                <strong>General Rule:</strong> All sales are final unless they meet specific eligibility criteria outlined in Section 3 below.
              </p>
            </div>
          </section>

          {/* 3. Refund Eligibility */}
          <section id="refund-eligibility" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">3. Refund Eligibility Criteria</h2>
            <p className="mb-3 leading-relaxed">Refunds may be issued in the following circumstances:</p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-slate-800 dark:text-white/90">3.1 Non-Delivery or Access Issues</h3>
            <p className="mb-3 leading-relaxed">If you have not received access to the product after successful payment:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Download link not received or expired before use;</li>
              <li>Product files are corrupted or inaccessible;</li>
              <li>License key or access code does not work;</li>
              <li>Technical failure on the platform preventing delivery.</li>
            </ul>
            <div className="mt-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
              <p className="text-sm text-emerald-900 dark:text-emerald-200/80 leading-relaxed">
                <strong>Action Required:</strong> You must report non-delivery issues within <strong>48 hours</strong> of purchase to be eligible for a full refund.
              </p>
            </div>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">3.2 Material Misrepresentation</h3>
            <p className="mb-3 leading-relaxed">If the product materially differs from its description:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Product is fundamentally different from what was advertised;</li>
              <li>Critical features or functionality are missing;</li>
              <li>Product is for a different platform or incompatible with stated requirements;</li>
              <li>Seller description contains fraudulent or misleading claims.</li>
            </ul>
            <div className="mt-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
              <p className="text-sm text-emerald-900 dark:text-emerald-200/80 leading-relaxed">
                <strong>Evidence Required:</strong> You must provide screenshots, documentation, or other evidence demonstrating the discrepancy. Requests must be made within <strong>7 days</strong> of purchase.
              </p>
            </div>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">3.3 Technical Defects</h3>
            <p className="mb-3 leading-relaxed">If the product contains critical technical issues that prevent use:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Software crashes on launch or fails to install;</li>
              <li>Product contains malware or harmful code (verified by BitForge);</li>
              <li>Files are corrupted and cannot be opened;</li>
              <li>Critical bugs that make the product unusable for its intended purpose.</li>
            </ul>
            <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
              <p className="text-sm text-amber-900 dark:text-amber-200/80 leading-relaxed">
                <strong>Note:</strong> Minor bugs, cosmetic issues, or features you personally do not like are not grounds for refund. You must contact the Seller first for support. Refund requests must be made within <strong>14 days</strong> of purchase.
              </p>
            </div>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">3.4 Duplicate Purchases</h3>
            <p className="mb-3 leading-relaxed">If you accidentally purchased the same product multiple times:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Duplicate charges for the same item within a short timeframe;</li>
              <li>Unintentional double-click or payment processing error.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              You must report duplicate purchases within <strong className="text-slate-800 dark:text-white/90">24 hours</strong> and not have accessed the duplicate copy.
            </p>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">3.5 Unauthorized Purchases</h3>
            <p className="mb-3 leading-relaxed">If your account or payment method was used without your authorization:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Fraudulent transaction made by a third party;</li>
              <li>Account compromise leading to unauthorized purchase.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              You must report unauthorized purchases immediately and provide evidence (police report,
              bank statement, etc.). We may require additional verification.
            </p>
          </section>

          {/* 4. Non-Refundable */}
          <section id="non-refundable" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">4. Non-Refundable Purchases</h2>
            <p className="mb-3 leading-relaxed">
              Refunds will <strong className="text-slate-800 dark:text-white/90">NOT</strong> be issued in the following situations:
            </p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li><strong className="text-slate-800 dark:text-white/90">Change of Mind:</strong> Buyer simply changes their mind or no longer wants the product;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Buyer&apos;s Remorse:</strong> Product purchased impulsively or without reading the description;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Lack of Use:</strong> Buyer does not use or understand how to use the product;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Compatibility Issues (Disclosed):</strong> Product does not work with your system if requirements were clearly stated;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Subjective Dissatisfaction:</strong> Product does not meet your personal preferences or aesthetic tastes;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Found Cheaper Elsewhere:</strong> Product is available at a lower price on another platform;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Already Accessed/Downloaded:</strong> Product has been fully downloaded, opened, or license key activated (except for cases in Section 3);</li>
              <li><strong className="text-slate-800 dark:text-white/90">Promotional Pricing:</strong> Products purchased during sales or with discount codes (unless they meet eligibility criteria);</li>
              <li><strong className="text-slate-800 dark:text-white/90">Past Refund Window:</strong> Requests made after the specified timeframes in Section 3;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Violation of Terms:</strong> Purchases made in violation of our Terms &amp; Conditions;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Partial Refunds:</strong> We do not offer partial refunds or pro-rated refunds for unused portions.</li>
            </ul>
          </section>

          {/* 5. Refund Process */}
          <section id="refund-process" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">5. Refund Request Process</h2>
            <p className="mb-3 leading-relaxed">To request a refund, follow these steps:</p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-slate-800 dark:text-white/90">Step 1: Contact the Seller</h3>
            <p className="mb-3 leading-relaxed">For most issues, you should <strong>first contact the Seller</strong> directly through:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>The messaging system on BitForge;</li>
              <li>Seller support email (if provided in the product listing).</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Many issues can be resolved quickly by the Seller (e.g., resending download links,
              providing technical support, issuing a replacement license key).
            </p>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">Step 2: Wait for Seller Response</h3>
            <p className="mb-3 leading-relaxed">
              Give the Seller <strong>48 hours</strong> to respond to your inquiry. Sellers are expected to provide reasonable support for their products.
            </p>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">Step 3: Contact BitForge Support</h3>
            <p className="mb-3 leading-relaxed">
              If the Seller does not respond within 48 hours or refuses a reasonable refund request, contact BitForge support:
            </p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Email: <a href="mailto:support@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">support@bittforge.in</a></li>
              <li>Subject Line: &quot;Refund Request - Order #[Your Order Number]&quot;</li>
            </ul>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">Step 4: Provide Required Information</h3>
            <p className="mb-3 leading-relaxed">Your refund request must include:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Your full name and registered email address;</li>
              <li>Order number and transaction ID;</li>
              <li>Product name and Seller name;</li>
              <li>Date of purchase;</li>
              <li>Detailed explanation of the issue;</li>
              <li>Evidence (screenshots, error messages, correspondence with Seller, etc.);</li>
              <li>Steps you&apos;ve already taken to resolve the issue.</li>
            </ul>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">Step 5: Review and Decision</h3>
            <p className="mb-3 leading-relaxed">BitForge will:</p>
            <ol className="ml-6 list-decimal space-y-2 leading-relaxed">
              <li>Acknowledge your request within 24–48 hours;</li>
              <li>Review the evidence and product listing;</li>
              <li>Contact the Seller for their response;</li>
              <li>Investigate the issue (may take 3–7 business days);</li>
              <li>Make a final decision and notify you via email.</li>
            </ol>
            <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
              <p className="text-sm text-amber-900 dark:text-amber-200/80 leading-relaxed">
                <strong>Note:</strong> BitForge&apos;s decision is final and binding. We reserve the right to approve or deny refund requests at our discretion based on the evidence provided and this policy.
              </p>
            </div>
          </section>

          {/* 6. Timeline */}
          <section id="refund-timeline" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">6. Refund Processing Timeline</h2>

            <h3 className="mb-2 mt-4 text-base font-semibold text-slate-800 dark:text-white/90">6.1 Approval to Processing</h3>
            <p className="mb-3 leading-relaxed">Once your refund is approved:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>We will initiate the refund within <strong>2–3 business days</strong>;</li>
              <li>You will receive an email confirmation with refund details;</li>
              <li>The refund amount will be the full purchase price (including applicable taxes);</li>
              <li>Platform fees and payment processing fees are non-refundable to BitForge (but are not deducted from your refund). Buyers are not charged these fees separately.</li>
            </ul>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">6.2 Payment Method Timelines</h3>
            <p className="mb-3 leading-relaxed">The time it takes for the refund to appear in your account depends on your payment method:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li><strong className="text-slate-800 dark:text-white/90">Credit/Debit Cards:</strong> 5–10 business days (depending on your bank);</li>
              <li><strong className="text-slate-800 dark:text-white/90">UPI:</strong> 3–5 business days;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Net Banking:</strong> 5–7 business days;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Wallets (Paytm, etc.):</strong> 2–5 business days;</li>
              <li><strong className="text-slate-800 dark:text-white/90">Bank Transfer:</strong> 7–10 business days.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              If you do not receive your refund within the stated timeframe, please contact your bank or
              payment provider first, then reach out to us at{" "}
              <a href="mailto:support@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">support@bittforge.in</a>.
            </p>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">6.3 Currency and Exchange Rates</h3>
            <p className="mb-3 leading-relaxed">
              Refunds are processed in Indian Rupees (INR). If you paid in a different currency, the refund
              amount may vary slightly due to currency exchange rate fluctuations between the purchase date
              and refund date. BitForge is not responsible for currency conversion differences.
            </p>
          </section>

          {/* 7. Cancellation */}
          <section id="cancellation" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">7. Order Cancellation</h2>

            <h3 className="mb-2 mt-4 text-base font-semibold text-slate-800 dark:text-white/90">7.1 Buyer-Initiated Cancellation</h3>
            <p className="mb-3 leading-relaxed">
              Due to the instant delivery nature of digital products, <strong>cancellations are generally
              not possible</strong> once payment is completed and the product is delivered.
            </p>
            <p className="mb-3 leading-relaxed">However, you may request a cancellation if:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>You made a duplicate purchase within minutes;</li>
              <li>Payment was processed but the product was not yet delivered;</li>
              <li>There was a clear payment processing error.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Cancellation requests must be made within <strong>1 hour</strong> of purchase by contacting{" "}
              <a href="mailto:support@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">support@bittforge.in</a>{" "}
              with your order number.
            </p>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">7.2 Seller-Initiated Cancellation</h3>
            <p className="mb-3 leading-relaxed">Sellers may cancel orders in the following situations:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Product listing error (wrong price, wrong file, etc.);</li>
              <li>Seller is unable to fulfill the order;</li>
              <li>Suspected fraudulent transaction;</li>
              <li>Violation of Seller&apos;s terms of use.</li>
            </ul>
            <p className="mt-3 leading-relaxed">In such cases, you will receive a full automatic refund within 3–5 business days.</p>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">7.3 BitForge-Initiated Cancellation</h3>
            <p className="mb-3 leading-relaxed">BitForge may cancel transactions and issue refunds if:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>The product violates our Terms &amp; Conditions or content policies;</li>
              <li>The Seller account is suspended or terminated;</li>
              <li>Suspicious or fraudulent activity is detected;</li>
              <li>Legal or regulatory compliance requires cancellation.</li>
            </ul>
            <p className="mt-3 leading-relaxed">You will be notified via email and receive a full refund.</p>
          </section>

          {/* 8. Seller Refunds */}
          <section id="seller-refunds" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">8. Seller-Initiated Refunds</h2>
            <p className="mb-3 leading-relaxed">
              Sellers have the ability to issue refunds directly to Buyers at their discretion. Reasons may include:
            </p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Customer service gesture;</li>
              <li>Product issue that cannot be resolved;</li>
              <li>Buyer dissatisfaction (at Seller&apos;s discretion);</li>
              <li>Incorrect product delivered.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Seller-initiated refunds follow the same processing timeline as BitForge-approved refunds.
              However, Sellers are not obligated to issue refunds beyond the eligibility criteria in this policy.
            </p>
            <div className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3">
              <p className="text-sm text-indigo-900 dark:text-indigo-200/80 leading-relaxed">
                <strong>Note for Sellers:</strong> Refunds reduce your payout amount. If a payout has already been processed, BitForge may deduct the refunded amount from your next payout or request repayment.
              </p>
            </div>
          </section>

          {/* 9. Payment Methods */}
          <section id="payment-methods" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">9. Refund Payment Methods</h2>
            <p className="mb-3 leading-relaxed">
              Refunds are issued to the <strong>original payment method</strong> used for the purchase:
            </p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>If you paid via credit/debit card, the refund goes back to that card;</li>
              <li>If you paid via UPI, the refund goes to the UPI ID used;</li>
              <li>If you paid via net banking, the refund goes to that bank account;</li>
              <li>If you paid via wallet, the refund goes back to the wallet.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              We <strong>cannot</strong> process refunds to a different account, payment method, or person.
            </p>
            <p className="mt-3 leading-relaxed">
              <strong className="text-slate-800 dark:text-white/90">Closed Accounts:</strong> If your original payment method
              is no longer active (e.g., card expired, account closed), please contact your bank or payment
              provider. Alternatively, contact us at{" "}
              <a href="mailto:support@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">support@bittforge.in</a>{" "}
              with documentation proving account ownership, and we will work with our payment processor to resolve the issue.
            </p>
          </section>

          {/* 10. Chargebacks */}
          <section id="chargebacks" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">10. Chargebacks and Payment Disputes</h2>

            <h3 className="mb-2 mt-4 text-base font-semibold text-slate-800 dark:text-white/90">10.1 What is a Chargeback?</h3>
            <p className="mb-3 leading-relaxed">
              A chargeback occurs when you dispute a charge with your bank or payment provider directly,
              rather than requesting a refund through BitForge.
            </p>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">10.2 Chargeback Policy</h3>
            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-red-900 dark:text-red-200/80">
                Please do not file a chargeback without contacting us first.
              </p>
            </div>
            <p className="mb-3 leading-relaxed">
              Chargebacks cause significant issues for both BitForge and Sellers. Before initiating a chargeback:
            </p>
            <ol className="ml-6 list-decimal space-y-2 leading-relaxed">
              <li>Contact the Seller to resolve the issue;</li>
              <li>If unresolved, contact BitForge support at <a href="mailto:support@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">support@bittforge.in</a>;</li>
              <li>Wait for our response and refund decision (typically 3–7 business days).</li>
            </ol>
            <p className="mt-4 mb-2 leading-relaxed">If you file a chargeback:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Your BitForge account may be immediately suspended or terminated;</li>
              <li>You will lose access to all purchased products;</li>
              <li>You may be barred from creating a new account;</li>
              <li>We will provide evidence to your bank/payment provider disputing the chargeback;</li>
              <li>If the chargeback is found in our favor, you may still owe the purchase amount plus chargeback fees, where permitted by law.</li>
            </ul>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">10.3 Exceptions</h3>
            <p className="mb-3 leading-relaxed">Chargebacks are appropriate in cases of:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Unauthorized or fraudulent transactions you did not make;</li>
              <li>BitForge is unresponsive to legitimate refund requests for an extended period (30+ days);</li>
              <li>Clear evidence of fraud or deception by BitForge (not the Seller).</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              In such cases, please notify us at{" "}
              <a href="mailto:legal@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">legal@bittforge.in</a>{" "}
              that you are filing a chargeback and why.
            </p>
          </section>

          {/* 11. Consumer Rights */}
          <section id="consumer-rights" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">11. Consumer Rights Under Indian Law</h2>

            <h3 className="mb-2 mt-4 text-base font-semibold text-slate-800 dark:text-white/90">11.1 Consumer Protection Act, 2019</h3>
            <p className="mb-3 leading-relaxed">
              As a consumer in India, you have rights under the Consumer Protection Act, 2019. This policy
              does not override your statutory rights.
            </p>
            <p className="mb-3 leading-relaxed">You have the right to:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Receive products that match their description;</li>
              <li>Seek redressal for defective or deficient products/services;</li>
              <li>File complaints with consumer forums if disputes are not resolved.</li>
            </ul>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">11.2 Limitations for Digital Goods</h3>
            <p className="mb-3 leading-relaxed">
              The Consumer Protection Act recognizes that digital products have unique characteristics.
              Courts and consumer forums generally uphold policies that:
            </p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Treat digital products as non-returnable once delivered and accessed;</li>
              <li>Require refunds for non-delivery, technical defects, or material misrepresentation;</li>
              <li>Do not obligate refunds for subjective dissatisfaction or change of mind.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              This policy is designed to comply with the Consumer Protection Act while accounting for the nature of digital goods.
            </p>

            <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-white/90">11.3 Consumer Forum Disputes</h3>
            <p className="mb-3 leading-relaxed">
              If you believe your consumer rights have been violated and BitForge has not provided adequate
              resolution, you may file a complaint with:
            </p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>District Consumer Disputes Redressal Forum (for claims up to ₹1 crore);</li>
              <li>State Consumer Disputes Redressal Commission (for claims ₹1 crore to ₹10 crore);</li>
              <li>National Consumer Disputes Redressal Commission (for claims above ₹10 crore).</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              You may also use the National Consumer Helpline (NCH) at <strong className="text-slate-800 dark:text-white/90">1800-11-4000</strong> or
              online at{" "}
              <a href="https://consumerhelpline.gov.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer">
                consumerhelpline.gov.in
              </a>.
            </p>
          </section>

          {/* 12. Contact */}
          <section id="contact" className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">12. Contact Us for Refund Requests</h2>
            <p className="mb-5 leading-relaxed">
              For refund requests, cancellations, or questions about this policy, please contact:
            </p>
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-5 sm:p-6 shadow-sm space-y-4">
              <p className="font-bold text-slate-900 dark:text-white">BitForge Technologies Pvt. Ltd.</p>

              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-1">Refund &amp; Cancellation Support:</p>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  Email: <a href="mailto:support@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">support@bittforge.in</a>
                </p>
                <p className="text-sm text-slate-600 dark:text-white/70">Subject: &quot;Refund Request - Order #[Your Order Number]&quot;</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-1">Response Time:</p>
                <p className="text-sm text-slate-600 dark:text-white/70">Initial acknowledgment: Within 24–48 hours</p>
                <p className="text-sm text-slate-600 dark:text-white/70">Full investigation and decision: 3–7 business days</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-1">Payment &amp; Technical Issues:</p>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  Email: <a href="mailto:help@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">help@bittforge.in</a>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                <p className="text-sm text-slate-600 dark:text-white/70">Address: Pune, Maharashtra, India</p>
                <p className="text-sm text-slate-600 dark:text-white/70">Business Hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              </div>
            </div>
          </section>

          {/* Additional Information */}
          <section className="mt-10 border-t border-slate-200 dark:border-white/10 pt-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Policy Updates and Changes</h2>
            <p className="mb-3 leading-relaxed">
              We reserve the right to modify this Refund &amp; Cancellation Policy at any time. Changes
              will be effective immediately upon posting to the Platform. We will notify users of material
              changes via email or prominent notice on the Platform.
            </p>
            <p className="mb-3 leading-relaxed">
              Your continued use of the Platform after changes are posted constitutes acceptance of the
              updated policy. Refund requests will be evaluated under the policy version in effect at the
              time of purchase.
            </p>
          </section>
        </div>

        {/* Footer navigation */}
        <section className="mt-14 border-t border-slate-200 dark:border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <BackButton />
            <div className="flex flex-wrap gap-5 text-slate-600 dark:text-white/70">
              <Link href="/legal/terms-and-conditions" className="font-medium hover:text-indigo-600 dark:hover:text-white transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/legal/privacy-policy" className="font-medium hover:text-indigo-600 dark:hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="font-medium hover:text-indigo-600 dark:hover:text-white transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
