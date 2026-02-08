"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
}

export default function AllOpeningsPage() {
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
    return `${career.salary.currency} ${career.salary.min.toLocaleString()} - ${career.salary.max.toLocaleString()} per year`;
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

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

      <div className="relative -mt-6 z-10 mx-auto max-w-6xl px-5 pb-20 pt-24 sm:pt-28 md:pt-32 md:pb-28">
        {/* HEADER SECTION */}
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            Careers
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-[40px]">
            All Open Positions
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
            Browse all currently open roles at BitForge. Use search and filters to quickly find
            positions that match your skills, location, and preferred way of working.
          </p>
        </section>

        {/* SEARCH & FILTERS */}
        <section className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <label className="block text-xs font-medium text-white/60 mb-1.5">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by job title or keyword"
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-white/55 sm:text-[11px] sm:items-end">
              <span>
                Showing {from}-{to} of {totalRoles} role{totalRoles === 1 ? "" : "s"}
              </span>
              <span className="text-white/40">
                Use filters to narrow down by department, location, or employment type.
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Department</label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">All departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Location</label>
              <select
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">All locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">All types</option>
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* JOB LIST */}
        <section className="mt-10">
          {loading ? (
            <div className="mt-4 text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
              <div className="text-white/60">Loading open positions...</div>
            </div>
          ) : totalRoles === 0 ? (
            <div className="mt-4 text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
              <div className="text-4xl mb-4">💼</div>
              <p className="text-white/60 mb-2">No open positions match your filters.</p>
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
                    className="block rounded-2xl border border-white/12 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold group-hover:text-cyan-300 transition-colors">
                          {career.title}
                        </h3>
                        <p className="mt-1 text-[11px] text-white/60">
                          {career.location} · {career.department}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-200/90 whitespace-nowrap">
                        {career.featured ? "⭐ Featured" : "Open"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-white/70 line-clamp-2">
                      {career.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/60">
                      <span className="rounded-full bg-black/40 px-2.5 py-1">
                        {career.employmentType}
                      </span>
                      {formatSalary(career) && (
                        <span className="rounded-full bg-black/40 px-2.5 py-1">
                          {formatSalary(career)}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-white/55">
                        {career.openings} open position{career.openings === 1 ? "" : "s"}
                      </span>
                      <span className="text-cyan-300 group-hover:text-cyan-200 flex items-center gap-1">
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
                  <div className="text-xs text-white/60">
                    Page {currentPageSafe} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPageSafe - 1)}
                      disabled={currentPageSafe === 1}
                      className="px-3 py-1.5 rounded-lg text-xs border border-white/20 text-white/80 disabled:opacity-40 disabled:cursor-not-allowed hover:border-cyan-400 hover:text-white"
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
                          className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-xs border text-white/80 hover:border-cyan-400 hover:text-white ${
                            isActive ? "border-cyan-400 bg-cyan-500/20" : "border-white/20 bg-transparent"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPageSafe + 1)}
                      disabled={currentPageSafe === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs border border-white/20 text-white/80 disabled:opacity-40 disabled:cursor-not-allowed hover:border-cyan-400 hover:text-white"
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
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>←</span>
            <span>Back to careers overview</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
