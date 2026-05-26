"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function UploadSolutionsPage() {
  return (
    <div className="py-10 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm text-slate-500 dark:text-white/60">
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Documentation</Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">For Sellers</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">Upload Solutions</span>
        </nav>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            For Sellers
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Upload Solutions</h1>
          <p className="text-lg text-slate-600 dark:text-white/70">
            Troubleshooting guide for common file upload errors and solutions.
          </p>
        </div>

        {/* Common Upload Errors */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Common Upload Errors</h2>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-gradient-to-r dark:from-red-500/10 dark:to-orange-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Error: File Too Large
              </h3>
              <p className="text-slate-600 dark:text-white/70 mb-3"><strong className="text-slate-900 dark:text-white">Message:</strong> "File size exceeds maximum limit of 500MB"</p>
              <p className="text-slate-600 dark:text-white/70 mb-3"><strong className="text-slate-900 dark:text-white">Cause:</strong> Your file is larger than our 500MB limit per file.</p>
              <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-lg">
                <p className="text-slate-900 dark:text-white font-semibold mb-2">Solutions:</p>
                <ul className="space-y-2 text-slate-600 dark:text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400">•</span>
                    <span>Compress video files using HandBrake or FFmpeg</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400">•</span>
                    <span>Split large files into multiple parts (Part 1, Part 2)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400">•</span>
                    <span>Use ZIP compression for document bundles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400">•</span>
                    <span>For videos: Reduce resolution or bitrate</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-gradient-to-r dark:from-red-500/10 dark:to-orange-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl"></span> Error: Unsupported File Type
              </h3>
              <p className="text-slate-600 dark:text-white/70 mb-3"><strong className="text-slate-900 dark:text-white">Message:</strong> "File type not allowed"</p>
              <p className="text-slate-600 dark:text-white/70 mb-3"><strong className="text-slate-900 dark:text-white">Cause:</strong> File format not in our supported list.</p>
              <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-lg">
                <p className="text-slate-900 dark:text-white font-semibold mb-2">Supported Formats:</p>
                <div className="grid md:grid-cols-2 gap-3 text-slate-600 dark:text-white/70 text-sm">
                  <div>
                    <p className="text-cyan-400 font-semibold mb-1">Documents:</p>
                    <p>PDF, DOCX, TXT, EPUB</p>
                  </div>
                  <div>
                    <p className="text-cyan-400 font-semibold mb-1">Videos:</p>
                    <p>MP4, MOV, AVI, MKV</p>
                  </div>
                  <div>
                    <p className="text-cyan-400 font-semibold mb-1">Audio:</p>
                    <p>MP3, WAV, M4A, FLAC</p>
                  </div>
                  <div>
                    <p className="text-cyan-400 font-semibold mb-1">Images:</p>
                    <p>JPG, PNG, GIF, SVG</p>
                  </div>
                  <div>
                    <p className="text-cyan-400 font-semibold mb-1">Archives:</p>
                    <p>ZIP, RAR, 7Z</p>
                  </div>
                  <div>
                    <p className="text-cyan-400 font-semibold mb-1">Code:</p>
                    <p>ZIP (with source files)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-gradient-to-r dark:from-red-500/10 dark:to-orange-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">🔄</span> Error: Upload Interrupted
              </h3>
              <p className="text-slate-600 dark:text-white/70 mb-3"><strong className="text-slate-900 dark:text-white">Message:</strong> "Upload failed - connection lost"</p>
              <p className="text-slate-600 dark:text-white/70 mb-3"><strong className="text-slate-900 dark:text-white">Cause:</strong> Network interruption during upload.</p>
              <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-lg">
                <p className="text-slate-900 dark:text-white font-semibold mb-2">Solutions:</p>
                <ul className="space-y-2 text-slate-600 dark:text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400">•</span>
                    <span>Use stable wired connection instead of WiFi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400">•</span>
                    <span>Upload during off-peak hours for better speeds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400">•</span>
                    <span>Try different browser (Chrome recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400">•</span>
                    <span>Disable VPN or proxy during upload</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* File Size Limits */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">File Size Guidelines</h2>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-slate-900 dark:text-white font-semibold">File Type</th>
                    <th className="text-left p-4 text-slate-900 dark:text-white font-semibold">Max Size</th>
                    <th className="text-left p-4 text-slate-900 dark:text-white font-semibold">Recommended</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-white/70 text-sm">
                  <tr className="border-t border-slate-200 dark:border-white/10">
                    <td className="p-4">Product Files (main download)</td>
                    <td className="p-4 text-cyan-400">500 MB</td>
                    <td className="p-4">Under 200 MB for faster downloads</td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-white/10">
                    <td className="p-4">Thumbnail Images</td>
                    <td className="p-4 text-cyan-400">5 MB</td>
                    <td className="p-4">Under 500 KB, 1200x800px</td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-white/10">
                    <td className="p-4">Preview Images</td>
                    <td className="p-4 text-cyan-400">5 MB each</td>
                    <td className="p-4">Under 1 MB, HD quality</td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-white/10">
                    <td className="p-4">Product Videos</td>
                    <td className="p-4 text-cyan-400">100 MB</td>
                    <td className="p-4">30-60 seconds, 1080p</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Upload Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🗜️</span> Compress Files
              </h3>
              <p className="text-slate-500 dark:text-white/60 text-sm">
                Always compress files before uploading. Use ZIP for documents, HandBrake for videos, TinyPNG for images.
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl"></span> Clear File Names
              </h3>
              <p className="text-slate-500 dark:text-white/60 text-sm">
                Use descriptive names without special characters: "React-Course-2024-v2.zip" instead of "course(final)!!!.zip"
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🧪</span> Test Downloads
              </h3>
              <p className="text-slate-500 dark:text-white/60 text-sm">
                After uploading, download and test your files to ensure they work correctly before publishing.
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Include README
              </h3>
              <p className="text-slate-500 dark:text-white/60 text-sm">
                Always include a README file with installation instructions, requirements, and support contact info.
              </p>
            </div>
          </div>
        </section>

        {/* Related */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Link href="/docs/product-management" className="group block bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 hover:border-indigo-400/40 dark:hover:border-cyan-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3"></div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">Product Management</h3>
            <p className="text-slate-500 dark:text-white/60 text-sm">Complete product setup guide</p>
          </Link>
          <Link href="/docs/troubleshooting" className="group block bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 hover:border-indigo-400/40 dark:hover:border-cyan-400/40 hover:bg-indigo-50/50 dark:hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">🔧</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">Troubleshooting</h3>
            <p className="text-slate-500 dark:text-white/60 text-sm">More common issues & solutions</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
