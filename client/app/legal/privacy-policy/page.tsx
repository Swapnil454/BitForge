import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy | BitForge",
  description: "Privacy Policy explaining how BitForge collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-white/60">
            <strong className="text-white/80">Effective Date:</strong> January 1, 2026
            <span className="mx-3">·</span>
            <strong className="text-white/80">Last Updated:</strong> February 1, 2026 (Platform launch &amp; payment integration update)
          </p>
          <p className="mt-3 text-sm text-white/70">
            At BitForge, we respect your privacy and are committed to protecting your personal information.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you use our Platform.
          </p>
        </section>

        {/* TABLE OF CONTENTS */}
        <section className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">
            Table of Contents
          </h2>
          <nav className="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
            <a href="#introduction" className="hover:text-cyan-300">1. Introduction</a>
            <a href="#information-collect" className="hover:text-cyan-300">2. Information We Collect</a>
            <a href="#how-we-use" className="hover:text-cyan-300">3. How We Use Your Information</a>
            <a href="#how-we-share" className="hover:text-cyan-300">4. How We Share Information</a>
            <a href="#cookies" className="hover:text-cyan-300">5. Cookies and Tracking</a>
            <a href="#data-retention" className="hover:text-cyan-300">6. Data Retention</a>
            <a href="#data-security" className="hover:text-cyan-300">7. Data Security</a>
            <a href="#your-rights" className="hover:text-cyan-300">8. Your Privacy Rights</a>
            <a href="#children" className="hover:text-cyan-300">9. Children&apos;s Privacy</a>
            <a href="#international" className="hover:text-cyan-300">10. International Transfers</a>
            <a href="#third-party" className="hover:text-cyan-300">11. Third-Party Services</a>
            <a href="#changes" className="hover:text-cyan-300">12. Changes to This Policy</a>
            <a href="#contact" className="hover:text-cyan-300">13. Contact Us</a>
          </nav>
        </section>

        {/* CONTENT */}
        <div className="prose prose-invert max-w-none space-y-10 text-sm text-white/70">
          {/* 1. Introduction */}
          <section id="introduction">
            <h2 className="mb-3 text-xl font-semibold text-white">1. Introduction</h2>
            <p className="mb-3">
              BitForge Technologies Pvt. Ltd. (&quot;BitForge,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates a digital
              marketplace platform. This Privacy Policy applies to all users of our website, applications,
              and services (collectively, the &quot;Platform&quot;).
            </p>
            <p className="mb-3">
              By accessing or using the Platform, you acknowledge that you have read and understood this
              Privacy Policy and consent to our collection, use, and disclosure of your information as
              described herein.
            </p>
            <p>
              If you do not agree with this Privacy Policy, please do not access or use the Platform.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section id="information-collect">
            <h2 className="mb-3 text-xl font-semibold text-white">2. Information We Collect</h2>
            <p className="mb-3">
              We collect various types of information in connection with your use of the Platform:
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">2.1 Information You Provide</h3>
            <p className="mb-3">
              When you create an account, make a purchase, or communicate with us, you may provide:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Account Information:</strong> Name, email address, username, password, and profile information;</li>
              <li><strong className="text-white/90">Contact Information:</strong> Phone number, mailing address, and other contact details;</li>
              <li><strong className="text-white/90">Payment Information:</strong> Credit card details, bank account information, UPI IDs, and billing address (processed securely through third-party payment processors);</li>
              <li><strong className="text-white/90">Seller Information:</strong> Business name, tax identification numbers (GST, PAN), payout preferences, and identity verification documents;</li>
              <li><strong className="text-white/90">Communications:</strong> Messages, support tickets, reviews, and other communications with us or other users;</li>
              <li><strong className="text-white/90">Content:</strong> Product listings, descriptions, images, files, and other content you upload to the Platform.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">2.2 Information Collected Automatically</h3>
            <p className="mb-3">
              When you use the Platform, we automatically collect certain information:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Device Information:</strong> IP address, browser type, operating system, device identifiers, and mobile network information;</li>
              <li><strong className="text-white/90">Usage Data:</strong> Pages viewed, time spent on pages, links clicked, search queries, and interaction with features;</li>
              <li><strong className="text-white/90">Location Information:</strong> Approximate geographic location based on your IP address;</li>
              <li><strong className="text-white/90">Cookies and Similar Technologies:</strong> We use cookies, web beacons, and similar technologies to track activity and store information (see Section 5).</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">2.3 Information from Third Parties</h3>
            <p className="mb-3">
              We may receive information about you from third-party sources:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">OAuth Providers:</strong> If you sign in using Google or other OAuth services, we receive your name, email, and profile information;</li>
              <li><strong className="text-white/90">Payment Processors:</strong> Transaction details, payment status, and fraud detection information from Razorpay and other payment providers;</li>
              <li><strong className="text-white/90">Analytics Services:</strong> Aggregated usage statistics and demographic information from analytics providers;</li>
              <li><strong className="text-white/90">Verification Services:</strong> Identity verification, KYC data, and background checks for Sellers.</li>
            </ul>
          </section>

          {/* 3. How We Use Information */}
          <section id="how-we-use">
            <h2 className="mb-3 text-xl font-semibold text-white">3. How We Use Your Information</h2>
            <p className="mb-3">
              We use the collected information for the following purposes:
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.1 Provide and Improve Services</h3>
            <ul className="ml-6 list-disc space-y-2">
              <li>Process transactions and deliver digital products;</li>
              <li>Create and manage your account;</li>
              <li>Facilitate communication between Buyers and Sellers;</li>
              <li>Provide customer support and respond to inquiries;</li>
              <li>Improve, personalize, and optimize the Platform experience;</li>
              <li>Develop new features and services.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.2 Safety and Security</h3>
            <ul className="ml-6 list-disc space-y-2">
              <li>Detect, prevent, and address fraud, abuse, and security issues;</li>
              <li>Verify identity and conduct KYC checks for Sellers;</li>
              <li>Monitor and analyze suspicious activity;</li>
              <li>Enforce our Terms &amp; Conditions and other policies;</li>
              <li>Resolve disputes and investigate complaints.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.3 Communications</h3>
            <ul className="ml-6 list-disc space-y-2">
              <li>Send transactional emails (order confirmations, receipts, account notifications);</li>
              <li>Send service updates, security alerts, and administrative messages;</li>
              <li>Respond to your questions and provide support;</li>
              <li>Send marketing communications (with your consent, where required);</li>
              <li>Conduct surveys and collect feedback.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.4 Legal Compliance</h3>
            <ul className="ml-6 list-disc space-y-2">
              <li>Comply with applicable laws, regulations, and legal processes;</li>
              <li>Respond to lawful requests from law enforcement and government authorities;</li>
              <li>Maintain records for tax, accounting, and regulatory purposes;</li>
              <li>Protect our rights, property, and safety, and those of our users;</li>
              <li>Enforce our agreements and resolve disputes.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">3.5 Analytics and Research</h3>
            <ul className="ml-6 list-disc space-y-2">
              <li>Analyze usage patterns and trends;</li>
              <li>Conduct market research and competitive analysis;</li>
              <li>Generate aggregated, anonymized statistics;</li>
              <li>Improve our algorithms and recommendation systems.</li>
            </ul>
          </section>

          {/* 4. How We Share Information */}
          <section id="how-we-share">
            <h2 className="mb-3 text-xl font-semibold text-white">4. How We Share Your Information</h2>
            <p className="mb-3">
              We may share your information in the following circumstances:
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.1 With Other Users</h3>
            <p className="mb-3">
              Certain information is visible to other users:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Sellers can see Buyer names and contact information for purchased orders;</li>
              <li>Public profiles, including username, bio, and listed products;</li>
              <li>Reviews and ratings you post on the Platform;</li>
              <li>Communications through our messaging system.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.2 With Service Providers</h3>
            <p className="mb-3">
              We share information with third-party service providers who perform services on our behalf:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Payment Processors:</strong> Razorpay, Stripe, and other payment gateways to process transactions;</li>
              <li><strong className="text-white/90">Cloud Hosting:</strong> AWS, Google Cloud, or similar providers for infrastructure;</li>
              <li><strong className="text-white/90">Email Services:</strong> SendGrid, Mailgun, or similar for transactional and marketing emails;</li>
              <li><strong className="text-white/90">Analytics:</strong> Google Analytics, Mixpanel, or similar for usage analysis;</li>
              <li><strong className="text-white/90">Customer Support:</strong> Help desk and support ticketing platforms;</li>
              <li><strong className="text-white/90">Identity Verification:</strong> KYC and fraud detection services for Seller verification.</li>
            </ul>
            <p className="mt-3">
              These service providers are contractually obligated to use your information only for the
              purposes we specify and to maintain appropriate security measures.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.3 For Legal Reasons</h3>
            <p className="mb-3">
              We may disclose your information if required by law or in good faith belief that such action is necessary to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Comply with legal obligations, court orders, or government requests;</li>
              <li>Enforce our Terms &amp; Conditions and other agreements;</li>
              <li>Protect the rights, property, or safety of BitForge, our users, or the public;</li>
              <li>Investigate fraud, security issues, or technical problems;</li>
              <li>Defend against legal claims.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.4 Business Transfers</h3>
            <p className="mb-3">
              In the event of a merger, acquisition, reorganization, sale of assets, or bankruptcy, your
              information may be transferred to the successor entity. We will notify you of any such
              change and any choices you may have regarding your information.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.5 With Your Consent</h3>
            <p className="mb-3">
              We may share your information with third parties when you give us explicit consent to do so.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">4.6 Aggregated and Anonymized Data</h3>
            <p className="mb-3">
              We may share aggregated, anonymized, or de-identified data that cannot reasonably be used to
              identify you for research, marketing, analytics, or other purposes.
            </p>
          </section>

          {/* 5. Cookies and Tracking */}
          <section id="cookies">
            <h2 className="mb-3 text-xl font-semibold text-white">5. Cookies and Tracking Technologies</h2>
            
            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">5.1 What Are Cookies?</h3>
            <p className="mb-3">
              Cookies are small text files placed on your device by websites you visit. We use cookies and
              similar technologies (web beacons, pixels, local storage) to enhance your experience and
              collect information about how you use the Platform.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">5.2 Types of Cookies We Use</h3>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Strictly Necessary Cookies:</strong> Required for the Platform to function (authentication, security, load balancing);</li>
              <li><strong className="text-white/90">Functional Cookies:</strong> Remember your preferences, settings, and choices;</li>
              <li><strong className="text-white/90">Performance Cookies:</strong> Collect anonymous usage data to help us improve the Platform;</li>
              <li><strong className="text-white/90">Analytics Cookies:</strong> Help us understand how users interact with the Platform (Google Analytics, etc.);</li>
              <li><strong className="text-white/90">Advertising Cookies:</strong> Deliver relevant ads and measure campaign effectiveness (with your consent).</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">5.3 Managing Cookies</h3>
            <p className="mb-3">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Block or delete cookies through your browser settings;</li>
              <li>Opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" className="text-cyan-300 hover:text-cyan-200" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>;</li>
              <li>Manage cookie preferences through your account settings on the Platform.</li>
            </ul>
            <p className="mt-3">
              Please note that disabling certain cookies may limit your ability to use some features of
              the Platform.
            </p>
          </section>

          {/* 6. Data Retention */}
          <section id="data-retention">
            <h2 className="mb-3 text-xl font-semibold text-white">6. Data Retention</h2>
            <p className="mb-3">
              We retain your information for as long as necessary to fulfill the purposes outlined in this
              Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
            <p className="mb-3">
              Retention periods vary depending on the type of information:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Account Information:</strong> Retained while your account is active and for a reasonable period thereafter;</li>
              <li><strong className="text-white/90">Transaction Records:</strong> Retained for at least 7 years for tax and accounting purposes;</li>
              <li><strong className="text-white/90">Communications:</strong> Retained for as long as necessary to provide support and resolve disputes;</li>
              <li><strong className="text-white/90">Analytics Data:</strong> May be retained indefinitely in aggregated, anonymized form;</li>
              <li><strong className="text-white/90">Legal Hold:</strong> Information subject to legal proceedings is retained until the matter is resolved.</li>
            </ul>
            <p className="mt-3">
              When we no longer need your information, we will securely delete or anonymize it in
              accordance with our data retention policies.
            </p>
          </section>

          {/* 7. Data Security */}
          <section id="data-security">
            <h2 className="mb-3 text-xl font-semibold text-white">7. Data Security</h2>
            <p className="mb-3">
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="mb-3">
              Our security measures include:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Encryption of data in transit using SSL/TLS;</li>
              <li>Encryption of sensitive data at rest;</li>
              <li>Regular security audits and vulnerability assessments;</li>
              <li>Access controls and authentication mechanisms;</li>
              <li>Employee training on data protection and security best practices;</li>
              <li>Secure development practices and code reviews;</li>
              <li>Monitoring and logging of system activity;</li>
              <li>Incident response procedures.</li>
            </ul>
            <p className="mt-3">
              However, no method of transmission over the Internet or electronic storage is 100% secure.
              While we strive to protect your information, we cannot guarantee its absolute security. You
              are responsible for maintaining the confidentiality of your account credentials.
            </p>
            <p className="mt-3">
              If you believe your account has been compromised, please contact us immediately at
              <span className="text-cyan-300"> security@bitforge.in</span>.
            </p>
          </section>

          {/* 8. Your Rights */}
          <section id="your-rights">
            <h2 className="mb-3 text-xl font-semibold text-white">8. Your Privacy Rights</h2>
            <p className="mb-3">
              Depending on your location and applicable law, you may have certain rights regarding your
              personal information:
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">8.1 Rights Under Indian Law</h3>
            <p className="mb-3">
              Under the Digital Personal Data Protection Act, 2023 (DPDP Act), Indian users have the right to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Access:</strong> Request confirmation of whether we process your personal data and obtain a copy;</li>
              <li><strong className="text-white/90">Correction:</strong> Request correction of inaccurate or incomplete personal data;</li>
              <li><strong className="text-white/90">Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements);</li>
              <li><strong className="text-white/90">Grievance Redressal:</strong> Lodge complaints with our Grievance Officer;</li>
              <li><strong className="text-white/90">Nominate:</strong> Nominate another individual to exercise your rights in case of death or incapacity.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">8.2 Additional Rights (GDPR and Other Jurisdictions)</h3>
            <p className="mb-3">
              If you are located in the European Economic Area, UK, or other jurisdictions with similar
              privacy laws, you may also have:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Right to Restriction:</strong> Request that we limit how we use your data;</li>
              <li><strong className="text-white/90">Right to Portability:</strong> Receive your data in a structured, machine-readable format;</li>
              <li><strong className="text-white/90">Right to Object:</strong> Object to our processing of your data for certain purposes;</li>
              <li><strong className="text-white/90">Right to Withdraw Consent:</strong> Withdraw consent at any time (where processing is based on consent);</li>
              <li><strong className="text-white/90">Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority.</li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">8.3 Exercising Your Rights</h3>
            <p className="mb-3">
              To exercise any of these rights, please contact us at <span className="text-cyan-300">privacy@bitforge.in</span>.
              We will respond to your request within 30 days (or as required by applicable law).
            </p>
            <p className="mb-3">
              We may need to verify your identity before processing your request. In some cases, we may be
              unable to fulfill your request due to legal obligations or legitimate business interests.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">8.4 Marketing Communications</h3>
            <p className="mb-3">
              You can opt out of marketing emails by:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Clicking the &quot;unsubscribe&quot; link in any marketing email;</li>
              <li>Adjusting your email preferences in your account settings;</li>
              <li>Contacting us at <span className="text-cyan-300">support@bitforge.in</span>.</li>
            </ul>
            <p className="mt-3">
              Please note that you cannot opt out of transactional or service-related communications
              (order confirmations, account notifications, security alerts).
            </p>
          </section>

          {/* 9. Children's Privacy */}
          <section id="children">
            <h2 className="mb-3 text-xl font-semibold text-white">9. Children&apos;s Privacy</h2>
            <p className="mb-3">
              The Platform is not intended for use by individuals under the age of 18. We do not knowingly
              collect personal information from children under 18.
            </p>
            <p className="mb-3">
              If you are a parent or guardian and believe that your child has provided us with personal
              information without your consent, please contact us at <span className="text-cyan-300">privacy@bitforge.in</span>.
              We will take steps to delete such information from our systems.
            </p>
            <p>
              By using the Platform, you represent and warrant that you are at least 18 years old.
            </p>
          </section>

          {/* 10. International Transfers */}
          <section id="international">
            <h2 className="mb-3 text-xl font-semibold text-white">10. International Data Transfers</h2>
            <p className="mb-3">
              BitForge is based in India. If you are accessing the Platform from outside India, please be
              aware that your information may be transferred to, stored, and processed in India or other
              countries where our service providers operate.
            </p>
            <p className="mb-3">
              These countries may have data protection laws that differ from those in your jurisdiction.
              By using the Platform, you consent to the transfer of your information to India and other
              countries.
            </p>
            <p className="mb-3">
              When we transfer personal data internationally, we implement appropriate safeguards such as:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Standard contractual clauses approved by regulatory authorities;</li>
              <li>Data processing agreements with service providers;</li>
              <li>Compliance with applicable data transfer frameworks;</li>
              <li>Technical and organizational security measures.</li>
            </ul>
          </section>

          {/* 11. Third-Party Services */}
          <section id="third-party">
            <h2 className="mb-3 text-xl font-semibold text-white">11. Third-Party Services and Links</h2>
            <p className="mb-3">
              The Platform may contain links to third-party websites, services, or applications that are
              not owned or controlled by BitForge. This Privacy Policy does not apply to such third-party
              services.
            </p>
            <p className="mb-3">
              We are not responsible for the privacy practices of third-party services. We encourage you to
              review the privacy policies of any third-party service before providing them with your
              information.
            </p>
            <p className="mb-3">
              Third-party services we integrate with include:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Payment Processors:</strong> Razorpay, Stripe (subject to their privacy policies);</li>
              <li><strong className="text-white/90">OAuth Providers:</strong> Google (for sign-in);</li>
              <li><strong className="text-white/90">Cloud Services:</strong> AWS, Google Cloud;</li>
              <li><strong className="text-white/90">Analytics:</strong> Google Analytics;</li>
              <li><strong className="text-white/90">Email Services:</strong> SendGrid.</li>
            </ul>
          </section>

          {/* 12. Changes to Policy */}
          <section id="changes">
            <h2 className="mb-3 text-xl font-semibold text-white">12. Changes to This Privacy Policy</h2>
            <p className="mb-3">
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technology, legal requirements, or other factors. When we make material changes, we will:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Update the &quot;Last Updated&quot; date at the top of this policy;</li>
              <li>Post the revised policy on the Platform;</li>
              <li>Send you an email notification (for material changes);</li>
              <li>Display a prominent notice on the Platform.</li>
            </ul>
            <p className="mt-3">
              Material changes will take effect 30 days after posting or notification. Your continued use
              of the Platform after the effective date constitutes acceptance of the revised Privacy
              Policy.
            </p>
            <p className="mt-3">
              We encourage you to review this Privacy Policy periodically to stay informed about how we
              protect your information.
            </p>
          </section>

          {/* 13. Contact Us */}
          <section id="contact">
            <h2 className="mb-3 text-xl font-semibold text-white">13. Contact Us</h2>
            <p className="mb-3">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data
              practices, please contact us:
            </p>
            <div className="rounded-2xl border border-white/12 bg-white/5 p-5">
              <p className="mb-3 font-semibold text-white">BitForge Technologies Pvt. Ltd.</p>
              
              <p className="mb-2 text-sm font-semibold text-white/80">Privacy Inquiries:</p>
              <p className="mb-1 text-white/70">Email: <span className="text-cyan-300">privacy@bitforge.in</span></p>
              
              <p className="mb-2 mt-4 text-sm font-semibold text-white/80">Grievance Officer (India - DPDP Act):</p>
              <p className="mb-1 text-white/70">Name: Data Protection Officer</p>
              <p className="mb-1 text-white/70">Email: <span className="text-cyan-300">grievance@bitforge.in</span></p>
              <p className="mb-1 text-white/70">Response Time: Within 30 days of receipt</p>
              
              <p className="mb-2 mt-4 text-sm font-semibold text-white/80">General Support:</p>
              <p className="mb-1 text-white/70">Email: <span className="text-cyan-300">support@bitforge.in</span></p>
              
              <p className="mt-4 text-white/70">Address: Pune, Maharashtra, India</p>
              <p className="text-white/70">Business Hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
            </div>
          </section>

          {/* Additional Information */}
          <section className="mt-10 border-t border-white/10 pt-8">
            <h2 className="mb-3 text-xl font-semibold text-white">Legal Basis for Processing (GDPR)</h2>
            <p className="mb-3">
              For users in the European Economic Area and UK, our legal bases for processing your personal
              data include:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong className="text-white/90">Contract Performance:</strong> Processing necessary to provide services you requested;</li>
              <li><strong className="text-white/90">Legitimate Interests:</strong> Processing for fraud prevention, security, and service improvement;</li>
              <li><strong className="text-white/90">Legal Obligation:</strong> Processing required to comply with legal and regulatory requirements;</li>
              <li><strong className="text-white/90">Consent:</strong> Processing based on your explicit consent (e.g., marketing communications).</li>
            </ul>
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
