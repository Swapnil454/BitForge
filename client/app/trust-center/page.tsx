import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Trust Center | BitForge",
  description: "Learn how BitForge protects your data, ensures platform security, and maintains trust through transparency and compliance.",
};

export default function TrustCenterPage() {
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
        <div className="absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-24 sm:pt-28 md:pt-32 md:pb-28">
        {/* HERO */}
        <section className="mb-12 max-w-4xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
              Trust Center
            </p>
            <span className="text-xs text-white/50 border border-white/10 rounded-full px-3 py-1">
              Last Updated: Feb 7, 2026
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Security, privacy, and compliance
            <span className="mt-1 block bg-linear-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent leading-tight pb-0.5">
              built into everything we do
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-white/70 sm:text-base">
            BitForge is committed to maintaining the highest standards of security, privacy, and platform
            integrity. This Trust Center provides transparency into our security practices, compliance
            posture, and ongoing efforts to protect our community.
          </p>
        </section>

        {/* TRUST PILLARS */}
        <section className="mb-14 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/30 bg-linear-to-b from-emerald-500/10 to-cyan-500/10 p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <span className="text-xl">🔒</span>
            </div>
            <h3 className="mb-2 text-base font-semibold text-white">Security First</h3>
            <p className="text-xs text-white/70">
              End-to-end encryption, regular security audits, and proactive threat monitoring to protect
              your data and transactions.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/30 bg-linear-to-b from-cyan-500/10 to-indigo-500/10 p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <span className="text-xl">🛡️</span>
            </div>
            <h3 className="mb-2 text-base font-semibold text-white">Privacy by Design</h3>
            <p className="text-xs text-white/70">
              DPDP Act and GDPR-compliant data handling with minimal collection, transparent use, and
              user control over personal information.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-400/30 bg-linear-to-b from-indigo-500/10 to-purple-500/10 p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
              <span className="text-xl">✓</span>
            </div>
            <h3 className="mb-2 text-base font-semibold text-white">Regulatory Compliance</h3>
            <p className="text-xs text-white/70">
              Adherence to Indian laws, international standards, and industry best practices for digital
              commerce and data protection.
            </p>
          </div>
        </section>

        {/* NAVIGATION */}
        <section className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">
            Quick Navigation
          </h2>
          <nav className="grid gap-2 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-3">
            <a href="#security" className="hover:text-cyan-300">Security & Infrastructure</a>
            <a href="#privacy" className="hover:text-cyan-300">Data Privacy</a>
            <a href="#payments" className="hover:text-cyan-300">Payment Security</a>
            <a href="#verification" className="hover:text-cyan-300">Seller Verification</a>
            <a href="#compliance" className="hover:text-cyan-300">Compliance & Certifications</a>
            <a href="#incident" className="hover:text-cyan-300">Incident Response</a>
            <a href="#transparency" className="hover:text-cyan-300">Transparency & Reporting</a>
            <a href="#best-practices" className="hover:text-cyan-300">Security Best Practices</a>
            <a href="#contact" className="hover:text-cyan-300">Security Contact</a>
          </nav>
        </section>

        {/* CONTENT */}
        <div className="space-y-14">
          {/* Security & Infrastructure */}
          <section id="security" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Security & Infrastructure</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Application Security</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Encryption in Transit:</strong> All data transmitted
                    between your device and our servers is encrypted using TLS 1.3 with 256-bit encryption.
                  </li>
                  <li>
                    <strong className="text-white/80">Encryption at Rest:</strong> Sensitive data (passwords,
                    payment details, personal information) is encrypted at rest using AES-256 encryption.
                  </li>
                  <li>
                    <strong className="text-white/80">Password Security:</strong> User passwords are hashed
                    using bcrypt with salt, never stored in plain text.
                  </li>
                  <li>
                    <strong className="text-white/80">Session Management:</strong> Secure session tokens with
                    automatic expiry and IP binding to prevent session hijacking.
                  </li>
                  <li>
                    <strong className="text-white/80">API Security:</strong> Rate limiting, authentication
                    tokens, and request validation to prevent abuse.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Infrastructure Security</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Cloud Hosting:</strong> Hosted on enterprise-grade
                    cloud infrastructure (AWS/Google Cloud) with SOC 2 Type II compliance.
                  </li>
                  <li>
                    <strong className="text-white/80">DDoS Protection:</strong> Multi-layer DDoS mitigation
                    to ensure platform availability during attacks.
                  </li>
                  <li>
                    <strong className="text-white/80">Firewalls & Network Security:</strong> Web application
                    firewall (WAF) and intrusion detection systems (IDS) monitoring all traffic.
                  </li>
                  <li>
                    <strong className="text-white/80">Database Security:</strong> Isolated database clusters
                    with access controls, regular backups, and point-in-time recovery.
                  </li>
                  <li>
                    <strong className="text-white/80">Vulnerability Scanning:</strong> Automated daily scans
                    for known vulnerabilities and misconfigurations.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Security Testing & Audits</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Penetration Testing:</strong> Planned quarterly security
                    penetration tests conducted by independent third-party firms.
                  </li>
                  <li>
                    <strong className="text-white/80">Code Reviews:</strong> Mandatory security code reviews
                    for all production deployments.
                  </li>
                  <li>
                    <strong className="text-white/80">Dependency Scanning:</strong> Automated scanning of
                    open-source dependencies for known security vulnerabilities.
                  </li>
                  <li>
                    <strong className="text-white/80">Bug Bounty Program:</strong> We welcome responsible
                    disclosure of security vulnerabilities (details below).
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Privacy */}
          <section id="privacy" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Data Privacy & Protection</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Privacy Principles</h3>
                <p className="mb-3 text-sm text-white/70">
                  We follow privacy-by-design principles in all product development:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Data Minimization:</strong> We collect only the data
                    necessary to provide our services.
                  </li>
                  <li>
                    <strong className="text-white/80">Purpose Limitation:</strong> Data is used only for the
                    purposes disclosed at collection.
                  </li>
                  <li>
                    <strong className="text-white/80">Transparency:</strong> Clear, accessible privacy notices
                    explaining our data practices.
                  </li>
                  <li>
                    <strong className="text-white/80">User Control:</strong> You can access, correct, delete,
                    or export your data at any time.
                  </li>
                  <li>
                    <strong className="text-white/80">Security:</strong> Appropriate technical and
                    organizational measures protect your data.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Compliance Framework</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">DPDP Act 2023 (India):</strong> Full compliance with
                    India&apos;s Digital Personal Data Protection Act, including Grievance Officer appointment
                    and user rights mechanisms.
                  </li>
                  <li>
                    <strong className="text-white/80">GDPR (EU):</strong> GDPR-compliant for European users,
                    including lawful basis documentation and data transfer safeguards.
                  </li>
                  <li>
                    <strong className="text-white/80">Data Residency:</strong> Primary data storage in India;
                    cross-border transfers use standard contractual clauses.
                  </li>
                  <li>
                    <strong className="text-white/80">Third-Party Vendors:</strong> All service providers
                    undergo privacy and security assessments and sign data processing agreements.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Your Privacy Rights</h3>
                <p className="mb-3 text-sm text-white/70">
                  You have the right to:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>Access a copy of your personal data;</li>
                  <li>Correct inaccurate or incomplete data;</li>
                  <li>Request deletion of your data (subject to legal retention requirements);</li>
                  <li>Export your data in a portable format;</li>
                  <li>Opt out of marketing communications;</li>
                  <li>Lodge complaints with our Grievance Officer or data protection authorities.</li>
                </ul>
                <p className="mt-3 text-sm text-white/70">
                  Exercise your rights by contacting <span className="text-cyan-300">privacy@bittforge.in</span>.
                  See our <Link href="/legal/privacy-policy" className="text-cyan-300 hover:text-cyan-200">Privacy Policy</Link> for details.
                </p>
              </div>
            </div>
          </section>

          {/* Payment Security */}
          <section id="payments" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Payment Security</h2>
            
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5">
                <p className="text-sm text-white/80">
                  <strong className="text-emerald-300">Zero Storage of Payment Credentials:</strong> BitForge
                  never stores your credit card, debit card, or bank account details. All payment processing
                  is handled by PCI DSS Level 1 certified payment processors.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Payment Processing Partners</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Razorpay:</strong> Primary payment gateway for India
                    (PCI DSS Level 1 compliant, RBI authorized).
                  </li>
                  <li>
                    <strong className="text-white/80">Stripe:</strong> Secondary payment processor for
                    international transactions (PCI DSS Level 1 compliant).
                  </li>
                  <li>
                    <strong className="text-white/80">UPI & Net Banking:</strong> Direct bank integrations
                    secured by partner gateways.
                  </li>
                </ul>
                <p className="mt-3 text-sm text-white/70">
                  Payment credentials are tokenized and encrypted by payment processors. BitForge receives
                  only transaction confirmations and masked card details (e.g., &quot;XXXX-XXXX-XXXX-1234&quot;).
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Fraud Prevention</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Real-Time Fraud Detection:</strong> Machine learning
                    models analyze transactions for suspicious patterns.
                  </li>
                  <li>
                    <strong className="text-white/80">3D Secure Authentication:</strong> Additional
                    verification layer (OTP, biometric) for card transactions.
                  </li>
                  <li>
                    <strong className="text-white/80">Velocity Checks:</strong> Automated limits on
                    transaction frequency and amounts to prevent abuse.
                  </li>
                  <li>
                    <strong className="text-white/80">Chargeback Monitoring:</strong> Proactive monitoring
                    and dispute management to protect buyers and sellers.
                  </li>
                  <li>
                    <strong className="text-white/80">IP & Device Fingerprinting:</strong> Detection of
                    anomalous access patterns and account takeover attempts.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Payout Security for Sellers</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
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
          <section id="verification" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Seller Verification & Trust</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Seller Onboarding Process</h3>
                <p className="mb-3 text-sm text-white/70">
                  All Sellers undergo a multi-step verification process:
                </p>
                <ol className="ml-6 list-decimal space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Identity Verification:</strong> Government-issued ID
                    (Aadhaar, PAN, passport) verification via third-party KYC providers.
                  </li>
                  <li>
                    <strong className="text-white/80">Business Verification:</strong> For registered
                    businesses, GST number and business registration documents are verified.
                  </li>
                  <li>
                    <strong className="text-white/80">Bank Account Verification:</strong> Micro-deposit
                    verification or Aadhaar-linked bank verification.
                  </li>
                  <li>
                    <strong className="text-white/80">Product Review:</strong> Initial product listings are
                    manually reviewed for compliance with content policies.
                  </li>
                  <li>
                    <strong className="text-white/80">Ongoing Monitoring:</strong> Continuous monitoring of
                    seller behavior, product quality, and customer feedback.
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Content Moderation</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Automated Scanning:</strong> AI-powered content analysis
                    to detect prohibited items, malware, and policy violations.
                  </li>
                  <li>
                    <strong className="text-white/80">Human Review:</strong> Dedicated moderation team reviews
                    flagged content and user reports.
                  </li>
                  <li>
                    <strong className="text-white/80">Virus Scanning:</strong> All uploaded files scanned for
                    malware and viruses before being made available for download.
                  </li>
                  <li>
                    <strong className="text-white/80">Intellectual Property Protection:</strong> DMCA
                    compliance and proactive detection of copyright violations.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Trust Signals for Buyers</h3>
                <p className="mb-3 text-sm text-white/70">
                  We provide transparency to help buyers make informed decisions:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
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
          <section id="compliance" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Compliance & Certifications</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Regulatory Compliance</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Digital Personal Data Protection Act (DPDP), 2023:</strong>
                    Compliance with India&apos;s primary data protection law, including Grievance Officer
                    designation and data rights management.
                  </li>
                  <li>
                    <strong className="text-white/80">Information Technology Act, 2000:</strong> Adherence to
                    intermediary guidelines and digital signature requirements.
                  </li>
                  <li>
                    <strong className="text-white/80">Consumer Protection Act, 2019:</strong> E-commerce
                    rules compliance, including transparent pricing and complaint redressal.
                  </li>
                  <li>
                    <strong className="text-white/80">RBI Guidelines:</strong> Compliance with payment system
                    regulations and KYC norms for financial transactions.
                  </li>
                  <li>
                    <strong className="text-white/80">GST Compliance:</strong> Automated GST calculation,
                    invoice generation, and reporting for sellers.
                  </li>
                  <li>
                    <strong className="text-white/80">GDPR (EU Residents):</strong> Lawful basis for
                    processing, data subject rights, and international transfer safeguards.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Industry Standards</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">ISO 27001 (In Progress):</strong> Working towards
                    information security management system certification.
                  </li>
                  <li>
                    <strong className="text-white/80">SOC 2 Type II:</strong> Our cloud infrastructure
                    partners maintain SOC 2 Type II compliance.
                  </li>
                  <li>
                    <strong className="text-white/80">PCI DSS:</strong> Payment processors are PCI DSS Level
                    1 compliant; BitForge operates as a PCI DSS compliant merchant.
                  </li>
                  <li>
                    <strong className="text-white/80">OWASP Top 10:</strong> Security controls aligned with
                    OWASP guidelines for web application security.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Third-Party Assessments</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>Planned quarterly penetration testing by certified security firms;</li>
                  <li>Annual compliance audits by independent auditors (phased rollout);</li>
                  <li>Ongoing vulnerability assessments and remediation;</li>
                  <li>Security vendor risk assessments for all critical service providers.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Incident Response */}
          <section id="incident" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Incident Response & Business Continuity</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Security Incident Response Plan</h3>
                <p className="mb-3 text-sm text-white/70">
                  We maintain a formal incident response plan that includes:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Detection & Analysis:</strong> 24/7 security monitoring
                    and automated alerting for anomalous activity.
                  </li>
                  <li>
                    <strong className="text-white/80">Containment:</strong> Immediate isolation of affected
                    systems to prevent spread of security incidents.
                  </li>
                  <li>
                    <strong className="text-white/80">Eradication & Recovery:</strong> Root cause analysis,
                    vulnerability patching, and system restoration.
                  </li>
                  <li>
                    <strong className="text-white/80">Communication:</strong> Transparent notification to
                    affected users within 72 hours of confirmed data breaches (as required by DPDP Act).
                  </li>
                  <li>
                    <strong className="text-white/80">Post-Incident Review:</strong> Comprehensive analysis
                    and implementation of preventive measures.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Data Breach Protocol</h3>
                <p className="mb-3 text-sm text-white/70">
                  In the event of a data breach:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>We will assess the scope and impact within 24-48 hours;</li>
                  <li>Notify the Data Protection Board of India (as required by DPDP Act);</li>
                  <li>Notify affected users via email with details of the breach and remediation steps;</li>
                  <li>Provide identity theft protection services if sensitive data is compromised;</li>
                  <li>Publish a public incident report (if material) on this Trust Center.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Business Continuity & Disaster Recovery</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">High Availability:</strong> Multi-region deployment
                    with automatic failover for 99.9% uptime.
                  </li>
                  <li>
                    <strong className="text-white/80">Data Backups:</strong> Automated daily backups with
                    point-in-time recovery up to 30 days.
                  </li>
                  <li>
                    <strong className="text-white/80">Geographic Redundancy:</strong> Data replicated across
                    multiple data centers in different geographic locations.
                  </li>
                  <li>
                    <strong className="text-white/80">Recovery Time Objective (RTO):</strong> Target recovery
                    within 4 hours for critical services.
                  </li>
                  <li>
                    <strong className="text-white/80">Recovery Point Objective (RPO):</strong> Maximum data
                    loss of 1 hour for critical data.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Transparency */}
          <section id="transparency" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Transparency & Reporting</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Security Transparency</h3>
                <p className="mb-3 text-sm text-white/70">
                  We believe in radical transparency about our security practices:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>Public disclosure of security audits and certifications (where applicable);</li>
                  <li>Regular security posture reports published on this page;</li>
                  <li>Transparent incident reporting with root cause analysis;</li>
                  <li>Open source contributions to security tools and libraries;</li>
                  <li>Participation in industry security communities and knowledge sharing.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Platform Metrics (Updated Monthly)</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/12 bg-white/5 p-4">
                    <p className="text-2xl font-bold text-white">99.9%</p>
                    <p className="mt-1 text-xs text-white/70">Platform Uptime (Last 90 Days)</p>
                  </div>
                  <div className="rounded-xl border border-white/12 bg-white/5 p-4">
                    <p className="text-2xl font-bold text-white">&lt; 72h</p>
                    <p className="mt-1 text-xs text-white/70">Average Incident Response Time</p>
                  </div>
                  <div className="rounded-xl border border-white/12 bg-white/5 p-4">
                    <p className="text-2xl font-bold text-white">100%</p>
                    <p className="mt-1 text-xs text-white/70">Seller KYC Verification Rate</p>
                  </div>
                  <div className="rounded-xl border border-white/12 bg-white/5 p-4">
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="mt-1 text-xs text-white/70">Confirmed Data Breaches (All Time)</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Compliance Reports</h3>
                <p className="mb-3 text-sm text-white/70">
                  Available upon request for enterprise customers and partners:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>SOC 2 Type II report (from infrastructure partners);</li>
                  <li>Penetration testing executive summaries;</li>
                  <li>Data processing agreements and standard contractual clauses;</li>
                  <li>Security questionnaires and vendor assessments;</li>
                  <li>Compliance attestation letters.</li>
                </ul>
                <p className="mt-3 text-sm text-white/70">
                  Request reports at <span className="text-cyan-300">compliance@bittforge.in</span> with your
                  business details and intended use.
                </p>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section id="best-practices" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Security Best Practices for Users</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">For All Users</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Use Strong Passwords:</strong> Create unique passwords
                    with at least 12 characters, including uppercase, lowercase, numbers, and symbols.
                  </li>
                  <li>
                    <strong className="text-white/80">Enable Two-Factor Authentication (2FA):</strong> Add an
                    extra layer of security to your account (coming soon).
                  </li>
                  <li>
                    <strong className="text-white/80">Verify Email Communications:</strong> Always check that
                    emails claiming to be from BitForge come from @bittforge.in addresses.
                  </li>
                  <li>
                    <strong className="text-white/80">Keep Software Updated:</strong> Ensure your browser and
                    operating system are up to date with the latest security patches.
                  </li>
                  <li>
                    <strong className="text-white/80">Use Secure Networks:</strong> Avoid accessing your
                    account on public Wi-Fi without a VPN.
                  </li>
                  <li>
                    <strong className="text-white/80">Monitor Account Activity:</strong> Regularly review your
                    transaction history and report suspicious activity immediately.
                  </li>
                  <li>
                    <strong className="text-white/80">Log Out on Shared Devices:</strong> Always log out when
                    using BitForge on public or shared computers.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">For Buyers</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>Verify seller ratings and reviews before purchasing;</li>
                  <li>Read product descriptions and system requirements carefully;</li>
                  <li>Download products from official BitForge links only;</li>
                  <li>Scan downloaded files with antivirus software before opening;</li>
                  <li>Report suspicious products or sellers to our support team.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">For Sellers</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>Complete KYC verification to build trust with buyers;</li>
                  <li>Upload only products you own or have rights to sell;</li>
                  <li>Scan all uploaded files for malware before listing;</li>
                  <li>Provide accurate product descriptions and support information;</li>
                  <li>Respond promptly to buyer inquiries and support requests;</li>
                  <li>Keep your payout information and tax details up to date.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-5">
                <h3 className="mb-2 text-base font-semibold text-amber-200">⚠️ Recognizing Phishing & Scams</h3>
                <p className="mb-2 text-sm text-white/70">
                  BitForge will <strong>NEVER</strong>:
                </p>
                <ul className="ml-6 list-disc space-y-1 text-xs text-white/70">
                  <li>Ask for your password via email or phone;</li>
                  <li>Request credit card details outside of our secure payment flow;</li>
                  <li>Send you unsolicited links asking you to verify your account;</li>
                  <li>Threaten account suspension without prior policy violations;</li>
                  <li>Ask you to make payments via wire transfer or cryptocurrency.</li>
                </ul>
                <p className="mt-3 text-sm text-white/70">
                  If you receive suspicious communications claiming to be from BitForge, forward them to
                  <span className="text-cyan-300"> security@bittforge.in</span> immediately.
                </p>
              </div>
            </div>
          </section>

          {/* Responsible Disclosure */}
          <section id="disclosure" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Responsible Security Disclosure</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Bug Bounty Program</h3>
                <p className="mb-3 text-sm text-white/70">
                  We welcome security researchers and ethical hackers to help us identify vulnerabilities.
                  If you discover a security issue, we encourage responsible disclosure.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5">
                <h3 className="mb-3 text-base font-semibold text-white">How to Report a Vulnerability</h3>
                
                <p className="mb-3 text-sm text-white/80">
                  <strong>Email:</strong> <span className="text-cyan-300">security@bittforge.in</span>
                </p>
                
                <p className="mb-2 text-sm text-white/80">Include in your report:</p>
                <ul className="ml-6 list-disc space-y-1 text-sm text-white/70">
                  <li>Detailed description of the vulnerability;</li>
                  <li>Steps to reproduce the issue;</li>
                  <li>Potential impact and severity assessment;</li>
                  <li>Proof of concept (if applicable);</li>
                  <li>Your contact information for follow-up;</li>
                  <li>Any suggested remediation steps.</li>
                </ul>
                
                <p className="mt-4 text-sm text-white/80">
                  <strong>Response Timeline:</strong>
                </p>
                <ul className="ml-6 list-disc space-y-1 text-sm text-white/70">
                  <li>Acknowledgment within 48 hours;</li>
                  <li>Initial assessment within 5 business days;</li>
                  <li>Regular updates on remediation progress;</li>
                  <li>Resolution timeline based on severity (critical issues within 72 hours).</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Responsible Disclosure Guidelines</h3>
                <p className="mb-3 text-sm text-white/70">
                  We ask that security researchers:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>Report vulnerabilities privately before public disclosure;</li>
                  <li>Give us reasonable time to investigate and remediate (90 days for non-critical, 30 days for critical);</li>
                  <li>Do not access, modify, or delete user data without explicit permission;</li>
                  <li>Do not perform actions that could harm platform availability (e.g., DDoS testing);</li>
                  <li>Do not exploit vulnerabilities for personal gain or to harm users;</li>
                  <li>Comply with all applicable laws and regulations.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Recognition & Rewards</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-white/70">
                  <li>
                    <strong className="text-white/80">Hall of Fame:</strong> Public recognition on this page
                    for responsible disclosure (with your permission).
                  </li>
                  <li>
                    <strong className="text-white/80">Bounty Rewards:</strong> Monetary rewards for qualifying
                    vulnerabilities based on severity (program details coming soon).
                  </li>
                  <li>
                    <strong className="text-white/80">Direct Communication:</strong> Opportunity to work
                    directly with our security team on remediation.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-white/90">Out of Scope</h3>
                <p className="mb-3 text-sm text-white/70">
                  The following are <strong>not</strong> eligible for bounty rewards:
                </p>
                <ul className="ml-6 list-disc space-y-1 text-xs text-white/70">
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
          <section id="contact" className="border-t border-white/10 pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-white">Security Contact Information</h2>
            
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/12 bg-white/5 p-5">
                <p className="mb-4 font-semibold text-white">Security Team Contacts</p>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="mb-1 font-medium text-white/90">Security Vulnerabilities & Bug Reports</p>
                    <p className="text-white/70">Email: <span className="text-cyan-300">security@bittforge.in</span></p>
                    <p className="text-xs text-white/60">Use for: Vulnerability disclosure, security bugs, penetration test findings</p>
                  </div>
                  
                  <div>
                    <p className="mb-1 font-medium text-white/90">Privacy & Data Protection</p>
                    <p className="text-white/70">Email: <span className="text-cyan-300">privacy@bittforge.in</span></p>
                    <p className="text-xs text-white/60">Use for: Data access requests, privacy concerns, GDPR/DPDP queries</p>
                  </div>
                  
                  <div>
                    <p className="mb-1 font-medium text-white/90">Grievance Officer (DPDP Act)</p>
                    <p className="text-white/70">Email: <span className="text-cyan-300">grievance@bittforge.in</span></p>
                    <p className="text-xs text-white/60">Use for: Formal complaints, data rights escalation, regulatory concerns</p>
                  </div>
                  
                  <div>
                    <p className="mb-1 font-medium text-white/90">Compliance & Legal</p>
                    <p className="text-white/70">Email: <span className="text-cyan-300">compliance@bittforge.in</span></p>
                    <p className="text-xs text-white/60">Use for: Compliance reports, legal requests, audit inquiries</p>
                  </div>
                  
                  <div>
                    <p className="mb-1 font-medium text-white/90">General Support</p>
                    <p className="text-white/70">Email: <span className="text-cyan-300">support@bittforge.in</span></p>
                    <p className="text-xs text-white/60">Use for: Account issues, transaction problems, general inquiries</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-white/90">PGP Public Key (Coming Soon)</p>
                <p className="text-xs text-white/70">
                  For encrypted communications, our PGP public key will be available here. In the meantime,
                  sensitive information can be shared via encrypted email or secure file transfer upon request.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-white/90">Business Address</p>
                <p className="text-sm text-white/70">BitForge Technologies Pvt. Ltd.</p>
                <p className="text-sm text-white/70">Pune, Maharashtra, India</p>
              </div>
            </div>
          </section>

          {/* Last Updated */}
          <section className="border-t border-white/10 pt-8">
            <p className="text-xs text-white/60">
              <strong>Trust Center Last Updated:</strong> February 7, 2026
            </p>
            <p className="mt-2 text-xs text-white/60">
              This page is updated regularly as we improve our security posture and introduce new trust
              initiatives. Material changes will be highlighted at the top of this page.
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
              <Link href="/legal/refund-cancellation-policy" className="hover:text-white">
                Refund Policy
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
