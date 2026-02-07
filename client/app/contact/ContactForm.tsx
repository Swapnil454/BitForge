"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { contactAPI } from "@/lib/api";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;

    const timeoutId = setTimeout(() => {
      setSuccess(null);
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [success]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const type = (formData.get("type") as string) || "support";
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
    } catch (error) {
      console.error("Contact submit error", error);
      toast.error("We could not submit the form. Please email help@bitforge.in directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4 text-sm text-white/80">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-medium uppercase tracking-wide text-white/60">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-white/35 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-white/60">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-white/35 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="type" className="text-xs font-medium uppercase tracking-wide text-white/60">
          Enquiry type
        </label>
        <select
          id="type"
          name="type"
          className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          defaultValue="support"
        >
          <option value="support">Product or order support</option>
          <option value="sales">Sales / using BitForge at your company</option>
          <option value="partnerships">Partnerships or integrations</option>
          <option value="other">Something else</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-xs font-medium uppercase tracking-wide text-white/60">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Share context such as order ID, product link, or what you are trying to achieve."
          className="resize-none rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-white/35 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        />
      </div>

      <p className="text-[11px] text-white/45">
        By submitting, you agree that BitForge may use this information to respond to your enquiry.
        For details, see our Privacy Policy in the Legal section.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_28px_rgba(56,189,248,0.7)] hover:brightness-110 disabled:opacity-60"
      >
        {submitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
        )}
        <span>{submitting ? "Sending..." : "Submit enquiry"}</span>
      </button>

      {success && (
        <p className="mt-2 text-[12px] text-emerald-300/90">
          {success}
        </p>
      )}
    </form>
  );
}
