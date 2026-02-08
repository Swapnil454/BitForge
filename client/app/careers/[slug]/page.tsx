"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import api from "@/lib/api";

interface Career {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experience: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  benefits?: string[];
  salary?: {
    min: number | null;
    max: number | null;
    currency: string;
  };
  status: string;
  applyUrl?: string;
  applyEmail?: string;
  featured: boolean;
  openings: number;
  createdAt?: string;
  updatedAt?: string;
}

const getCurrencySymbol = (currency: string) => {
  if (!currency) return "";
  const cur = currency.toUpperCase();
  if (cur === "INR" || cur === "₹") return "₹";
  if (cur === "USD" || cur === "$") return "$";
  if (cur === "EUR" || cur === "€") return "€";
  return currency;
};

export default function JobDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [career, setCareer] = useState<Career | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedJobs, setRelatedJobs] = useState<Career[]>([]);

  useEffect(() => {
    fetchJobDetail();
  }, [slug]);

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      
      // Fetch all careers and find the one matching the slug
      const response = await api.get("/careers");
      const allCareers = response.data.data || [];
      
      // Generate slug from title and find matching career
      const job = allCareers.find((c: Career) => generateSlug(c.title) === slug);
      
      if (!job) {
        notFound();
        return;
      }
      
      setCareer(job);
      
      // Find related jobs in the same department
      const related = allCareers
        .filter((c: Career) => c.department === job.department && c._id !== job._id)
        .slice(0, 3);
      setRelatedJobs(related);
      
    } catch (error) {
      console.error("Error fetching job detail:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleApply = () => {
    if (career?.applyUrl) {
      window.open(career.applyUrl, "_blank");
    } else {
      const email = career?.applyEmail || "careers@bitforge.in";
      const subject = `Application: ${career?.title}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    }
  };

  if (loading) {
    return (
      <main className="relative min-h-screen bg-[#05050a] text-white">
        <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 border-b border-white/10 bg-[#05050a]/80 backdrop-blur-xl">
          <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/bitforge_logo1.png"
                alt="BitForge"
                width={40}
                height={40}
                className="h-10 w-auto drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]"
              />
              <span className="-ml-3 text-lg font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                BitForge
              </span>
            </Link>
          </nav>
        </header>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white/60">Loading job details...</div>
        </div>
      </main>
    );
  }

  if (!career) {
    return notFound();
  }

  return (
    <main className="relative min-h-screen bg-[#05050a] text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 border-b border-white/10 bg-[#05050a]/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/bitforge_logo1.png"
                alt="BitForge"
                width={40}
                height={40}
                className="h-10 w-auto drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]"
              />
              <span className="-ml-3 text-lg font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                BitForge
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-3 py-1.5 text-white/80 hover:border-cyan-400 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="hidden rounded-lg bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-black shadow-[0_0_26px_rgba(56,189,248,0.7)] sm:inline-flex"
            >
              Join BitForge
            </Link>
          </div>
        </nav>
      </header>

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-70">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-8rem] h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative -mt-8 z-10 mx-auto max-w-5xl px-5 pb-16 pt-24 sm:pt-28 md:pt-32">
        {/* BREADCRUMB */}
        <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
          <Link href="/" className="hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]">
            Home
          </Link>
          <span>›</span>
          <Link href="/careers" className="hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]">
            Careers
          </Link>
          <span>›</span>
          <span className="text-white">{career.title}</span>
        </div>

        {/* JOB HEADER - Clean design */}
        <div className="mb-8">
          {career.featured && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-purple-500 px-3 py-1 text-xs font-semibold text-white">
              Featured role
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-white md:text-5xl mb-4 leading-tight">
            {career.title}
          </h1>
          <p className="text-white/70 text-base mb-4 max-w-3xl">
            We are looking for a motivated professional to join our team and help us build the future of digital commerce.
          </p>

          {/* Job Meta Info - Clean inline badges */}
          <div className="flex flex-wrap gap-3 mb-4 text-sm text-white/80">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-white/70">Location:</span>
              <span className="text-white">{career.location}</span>
            </div>
            <div className="h-4 w-px bg-white/20"></div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-white/70">Team:</span>
              <span className="text-white">{career.department}</span>
            </div>
            <div className="h-4 w-px bg-white/20"></div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-white/70">Type:</span>
              <span className="text-white">{career.employmentType}</span>
            </div>
            <div className="h-4 w-px bg-white/20"></div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-white/70">Experience:</span>
              <span className="text-white">{career.experience}</span>
            </div>
            {career.salary?.min && career.salary?.max && (
              <>
                <div className="h-4 w-px bg-white/20"></div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-white/70">Salary range:</span>
                  <span className="text-emerald-300 font-semibold">
                    {getCurrencySymbol(career.salary.currency)} {career.salary.min.toLocaleString()} - {career.salary.max.toLocaleString()} per year (CTC)
                  </span>
                </div>
              </>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-r from-cyan-500 to-indigo-500 px-8 py-3.5 text-base font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
            >
              <span>Apply Now</span>
              <span>→</span>
            </button>
            <button
              onClick={() => {
                const text = `Check out this job at BitForge: ${career.title}\n${window.location.href}`;
                if (navigator.share) {
                  navigator.share({ title: career.title, text, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
            >
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        {/* JOB DETAILS */}
        <div className="space-y-8">
          {/* DESCRIPTION */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              About This Role
            </h2>
            <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">
              {career.description}
            </p>
          </section>

          {/* RESPONSIBILITIES */}
          {career.responsibilities && career.responsibilities.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                What You&apos;ll Do
              </h2>
              <ul className="space-y-2">
                {career.responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-white/90 leading-relaxed">
                    <span className="mt-2 h-2 w-2 rounded-full bg-gray-200 shrink-0" />
                    <span className="text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* REQUIREMENTS */}
          {career.requirements && career.requirements.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                Requirements
              </h2>
              <ul className="space-y-2">
                {career.requirements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-white/90 leading-relaxed">
                    <span className="mt-2 h-2 w-2 rounded-full bg-gray-200 shrink-0" />
                    <span className="text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* NICE TO HAVE */}
          {career.niceToHave && career.niceToHave.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                Nice to Have
              </h2>
              <ul className="space-y-2">
                {career.niceToHave.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-white/80 leading-relaxed">
                    <span className="mt-2 h-2 w-2 rounded-full bg-gray-200 shrink-0" />
                    <span className="text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* BENEFITS */}
          {career.benefits && career.benefits.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                Benefits &amp; Perks
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {career.benefits.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-gray-200 shrink-0" />
                    <span className="text-white/90 text-base leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ABOUT COMPANY */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              About BitForge
            </h2>
            <p className="text-white/80 text-base leading-relaxed mb-2">
              BitForge builds modern infrastructure for creators and businesses selling digital products.
            </p>
            <p className="text-white/70 text-base leading-relaxed">
              We are a remote-friendly team that moves fast, cares deeply about our customers, and gives people the
              autonomy to do the best work of their careers.
            </p>
          </section>

          {/* RELATED JOBS */}
          {relatedJobs.length > 0 && (
            <section className="pt-8 mt-8 border-t border-white/15">
              <h2 className="text-xl font-semibold text-white mb-4">
                Similar Positions
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {relatedJobs.map((job) => (
                  <Link
                    key={job._id}
                    href={`/careers/${generateSlug(job.title)}`}
                    className="block rounded-lg bg-white/5 p-4 hover:bg-cyan-500/10 transition-all group border border-white/15 hover:border-cyan-400 hover:-translate-y-0.5"
                  >
                    <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                      {job.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <span>{job.department}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* APPLY CTA */}
          <section className="mt-10 pt-8 border-t border-white/15 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">Interested in This Position?</h2>
              <p className="text-white/80 text-base mb-3">
                Apply now and join our team building the future of digital commerce. 
                We review all applications carefully and typically respond within 3-5 business days.
              </p>
              <p className="text-white/70 text-sm mb-6">
                We encourage candidates from all backgrounds to apply, even if you don&apos;t meet every single requirement.
              </p>
              <button
                onClick={handleApply}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-r from-cyan-500 to-indigo-500 px-10 py-3.5 text-base font-semibold text-white hover:shadow-xl hover:shadow-cyan-500/30 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
              >
                <span>Submit Application</span>
                <span>→</span>
              </button>
              <div className="mt-8">
                <p className="text-sm text-white/70">
                  Have questions?{" "}
                  <a
                    href="mailto:careers@bitforge.in"
                    className="text-cyan-400 hover:text-cyan-300 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
                  >
                    Contact us at careers@bitforge.in
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* BACK TO CAREERS */}
        <div className="mt-10">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
          >
            <span>←</span>
            <span>View all openings</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
