"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { contactAPI } from "@/lib/api";
import { ChevronDown } from "lucide-react";

const ENQUIRY_OPTIONS = [
  { value: "support", label: "Product or order support" },
  { value: "sales", label: "Sales / using BitForge at your company" },
  { value: "partnerships", label: "Partnerships or integrations" },
  { value: "other", label: "Something else" },
];

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Custom dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(ENQUIRY_OPTIONS[0].value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!success) return;

    const timeoutId = setTimeout(() => {
      setSuccess(null);
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [success]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const type = selectedType; // Use custom state instead of formData
    const message = (formData.get("message") as string)?.trim();

    if (!name || !email || !message) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setSuccess(null);
    setSubmitting(true);

    try {
      // Notify admins via backend notifications
      await contactAPI.submitMessage({ name, email, type, message });

      toast.success("Your message has been sent to the BitForge team.");
      setSuccess("Thanks! Our team will get back within 1 business day.");
      form.reset();
      setSelectedType(ENQUIRY_OPTIONS[0].value);
    } catch (error) {
      console.error("Contact submit error", error);
      toast.error("We could not submit the form. Please email help@bittforge.in directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyles = "rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-white/35 focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-cyan-400 transition-shadow";

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-5 text-sm text-slate-700 dark:text-white/80">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white/60">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            className={inputStyles}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white/60">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={inputStyles}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5" ref={dropdownRef}>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white/60">
          Enquiry type
        </label>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`${inputStyles} w-full text-left flex items-center justify-between ${dropdownOpen ? 'border-indigo-500 ring-1 ring-indigo-500 dark:border-cyan-400 dark:ring-cyan-400' : ''}`}
          >
            <span className="block truncate">
              {ENQUIRY_OPTIONS.find((o) => o.value === selectedType)?.label}
            </span>
            <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0f0f13] py-1 shadow-lg shadow-black/5 dark:shadow-black/40 overflow-hidden text-sm animate-in fade-in slide-in-from-top-1">
              {ENQUIRY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    selectedType === option.value 
                      ? "bg-indigo-50/70 dark:bg-cyan-500/10 text-indigo-700 dark:text-cyan-400 font-semibold" 
                      : "text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 font-medium"
                  }`}
                  onClick={() => {
                    setSelectedType(option.value);
                    setDropdownOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white/60">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Share context such as order ID, product link, or what you are trying to achieve."
          className={`resize-none ${inputStyles}`}
        />
      </div>

      <p className="text-[11px] text-slate-500 dark:text-white/45">
        By submitting, you agree that BitForge may use this information to respond to your enquiry.
        For details, see our Privacy Policy in the Legal section.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-cyan-400 dark:to-indigo-500 px-6 py-3 text-sm font-bold text-white dark:text-black shadow-lg shadow-indigo-500/25 dark:shadow-[0_0_28px_rgba(56,189,248,0.7)] hover:shadow-indigo-500/40 dark:hover:brightness-110 transition-all disabled:opacity-60"
      >
        {submitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black" />
        )}
        <span>{submitting ? "Sending..." : "Submit enquiry"}</span>
      </button>

      {success && (
        <p className="mt-2 text-[12px] font-medium text-emerald-600 dark:text-emerald-300/90">
          {success}
        </p>
      )}
    </form>
  );
}
