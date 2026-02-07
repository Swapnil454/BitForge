import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Refund & Cancellation Policy | BitForge",
  description: "Refund and Cancellation Policy for digital products on BitForge marketplace.",
};

export default function RefundCancellationPolicyPage() {
  return (
    <main className="relative min-h-screen bg-[#05050a] text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 border-b border-white/10 bg-[#05050a]/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/bitforge_logo1.png"
              alt="BitForge logo"
              width={256}
              height={256}
              className="h-10 w-auto sm:h-12 drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]"
              priority
            />
            <span className="-ml-3 text-lg font-bold tracking-tight sm:-ml-4 sm:text-2xl bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
              BitForge
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-3 py-1.5 text-white/80 hover:border-cyan-400 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-8rem] h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 pb-20 pt-24 sm:pt-28 md:pt-32 md:pb-28">
        {/* HEADER */}
        <section className="mb-10 border-b border-white/10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-[42px]">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="mt-4 text-sm text-white/60">
            <strong className="text-white/80">Effective Date:</strong> January 1, 2026
            <span className="mx-3">·</span>
            <strong className="text-white/80">Last Updated:</strong> February 1, 2026
          </p>
          <p className="mt-3 text-sm text-white/70">
            This Refund &amp; Cancellation Policy outlines the terms and conditions for refunds,
            cancellations, and returns on the BitForge platform. Due to the digital nature of products
            sold on our marketplace, special considerations apply.
          </p>
        </section>

        {/* TABLE OF CONTENTS */}
        <section className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">
            Table of Contents
          </h2>
          <nav className="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
            <a href="#overview" className="hover:text-cyan-300">1. Policy Overview</a>
            <a href="#digital-nature" className="hover:text-cyan-300">2. Digital Product Nature</a>
            <a href="#refund-eligibility" className="hover:text-cyan-300">3. Refund Eligibility</a>
            <a href="#non-refundable" className="hover:text-cyan-300">4. Non-Refundable Purchases</a>
            <a href="#refund-process" className="hover:text-cyan-300">5. Refund Request Process</a>
            <a href="#refund-timeline" className="hover:text-cyan-300">6. Refund Processing Timeline</a>
            <a href="#cancellation" className="hover:text-cyan-300">7. Order Cancellation</a>
            <a href="#seller-refunds" className="hover:text-cyan-300">8. Seller-Initiated Refunds</a>
            <a href="#payment-methods" className="hover:text-cyan-300">9. Refund Payment Methods</a>
            <a href="#chargebacks" className="hover:text-cyan-300">10. Chargebacks and Disputes</a>
            <a href="#consumer-rights" className="hover:text-cyan-300">11. Consumer Rights (India)</a>
            <a href="#contact" className="hover:text-cyan-300">12. Contact for Refunds</a>
          </nav>
        </section>

        {/* CONTENT */}
        <div className="prose prose-invert max-w-none space-y-10 text-sm text-white/70">
          {/* 1. Overview */}
          <section id="overview">
            <h2 className="mb-3 text-xl font-semibold text-white">1. Policy Overview</h2>
            <p className="mb-3">
              This Refund &amp; Cancellation Policy applies to all purchases made on the BitForge platform.
              It governs refunds for digital products, licenses, software, and other intangible goods sold
              by Sellers to Buyers through the marketplace.
            </p>
            <p className="mb-3">
              By making a purchase on BitForge, you acknowledge and agree to this policy. This policy
              should be read in conjunction with our Terms &amp; Conditions and Privacy Policy.
            </p>
            <p>
              <strong className="text-white/90">Important:</strong> In the event of any conflict between
              this policy and summaries or descriptions elsewhere on the platform, this Refund &amp;
              Cancellation Policy shall prevail.
            </p>
          </section>

          {/* 2. Digital Nature */}
          <section id="digital-nature">
            <h2 className="mb-3 text-xl font-semibold text-white">2. Nature of Digital Products</h2>
            <p className="mb-3">
              All products sold on BitForge are digital goods, including but not limited to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Software applications and tools;</li>
              <li>Digital downloads (ebooks, templates, design files, etc.);</li>
              <li>License keys and access codes;</li>
              <li>Subscription-based services;</li>
              <li>Digital content (videos, audio, documents);</li>
              <li>Online courses and educational materials.</li>
            </ul>
            <p className="mt-3">
              Because these products are delivered instantly and electronically, traditional return and
              exchange processes do not apply. Once a digital product is delivered and accessed, it cannot
              be &quot;returned&quot; in the conventional sense.
            </p>
            <p className="mt-3">
              <strong className="text-white/90">General Rule:</strong> All sales are final unless they meet
              specific eligibility criteria outlined in Section 3 below.
            </p>
          </section>

          {/* 3. Refund Eligibility */}
          <section id="refund-eligibility">
            <h2 className="mb-3 text-xl font-semibold text-white">3. Refund Eligibility Criteria</h2>
            <p className="mb-3">
              Refunds may be issued in the following circumstances:
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.1 Non-Delivery or Access Issues</h3>
            <p className="mb-3">
              If you have not received access to the product after successful payment:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Download link not received or expired before use;</li>
              <li>Product files are corrupted or inaccessible;</li>
              <li>License key or access code does not work;</li>
              <li>Technical failure on the platform preventing delivery.</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white/90">Action Required:</strong> You must report non-delivery issues
              within <strong>48 hours</strong> of purchase to be eligible for a full refund.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.2 Material Misrepresentation</h3>
            <p className="mb-3">
              If the product materially differs from its description:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Product is fundamentally different from what was advertised;</li>
              <li>Critical features or functionality are missing;</li>
              <li>Product is for a different platform or incompatible with stated requirements;</li>
              <li>Seller description contains fraudulent or misleading claims.</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white/90">Evidence Required:</strong> You must provide screenshots,
              documentation, or other evidence demonstrating the discrepancy. Requests must be made within
              <strong> 7 days</strong> of purchase.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.3 Technical Defects</h3>
            <p className="mb-3">
              If the product contains critical technical issues that prevent use:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Software crashes on launch or fails to install;</li>
              <li>Product contains malware or harmful code (verified by BitForge);</li>
              <li>Files are corrupted and cannot be opened;</li>
              <li>Critical bugs that make the product unusable for its intended purpose.</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white/90">Note:</strong> Minor bugs, cosmetic issues, or features you
              personally do not like are not grounds for refund. You must contact the Seller first for
              support. Refund requests must be made within <strong>14 days</strong> of purchase.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.4 Duplicate Purchases</h3>
            <p className="mb-3">
              If you accidentally purchased the same product multiple times:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Duplicate charges for the same item within a short timeframe;</li>
              <li>Unintentional double-click or payment processing error.</li>
            </ul>
            <p className="mt-3">
              You must report duplicate purchases within <strong>24 hours</strong> and not have accessed
              the duplicate copy.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.5 Unauthorized Purchases</h3>
            <p className="mb-3">
              If your account or payment method was used without your authorization:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Fraudulent transaction made by a third party;</li>
              <li>Account compromise leading to unauthorized purchase.</li>
            </ul>
            <p className="mt-3">
              You must report unauthorized purchases immediately and provide evidence (police report,
              bank statement, etc.). We may require additional verification.
            </p>
          </section>

          {/* 4. Non-Refundable */}
          <section id="non-refundable">
            <h2 className="mb-3 text-xl font-semibold text-white">4. Non-Refundable Purchases</h2>
            <p className="mb-3">
              Refunds will <strong className="text-white/90">NOT</strong> be issued in the following situations:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-white/90">Change of Mind:</strong> Buyer simply changes their mind
                or no longer wants the product;
              </li>
              <li>
                <strong className="text-white/90">Buyer&apos;s Remorse:</strong> Product purchased impulsively
                or without reading the description;
              </li>
              <li>
                <strong className="text-white/90">Lack of Use:</strong> Buyer does not use or understand
                how to use the product;
              </li>
              <li>
                <strong className="text-white/90">Compatibility Issues (Disclosed):</strong> Product does
                not work with your system if requirements were clearly stated;
              </li>
              <li>
                <strong className="text-white/90">Subjective Dissatisfaction:</strong> Product does not meet
                your personal preferences or aesthetic tastes;
              </li>
              <li>
                <strong className="text-white/90">Found Cheaper Elsewhere:</strong> Product is available at
                a lower price on another platform;
              </li>
              <li>
                <strong className="text-white/90">Already Accessed/Downloaded:</strong> Product has been
                fully downloaded, opened, or license key activated (except for cases in Section 3);
              </li>
              <li>
                <strong className="text-white/90">Promotional Pricing:</strong> Products purchased during
                sales or with discount codes (unless they meet eligibility criteria);
              </li>
              <li>
                <strong className="text-white/90">Past Refund Window:</strong> Requests made after the
                specified timeframes in Section 3;
              </li>
              <li>
                <strong className="text-white/90">Violation of Terms:</strong> Purchases made in violation
                of our Terms &amp; Conditions;
              </li>
              <li>
                <strong className="text-white/90">Partial Refunds:</strong> We do not offer partial refunds
                or pro-rated refunds for unused portions.
              </li>
            </ul>
          </section>

          {/* 5. Refund Process */}
          <section id="refund-process">
            <h2 className="mb-3 text-xl font-semibold text-white">5. Refund Request Process</h2>
            <p className="mb-3">
              To request a refund, follow these steps:
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Step 1: Contact the Seller</h3>
            <p className="mb-3">
              For most issues, you should <strong>first contact the Seller</strong> directly through:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>The messaging system on BitForge;</li>
              <li>Seller support email (if provided in the product listing).</li>
            </ul>
            <p className="mt-3">
              Many issues can be resolved quickly by the Seller (e.g., resending download links,
              providing technical support, issuing a replacement license key).
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Step 2: Wait for Seller Response</h3>
            <p className="mb-3">
              Give the Seller <strong>48 hours</strong> to respond to your inquiry. Sellers are expected
              to provide reasonable support for their products.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Step 3: Contact BitForge Support</h3>
            <p className="mb-3">
              If the Seller does not respond within 48 hours or refuses a reasonable refund request,
              contact BitForge support:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Email: <span className="text-cyan-300">support@bittforge.in</span></li>
              <li>Subject Line: &quot;Refund Request - Order #[Your Order Number]&quot;</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Step 4: Provide Required Information</h3>
            <p className="mb-3">
              Your refund request must include:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Your full name and registered email address;</li>
              <li>Order number and transaction ID;</li>
              <li>Product name and Seller name;</li>
              <li>Date of purchase;</li>
              <li>Detailed explanation of the issue;</li>
              <li>Evidence (screenshots, error messages, correspondence with Seller, etc.);</li>
              <li>Steps you&apos;ve already taken to resolve the issue.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Step 5: Review and Decision</h3>
            <p className="mb-3">
              BitForge will:
            </p>
            <ol className="ml-6 list-decimal space-y-2">
              <li>Acknowledge your request within 24–48 hours;</li>
              <li>Review the evidence and product listing;</li>
              <li>Contact the Seller for their response;</li>
              <li>Investigate the issue (may take 3–7 business days);</li>
              <li>Make a final decision and notify you via email.</li>
            </ol>
            <p className="mt-3">
              <strong className="text-white/90">Note:</strong> BitForge&apos;s decision is final and binding.
              We reserve the right to approve or deny refund requests at our discretion based on the
              evidence provided and this policy.
            </p>
          </section>

          {/* 6. Timeline */}
          <section id="refund-timeline">
            <h2 className="mb-3 text-xl font-semibold text-white">6. Refund Processing Timeline</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">6.1 Approval to Processing</h3>
            <p className="mb-3">
              Once your refund is approved:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>We will initiate the refund within <strong>2–3 business days</strong>;</li>
              <li>You will receive an email confirmation with refund details;</li>
              <li>The refund amount will be the full purchase price (including applicable taxes);</li>
              <li>Platform fees and payment processing fees are non-refundable to BitForge (but are not deducted from your refund). Buyers are not charged these fees separately.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">6.2 Payment Method Timelines</h3>
            <p className="mb-3">
              The time it takes for the refund to appear in your account depends on your payment method:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Credit/Debit Cards:</strong> 5–10 business days (depending on your bank);</li>
              <li><strong className="text-white/90">UPI:</strong> 3–5 business days;</li>
              <li><strong className="text-white/90">Net Banking:</strong> 5–7 business days;</li>
              <li><strong className="text-white/90">Wallets (Paytm, etc.):</strong> 2–5 business days;</li>
              <li><strong className="text-white/90">Bank Transfer:</strong> 7–10 business days.</li>
            </ul>
            <p className="mt-3">
              If you do not receive your refund within the stated timeframe, please contact your bank or
              payment provider first, then reach out to us at <span className="text-cyan-300">support@bittforge.in</span>.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">6.3 Currency and Exchange Rates</h3>
            <p className="mb-3">
              Refunds are processed in Indian Rupees (INR). If you paid in a different currency, the refund
              amount may vary slightly due to currency exchange rate fluctuations between the purchase date
              and refund date. BitForge is not responsible for currency conversion differences.
            </p>
          </section>

          {/* 7. Cancellation */}
          <section id="cancellation">
            <h2 className="mb-3 text-xl font-semibold text-white">7. Order Cancellation</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">7.1 Buyer-Initiated Cancellation</h3>
            <p className="mb-3">
              Due to the instant delivery nature of digital products, <strong>cancellations are generally
              not possible</strong> once payment is completed and the product is delivered.
            </p>
            <p className="mb-3">
              However, you may request a cancellation if:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>You made a duplicate purchase within minutes;</li>
              <li>Payment was processed but the product was not yet delivered;</li>
              <li>There was a clear payment processing error.</li>
            </ul>
            <p className="mt-3">
              Cancellation requests must be made within <strong>1 hour</strong> of purchase by contacting
              <span className="text-cyan-300"> support@bittforge.in</span> with your order number.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">7.2 Seller-Initiated Cancellation</h3>
            <p className="mb-3">
              Sellers may cancel orders in the following situations:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Product listing error (wrong price, wrong file, etc.);</li>
              <li>Seller is unable to fulfill the order;</li>
              <li>Suspected fraudulent transaction;</li>
              <li>Violation of Seller&apos;s terms of use.</li>
            </ul>
            <p className="mt-3">
              In such cases, you will receive a full automatic refund within 3–5 business days.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">7.3 BitForge-Initiated Cancellation</h3>
            <p className="mb-3">
              BitForge may cancel transactions and issue refunds if:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>The product violates our Terms &amp; Conditions or content policies;</li>
              <li>The Seller account is suspended or terminated;</li>
              <li>Suspicious or fraudulent activity is detected;</li>
              <li>Legal or regulatory compliance requires cancellation.</li>
            </ul>
            <p className="mt-3">
              You will be notified via email and receive a full refund.
            </p>
          </section>

          {/* 8. Seller Refunds */}
          <section id="seller-refunds">
            <h2 className="mb-3 text-xl font-semibold text-white">8. Seller-Initiated Refunds</h2>
            <p className="mb-3">
              Sellers have the ability to issue refunds directly to Buyers at their discretion. Reasons may include:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Customer service gesture;</li>
              <li>Product issue that cannot be resolved;</li>
              <li>Buyer dissatisfaction (at Seller&apos;s discretion);</li>
              <li>Incorrect product delivered.</li>
            </ul>
            <p className="mt-3">
              Seller-initiated refunds follow the same processing timeline as BitForge-approved refunds.
              However, Sellers are not obligated to issue refunds beyond the eligibility criteria in this policy.
            </p>
            <p className="mt-3">
              <strong className="text-white/90">Note for Sellers:</strong> Refunds reduce your payout amount.
              If a payout has already been processed, BitForge may deduct the refunded amount from your
              next payout or request repayment.
            </p>
          </section>

          {/* 9. Payment Methods */}
          <section id="payment-methods">
            <h2 className="mb-3 text-xl font-semibold text-white">9. Refund Payment Methods</h2>
            <p className="mb-3">
              Refunds are issued to the <strong>original payment method</strong> used for the purchase:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>If you paid via credit/debit card, the refund goes back to that card;</li>
              <li>If you paid via UPI, the refund goes to the UPI ID used;</li>
              <li>If you paid via net banking, the refund goes to that bank account;</li>
              <li>If you paid via wallet, the refund goes back to the wallet.</li>
            </ul>
            <p className="mt-3">
              We <strong>cannot</strong> process refunds to a different account, payment method, or person.
            </p>
            <p className="mt-3">
              <strong className="text-white/90">Closed Accounts:</strong> If your original payment method
              is no longer active (e.g., card expired, account closed), please contact your bank or payment
              provider. They can assist in redirecting the refund. Alternatively, contact us at
              <span className="text-cyan-300"> support@bittforge.in</span> with documentation proving account
              ownership, and we will work with our payment processor to resolve the issue.
            </p>
          </section>

          {/* 10. Chargebacks */}
          <section id="chargebacks">
            <h2 className="mb-3 text-xl font-semibold text-white">10. Chargebacks and Payment Disputes</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">10.1 What is a Chargeback?</h3>
            <p className="mb-3">
              A chargeback occurs when you dispute a charge with your bank or payment provider directly,
              rather than requesting a refund through BitForge.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">10.2 Chargeback Policy</h3>
            <p className="mb-3">
              <strong className="text-white/90">Please do not file a chargeback without contacting us first.</strong>
            </p>
            <p className="mb-3">
              Chargebacks cause significant issues for both BitForge and Sellers. Before initiating a
              chargeback:
            </p>
            <ol className="ml-6 list-decimal space-y-2">
              <li>Contact the Seller to resolve the issue;</li>
              <li>If unresolved, contact BitForge support at <span className="text-cyan-300">support@bittforge.in</span>;</li>
              <li>Wait for our response and refund decision (typically 3–7 business days).</li>
            </ol>
            <p className="mt-3">
              If you file a chargeback:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Your BitForge account may be immediately suspended or terminated;</li>
              <li>You will lose access to all purchased products;</li>
              <li>You may be barred from creating a new account;</li>
              <li>We will provide evidence to your bank/payment provider disputing the chargeback;</li>
              <li>If the chargeback is found in our favor, you may still owe the purchase amount plus chargeback fees, where permitted by law.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">10.3 Exceptions</h3>
            <p className="mb-3">
              Chargebacks are appropriate in cases of:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Unauthorized or fraudulent transactions you did not make;</li>
              <li>BitForge is unresponsive to legitimate refund requests for an extended period (30+ days);</li>
              <li>Clear evidence of fraud or deception by BitForge (not the Seller).</li>
            </ul>
            <p className="mt-3">
              In such cases, please notify us at <span className="text-cyan-300">legal@bittforge.in</span> that
              you are filing a chargeback and why.
            </p>
          </section>

          {/* 11. Consumer Rights */}
          <section id="consumer-rights">
            <h2 className="mb-3 text-xl font-semibold text-white">11. Consumer Rights Under Indian Law</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">11.1 Consumer Protection Act, 2019</h3>
            <p className="mb-3">
              As a consumer in India, you have rights under the Consumer Protection Act, 2019. This policy
              does not override your statutory rights.
            </p>
            <p className="mb-3">
              You have the right to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Receive products that match their description;</li>
              <li>Seek redressal for defective or deficient products/services;</li>
              <li>File complaints with consumer forums if disputes are not resolved.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">11.2 Limitations for Digital Goods</h3>
            <p className="mb-3">
              The Consumer Protection Act recognizes that digital products have unique characteristics.
              Courts and consumer forums generally uphold policies that:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Treat digital products as non-returnable once delivered and accessed;</li>
              <li>Require refunds for non-delivery, technical defects, or material misrepresentation;</li>
              <li>Do not obligate refunds for subjective dissatisfaction or change of mind.</li>
            </ul>
            <p className="mt-3">
              This policy is designed to comply with the Consumer Protection Act while accounting for the
              nature of digital goods.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">11.3 Consumer Forum Disputes</h3>
            <p className="mb-3">
              If you believe your consumer rights have been violated and BitForge has not provided adequate
              resolution, you may file a complaint with:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>District Consumer Disputes Redressal Forum (for claims up to ₹1 crore);</li>
              <li>State Consumer Disputes Redressal Commission (for claims ₹1 crore to ₹10 crore);</li>
              <li>National Consumer Disputes Redressal Commission (for claims above ₹10 crore).</li>
            </ul>
            <p className="mt-3">
              You may also use the National Consumer Helpline (NCH) at <strong>1800-11-4000</strong> or
              online at <a href="https://consumerhelpline.gov.in" className="text-cyan-300 hover:text-cyan-200" target="_blank" rel="noopener noreferrer">consumerhelpline.gov.in</a>.
            </p>
          </section>

          {/* 12. Contact */}
          <section id="contact">
            <h2 className="mb-3 text-xl font-semibold text-white">12. Contact Us for Refund Requests</h2>
            <p className="mb-3">
              For refund requests, cancellations, or questions about this policy, please contact:
            </p>
            <div className="rounded-2xl border border-white/12 bg-white/5 p-5">
              <p className="mb-3 font-semibold text-white">BitForge Technologies Pvt. Ltd.</p>
              
              <p className="mb-2 text-sm font-semibold text-white/80">Refund &amp; Cancellation Support:</p>
              <p className="mb-1 text-white/70">Email: <span className="text-cyan-300">support@bittforge.in</span></p>
              <p className="mb-1 text-white/70">Subject: &quot;Refund Request - Order #[Your Order Number]&quot;</p>
              
              <p className="mb-2 mt-4 text-sm font-semibold text-white/80">Response Time:</p>
              <p className="mb-1 text-white/70">Initial acknowledgment: Within 24–48 hours</p>
              <p className="mb-1 text-white/70">Full investigation and decision: 3–7 business days</p>
              
              <p className="mb-2 mt-4 text-sm font-semibold text-white/80">Payment &amp; Technical Issues:</p>
              <p className="mb-1 text-white/70">Email: <span className="text-cyan-300">help@bittforge.in</span></p>
              
              <p className="mt-4 text-white/70">Address: Pune, Maharashtra, India</p>
              <p className="text-white/70">Business Hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
            </div>
          </section>

          {/* Additional Information */}
          <section className="mt-10 border-t border-white/10 pt-8">
            <h2 className="mb-3 text-xl font-semibold text-white">Policy Updates and Changes</h2>
            <p className="mb-3">
              We reserve the right to modify this Refund &amp; Cancellation Policy at any time. Changes
              will be effective immediately upon posting to the Platform. We will notify users of material
              changes via email or prominent notice on the Platform.
            </p>
            <p className="mb-3">
              Your continued use of the Platform after changes are posted constitutes acceptance of the
              updated policy. Refund requests will be evaluated under the policy version in effect at the
              time of purchase.
            </p>
          </section>
        </div>

        {/* Footer navigation */}
        <section className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <Link
              href="/"
              className="text-white/70 hover:text-white"
            >
              ← Back to BitForge
            </Link>
            <div className="flex flex-wrap gap-4 text-white/70">
              <Link href="/legal/terms-and-conditions" className="hover:text-white">
                Terms &amp; Conditions
              </Link>
              <Link href="/legal/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
