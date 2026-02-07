import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms & Conditions | BitForge",
  description: "Terms and Conditions governing the use of BitForge digital marketplace platform.",
};

export default function TermsAndConditionsPage() {
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
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-sm text-white/60">
            <strong className="text-white/80">Effective Date:</strong> January 1, 2026
            <span className="mx-3">·</span>
            <strong className="text-white/80">Last Updated:</strong> February 1, 2026
          </p>
          <p className="mt-3 text-sm text-white/70">
            These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the BitForge
            platform, including our website, services, and applications (collectively, the
            &quot;Platform&quot;). By accessing or using the Platform, you agree to be bound by these Terms.
          </p>
        </section>

        {/* TABLE OF CONTENTS */}
        <section className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">
            Table of Contents
          </h2>
          <nav className="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
            <a href="#acceptance" className="hover:text-cyan-300">1. Acceptance of Terms</a>
            <a href="#definitions" className="hover:text-cyan-300">2. Definitions</a>
            <a href="#accounts" className="hover:text-cyan-300">3. User Accounts</a>
            <a href="#buyer-terms" className="hover:text-cyan-300">4. Buyer Terms</a>
            <a href="#seller-terms" className="hover:text-cyan-300">5. Seller Terms</a>
            <a href="#payments" className="hover:text-cyan-300">6. Payments and Fees</a>
            <a href="#intellectual-property" className="hover:text-cyan-300">7. Intellectual Property</a>
            <a href="#prohibited" className="hover:text-cyan-300">8. Prohibited Activities</a>
            <a href="#content" className="hover:text-cyan-300">9. Content Standards</a>
            <a href="#disputes" className="hover:text-cyan-300">10. Dispute Resolution</a>
            <a href="#disclaimers" className="hover:text-cyan-300">11. Disclaimers and Limitations</a>
            <a href="#indemnification" className="hover:text-cyan-300">12. Indemnification</a>
            <a href="#termination" className="hover:text-cyan-300">13. Termination</a>
            <a href="#privacy" className="hover:text-cyan-300">14. Privacy</a>
            <a href="#changes" className="hover:text-cyan-300">15. Changes to Terms</a>
            <a href="#governing-law" className="hover:text-cyan-300">16. Governing Law</a>
            <a href="#contact" className="hover:text-cyan-300">17. Contact Information</a>
          </nav>
        </section>

        {/* CONTENT */}
        <div className="prose prose-invert max-w-none space-y-10 text-sm text-white/70">
          {/* 1. Acceptance */}
          <section id="acceptance">
            <h2 className="mb-3 text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="mb-3">
              By creating an account, accessing, or using the BitForge Platform, you acknowledge that
              you have read, understood, and agree to be bound by these Terms and all applicable laws
              and regulations. If you do not agree with these Terms, you must not access or use the
              Platform.
            </p>
            <p className="mb-3">
              If you are accessing or using the Platform on behalf of a business or entity, you
              represent and warrant that you have the authority to bind that business or entity to
              these Terms and that you agree to these Terms on behalf of that business or entity.
            </p>
            <p>
              You must be at least 18 years old to use the Platform. By using the Platform, you
              represent and warrant that you meet this age requirement.
            </p>
          </section>

          {/* 2. Definitions */}
          <section id="definitions">
            <h2 className="mb-3 text-xl font-semibold text-white">2. Definitions</h2>
            <p className="mb-3">For the purposes of these Terms:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-white/90">&quot;Platform&quot;</strong> refers to the BitForge
                website, applications, services, and related infrastructure.
              </li>
              <li>
                <strong className="text-white/90">&quot;Seller&quot;</strong> refers to any user who lists,
                offers, or sells digital products on the Platform.
              </li>
              <li>
                <strong className="text-white/90">&quot;Buyer&quot;</strong> refers to any user who browses,
                purchases, or downloads digital products from the Platform.
              </li>
              <li>
                <strong className="text-white/90">&quot;Digital Product&quot;</strong> refers to any
                software, digital content, licenses, access keys, or other intangible goods offered for
                sale on the Platform.
              </li>
              <li>
                <strong className="text-white/90">&quot;Content&quot;</strong> refers to any text, images,
                videos, software, data, or other materials uploaded, posted, or transmitted through the
                Platform.
              </li>
              <li>
                <strong className="text-white/90">&quot;We,&quot; &quot;Us,&quot; or &quot;BitForge&quot;</strong> refers
                to the company operating the Platform.
              </li>
            </ul>
          </section>

          {/* 3. User Accounts */}
          <section id="accounts">
            <h2 className="mb-3 text-xl font-semibold text-white">3. User Accounts and Registration</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.1 Account Creation</h3>
            <p className="mb-3">
              To access certain features of the Platform, you must create an account. You agree to
              provide accurate, current, and complete information during registration and to update
              such information to keep it accurate, current, and complete.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.2 Account Security</h3>
            <p className="mb-3">
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activities that occur under your account. You agree to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Use a strong and unique password for your account;</li>
              <li>Immediately notify us of any unauthorized access or use of your account;</li>
              <li>Not share your account credentials with any third party;</li>
              <li>Log out of your account at the end of each session when using a shared device.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.3 Account Types</h3>
            <p className="mb-3">
              BitForge offers different account types, including Buyer accounts and Seller accounts.
              Each account type may have different rights, privileges, and obligations as outlined in
              these Terms. You may upgrade or change your account type subject to our approval and
              verification processes.
            </p>
          </section>

          {/* 4. Buyer Terms */}
          <section id="buyer-terms">
            <h2 className="mb-3 text-xl font-semibold text-white">4. Buyer Terms</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.1 Purchases</h3>
            <p className="mb-3">
              When you purchase a Digital Product through the Platform, you are entering into a direct
              transaction with the Seller. BitForge acts as a payment processor and platform provider
              but is not a party to the transaction between you and the Seller.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.2 Payment</h3>
            <p className="mb-3">
              By providing payment information, you represent and warrant that you are authorized to
              use the payment method provided. All transactions are processed through secure,
              third-party payment processors. You agree to pay all charges incurred by you or on your
              behalf through the Platform, including applicable taxes and fees.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.3 Access and Downloads</h3>
            <p className="mb-3">
              Upon successful payment, you will receive access to download or use the purchased Digital
              Product. Access is typically provided immediately, and download links may expire after a
              certain period. You are responsible for downloading and storing your purchased products.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.4 License and Usage Rights</h3>
            <p className="mb-3">
              Your purchase of a Digital Product grants you a limited, non-exclusive,
              non-transferable license to use the product in accordance with the license terms
              provided by the Seller. You do not acquire ownership of the underlying intellectual
              property unless explicitly stated by the Seller.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.5 Refunds and Returns</h3>
            <p className="mb-3">
              Due to the nature of digital products, all sales are generally final. However, refunds
              may be issued in cases of technical defects, non-delivery, or material misrepresentation
              of the product. Please refer to our Refund &amp; Cancellation Policy for detailed information.
              In case of any conflict between this summary and the full policy, the Refund &amp; Cancellation
              Policy shall prevail.
            </p>
          </section>

          {/* 5. Seller Terms */}
          <section id="seller-terms">
            <h2 className="mb-3 text-xl font-semibold text-white">5. Seller Terms</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">5.1 Seller Eligibility</h3>
            <p className="mb-3">
              To become a Seller, you must complete our verification process, provide accurate business
              or individual information, and comply with all applicable laws and regulations. We reserve
              the right to reject or terminate any Seller account at our discretion.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">5.2 Product Listings</h3>
            <p className="mb-3">
              As a Seller, you are responsible for the accuracy and completeness of your product listings.
              You represent and warrant that:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>You have all necessary rights and licenses to sell the Digital Products you list;</li>
              <li>Your product descriptions, images, and information are accurate and not misleading;</li>
              <li>Your products comply with all applicable laws and do not infringe third-party rights;</li>
              <li>Your products are free from malware, viruses, and harmful code;</li>
              <li>You will honor all licenses and usage terms you specify for your products.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">5.3 Pricing and Discounts</h3>
            <p className="mb-3">
              You have full control over the pricing of your Digital Products. Prices must be set in
              Indian Rupees (INR) and should include any applicable taxes. You may offer discounts and
              promotional pricing, but you must honor all prices displayed on the Platform at the time
              of purchase.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">5.4 Seller Obligations</h3>
            <p className="mb-3">
              As a Seller, you agree to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Ensure your Digital Products are delivered to Buyers promptly after purchase;</li>
              <li>Maintain accurate and current contact information;</li>
              <li>Respond to customer inquiries and support requests in a timely manner;</li>
              <li>Comply with all applicable tax obligations related to your sales;</li>
              <li>Not engage in fraudulent, deceptive, or manipulative practices;</li>
              <li>Keep your product files and access mechanisms functional and accessible.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">5.5 Seller Payouts</h3>
            <p className="mb-3">
              BitForge processes payments on behalf of Sellers. Payout schedules, methods, and
              requirements are detailed separately in our Seller Payout Terms. You must provide valid
              banking information and complete any required verification before receiving payouts.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">5.6 Product Removal</h3>
            <p className="mb-3">
              We reserve the right to remove any product listing that violates these Terms, applicable
              laws, or our content policies. We may also remove products in response to intellectual
              property complaints or other legal requests.
            </p>
          </section>

          {/* 6. Payments and Fees */}
          <section id="payments">
            <h2 className="mb-3 text-xl font-semibold text-white">6. Payments and Fees</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">6.1 Platform Fees</h3>
            <p className="mb-3">
              BitForge charges Sellers a commission on each successful transaction. The current fee
              structure is:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Standard marketplace fee: 15% of the transaction value</li>
              <li>Payment processing fee: As charged by our payment processor (typically 2-3%)</li>
            </ul>
            <p className="mt-3">
              These fees are automatically deducted from each transaction before payout. We reserve the
              right to modify our fee structure with 30 days&apos; notice to Sellers.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">6.2 Taxes</h3>
            <p className="mb-3">
              You are responsible for determining and paying any applicable taxes arising from your use
              of the Platform. Sellers are responsible for collecting and remitting any applicable
              taxes (including GST, VAT, or sales tax) on their sales. Sellers are solely responsible
              for GST registration, filing, and compliance where applicable. BitForge may collect tax
              information from users as required by law.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">6.3 Currency</h3>
            <p className="mb-3">
              All transactions on the Platform are conducted in Indian Rupees (INR) unless otherwise
              specified. Currency conversion, if applicable, will be handled by your payment provider
              and may incur additional fees.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">6.4 Payment Disputes</h3>
            <p className="mb-3">
              In the event of a payment dispute, chargeback, refund request, fraud investigation, or
              legal requests, we may withhold payouts and investigate the matter. You agree to cooperate
              with such investigations and to provide any requested documentation promptly.
            </p>
          </section>

          {/* 7. Intellectual Property */}
          <section id="intellectual-property">
            <h2 className="mb-3 text-xl font-semibold text-white">7. Intellectual Property Rights</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">7.1 Platform Ownership</h3>
            <p className="mb-3">
              The Platform and its original content, features, and functionality are owned by BitForge
              and are protected by international copyright, trademark, patent, trade secret, and other
              intellectual property laws. Our trademarks and trade dress may not be used without our
              prior written permission.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">7.2 User Content Ownership</h3>
            <p className="mb-3">
              You retain ownership of all intellectual property rights in the Content you upload or
              submit to the Platform. However, by uploading Content, you grant BitForge a worldwide,
              non-exclusive, royalty-free license to use, reproduce, modify, and display such Content
              solely for the purpose of operating and promoting the Platform.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">7.3 DMCA and Copyright Complaints</h3>
            <p className="mb-3">
              BitForge respects the intellectual property rights of others. If you believe that your
              copyrighted work has been copied in a way that constitutes copyright infringement, please
              submit a notice to our designated copyright agent at <span className="text-cyan-300">legal@bittforge.in</span> with:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Identification of the copyrighted work claimed to have been infringed;</li>
              <li>Identification of the material that is claimed to be infringing;</li>
              <li>Your contact information;</li>
              <li>A statement that you have a good faith belief that use of the material is not authorized;</li>
              <li>A statement that the information in the notification is accurate;</li>
              <li>Your physical or electronic signature.</li>
            </ul>
          </section>

          {/* 8. Prohibited Activities */}
          <section id="prohibited">
            <h2 className="mb-3 text-xl font-semibold text-white">8. Prohibited Activities</h2>
            <p className="mb-3">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Violating any applicable laws, regulations, or third-party rights;</li>
              <li>Uploading or selling products containing malware, viruses, or harmful code;</li>
              <li>Engaging in fraudulent, deceptive, or misleading practices;</li>
              <li>Infringing on any intellectual property rights of others;</li>
              <li>Harassing, threatening, or abusing other users;</li>
              <li>Manipulating prices, reviews, or ratings;</li>
              <li>Creating fake accounts or impersonating others;</li>
              <li>Scraping, data mining, or automated data collection from the Platform;</li>
              <li>Attempting to gain unauthorized access to the Platform or other user accounts;</li>
              <li>Selling prohibited items including illegal content, stolen goods, or regulated items;</li>
              <li>Circumventing or bypassing our security measures or payment systems;</li>
              <li>Using the Platform to distribute spam or unsolicited communications;</li>
              <li>Interfering with the proper functioning of the Platform;</li>
              <li>Reverse engineering, decompiling, or disassembling any part of the Platform.</li>
            </ul>
          </section>

          {/* 9. Content Standards */}
          <section id="content">
            <h2 className="mb-3 text-xl font-semibold text-white">9. Content Standards and Moderation</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">9.1 User Content Responsibility</h3>
            <p className="mb-3">
              You are solely responsible for all Content you upload, post, or transmit through the
              Platform. All Content must comply with these Terms and applicable laws.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">9.2 Prohibited Content</h3>
            <p className="mb-3">
              Content must not:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Contain illegal, harmful, threatening, abusive, or defamatory material;</li>
              <li>Promote violence, discrimination, or hatred against individuals or groups;</li>
              <li>Include pornographic, obscene, or sexually explicit material;</li>
              <li>Violate privacy rights or disclose personal information without consent;</li>
              <li>Infringe on intellectual property rights;</li>
              <li>Contain false, misleading, or deceptive information;</li>
              <li>Promote illegal activities or facilitate criminal conduct.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">9.3 Content Moderation</h3>
            <p className="mb-3">
              We reserve the right, but are not obligated, to monitor, review, and remove any Content
              that violates these Terms or is otherwise objectionable. We may employ automated tools
              and human review to moderate Content.
            </p>
          </section>

          {/* 10. Dispute Resolution */}
          <section id="disputes">
            <h2 className="mb-3 text-xl font-semibold text-white">10. Dispute Resolution</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">10.1 User Disputes</h3>
            <p className="mb-3">
              Disputes between Buyers and Sellers should first be attempted to be resolved directly
              between the parties. If direct resolution fails, either party may contact BitForge
              support at <span className="text-cyan-300">support@bittforge.in</span> for mediation assistance.
              BitForge&apos;s mediation assistance does not constitute legal arbitration and does not waive
              either party&apos;s right to binding arbitration under Section 16 of these Terms.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">10.2 Dispute Process</h3>
            <p className="mb-3">
              Our dispute resolution process typically involves:
            </p>
            <ol className="ml-6 list-decimal space-y-2">
              <li>Initial review of the dispute by our support team;</li>
              <li>Request for documentation and evidence from both parties;</li>
              <li>Investigation and assessment of the issue;</li>
              <li>Determination and recommended resolution;</li>
              <li>Implementation of the resolution (if agreed upon by parties).</li>
            </ol>
            <p className="mt-3">
              While we will make reasonable efforts to mediate disputes, we are not obligated to
              resolve disputes between users and our decisions are final and binding.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">10.3 Disputes with BitForge</h3>
            <p className="mb-3">
              Any disputes arising between you and BitForge shall be governed by the arbitration and
              governing law provisions set forth in Section 16 of these Terms.
            </p>
          </section>

          {/* 11. Disclaimers */}
          <section id="disclaimers">
            <h2 className="mb-3 text-xl font-semibold text-white">11. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">11.1 Platform &quot;As Is&quot;</h3>
            <p className="mb-3 uppercase">
              THE PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF
              ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">11.2 No Warranty on Products</h3>
            <p className="mb-3">
              BitForge does not warrant or guarantee the quality, accuracy, reliability, or
              completeness of any Digital Products sold through the Platform. We are not responsible
              for verifying the accuracy of product descriptions or the functionality of products
              listed by Sellers.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">11.3 Limitation of Liability</h3>
            <p className="mb-3 uppercase">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BITFORGE SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
              REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL,
              OR OTHER INTANGIBLE LOSSES RESULTING FROM:
            </p>
            <ul className="ml-6 list-disc space-y-2 uppercase">
              <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE PLATFORM;</li>
              <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE PLATFORM;</li>
              <li>ANY CONTENT OBTAINED FROM THE PLATFORM;</li>
              <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</li>
            </ul>
            <p className="mt-3 uppercase">
              IN NO EVENT SHALL OUR AGGREGATE LIABILITY EXCEED THE GREATER OF TEN THOUSAND RUPEES
              (INR ₹10,000) OR THE AMOUNT YOU PAID TO BITFORGE IN THE PAST SIX MONTHS.
            </p>
          </section>

          {/* 12. Indemnification */}
          <section id="indemnification">
            <h2 className="mb-3 text-xl font-semibold text-white">12. Indemnification</h2>
            <p className="mb-3">
              You agree to indemnify, defend, and hold harmless BitForge, its affiliates, officers,
              directors, employees, agents, and licensors from and against any and all claims,
              liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys&apos;
              fees) arising from:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Your use of the Platform;</li>
              <li>Your violation of these Terms;</li>
              <li>Your violation of any rights of another party;</li>
              <li>Your Content or Digital Products;</li>
              <li>Any transactions conducted through your account;</li>
              <li>Your breach of any representations or warranties made herein.</li>
            </ul>
            <p className="mt-3">
              This indemnification obligation will survive the termination of your account and your use
              of the Platform.
            </p>
          </section>

          {/* 13. Termination */}
          <section id="termination">
            <h2 className="mb-3 text-xl font-semibold text-white">13. Account Termination and Suspension</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">13.1 Termination by You</h3>
            <p className="mb-3">
              You may terminate your account at any time by contacting our support team at
              <span className="text-cyan-300"> support@bittforge.in</span>. Upon termination, you will no
              longer have access to your account, but you will retain access to any products you have
              purchased as a Buyer.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">13.2 Termination by BitForge</h3>
            <p className="mb-3">
              We reserve the right to suspend or terminate your account at any time, with or without
              notice, for any reason, including but not limited to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Violation of these Terms;</li>
              <li>Fraudulent, abusive, or illegal activity;</li>
              <li>Extended periods of inactivity;</li>
              <li>Requests by law enforcement or government agencies;</li>
              <li>Technical or security concerns;</li>
              <li>Discontinuation of the Platform or modifications to services.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">13.3 Effect of Termination</h3>
            <p className="mb-3">
              Upon termination:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Your right to access and use the Platform will immediately cease;</li>
              <li>Your listings and Content may be removed from the Platform;</li>
              <li>Sellers will be paid any outstanding balances owed, subject to applicable holds;</li>
              <li>Buyers will retain access to previously purchased Digital Products;</li>
              <li>Certain provisions of these Terms will survive termination, including indemnification, disclaimers, and limitations of liability.</li>
            </ul>
          </section>

          {/* 14. Privacy */}
          <section id="privacy">
            <h2 className="mb-3 text-xl font-semibold text-white">14. Privacy and Data Protection</h2>
            <p className="mb-3">
              Your privacy is important to us. Our collection, use, and disclosure of your personal
              information is governed by our Privacy Policy, which is incorporated into these Terms by
              reference. By using the Platform, you consent to our Privacy Policy.
            </p>
            <p className="mb-3">
              We implement appropriate technical and organizational measures to protect your personal
              data against unauthorized or unlawful processing and against accidental loss, destruction,
              or damage. However, no method of transmission over the Internet or electronic storage is
              100% secure.
            </p>
            <p>
              For questions about our privacy practices or to exercise your data rights, please contact
              <span className="text-cyan-300"> privacy@bittforge.in</span>.
            </p>
          </section>

          {/* 15. Changes to Terms */}
          <section id="changes">
            <h2 className="mb-3 text-xl font-semibold text-white">15. Changes to These Terms</h2>
            <p className="mb-3">
              We reserve the right to modify or replace these Terms at any time at our sole discretion.
              If we make material changes to these Terms, we will provide notice by:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Posting the updated Terms on the Platform with a new &quot;Last Updated&quot; date;</li>
              <li>Sending an email notification to your registered email address;</li>
              <li>Displaying a prominent notice on the Platform.</li>
            </ul>
            <p className="mt-3">
              Material changes will take effect 30 days after posting or notification. Your continued
              use of the Platform after the effective date constitutes acceptance of the modified
              Terms. If you do not agree to the modified Terms, you must stop using the Platform.
            </p>
          </section>

          {/* 16. Governing Law */}
          <section id="governing-law">
            <h2 className="mb-3 text-xl font-semibold text-white">16. Governing Law and Jurisdiction</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">16.1 Governing Law</h3>
            <p className="mb-3">
              These Terms shall be governed by and construed in accordance with the laws of India,
              without regard to its conflict of law provisions. The United Nations Convention on
              Contracts for the International Sale of Goods does not apply to these Terms.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">16.2 Dispute Resolution and Arbitration</h3>
            <p className="mb-3">
              Any dispute, controversy, or claim arising out of or relating to these Terms, including
              the breach, termination, or validity thereof, shall be resolved through binding
              arbitration in accordance with the Arbitration and Conciliation Act, 1996.
            </p>
            <p className="mb-3">
              The arbitration shall:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Be conducted by a sole arbitrator mutually appointed by the parties;</li>
              <li>Take place in Pune, India;</li>
              <li>Be conducted in English;</li>
              <li>Result in a binding award that may be entered as a judgment in any court of competent jurisdiction.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">16.3 Exception for Small Claims</h3>
            <p className="mb-3">
              Either party may bring an action in small claims court if the claim qualifies and remains
              in small claims court.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">16.4 Jurisdiction</h3>
            <p className="mb-3">
              Subject to the arbitration provisions above, you agree to submit to the exclusive
              jurisdiction of the courts located in Pune, India for the resolution of any disputes.
            </p>
          </section>

          {/* 17. Contact */}
          <section id="contact">
            <h2 className="mb-3 text-xl font-semibold text-white">17. Contact Information</h2>
            <p className="mb-3">
              If you have any questions, concerns, or complaints about these Terms, please contact us at:
            </p>
            <div className="rounded-2xl border border-white/12 bg-white/5 p-5">
              <p className="mb-2 font-semibold text-white">BitForge Technologies Pvt. Ltd.</p>
              <p className="mb-1 text-white/80">Email: <span className="text-cyan-300">legal@bittforge.in</span></p>
              <p className="mb-1 text-white/80">Support: <span className="text-cyan-300">support@bittforge.in</span></p>
              <p className="mb-1 text-white/80">Address: Pune, Maharashtra, India</p>
              <p className="text-white/80">Business Hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
            </div>
          </section>

          {/* Additional Provisions */}
          <section className="mt-10 border-t border-white/10 pt-8">
            <h2 className="mb-3 text-xl font-semibold text-white">Additional Provisions</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Severability</h3>
            <p className="mb-3">
              If any provision of these Terms is found to be unenforceable or invalid, that provision
              will be limited or eliminated to the minimum extent necessary so that these Terms will
              otherwise remain in full force and effect.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Waiver</h3>
            <p className="mb-3">
              Our failure to enforce any right or provision of these Terms will not be considered a
              waiver of those rights. Any waiver must be in writing and signed by an authorized
              representative of BitForge.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Assignment</h3>
            <p className="mb-3">
              You may not assign or transfer these Terms or your account without our prior written
              consent. We may assign these Terms at any time without notice to you.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Entire Agreement</h3>
            <p className="mb-3">
              These Terms, together with our Privacy Policy, Refund &amp; Cancellation Policy, and any
              other legal notices or policies published by us on the Platform, constitute the entire
              agreement between you and BitForge regarding the use of the Platform.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Force Majeure</h3>
            <p className="mb-3">
              BitForge shall not be liable for any failure or delay in performance due to circumstances
              beyond our reasonable control, including acts of God, war, terrorism, riots, embargoes,
              acts of civil or military authorities, fire, floods, accidents, network infrastructure
              failures, strikes, or shortages of transportation facilities, fuel, energy, labor, or
              materials.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">Notices</h3>
            <p className="mb-3">
              We may provide notices to you via email, regular mail, or postings on the Platform.
              Notices to BitForge should be sent to <span className="text-cyan-300">legal@bittforge.in</span>.
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
              <Link href="/legal/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/legal/refund-cancellation-policy" className="hover:text-white">
                Refund Policy
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
