"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import api from "@/lib/api";
import toast from "react-hot-toast";

const LEGAL_PAGES = [
  { id: "about", label: "About Us" },
  { id: "contact", label: "Contact Support" },
  { id: "careers", label: "Careers" },
  { id: "seller-terms", label: "Seller Terms" },
  { id: "trust-center", label: "Trust Center" },
  { id: "privacy-policy", label: "Privacy Policy" },
  { id: "refund-cancellation-policy", label: "Refund Policy" },
  { id: "terms-and-conditions", label: "Terms & Conditions" }
];

export default function LegalPagesSettings() {
  const [selectedPage, setSelectedPage] = useState(LEGAL_PAGES[0].id);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [lastUpdatedDate, setLastUpdatedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDates(selectedPage);
  }, [selectedPage]);

  const fetchDates = async (pageId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/settings/legal-dates?pageId=${pageId}`);
      if (res.data?.success && res.data?.data) {
        setEffectiveDate(res.data.data.legalEffectiveDate || "January 1, 2026");
        setLastUpdatedDate(res.data.data.legalLastUpdatedDate || "February 1, 2026");
      }
    } catch (error) {
      console.error("Failed to fetch legal dates:", error);
      toast.error("Failed to load legal dates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!effectiveDate.trim() || !lastUpdatedDate.trim()) {
      toast.error("Both dates are required");
      return;
    }

    try {
      setSaving(true);
      await api.put("/settings/legal-dates", {
        pageId: selectedPage,
        legalEffectiveDate: effectiveDate.trim(),
        legalLastUpdatedDate: lastUpdatedDate.trim()
      });
      toast.success("Legal dates updated successfully");
    } catch (error) {
      console.error("Failed to save legal dates:", error);
      toast.error("Failed to save legal dates");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      <PageHeader 
        title="Legal Pages Dates" 
        subtitle="Manage Effective Date and Last Updated Date for individual pages" 
        backHref="/dashboard/admin/settings" 
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 md:py-8">
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Page-Specific Dates</h2>
            <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
              Select a page below to update its specific dates. Format recommendation: "January 1, 2026".
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider mb-2">
              Select Page
            </label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
            >
              {LEGAL_PAGES.map(page => (
                <option key={page.id} value={page.id}>{page.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-slate-100 dark:bg-white/5 rounded-xl"></div>
              <div className="h-20 bg-slate-100 dark:bg-white/5 rounded-xl"></div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider mb-2">
                  Effective Date
                </label>
                <input
                  type="text"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  placeholder="e.g., January 1, 2026"
                  suppressHydrationWarning
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider mb-2">
                  Last Updated Date
                </label>
                <input
                  type="text"
                  value={lastUpdatedDate}
                  onChange={(e) => setLastUpdatedDate(e.target.value)}
                  placeholder="e.g., February 1, 2026"
                  suppressHydrationWarning
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 text-sm"
                >
                  {saving ? "Saving Changes..." : "Save Dates"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
