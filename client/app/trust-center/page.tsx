import Link from "next/link";
import DynamicHeader from "@/app/components/DynamicHeader";
import { BackButton } from "./BackButton";
import { Lock, Shield, Check } from "lucide-react";

export const metadata = {
  title: "Trust Center | BitForge",
  description: "Learn how BitForge protects your data, ensures platform security, and maintains trust through transparency and compliance.",
};

import { getGlobalLegalDates } from "@/lib/getGlobalSettings";

export default async function TrustCenterPage() {
  const dates = await getGlobalLegalDates("trust-center");
  const lastUpdatedDate = dates?.legalLastUpdatedDate || "Feb 7, 2026";

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white overflow-x-hidden">
      <DynamicHeader title="Trust Center" />

      {/* BACKGROUND GLOW — dark mode only */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60 hidden dark:block">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-20 md:pb-28">

        {/* HERO */}
        <section className="mb-6 max-w-4xl pt-2">
          <h1 className="text-3xl font-black tracking-tight leading-tight sm:text-4xl md:text-5xl text-slate-900 dark:text-white mb-1">
            Security, privacy, and compliance
            <span className="mt-1 block bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 bg-clip-text text-transparent leading-tight pb-0.5 dark:from-cyan-400 dark:via-sky-400 dark:to-indigo-400">
              built into everything we do
            </span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-white/60 mb-3">
            <strong className="text-slate-700 dark:text-white/80">Last Updated:</strong> {lastUpdatedDate}
          </p>
          <p className="text-sm text-slate-600 dark:text-white/70 sm:text-base leading-relaxed max-w-3xl">
            BitForge is committed to maintaining the highest standards of security, privacy, and platform
            integrity. This Trust Center provides transparency into our security practices, compliance
            posture, and ongoing efforts to protect our community.
          </p>
        </section>

        {/* TRUST PILLARS */}
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-transparent dark:bg-gradient-to-b dark:from-emerald-500/10 dark:to-cyan-500/10 p-5 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
              <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </div>
            <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">Security First</h3>
            <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
              End-to-end encryption, regular security audits, and proactive threat monitoring to protect
              your data and transactions.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-200 dark:border-cyan-400/30 bg-cyan-50 dark:bg-transparent dark:bg-gradient-to-b dark:from-cyan-500/10 dark:to-indigo-500/10 p-5 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-500/20">
              <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" strokeWidth={2.5} />
            </div>
            <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">Privacy by Design</h3>
            <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
              DPDP Act and GDPR-compliant data handling with minimal collection, transparent use, and
              user control over personal information.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-400/30 bg-indigo-50 dark:bg-transparent dark:bg-gradient-to-b dark:from-indigo-500/10 dark:to-purple-500/10 p-5 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
              <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={3} />
            </div>
            <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">Regulatory Compliance</h3>
            <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
              Adherence to Indian laws, international standards, and industry best practices for digital
              commerce and data protection.
            </p>
          </div>
        </section>

        {/* NAVIGATION */}
        <section className="mb-6 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-4 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-white/60">
            Quick Navigation
          </h2>
          <nav className="grid gap-2 text-sm text-slate-600 dark:text-white/70 sm:grid-cols-2 lg:grid-cols-3">
            <a href="#security"      className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">Security &amp; Infrastructure</a>
            <a href="#privacy"       className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">Data Privacy</a>
            <a href="#payments"      className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">Payment Security</a>
            <a href="#verification"  className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">Seller Verification</a>
            <a href="#compliance"    className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">Compliance &amp; Certifications</a>
            <a href="#incident"      className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">Incident Response</a>
            <a href="#transparency"  className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">Transparency &amp; Reporting</a>
            <a href="#best-practices" className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">Security Best Practices</a>
            <a href="#contact"       className="hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors font-medium">Security Contact</a>
          </nav>
        </section>

        {/* CONTENT */}
        <div className="space-y-10">

          {/* Security & Infrastructure */}
          <section id="security" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Security &amp; Infrastructure</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Application Security</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using TLS 1.3 with 256-bit encryption.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Encryption at Rest:</strong> Sensitive data (passwords, payment details, personal information) is encrypted at rest using AES-256 encryption.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Password Security:</strong> User passwords are hashed using bcrypt with salt, never stored in plain text.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Session Management:</strong> Secure session tokens with automatic expiry and IP binding to prevent session hijacking.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">API Security:</strong> Rate limiting, authentication tokens, and request validation to prevent abuse.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Infrastructure Security</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Cloud Hosting:</strong> Hosted on enterprise-grade cloud infrastructure (AWS/Google Cloud) with SOC 2 Type II compliance.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">DDoS Protection:</strong> Multi-layer DDoS mitigation to ensure platform availability during attacks.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Firewalls &amp; Network Security:</strong> Web application firewall (WAF) and intrusion detection systems (IDS) monitoring all traffic.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Database Security:</strong> Isolated database clusters with access controls, regular backups, and point-in-time recovery.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Vulnerability Scanning:</strong> Automated daily scans for known vulnerabilities and misconfigurations.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Security Testing &amp; Audits</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Penetration Testing:</strong> Planned quarterly security penetration tests conducted by independent third-party firms.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Code Reviews:</strong> Mandatory security code reviews for all production deployments.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Dependency Scanning:</strong> Automated scanning of open-source dependencies for known security vulnerabilities.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Bug Bounty Program:</strong> We welcome responsible disclosure of security vulnerabilities (details below).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Privacy */}
          <section id="privacy" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Data Privacy &amp; Protection</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Privacy Principles</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">We follow privacy-by-design principles in all product development:</p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Data Minimization:</strong> We collect only the data necessary to provide our services.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Purpose Limitation:</strong> Data is used only for the purposes disclosed at collection.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Transparency:</strong> Clear, accessible privacy notices explaining our data practices.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">User Control:</strong> You can access, correct, delete, or export your data at any time.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Security:</strong> Appropriate technical and organizational measures protect your data.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Compliance Framework</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">DPDP Act 2023 (India):</strong> Full compliance with India&apos;s Digital Personal Data Protection Act, including Grievance Officer appointment and user rights mechanisms.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">GDPR (EU):</strong> GDPR-compliant for European users, including lawful basis documentation and data transfer safeguards.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Data Residency:</strong> Primary data storage in India; cross-border transfers use standard contractual clauses.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Third-Party Vendors:</strong> All service providers undergo privacy and security assessments and sign data processing agreements.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Your Privacy Rights</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">You have the right to:</p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Access a copy of your personal data;</li>
                  <li>Correct inaccurate or incomplete data;</li>
                  <li>Request deletion of your data (subject to legal retention requirements);</li>
                  <li>Export your data in a portable format;</li>
                  <li>Opt out of marketing communications;</li>
                  <li>Lodge complaints with our Grievance Officer or data protection authorities.</li>
                </ul>
                <p className="mt-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  Exercise your rights by contacting{" "}
                  <a href="mailto:privacy@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">privacy@bittforge.in</a>.
                  See our{" "}
                  <Link href="/legal/privacy-policy" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">Privacy Policy</Link>{" "}
                  for details.
                </p>
              </div>
            </div>
          </section>

          {/* Payment Security */}
          <section id="payments" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Payment Security</h2>
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/5 p-5">
                <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed">
                  <strong className="text-emerald-700 dark:text-emerald-300">Zero Storage of Payment Credentials:</strong> BitForge
                  never stores your credit card, debit card, or bank account details. All payment processing
                  is handled by PCI DSS Level 1 certified payment processors.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Payment Processing Partners</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Razorpay:</strong> Primary payment gateway for India (PCI DSS Level 1 compliant, RBI authorized).</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Stripe:</strong> Secondary payment processor for international transactions (PCI DSS Level 1 compliant).</li>
                  <li><strong className="text-slate-700 dark:text-white/80">UPI &amp; Net Banking:</strong> Direct bank integrations secured by partner gateways.</li>
                </ul>
                <p className="mt-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  Payment credentials are tokenized and encrypted by payment processors. BitForge receives
                  only transaction confirmations and masked card details (e.g., &quot;XXXX-XXXX-XXXX-1234&quot;).
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Fraud Prevention</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Real-Time Fraud Detection:</strong> Machine learning models analyze transactions for suspicious patterns.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">3D Secure Authentication:</strong> Additional verification layer (OTP, biometric) for card transactions.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Velocity Checks:</strong> Automated limits on transaction frequency and amounts to prevent abuse.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Chargeback Monitoring:</strong> Proactive monitoring and dispute management to protect buyers and sellers.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">IP &amp; Device Fingerprinting:</strong> Detection of anomalous access patterns and account takeover attempts.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Payout Security for Sellers</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Mandatory KYC verification before first payout;</li>
                  <li>Bank account verification via penny drop or Aadhaar linkage;</li>
                  <li>Automated holds on suspicious seller accounts;</li>
                  <li>Secure payout processing through verified banking channels;</li>
                  <li>Transaction audit trails for compliance and dispute resolution.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Seller Verification */}
          <section id="verification" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Seller Verification &amp; Trust</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Seller Onboarding Process</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">All Sellers undergo a multi-step verification process:</p>
                <ol className="ml-6 list-decimal space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Identity Verification:</strong> Government-issued ID (Aadhaar, PAN, passport) verification via third-party KYC providers.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Business Verification:</strong> For registered businesses, GST number and business registration documents are verified.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Bank Account Verification:</strong> Micro-deposit verification or Aadhaar-linked bank verification.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Product Review:</strong> Initial product listings are manually reviewed for compliance with content policies.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Ongoing Monitoring:</strong> Continuous monitoring of seller behavior, product quality, and customer feedback.</li>
                </ol>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Content Moderation</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Automated Scanning:</strong> AI-powered content analysis to detect prohibited items, malware, and policy violations.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Human Review:</strong> Dedicated moderation team reviews flagged content and user reports.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Virus Scanning:</strong> All uploaded files scanned for malware and viruses before being made available for download.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Intellectual Property Protection:</strong> DMCA compliance and proactive detection of copyright violations.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Trust Signals for Buyers</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">We provide transparency to help buyers make informed decisions:</p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Verified seller badges for KYC-completed sellers;</li>
                  <li>Seller ratings and reviews from verified purchases;</li>
                  <li>Total sales and customer satisfaction metrics;</li>
                  <li>Product update history and support responsiveness;</li>
                  <li>Clear refund policies and support contact information.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Compliance */}
          <section id="compliance" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Compliance &amp; Certifications</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Regulatory Compliance</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Digital Personal Data Protection Act (DPDP), 2023:</strong> Compliance with India&apos;s primary data protection law, including Grievance Officer designation and data rights management.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Information Technology Act, 2000:</strong> Adherence to intermediary guidelines and digital signature requirements.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Consumer Protection Act, 2019:</strong> E-commerce rules compliance, including transparent pricing and complaint redressal.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">RBI Guidelines:</strong> Compliance with payment system regulations and KYC norms for financial transactions.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">GST Compliance:</strong> Automated GST calculation, invoice generation, and reporting for sellers.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">GDPR (EU Residents):</strong> Lawful basis for processing, data subject rights, and international transfer safeguards.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Industry Standards</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">ISO 27001 (In Progress):</strong> Working towards information security management system certification.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">SOC 2 Type II:</strong> Our cloud infrastructure partners maintain SOC 2 Type II compliance.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">PCI DSS:</strong> Payment processors are PCI DSS Level 1 compliant; BitForge operates as a PCI DSS compliant merchant.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">OWASP Top 10:</strong> Security controls aligned with OWASP guidelines for web application security.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Third-Party Assessments</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Planned quarterly penetration testing by certified security firms;</li>
                  <li>Annual compliance audits by independent auditors (phased rollout);</li>
                  <li>Ongoing vulnerability assessments and remediation;</li>
                  <li>Security vendor risk assessments for all critical service providers.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Incident Response */}
          <section id="incident" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Incident Response &amp; Business Continuity</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Security Incident Response Plan</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">We maintain a formal incident response plan that includes:</p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Detection &amp; Analysis:</strong> 24/7 security monitoring and automated alerting for anomalous activity.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Containment:</strong> Immediate isolation of affected systems to prevent spread of security incidents.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Eradication &amp; Recovery:</strong> Root cause analysis, vulnerability patching, and system restoration.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Communication:</strong> Transparent notification to affected users within 72 hours of confirmed data breaches (as required by DPDP Act).</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Post-Incident Review:</strong> Comprehensive analysis and implementation of preventive measures.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Data Breach Protocol</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">In the event of a data breach:</p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>We will assess the scope and impact within 24–48 hours;</li>
                  <li>Notify the Data Protection Board of India (as required by DPDP Act);</li>
                  <li>Notify affected users via email with details of the breach and remediation steps;</li>
                  <li>Provide identity theft protection services if sensitive data is compromised;</li>
                  <li>Publish a public incident report (if material) on this Trust Center.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Business Continuity &amp; Disaster Recovery</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">High Availability:</strong> Multi-region deployment with automatic failover for 99.9% uptime.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Data Backups:</strong> Automated daily backups with point-in-time recovery up to 30 days.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Geographic Redundancy:</strong> Data replicated across multiple data centers in different geographic locations.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Recovery Time Objective (RTO):</strong> Target recovery within 4 hours for critical services.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Recovery Point Objective (RPO):</strong> Maximum data loss of 1 hour for critical data.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Transparency */}
          <section id="transparency" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Transparency &amp; Reporting</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Security Transparency</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">We believe in radical transparency about our security practices:</p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Public disclosure of security audits and certifications (where applicable);</li>
                  <li>Regular security posture reports published on this page;</li>
                  <li>Transparent incident reporting with root cause analysis;</li>
                  <li>Open source contributions to security tools and libraries;</li>
                  <li>Participation in industry security communities and knowledge sharing.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Platform Metrics (Updated Monthly)</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">99.9%</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-white/60">Platform Uptime (Last 90 Days)</p>
                  </div>
                  <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">&lt; 72h</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-white/60">Average Incident Response Time</p>
                  </div>
                  <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">100%</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-white/60">Seller KYC Verification Rate</p>
                  </div>
                  <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">0</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-white/60">Confirmed Data Breaches (All Time)</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Compliance Reports</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">Available upon request for enterprise customers and partners:</p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>SOC 2 Type II report (from infrastructure partners);</li>
                  <li>Penetration testing executive summaries;</li>
                  <li>Data processing agreements and standard contractual clauses;</li>
                  <li>Security questionnaires and vendor assessments;</li>
                  <li>Compliance attestation letters.</li>
                </ul>
                <p className="mt-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  Request reports at{" "}
                  <a href="mailto:compliance@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">compliance@bittforge.in</a>{" "}
                  with your business details and intended use.
                </p>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section id="best-practices" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Security Best Practices for Users</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">For All Users</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Use Strong Passwords:</strong> Create unique passwords with at least 12 characters, including uppercase, lowercase, numbers, and symbols.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Enable Two-Factor Authentication (2FA):</strong> Add an extra layer of security to your account (coming soon).</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Verify Email Communications:</strong> Always check that emails claiming to be from BitForge come from @bittforge.in addresses.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Keep Software Updated:</strong> Ensure your browser and operating system are up to date with the latest security patches.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Use Secure Networks:</strong> Avoid accessing your account on public Wi-Fi without a VPN.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Monitor Account Activity:</strong> Regularly review your transaction history and report suspicious activity immediately.</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Log Out on Shared Devices:</strong> Always log out when using BitForge on public or shared computers.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">For Buyers</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Verify seller ratings and reviews before purchasing;</li>
                  <li>Read product descriptions and system requirements carefully;</li>
                  <li>Download products from official BitForge links only;</li>
                  <li>Scan downloaded files with antivirus software before opening;</li>
                  <li>Report suspicious products or sellers to our support team.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">For Sellers</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Complete KYC verification to build trust with buyers;</li>
                  <li>Upload only products you own or have rights to sell;</li>
                  <li>Scan all uploaded files for malware before listing;</li>
                  <li>Provide accurate product descriptions and support information;</li>
                  <li>Respond promptly to buyer inquiries and support requests;</li>
                  <li>Keep your payout information and tax details up to date.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-500/5 p-5">
                <h3 className="mb-2 text-base font-bold text-amber-800 dark:text-amber-200">⚠ Recognizing Phishing &amp; Scams</h3>
                <p className="mb-2 text-sm text-slate-700 dark:text-white/70 leading-relaxed">
                  BitForge will <strong>NEVER</strong>:
                </p>
                <ul className="ml-6 list-disc space-y-1 text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Ask for your password via email or phone;</li>
                  <li>Request credit card details outside of our secure payment flow;</li>
                  <li>Send you unsolicited links asking you to verify your account;</li>
                  <li>Threaten account suspension without prior policy violations;</li>
                  <li>Ask you to make payments via wire transfer or cryptocurrency.</li>
                </ul>
                <p className="mt-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  If you receive suspicious communications claiming to be from BitForge, forward them to{" "}
                  <a href="mailto:security@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">security@bittforge.in</a>{" "}
                  immediately.
                </p>
              </div>
            </div>
          </section>

          {/* Responsible Disclosure */}
          <section id="disclosure" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Responsible Security Disclosure</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Bug Bounty Program</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  We welcome security researchers and ethical hackers to help us identify vulnerabilities.
                  If you discover a security issue, we encourage responsible disclosure.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/5 p-5">
                <h3 className="mb-3 text-base font-bold text-emerald-800 dark:text-white">How to Report a Vulnerability</h3>
                <p className="mb-3 text-sm text-slate-700 dark:text-white/80 leading-relaxed">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:security@bittforge.in" className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">security@bittforge.in</a>
                </p>
                <p className="mb-2 text-sm text-slate-700 dark:text-white/80">Include in your report:</p>
                <ul className="ml-6 list-disc space-y-1 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Detailed description of the vulnerability;</li>
                  <li>Steps to reproduce the issue;</li>
                  <li>Potential impact and severity assessment;</li>
                  <li>Proof of concept (if applicable);</li>
                  <li>Your contact information for follow-up;</li>
                  <li>Any suggested remediation steps.</li>
                </ul>
                <p className="mt-4 text-sm text-slate-700 dark:text-white/80"><strong>Response Timeline:</strong></p>
                <ul className="ml-6 list-disc space-y-1 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Acknowledgment within 48 hours;</li>
                  <li>Initial assessment within 5 business days;</li>
                  <li>Regular updates on remediation progress;</li>
                  <li>Resolution timeline based on severity (critical issues within 72 hours).</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Responsible Disclosure Guidelines</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">We ask that security researchers:</p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Report vulnerabilities privately before public disclosure;</li>
                  <li>Give us reasonable time to investigate and remediate (90 days for non-critical, 30 days for critical);</li>
                  <li>Do not access, modify, or delete user data without explicit permission;</li>
                  <li>Do not perform actions that could harm platform availability (e.g., DDoS testing);</li>
                  <li>Do not exploit vulnerabilities for personal gain or to harm users;</li>
                  <li>Comply with all applicable laws and regulations.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Recognition &amp; Rewards</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                  <li><strong className="text-slate-700 dark:text-white/80">Hall of Fame:</strong> Public recognition on this page for responsible disclosure (with your permission).</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Bounty Rewards:</strong> Monetary rewards for qualifying vulnerabilities based on severity (program details coming soon).</li>
                  <li><strong className="text-slate-700 dark:text-white/80">Direct Communication:</strong> Opportunity to work directly with our security team on remediation.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-white/90">Out of Scope</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">The following are <strong>not</strong> eligible for bounty rewards:</p>
                <ul className="ml-6 list-disc space-y-1 text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                  <li>Denial of service (DoS/DDoS) attacks;</li>
                  <li>Social engineering attacks against BitForge employees;</li>
                  <li>Physical attacks against BitForge infrastructure;</li>
                  <li>Reports from automated scanners without validation;</li>
                  <li>Known issues already reported or publicly disclosed;</li>
                  <li>Issues in third-party services not under BitForge control;</li>
                  <li>Missing security headers without demonstrated impact;</li>
                  <li>Self-XSS or issues requiring significant user interaction;</li>
                  <li>Vulnerabilities in deprecated or EOL software versions clearly marked as unsupported.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className="border-t border-slate-200 dark:border-white/10 pt-10 scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Security Contact Information</h2>
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-5 sm:p-6 shadow-sm">
                <p className="mb-5 font-bold text-slate-900 dark:text-white">Security Team Contacts</p>
                <div className="space-y-4 text-sm divide-y divide-slate-100 dark:divide-white/10">
                  {[
                    {
                      title: "Security Vulnerabilities & Bug Reports",
                      email: "security@bittforge.in",
                      note: "Use for: Vulnerability disclosure, security bugs, penetration test findings",
                    },
                    {
                      title: "Privacy & Data Protection",
                      email: "privacy@bittforge.in",
                      note: "Use for: Data access requests, privacy concerns, GDPR/DPDP queries",
                    },
                    {
                      title: "Grievance Officer (DPDP Act)",
                      email: "grievance@bittforge.in",
                      note: "Use for: Formal complaints, data rights escalation, regulatory concerns",
                    },
                    {
                      title: "Compliance & Legal",
                      email: "compliance@bittforge.in",
                      note: "Use for: Compliance reports, legal requests, audit inquiries",
                    },
                    {
                      title: "General Support",
                      email: "support@bittforge.in",
                      note: "Use for: Account issues, transaction problems, general inquiries",
                    },
                  ].map((item) => (
                    <div key={item.email} className="pt-4 first:pt-0">
                      <p className="mb-1 font-semibold text-slate-800 dark:text-white/90">{item.title}</p>
                      <p className="text-slate-600 dark:text-white/70">
                        Email:{" "}
                        <a href={`mailto:${item.email}`} className="font-medium text-indigo-600 dark:text-cyan-300 hover:underline">
                          {item.email}
                        </a>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-white/50 mt-0.5">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-white/90">PGP Public Key (Coming Soon)</p>
                <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                  For encrypted communications, our PGP public key will be available here. In the meantime,
                  sensitive information can be shared via encrypted email or secure file transfer upon request.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-white/90">Business Address</p>
                <p className="text-sm text-slate-600 dark:text-white/70">BitForge Technologies Pvt. Ltd.</p>
                <p className="text-sm text-slate-600 dark:text-white/70">Pune, Maharashtra, India</p>
              </div>
            </div>
          </section>

          {/* Last Updated */}
          <section className="border-t border-slate-200 dark:border-white/10 pt-8">
            <p className="text-xs text-slate-500 dark:text-white/60">
              <strong>Trust Center Last Updated:</strong> {lastUpdatedDate}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-white/60 leading-relaxed">
              This page is updated regularly as we improve our security posture and introduce new trust
              initiatives. Material changes will be highlighted at the top of this page.
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
              <Link href="/legal/refund-cancellation-policy" className="font-medium hover:text-indigo-600 dark:hover:text-white transition-colors">
                Refund Policy
              </Link>
              <Link href="/contact" className="font-medium hover:text-indigo-600 dark:hover:text-white transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
