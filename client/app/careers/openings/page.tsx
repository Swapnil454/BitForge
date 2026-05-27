"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const CustomDropdown = ({
  options,
  value,
  onChange,
  label,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  label: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-black/40 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm dark:shadow-none"
      >
        <span>{selectedOption?.label}</span>
        <svg className={`h-4 w-4 text-slate-500 dark:text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f111a] py-1 shadow-lg dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                value === option.value ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300 font-medium' : 'text-slate-700 dark:text-white/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
}

export default function AllOpeningsPage() {
  const { isAuthenticated } = useAuth();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");
  const [employmentType, setEmploymentType] = useState("all");
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        setLoading(true);
        const response = await api.get("/careers");
        setCareers(response.data.data || []);
      } catch (error) {
        console.error("Error fetching careers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCareers();
  }, []);

  // Responsive page size: 8 on desktop, 4 on small screens
  useEffect(() => {
    const updatePageSize = () => {
      if (typeof window === "undefined") return;
      setPageSize(window.innerWidth < 640 ? 4 : 8);
    };
    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  const departments = useMemo(
    () => Array.from(new Set(careers.map((c) => c.department))).sort(),
    [careers]
  );
  const locations = useMemo(
    () => Array.from(new Set(careers.map((c) => c.location))).sort(),
    [careers]
  );
  const employmentTypes = useMemo(
    () => Array.from(new Set(careers.map((c) => c.employmentType))).sort(),
    [careers]
  );

  const filteredCareers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const base = careers.filter((c) => {
      const matchesDept = department === "all" || c.department === department;
      const matchesLocation = location === "all" || c.location === location;
      const matchesType = employmentType === "all" || c.employmentType === employmentType;

      const matchesSearch =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query);

      return matchesDept && matchesLocation && matchesType && matchesSearch;
    });

    // Sort newest first (fallback to API order if no createdAt)
    return [...base].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [careers, search, department, location, employmentType]);

  const totalRoles = filteredCareers.length;
  const totalPages = Math.max(1, Math.ceil(totalRoles / pageSize) || 1);

  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const currentPageCareers = filteredCareers.slice(startIndex, startIndex + pageSize);

  const from = totalRoles === 0 ? 0 : startIndex + 1;
  const to = startIndex + currentPageCareers.length;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formatSalary = (career: Career) => {
    if (!career.salary?.min || !career.salary?.max) return null;
    
    if (career.salary.currency === "INR") {
      const isLpaDirect = career.salary.max < 1000;
      const minLpa = isLpaDirect ? career.salary.min : career.salary.min / 100000;
      const maxLpa = isLpaDirect ? career.salary.max : career.salary.max / 100000;
      const fmt = (v: number) =>
        v % 1 === 0 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, "");
      return `₹${fmt(minLpa)}–₹${fmt(maxLpa)} LPA`;
    }

    return `${career.salary.currency} ${career.salary.min.toLocaleString()} - ${career.salary.max.toLocaleString()} per year`;
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05050a]/80 backdrop-blur-xl">
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
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 dark:border-white/20 px-3 py-1.5 text-slate-700 dark:text-white/80 hover:border-cyan-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="hidden rounded-lg bg-cyan-600 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white dark:text-black shadow-md dark:shadow-[0_0_26px_rgba(56,189,248,0.7)] hover:bg-cyan-700 dark:hover:bg-transparent sm:inline-flex"
                >
                  Join BitForge
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-lg bg-cyan-600 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white dark:text-black shadow-md dark:shadow-[0_0_26px_rgba(56,189,248,0.7)] hover:bg-cyan-700 dark:hover:bg-transparent"
              >
                Dashboard
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-70">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-8rem] h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative -mt-6 z-10 mx-auto max-w-6xl px-5 pb-12 pt-20 sm:pt-24 md:pt-28 md:pb-16">
        {/* HEADER SECTION */}
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            Careers
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-[40px]">
            All Open Positions
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-600 dark:text-white/70 sm:text-base">
            Browse all currently open roles at BitForge. Use search and filters to quickly find
            positions that match your skills, location, and preferred way of working.
          </p>
        </section>

        {/* SEARCH & FILTERS */}
        <section className="mt-10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-1.5">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by job title or keyword"
                  className="w-full rounded-lg border border-white/15 bg-white dark:bg-black/40 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-white/55 sm:text-[11px] sm:items-end">
              <span>
                Showing {from}-{to} of {totalRoles} role{totalRoles === 1 ? "" : "s"}
              </span>
              <span className="text-slate-500 dark:text-white/40">
                Use filters to narrow down by department, location, or employment type.
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <CustomDropdown
              label="Department"
              value={department}
              options={[
                { label: "All departments", value: "all" },
                ...departments.map((d) => ({ label: d, value: d }))
              ]}
              onChange={(val) => {
                setDepartment(val);
                setCurrentPage(1);
              }}
            />

            <CustomDropdown
              label="Location"
              value={location}
              options={[
                { label: "All locations", value: "all" },
                ...locations.map((l) => ({ label: l, value: l }))
              ]}
              onChange={(val) => {
                setLocation(val);
                setCurrentPage(1);
              }}
            />

            <CustomDropdown
              label="Employment Type"
              value={employmentType}
              options={[
                { label: "All types", value: "all" },
                ...employmentTypes.map((t) => ({ label: t, value: t }))
              ]}
              onChange={(val) => {
                setEmploymentType(val);
                setCurrentPage(1);
              }}
            />
          </div>
        </section>

        {/* JOB LIST */}
        <section className="mt-10">
          {loading ? (
            <div className="mt-4 text-center py-16 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
              <div className="text-slate-500 dark:text-white/60">Loading open positions...</div>
            </div>
          ) : totalRoles === 0 ? (
            <div className="mt-4 text-center py-16 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
              <div className="text-4xl mb-4">💼</div>
              <p className="text-slate-500 dark:text-white/60 mb-2">No open positions match your filters.</p>
              <p className="text-white/50 text-sm">
                Try clearing some filters or checking back a little later.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {currentPageCareers.map((career) => (
                  <Link
                    key={career._id}
                    href={`/careers/${generateSlug(career.title)}`}
                    className="block rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 p-4 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                          {career.title}
                        </h3>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-white/60">
                          {career.location} · {career.department}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-200/90 whitespace-nowrap">
                        {career.featured ? "⭐ Featured" : "Open"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-600 dark:text-white/70 line-clamp-2">
                      {career.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-white/60">
                      <span className="rounded-full bg-white dark:bg-black/40 px-2.5 py-1">
                        {career.employmentType}
                      </span>
                      {formatSalary(career) && (
                        <span className="rounded-full bg-white dark:bg-black/40 px-2.5 py-1">
                          {formatSalary(career)}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-white/55">
                        {career.openings} open position{career.openings === 1 ? "" : "s"}
                      </span>
                      <span className="text-cyan-600 dark:text-cyan-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-200 flex items-center gap-1">
                        View details
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <div className="text-xs text-slate-500 dark:text-white/60">
                    Page {currentPageSafe} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPageSafe - 1)}
                      disabled={currentPageSafe === 1}
                      className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white/80 disabled:opacity-40 disabled:cursor-not-allowed hover:border-cyan-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const page = idx + 1;
                      const isActive = page === currentPageSafe;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-xs border text-slate-700 dark:text-white/80 hover:border-cyan-400 hover:text-slate-900 dark:hover:text-white ${
                            isActive ? "border-cyan-400 bg-cyan-500/20" : "border-slate-300 dark:border-white/20 bg-transparent"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPageSafe + 1)}
                      disabled={currentPageSafe === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white/80 disabled:opacity-40 disabled:cursor-not-allowed hover:border-cyan-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* BACK LINK */}
        <section className="mt-12">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
          >
            <span>←</span>
            <span>Back to careers overview</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
