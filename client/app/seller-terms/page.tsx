"use client";

export default function SellerTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4">
            Seller Terms & Conditions
          </h1>
          <p className="text-slate-400">
            Understanding content security, preview generation, and platform policies
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Last updated: February 11, 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          
          {/* Content Security */}
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              🔐 Content Security & Protection
            </h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                Your product files are protected with <strong>industry-leading security measures</strong>:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Authenticated Storage:</strong> Original files are stored with Cloudinary's 
                  <code className="bg-slate-700/50 px-2 py-0.5 rounded mx-1 text-cyan-300">type: "authenticated"</code>
                  access control, making them inaccessible via direct URLs.
                </li>
                <li>
                  <strong>Signed URLs:</strong> After purchase, buyers receive time-limited signed URLs 
                  (valid for 5 minutes) that cannot be shared or reused.
                </li>
                <li>
                  <strong>Malware Scanning:</strong> All uploaded files are automatically scanned using 
                  VirusTotal API to ensure platform safety.
                </li>
                <li>
                  <strong>No Public Access:</strong> Your full content PDFs are never publicly accessible. 
                  Only verified purchasers can download them.
                </li>
              </ul>
            </div>
          </section>

          {/* Preview Generation */}
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              👁️ Automatic Preview Generation
            </h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                When you upload a PDF, our system <strong>automatically generates a watermarked preview</strong> 
                for potential buyers. Here's how it works:
              </p>
              
              <div className="bg-slate-900/50 rounded-lg p-4 my-4">
                <h3 className="text-lg font-semibold text-white mb-3">Preview Page Count Rules:</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 text-cyan-300">Original Pages</th>
                      <th className="text-left py-2 text-cyan-300">Preview Pages Shown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    <tr>
                      <td className="py-2">1-11 pages</td>
                      <td className="py-2 text-emerald-400 font-medium">1 page</td>
                    </tr>
                    <tr>
                      <td className="py-2">12-25 pages</td>
                      <td className="py-2 text-emerald-400 font-medium">2 pages</td>
                    </tr>
                    <tr>
                      <td className="py-2">26-50 pages</td>
                      <td className="py-2 text-emerald-400 font-medium">3 pages</td>
                    </tr>
                    <tr>
                      <td className="py-2">51+ pages</td>
                      <td className="py-2 text-emerald-400 font-medium">4 pages</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Watermarked Pages:</strong> Preview pages include diagonal "PREVIEW ONLY" watermark 
                  and bottom text stating "Purchase to unlock full content".
                </li>
                <li>
                  <strong>Locked Placeholder Pages:</strong> After real preview pages, 2-3 locked placeholder 
                  pages are added showing "LOCKED" to indicate more content is available.
                </li>
                <li>
                  <strong>Public Access:</strong> Preview PDFs are intentionally public so buyers can evaluate 
                  your content quality before purchasing.
                </li>
                <li>
                  <strong>Zero Seller Effort:</strong> This happens automatically - you only upload ONE file 
                  (the full content PDF).
                </li>
              </ul>
            </div>
          </section>

          {/* Seller Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              ✅ Seller Responsibilities
            </h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>By uploading content to this platform, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Own or have rights</strong> to sell the content you're uploading.
                </li>
                <li>
                  <strong>Ensure content quality</strong> and accuracy of product descriptions.
                </li>
                <li>
                  <strong>Accept that preview pages will be publicly visible</strong> as watermarked samples.
                </li>
                <li>
                  <strong>Not upload malicious, illegal, or copyrighted content</strong> without permission.
                </li>
                <li>
                  <strong>Provide accurate metadata</strong> (title, description, price, page count).
                </li>
                <li>
                  <strong>Understand that products require admin approval</strong> before being listed publicly.
                </li>
              </ul>
            </div>
          </section>

          {/* Content Restrictions */}
          <section>
            <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
              ⚠️ Prohibited Content
            </h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>The following types of content are <strong>strictly prohibited</strong>:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pirated, cracked, or illegally obtained materials</li>
                <li>Malware, viruses, or malicious code</li>
                <li>Explicit adult content or illegal material</li>
                <li>Content that infringes on intellectual property rights</li>
                <li>Misleading or fraudulent products</li>
                <li>Content promoting hate speech, violence, or discrimination</li>
              </ul>
              <p className="text-red-300 font-medium mt-3">
                ⚡ Violation of these terms may result in immediate account suspension and legal action.
              </p>
            </div>
          </section>

          {/* Revenue & Payouts */}
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              💰 Revenue & Payouts
            </h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Platform Fee:</strong> The platform charges a commission on each sale 
                  (percentage varies by product category).
                </li>
                <li>
                  <strong>Payout Schedule:</strong> Earnings are transferred to your bank account 
                  according to the configured payout schedule.
                </li>
                <li>
                  <strong>Minimum Payout:</strong> A minimum balance threshold may apply before 
                  payouts can be processed.
                </li>
                <li>
                  <strong>Tax Responsibility:</strong> Sellers are responsible for reporting and 
                  paying applicable taxes on their earnings.
                </li>
              </ul>
            </div>
          </section>

          {/* Data & Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              🛡️ Data & Privacy
            </h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>File Storage:</strong> All files are stored securely on Cloudinary's 
                  infrastructure with enterprise-grade encryption.
                </li>
                <li>
                  <strong>Buyer Information:</strong> You will NOT receive buyers' personal information 
                  (emails, addresses) to protect their privacy.
                </li>
                <li>
                  <strong>Analytics:</strong> You can view sales statistics, revenue, and product 
                  performance metrics in your dashboard.
                </li>
                <li>
                  <strong>Data Deletion:</strong> If you delete your account, your content will be 
                  removed from the platform (existing purchases remain accessible to buyers).
                </li>
              </ul>
            </div>
          </section>

          {/* Support & Disputes */}
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              🤝 Support & Disputes
            </h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Buyer Disputes:</strong> If a buyer reports an issue with your product, 
                  you may be required to provide support or issue a refund.
                </li>
                <li>
                  <strong>Product Updates:</strong> You can update product descriptions and pricing, 
                  but file changes require re-approval.
                </li>
                <li>
                  <strong>Platform Support:</strong> Contact our support team for technical issues 
                  or policy questions.
                </li>
                <li>
                  <strong>Refund Policy:</strong> The platform's refund policy applies to all sales. 
                  Refunds may impact your seller rating.
                </li>
              </ul>
            </div>
          </section>

          {/* Acceptance */}
          <section className="border-t border-slate-700 pt-6 mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              ✍️ Agreement
            </h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                By checking the "I agree" box on the upload page, you acknowledge that you have 
                <strong> read, understood, and agreed</strong> to these Seller Terms & Conditions.
              </p>
              <p className="text-sm text-slate-400">
                These terms are subject to change. Continued use of the platform after changes 
                constitutes acceptance of updated terms.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">
              Questions or Concerns?
            </h3>
            <p className="text-slate-300 text-sm">
              If you have questions about these terms or need clarification, please contact our 
              support team at{" "}
              <a href="mailto:support@contentsellify.com" className="text-cyan-400 underline">
                support@contentsellify.com
              </a>
            </p>
          </section>

        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 
                     border border-slate-600 rounded-xl text-white font-medium transition"
          >
            ← Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
