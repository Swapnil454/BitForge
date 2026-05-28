"use client";

import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import { ShieldCheck, Eye, Scale, AlertTriangle, Wallet, Lock, HelpCircle, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function SellerTermsPage() {
  const [lastUpdated, setLastUpdated] = useState("May 26, 2026");

  useEffect(() => {
    api.get("/settings/legal-dates?pageId=seller-terms").then(res => {
      if (res.data?.success && res.data?.data?.legalLastUpdatedDate) {
        setLastUpdated(res.data.data.legalLastUpdatedDate);
      }
    }).catch(err => console.error("Failed to fetch dates", err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A101D] text-slate-900 dark:text-white pb-20">
      <PageHeader 
        title="Seller Terms & Conditions" 
        subtitle="Platform policies and guidelines"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        {/* Intro */}
        <div className="text-center mb-10">
          <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            Seller Guidelines & Policies
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Understanding content security, preview generation, and platform responsibilities. By uploading content, you agree to these terms.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 font-medium uppercase tracking-wider">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">

          {/* Content Security */}
          <section className="bg-white dark:bg-[#12141c]/80 border border-slate-200 dark:border-white/5 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Content Security & Protection
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
              Your product files are protected with <strong className="text-slate-900 dark:text-white">industry-leading security measures</strong>:
            </p>
            <ul className="space-y-3">
              {[
                { title: "Authenticated Storage", desc: "Original files are stored with Cloudinary's authenticated access control, making them inaccessible via direct URLs." },
                { title: "Signed URLs", desc: "After purchase, buyers receive time-limited signed URLs (valid for 5 minutes) that cannot be shared or reused." },
                { title: "Malware Scanning", desc: "All uploaded files are automatically scanned using VirusTotal API to ensure platform safety." },
                { title: "No Public Access", desc: "Your full content PDFs are never publicly accessible. Only verified purchasers can download them." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  <div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-200 font-semibold">{item.title}: </strong>
                    {item.desc}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Preview Generation */}
          <section className="bg-white dark:bg-[#12141c]/80 border border-slate-200 dark:border-white/5 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Automatic Preview Generation
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              When you upload a PDF, our system <strong className="text-slate-900 dark:text-white">automatically generates a watermarked preview</strong> for potential buyers. Here's how it works:
            </p>

            <div className="bg-slate-50 dark:bg-[#0B1221] border border-slate-100 dark:border-white/5 rounded-xl p-5 mb-6 overflow-hidden">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Preview Page Count Rules</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-white/10">Original Pages</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-white/10">Preview Shown</div>
                
                <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">1-11 pages</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">1 page</div>
                
                <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">12-25 pages</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">2 pages</div>
                
                <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">26-50 pages</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">3 pages</div>
                
                <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">51+ pages</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">4 pages</div>
              </div>
            </div>

            <ul className="space-y-3">
              {[
                { title: "Watermarked Pages", desc: 'Preview pages include a diagonal "PREVIEW ONLY" watermark and bottom text stating "Purchase to unlock full content".' },
                { title: "Locked Placeholder Pages", desc: 'After real preview pages, 2-3 locked placeholder pages are added showing "LOCKED" to indicate more content is available.' },
                { title: "Public Access", desc: 'Preview PDFs are intentionally public so buyers can evaluate your content quality before purchasing.' },
                { title: "Zero Seller Effort", desc: 'This happens automatically - you only upload ONE file (the full content PDF).' },
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  <div className="mt-1 w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-200 font-semibold">{item.title}: </strong>
                    {item.desc}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Seller Responsibilities */}
          <section className="bg-white dark:bg-[#12141c]/80 border border-slate-200 dark:border-white/5 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Seller Responsibilities
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
              By uploading content to this platform, you agree to:
            </p>
            <ul className="space-y-3">
              {[
                "Own or have rights to sell the content you're uploading.",
                "Ensure content quality and accuracy of product descriptions.",
                "Accept that preview pages will be publicly visible as watermarked samples.",
                "Not upload malicious, illegal, or copyrighted content without permission.",
                "Provide accurate metadata (title, description, price, page count).",
                "Understand that products require admin approval before being listed publicly."
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Prohibited Content */}
          <section className="bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Prohibited Content
              </h2>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
              The following types of content are <strong className="text-rose-600 dark:text-rose-400">strictly prohibited</strong>:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                "Pirated or cracked materials",
                "Malware or malicious code",
                "Explicit adult content",
                "Copyright infringement",
                "Misleading or fraudulent products",
                "Hate speech or discrimination"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-400">
                  <div className="w-1 h-1 bg-rose-500 rounded-full shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="bg-rose-100/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4">
              <p className="text-rose-700 dark:text-rose-300 text-sm font-bold">
                ⚡ Violation of these terms may result in immediate account suspension and legal action.
              </p>
            </div>
          </section>

          {/* Grid Layout for remaining sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Revenue & Payouts */}
            <section className="bg-white dark:bg-[#12141c]/80 border border-slate-200 dark:border-white/5 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Revenue & Payouts
                </h2>
              </div>
              <ul className="space-y-4">
                {[
                  { title: "Platform Commission", desc: "BitForge charges a flat 10% commission on each successful sale." },
                  { title: "Your Earnings", desc: "You retain 90% of the total sale price, which is added directly to your balance." },
                  { title: "Example Calculation", desc: "For a ₹10 product, a 10% platform fee (₹1) is deducted, and you earn ₹9." },
                  { title: "Payout Schedule", desc: "Earnings are automatically settled to your registered bank account via RazorpayX." }
                ].map((item, i) => (
                  <li key={i} className="flex flex-col text-sm text-slate-600 dark:text-slate-400 border-l-2 border-amber-500/30 pl-3">
                    <strong className="text-slate-900 dark:text-slate-200 block mb-1 text-[15px]">{item.title}</strong>
                    <span className="leading-relaxed">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Data & Privacy */}
            <section className="bg-white dark:bg-[#12141c]/80 border border-slate-200 dark:border-white/5 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Data & Privacy
                </h2>
              </div>
              <ul className="space-y-3">
                {[
                  { title: "File Storage", desc: "Files are stored with enterprise-grade encryption." },
                  { title: "Buyer Privacy", desc: "You will NOT receive buyers' personal information." },
                  { title: "Analytics", desc: "View sales and metrics in your dashboard." },
                  { title: "Data Deletion", desc: "If you delete your account, content is removed." }
                ].map((item, i) => (
                  <li key={i} className="flex flex-col text-sm text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-slate-200">{item.title}</strong>
                    <span>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Contact */}
          <section className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-500/10 dark:to-cyan-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6 sm:p-8 text-center mt-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white dark:bg-[#12141c] text-indigo-600 dark:text-indigo-400 rounded-full mb-4 shadow-sm">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Questions or Concerns?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
              If you have questions about these terms or need clarification, please contact our support team at{" "}
              <a href="mailto:support@Bitforge.com" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                support@Bitforge.com
              </a>
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
