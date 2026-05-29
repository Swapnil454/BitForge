"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import GlassySelect from "./GlassySelect";

export interface Career {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  salary: {
    min: number | null;
    max: number | null;
    currency: string;
  };
  status: string;
  applyUrl: string;
  applyEmail: string;
  featured: boolean;
  openings: number;
}

export interface CareerFormData {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  salary: {
    min: number | null;
    max: number | null;
    currency: string;
  };
  status: string;
  applyUrl: string;
  applyEmail: string;
  featured: boolean;
  openings: number;
}

interface CareerFormProps {
  initialData?: Career;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DEPARTMENTS = ["Engineering", "Product", "Design", "Operations", "Marketing", "Sales", "Support", "Other"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const EXPERIENCE_LEVELS = ["0-2 years", "2-5 years", "5-8 years", "8+ years"];
const CURRENCIES = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

export default function CareerForm({ initialData, isEditing = false, onSuccess, onCancel }: CareerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CareerFormData>({
    title: initialData?.title || "",
    department: initialData?.department || "Engineering",
    location: initialData?.location || "Remote",
    employmentType: initialData?.employmentType || "Full-time",
    experience: initialData?.experience || "0-2 years",
    description: initialData?.description || "",
    responsibilities: initialData?.responsibilities || [],
    requirements: initialData?.requirements || [],
    niceToHave: initialData?.niceToHave || [],
    benefits: initialData?.benefits || [],
    salary: initialData?.salary || { min: null, max: null, currency: "INR" },
    status: initialData?.status || "draft",
    applyUrl: initialData?.applyUrl || "",
    applyEmail: initialData?.applyEmail || "careers@bittforge.in",
    featured: initialData?.featured || false,
    openings: initialData?.openings || 1,
  });

  const handleArrayFieldChange = (field: keyof CareerFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value.split("\n").filter((item) => item.trim() !== ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && initialData?._id) {
        await api.put(`/careers/admin/${initialData._id}`, formData);
        showSuccess("Career updated successfully");
      } else {
        await api.post("/careers/admin/create", formData);
        showSuccess("Career created successfully");
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/admin/careers");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Error saving career:", error);
      showError(error.response?.data?.message || "Failed to save career");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 sm:px-4 sm:py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 transition-all focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 hover:bg-slate-50 dark:hover:bg-white/[0.07]";
  const labelClasses = "mb-1.5 block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl pb-10">
      <div className="space-y-5 sm:space-y-8">
        {/* Section: Basic Info */}
        <section className="relative z-40 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 sm:p-8 backdrop-blur-sm shadow-sm dark:shadow-none">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Basic Information</h3>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClasses}>Job Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputClasses}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>

            <div>
              <label className={labelClasses}>Department *</label>
              <GlassySelect
                value={formData.department}
                onChange={(v) => setFormData({ ...formData, department: v })}
                options={DEPARTMENTS.map((dept) => ({ value: dept, label: dept }))}
              />
            </div>

            <div>
              <label className={labelClasses}>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={inputClasses}
                placeholder="e.g. Remote / Bangalore"
              />
            </div>

            <div>
              <label className={labelClasses}>Employment Type</label>
              <GlassySelect
                value={formData.employmentType}
                onChange={(v) => setFormData({ ...formData, employmentType: v })}
                options={EMPLOYMENT_TYPES.map((type) => ({ value: type, label: type }))}
              />
            </div>

            <div>
              <label className={labelClasses}>Experience</label>
              <GlassySelect
                value={formData.experience}
                onChange={(v) => setFormData({ ...formData, experience: v })}
                options={EXPERIENCE_LEVELS.map((level) => ({ value: level, label: level }))}
              />
            </div>
          </div>
        </section>

        {/* Section: Description & Role */}
        <section className="relative z-30 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 sm:p-8 backdrop-blur-sm shadow-sm dark:shadow-none">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Job Description</h3>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className={labelClasses}>Summary *</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputClasses} min-h-[120px] resize-none`}
                placeholder="Briefly describe the role and its impact..."
              />
            </div>

            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>Responsibilities (one per line)</label>
                <textarea
                  rows={6}
                  value={formData.responsibilities.join("\n")}
                  onChange={(e) => handleArrayFieldChange("responsibilities", e.target.value)}
                  className={`${inputClasses} min-h-[180px] font-mono text-[13px]`}
                  placeholder="Build user-facing features\nOptimize performance\nCollaborate with design teams"
                />
              </div>
              <div>
                <label className={labelClasses}>Requirements (one per line)</label>
                <textarea
                  rows={6}
                  value={formData.requirements.join("\n")}
                  onChange={(e) => handleArrayFieldChange("requirements", e.target.value)}
                  className={`${inputClasses} min-h-[180px] font-mono text-[13px]`}
                  placeholder="3+ years of React experience\nStrong TypeScript skills\nExcellent communication"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Compensation & Benefits */}
        <section className="relative z-20 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 sm:p-8 backdrop-blur-sm shadow-sm dark:shadow-none">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compensation & Perks</h3>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
              <div>
                <label className={labelClasses}>Min Salary</label>
                <input
                  type="number"
                  value={formData.salary.min || ""}
                  onChange={(e) => setFormData({ ...formData, salary: { ...formData.salary, min: e.target.value ? Number(e.target.value) : null } })}
                  className={inputClasses}
                  placeholder="e.g. 1200000"
                />
              </div>
              <div>
                <label className={labelClasses}>Max Salary</label>
                <input
                  type="number"
                  value={formData.salary.max || ""}
                  onChange={(e) => setFormData({ ...formData, salary: { ...formData.salary, max: e.target.value ? Number(e.target.value) : null } })}
                  className={inputClasses}
                  placeholder="e.g. 1800000"
                />
              </div>
              <div>
                <label className={labelClasses}>Currency</label>
                <GlassySelect
                  value={formData.salary.currency}
                  onChange={(v) => setFormData({ ...formData, salary: { ...formData.salary, currency: v } })}
                  options={CURRENCIES}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>Benefits (one per line)</label>
                <textarea
                  rows={4}
                  value={formData.benefits.join("\n")}
                  onChange={(e) => handleArrayFieldChange("benefits", e.target.value)}
                  className={`${inputClasses} min-h-[120px]`}
                  placeholder="Health Insurance\nPaid Time Off\nStock Options"
                />
              </div>
              <div>
                <label className={labelClasses}>Nice to Have (one per line)</label>
                <textarea
                  rows={4}
                  value={formData.niceToHave.join("\n")}
                  onChange={(e) => handleArrayFieldChange("niceToHave", e.target.value)}
                  className={`${inputClasses} min-h-[120px]`}
                  placeholder="Experience with Next.js\nOpen source contributions"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Application & Status */}
        <section className="relative z-10 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 sm:p-8 backdrop-blur-sm shadow-sm dark:shadow-none">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Application & Settings</h3>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Apply Email</label>
              <input
                type="email"
                value={formData.applyEmail}
                onChange={(e) => setFormData({ ...formData, applyEmail: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Apply URL (Optional)</label>
              <input
                type="url"
                value={formData.applyUrl}
                onChange={(e) => setFormData({ ...formData, applyUrl: e.target.value })}
                className={inputClasses}
                placeholder="https://career-portal.com/..."
              />
            </div>

            <div>
              <label className={labelClasses}>Status</label>
              <GlassySelect
                value={formData.status}
                onChange={(v) => setFormData({ ...formData, status: v })}
                options={[
                  { value: "draft", label: "Draft (Internal Only)" },
                  { value: "published", label: "Published (Live)" },
                  { value: "closed", label: "Closed (Archived)" },
                ]}
              />
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div>
                <label className={labelClasses}>Openings</label>
                <input
                  type="number"
                  min="1"
                  value={formData.openings}
                  onChange={(e) => setFormData({ ...formData, openings: Number(e.target.value) })}
                  className={inputClasses.replace("w-full", "w-28") + " px-2 text-center"}
                />
              </div>
              <div className="pt-6">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-white/80">Feature this role</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <button
            type="button"
            onClick={() => onCancel ? onCancel() : router.back()}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-6 py-3 sm:px-8 sm:py-4 text-sm font-bold text-slate-900 dark:text-white transition-all hover:bg-slate-200 dark:hover:bg-white/10 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 sm:px-8 sm:py-4 text-sm font-bold text-white shadow-xl shadow-cyan-900/20 transition-all hover:scale-[1.02] hover:opacity-90 active:scale-100 disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Saving..." : isEditing ? "Update Job Posting" : "Publish Career"}
          </button>
        </div>
      </div>
    </form>
  );
}
