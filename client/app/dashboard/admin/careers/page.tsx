"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassySelect from "./components/GlassySelect";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

const DEFAULT_DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Operations",
  "Marketing",
  "Sales",
  "Support",
  "Other",
];
const DEFAULT_EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const DEFAULT_EXPERIENCE_LEVELS = ["0-2 years", "2-5 years", "5-8 years", "8+ years"];
const DEFAULT_LOCATIONS = ["Remote", "Hybrid", "On-site"];

interface Career {
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
  createdAt?: string;
  updatedAt?: string;
}

interface Stats {
  byStatus: Array<{ _id: string; count: number }>;
  byDepartment: Array<{ _id: string; count: number }>;
}

const mergeUniqueSorted = (values: Array<string | undefined | null>) =>
  Array.from(
    new Set(
      values
        .map((value) => (value ?? "").trim())
        .filter((value) => value !== "")
    )
  ).sort((a, b) => a.localeCompare(b));

const normalizeValue = (value: string) => value.trim().toLowerCase();

export default function AdminCareersPage() {
  const router = useRouter();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState<Stats | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterEmploymentType, setFilterEmploymentType] = useState("all");
  const [filterExperience, setFilterExperience] = useState("all");
  const [filterFeatured, setFilterFeatured] = useState("all");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);

  useEffect(() => {
    fetchCareers();
    fetchStats();
  }, [filterStatus]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => careers.some((career) => career._id === id)));
    setOpenMenuId(null);
    setIsBulkMenuOpen(false);
  }, [careers]);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const response = await api.get(`/careers/admin/all${params}`);
      setCareers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching careers:", error);
      showError("Failed to fetch careers");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/careers/admin/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this career?")) return;

    try {
      await api.delete(`/careers/admin/${id}`);
      showSuccess("Career deleted successfully");
      fetchCareers();
      fetchStats();
    } catch (error) {
      console.error("Error deleting career:", error);
      showError("Failed to delete career");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === "closed") {
      const confirmed = confirm("This will hide this role from public careers pages. Continue?");
      if (!confirmed) return;
    }
    try {
      await api.patch(`/careers/admin/${id}/status`, { status: newStatus });
      showSuccess(`Career ${newStatus} successfully`);
      fetchCareers();
      fetchStats();
    } catch (error) {
      console.error("Error updating status:", error);
      showError("Failed to update status");
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction) {
      showError("Select a bulk action to apply");
      return;
    }
    if (selectedIds.length === 0) {
      showError("Select at least one job");
      return;
    }

    if (bulkAction === "delete") {
      const confirmed = confirm(
        `Delete ${selectedIds.length} role${selectedIds.length === 1 ? "" : "s"}? This cannot be undone.`
      );
      if (!confirmed) return;
    }

    if (bulkAction === "close") {
      const confirmed = confirm(
        `Close ${selectedIds.length} role${selectedIds.length === 1 ? "" : "s"}? This will hide them from public careers pages.`
      );
      if (!confirmed) return;
    }

    try {
      if (bulkAction === "publish" || bulkAction === "draft" || bulkAction === "close") {
        const status = bulkAction === "close" ? "closed" : bulkAction === "publish" ? "published" : "draft";
        await Promise.all(
          selectedIds.map((id) => api.patch(`/careers/admin/${id}/status`, { status }))
        );
      } else if (bulkAction === "feature" || bulkAction === "unfeature") {
        await Promise.all(
          selectedIds.map((id) => {
            const career = careers.find((c) => c._id === id);
            if (!career) return Promise.resolve();
            return api.put(`/careers/admin/${id}`, { ...career, featured: bulkAction === "feature" });
          })
        );
      } else if (bulkAction === "delete") {
        await Promise.all(selectedIds.map((id) => api.delete(`/careers/admin/${id}`)));
      }

      showSuccess("Bulk action applied successfully");
      setSelectedIds([]);
      setBulkAction("");
      fetchCareers();
      fetchStats();
    } catch (error) {
      console.error("Error applying bulk action:", error);
      showError("Failed to apply bulk action");
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
      case "draft":
        return "text-yellow-300 bg-yellow-500/10 border-yellow-500/30";
      case "closed":
        return "text-red-300 bg-red-500/10 border-red-500/30";
      default:
        return "text-white/60 bg-white/5 border-white/10";
    }
  };

  const getStatusTooltip = (status: string) => {
    switch (status) {
      case "published":
        return "Published · Visible on public careers pages";
      case "draft":
        return "Draft · Not yet visible to candidates";
      case "closed":
        return "Closed · Hidden from public careers pages";
      default:
        return "";
    }
  };

  const formatStatusLabel = (status: string) => {
    if (status === "published") return "Published";
    if (status === "draft") return "Draft";
    if (status === "closed") return "Closed";
    return status;
  };

  const getStatusCount = (status: string) => {
    if (!stats) return 0;
    const stat = stats.byStatus.find(s => s._id === status);
    return stat ? stat.count : 0;
  };

  const formatSalaryAdmin = (salary: { min: number | null; max: number | null; currency: string }) => {
    if (!salary || !salary.min || !salary.max) return "";
    if (salary.currency === "INR") {
      const minLpa = salary.min / 100000;
      const maxLpa = salary.max / 100000;
      const fmt = (v: number) =>
        v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "");
      return `₹${fmt(minLpa)}–₹${fmt(maxLpa)} LPA`;
    }
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()} per year`;
  };

  const formatDate = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatRelativeDays = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const departmentOptions = mergeUniqueSorted([
    ...DEFAULT_DEPARTMENTS,
    ...(stats?.byDepartment?.map((dept) => dept._id) ?? []),
    ...careers.map((career) => career.department),
  ]);
  const locationOptions = mergeUniqueSorted([
    ...DEFAULT_LOCATIONS,
    ...careers.map((career) => career.location),
  ]);
  const employmentTypeOptions = mergeUniqueSorted([
    ...DEFAULT_EMPLOYMENT_TYPES,
    ...careers.map((career) => career.employmentType),
  ]);
  const experienceOptions = mergeUniqueSorted([
    ...DEFAULT_EXPERIENCE_LEVELS,
    ...careers.map((career) => career.experience),
  ]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    filterDepartment !== "all" ||
    filterLocation !== "all" ||
    filterEmploymentType !== "all" ||
    filterExperience !== "all" ||
    filterFeatured !== "all" ||
    filterStatus !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterDepartment("all");
    setFilterLocation("all");
    setFilterEmploymentType("all");
    setFilterExperience("all");
    setFilterFeatured("all");
    setFilterStatus("all");
  };

  const getBulkActionLabel = (value: string) => {
    switch (value) {
      case "publish":
        return "Publish";
      case "draft":
        return "Unpublish";
      case "feature":
        return "Mark featured";
      case "unfeature":
        return "Remove featured";
      case "close":
        return "Close roles";
      case "delete":
        return "Delete";
      default:
        return "Bulk actions";
    }
  };

  const filteredCareers = careers.filter((career) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      career.title.toLowerCase().includes(query) ||
      career.description.toLowerCase().includes(query);

    const matchesDept =
      filterDepartment === "all" ||
      normalizeValue(career.department) === normalizeValue(filterDepartment);
    const matchesLocation =
      filterLocation === "all" ||
      normalizeValue(career.location) === normalizeValue(filterLocation);
    const matchesType =
      filterEmploymentType === "all" ||
      normalizeValue(career.employmentType) === normalizeValue(filterEmploymentType);
    const matchesExperience =
      filterExperience === "all" ||
      normalizeValue(career.experience) === normalizeValue(filterExperience);
    const matchesFeatured =
      filterFeatured === "all" ||
      (filterFeatured === "featured" ? career.featured : !career.featured);

    return (
      matchesSearch &&
      matchesDept &&
      matchesLocation &&
      matchesType &&
      matchesExperience &&
      matchesFeatured
    );
  });

  const newTodayCount = careers.filter((career) => {
    if (!career.createdAt) return false;
    const created = new Date(career.createdAt);
    const now = new Date();
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  }).length;

  const isAllSelected =
    filteredCareers.length > 0 &&
    filteredCareers.every((career) => selectedIds.includes(career._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCareers.map((c) => c._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        title="Careers Management"
        subtitle="Manage job openings"
        rightSlot={
          <Link
            href="/dashboard/admin/careers/create"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-2.5 text-[11px] font-semibold text-white shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-opacity hover:opacity-90 sm:h-auto sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm sm:shadow-[0_0_18px_rgba(56,189,248,0.45)]"
          >
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">Create New Job</span>
          </Link>
        }
      />

      <div className="px-4 py-3 pb-16 sm:px-6 sm:py-5 sm:pb-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 p-0">
            {/* Stats */}
            {stats && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold tracking-wide text-white/90">Overview</h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                    <div className="text-lg font-bold text-emerald-400">{getStatusCount("published")}</div>
                    <div className="mt-0 text-[10px] text-white/50">Live</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                    <div className="text-lg font-bold text-yellow-400">{getStatusCount("draft")}</div>
                    <div className="mt-0 text-[10px] text-white/50">Drafts</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                    <div className="text-lg font-bold text-red-400">{getStatusCount("closed")}</div>
                    <div className="mt-0 text-[10px] text-white/50">Closed</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                    <div className="text-lg font-bold text-cyan-400">{careers.length}</div>
                    <div className="mt-0 text-[10px] text-white/50">Total</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-1 text-[11px] text-white/60 sm:grid-cols-2">
                  <span>New roles created today: {newTodayCount}</span>
                  <span>Average response time: 3–5 business days</span>
                </div>
              </div>
            )}

            {/* Status filters */}
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="col-span-2 mb-0.5 sm:col-span-2 lg:col-span-4">
                <h3 className="text-sm font-semibold tracking-wide text-white/90">Status</h3>
              </div>
              {["all", "published", "draft", "closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    filterStatus === status
                      ? "border border-cyan-400/60 bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-cyan-200 shadow-md shadow-cyan-900/20"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
              </div>
            </div>

            {/* Search + advanced filters */}
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <div className="mb-2">
                <h3 className="text-sm font-semibold tracking-wide text-white/90">Search & Filters</h3>
              </div>
              <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.5fr)_repeat(5,minmax(125px,1fr))] lg:items-end">
                <div className="lg:min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Search jobs</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by job title or keyword"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs lg:grid-cols-2 xl:contents">
                  <div className="lg:min-w-0 xl:min-w-[160px]">
                    <label className="mb-1 block text-[11px] font-medium text-white/60">Department</label>
                    <GlassySelect
                      value={filterDepartment}
                      onChange={(v) => setFilterDepartment(v)}
                      options={[
                        { value: "all", label: "All" },
                        ...departmentOptions.map((dept) => ({ value: dept, label: dept })),
                      ]}
                    />
                  </div>
                  <div className="lg:min-w-0 xl:min-w-[190px]">
                    <label className="mb-1 block text-[11px] font-medium text-white/60">Location</label>
                    <GlassySelect
                      value={filterLocation}
                      onChange={(v) => setFilterLocation(v)}
                      buttonClassName="py-3 text-[15px]"
                      options={[
                        { value: "all", label: "All" },
                        ...locationOptions.map((loc) => ({ value: loc, label: loc })),
                      ]}
                    />
                  </div>
                  <div className="lg:min-w-0 xl:min-w-[170px]">
                    <label className="mb-1 block text-[11px] font-medium text-white/60">Employment type</label>
                    <GlassySelect
                      value={filterEmploymentType}
                      onChange={(v) => setFilterEmploymentType(v)}
                      options={[
                        { value: "all", label: "All" },
                        ...employmentTypeOptions.map((t) => ({ value: t, label: t })),
                      ]}
                    />
                  </div>
                  <div className="lg:min-w-0 xl:min-w-[190px]">
                    <label className="mb-1 block text-[11px] font-medium text-white/60">Experience</label>
                    <GlassySelect
                      value={filterExperience}
                      onChange={(v) => setFilterExperience(v)}
                      buttonClassName="py-3 text-[15px]"
                      options={[
                        { value: "all", label: "All" },
                        ...experienceOptions.map((exp) => ({ value: exp, label: exp })),
                      ]}
                    />
                  </div>
                  <div className="lg:min-w-0 xl:min-w-[170px]">
                    <label className="mb-1 block text-[11px] font-medium text-white/60">Featured</label>
                    <GlassySelect
                      value={filterFeatured}
                      onChange={(v) => setFilterFeatured(v)}
                      options={[
                        { value: "all", label: "All" },
                        { value: "featured", label: "Featured only" },
                        { value: "nonFeatured", label: "Non-featured" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/60">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-white/50">Saved views:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterFeatured("featured");
                      setFilterEmploymentType("all");
                      setFilterDepartment("all");
                      setFilterLocation("all");
                      setFilterExperience("all");
                      setFilterStatus("all");
                      setSearchTerm("");
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/80 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
                  >
                    Featured roles
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterEmploymentType("Internship");
                      setFilterFeatured("all");
                      setFilterDepartment("all");
                      setFilterLocation("all");
                      setFilterExperience("all");
                      setFilterStatus("all");
                      setSearchTerm("");
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/80 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
                  >
                    Internships
                  </button>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="text-[11px] text-cyan-300 hover:text-cyan-200 disabled:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>

      {/* Bulk selection + actions */}
      {filteredCareers.length > 0 && (
        <div className="mt-1 mb-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5">
            <h3 className="text-[13px] font-semibold tracking-wide text-white/90">Manage Results</h3>
            <span className="text-[11px] text-white/50">{filteredCareers.length} jobs</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={isAllSelected}
                onChange={toggleSelectAll}
              />
              <span>Select all on this view</span>
              {selectedIds.length > 0 && (
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBulkMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/15 rounded-lg text-xs text-white/80 hover:bg-white/10 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
                >
                  <span>{getBulkActionLabel(bulkAction)}</span>
                  <svg
                    className="h-3 w-3 text-white/70"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {isBulkMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-1 w-44 rounded-lg border border-white/10 bg-[#05050a]/95 backdrop-blur-md shadow-xl z-20 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    {["publish", "draft", "feature", "unfeature", "close", "delete"].map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => {
                          setBulkAction(action);
                          setIsBulkMenuOpen(false);
                        }}
                        className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 ${
                          action === "delete" ? "text-red-300" : "text-white/85"
                        }`}
                      >
                        {getBulkActionLabel(action)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleBulkAction}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={selectedIds.length === 0}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Careers List */}
      {!loading && (
        <div className="mb-1.5 mt-0.5">
          <h3 className="text-[13px] font-semibold tracking-wide text-white/90">Job Listings</h3>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white/60">Loading careers...</div>
        </div>
      ) : filteredCareers.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl mt-3">
          {careers.length === 0 ? (
            <>
              <p className="text-white/60 mb-2">
                {filterStatus === "draft"
                  ? "No draft roles. Create a new job to get started."
                  : filterStatus === "published"
                  ? "No published roles yet. Publish a draft to go live."
                  : filterStatus === "closed"
                  ? "No closed roles. Closed roles will appear here."
                  : "No careers found"}
              </p>
              <Link
                href="/dashboard/admin/careers/create"
                className="mt-4 inline-block text-cyan-400 hover:text-cyan-300"
              >
                Create a new job posting
              </Link>
            </>
          ) : (
            <>
              <p className="text-white/60 mb-2">No roles match your current search and filters.</p>
              <p className="text-white/50 text-sm">Clear some filters or adjust your search query.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 pb-10 sm:pb-0">
          {filteredCareers.map((career) => (
            <div
              key={career._id}
              className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3.5 hover:bg-white/[0.08] transition-colors"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-0.5"
                      checked={selectedIds.includes(career._id)}
                      onChange={() => toggleSelect(career._id)}
                    />
                    <h3 className="text-base font-semibold text-white">{career.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(career.status)}`}
                      title={getStatusTooltip(career.status)}
                    >
                      {formatStatusLabel(career.status)}
                    </span>
                    {career.featured && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] border border-white/20 text-white/70 bg-transparent"
                        title="Pinned near the top of public careers pages"
                      >
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60 mb-2">
                    <span>
                      <span className="font-medium text-white/70">Location:</span> {career.location}
                    </span>
                    <span>
                      <span className="font-medium text-white/70">Department:</span> {career.department}
                    </span>
                    <span>
                      <span className="font-medium text-white/70">Type:</span> {career.employmentType}
                    </span>
                    <span>
                      <span className="font-medium text-white/70">Openings:</span> {career.openings}
                    </span>
                  </div>
                  <p className="text-white/70 text-xs line-clamp-1 mt-1">{career.description}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/60">
                    {career.salary?.min && career.salary?.max && (
                      <span>{formatSalaryAdmin(career.salary)}</span>
                    )}
                    <span>Experience: {career.experience}</span>
                  </div>
                  {(career.createdAt || career.updatedAt) && (
                    <p className="text-white/40 text-[11px] mt-1">
                      {career.createdAt && (
                        <span>Created {formatDate(career.createdAt)}</span>
                      )}
                      {career.createdAt && career.updatedAt && <span> · </span>}
                      {career.updatedAt && (
                        <span>Last updated {formatRelativeDays(career.updatedAt)}</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex justify-end pt-1 sm:ml-4 sm:pt-0">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId((prev) => (prev === career._id ? null : career._id))}
                      className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === career._id}
                   >
                      <span className="sr-only">Open job actions</span>
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="8" cy="3" r="1.25" fill="currentColor" />
                        <circle cx="8" cy="8" r="1.25" fill="currentColor" />
                        <circle cx="8" cy="13" r="1.25" fill="currentColor" />
                      </svg>
                    </button>
                    {openMenuId === career._id && (
                      <div className="absolute right-0 bottom-full mb-2 w-44 rounded-lg border border-white/10 bg-[#05050a] py-1 shadow-lg z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <Link
                          href={`/dashboard/admin/careers/edit/${career._id}`}
                          className="block w-full px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10"
                        >
                          Edit job
                        </Link>
                        {career.status === "draft" && (
                          <button
                            type="button"
                            onClick={() => {
                              handleStatusChange(career._id, "published");
                              setOpenMenuId(null);
                            }}
                            className="block w-full px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10"
                          >
                            Publish job
                          </button>
                        )}
                        {career.status === "published" && (
                          <button
                            type="button"
                            onClick={() => {
                              handleStatusChange(career._id, "closed");
                              setOpenMenuId(null);
                            }}
                            className="block w-full px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10"
                          >
                            Close role
                          </button>
                        )}
                        {career.status === "closed" && (
                          <button
                            type="button"
                            onClick={() => {
                              handleStatusChange(career._id, "published");
                              setOpenMenuId(null);
                            }}
                            className="block w-full px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10"
                          >
                            Reopen (publish)
                          </button>
                        )}
                        <div className="my-1 h-px bg-white/10" />
                        <button
                          type="button"
                          onClick={() => {
                            handleDelete(career._id);
                            setOpenMenuId(null);
                          }}
                          className="block w-full px-3 py-1.5 text-left text-xs text-red-300 hover:bg-red-500/10"
                        >
                          Delete job
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      </div>

    </div>
  );
}
