"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutGrid,
  Layers,
  List,
  MoreVertical,
  Search,
  Sparkles,
  XCircle,
  Filter,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import GlassySelect from "./components/GlassySelect";
import CareerForm from "./components/CareerForm";

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
const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
  const [filterClosingSoon, setFilterClosingSoon] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "updated" | "openings" | "featured">("newest");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [activeCareer, setActiveCareer] = useState<Career | null>(null);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDanger?: boolean;
  } | null>(null);

  useEffect(() => {
    fetchCareers();
    fetchStats();
  }, [filterStatus]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => careers.some((career) => career._id === id)));
    setOpenMenuId(null);
    setIsBulkMenuOpen(false);
    setActiveCareer((prev) => (prev && !careers.some((career) => career._id === prev._id) ? null : prev));
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


  const handleDelete = (id: string) => {
    setConfirmAction({
      title: "Delete Career",
      message: "Are you sure you want to delete this career? This action cannot be undone.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/careers/admin/${id}`);
          showSuccess("Career deleted successfully");
          fetchCareers();
          fetchStats();
        } catch (error) {
          console.error("Error deleting career:", error);
          showError("Failed to delete career");
        }
      }
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    const update = async () => {
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

    if (newStatus === "closed") {
      setConfirmAction({
        title: "Close Role",
        message: "This will hide this role from public careers pages. Continue?",
        confirmText: "Close Role",
        isDanger: true,
        onConfirm: update
      });
    } else {
      update();
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction) {
      showError("Select a bulk action to apply");
      return;
    }
    if (selectedIds.length === 0) {
      showError("Select at least one job");
      return;
    }

    const applyBulk = async () => {
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

    if (bulkAction === "delete") {
      setConfirmAction({
        title: "Delete Roles",
        message: `Delete ${selectedIds.length} role${selectedIds.length === 1 ? "" : "s"}? This cannot be undone.`,
        confirmText: "Delete",
        isDanger: true,
        onConfirm: applyBulk
      });
    } else if (bulkAction === "close") {
      setConfirmAction({
        title: "Close Roles",
        message: `Close ${selectedIds.length} role${selectedIds.length === 1 ? "" : "s"}? This will hide them from public careers pages.`,
        confirmText: "Close Roles",
        isDanger: true,
        onConfirm: applyBulk
      });
    } else {
      applyBulk();
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30";
      case "draft":
        return "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-400 dark:border-yellow-500/30";
      case "closed":
        return "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30";
      default:
        return "text-slate-500 dark:text-white/60 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10";
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
      const isLpaDirect = salary.max < 1000;
      const minLpa = isLpaDirect ? salary.min : salary.min / 100000;
      const maxLpa = isLpaDirect ? salary.max : salary.max / 100000;
      const fmt = (v: number) =>
        v % 1 === 0 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, "");
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
    filterStatus !== "all" ||
    filterClosingSoon ||
    sortBy !== "newest";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterDepartment("all");
    setFilterLocation("all");
    setFilterEmploymentType("all");
    setFilterExperience("all");
    setFilterFeatured("all");
    setFilterStatus("all");
    setFilterClosingSoon(false);
    setSortBy("newest");
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
    const matchesClosingSoon =
      !filterClosingSoon ||
      (career.status === "published" && (career.openings ?? 0) <= 1);

    return (
      matchesSearch &&
      matchesDept &&
      matchesLocation &&
      matchesType &&
      matchesExperience &&
      matchesFeatured &&
      matchesClosingSoon
    );
  }).sort((a, b) => {
    const safeDate = (value?: string) => {
      const d = value ? new Date(value).getTime() : 0;
      return Number.isNaN(d) ? 0 : d;
    };

    if (sortBy === "oldest") return safeDate(a.createdAt) - safeDate(b.createdAt);
    if (sortBy === "updated") return safeDate(b.updatedAt) - safeDate(a.updatedAt);
    if (sortBy === "openings") return (b.openings ?? 0) - (a.openings ?? 0);
    if (sortBy === "featured") return Number(b.featured) - Number(a.featured);
    return safeDate(b.createdAt) - safeDate(a.createdAt);
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

  const featuredCount = careers.filter((career) => career.featured).length;
  const closingSoonCount = careers.filter(
    (career) => career.status === "published" && (career.openings ?? 0) <= 1
  ).length;

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#05050a]/80 backdrop-blur-xl">
        <div className="relative mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-4 z-10">
            <Link
              href="/dashboard/admin"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
          
          {/* Centered Title */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 dark:text-white pointer-events-auto">
              Careers
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 z-10">
            <Link
              href="/careers"
              className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white sm:inline-flex transition"
            >
              View Public
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => {
                setEditingCareer(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-white sm:px-4 sm:text-sm"
              title="Create Job"
            >
              <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Create Job</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5 pb-12">
          {stats && (
            <section className="rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm dark:border-white/5 dark:bg-white/5 sm:p-4 lg:px-8">
              <div className="flex w-full overflow-x-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex min-w-max flex-1 items-center justify-between divide-x divide-slate-200 dark:divide-white/10">
                  {[
                    { label: "Total", value: careers.length },
                    { label: "Published", value: getStatusCount("published") },
                    { label: "Drafts", value: getStatusCount("draft") },
                    { label: "Featured", value: featuredCount },
                    { label: "New", value: newTodayCount },
                  ].map((item, idx) => (
                    <div key={item.label} className={`px-4 text-center sm:px-6 ${idx === 0 ? "pl-0" : ""} ${idx === 4 ? "pr-0" : ""}`}>
                      <p className="whitespace-nowrap text-[9px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/50 sm:text-[11px]">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-xl font-light tracking-tight text-slate-900 dark:text-white sm:mt-1 sm:text-2xl">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-white/5 dark:bg-white/5 overflow-hidden">
            {/* Search and Primary Filters */}
            <div className="border-b border-slate-200/60 p-3 dark:border-white/5 flex items-center justify-between gap-3 sm:px-4">
              <div className="relative w-full max-w-3xl flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 sm:h-4 sm:w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search roles, keywords..."
                  className="w-full rounded-full border border-slate-200/60 bg-slate-50 py-1.5 pl-9 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 transition focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-[#0b0b12] dark:text-white dark:focus:ring-white/5 sm:py-2 sm:pl-10 sm:pr-4 sm:text-sm"
                />
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition sm:px-4 sm:py-2 sm:text-xs ${
                    showAdvancedFilters
                      ? "border-cyan-600 bg-cyan-600 text-white dark:border-cyan-500 dark:bg-cyan-500 dark:text-white"
                      : "border-slate-200/60 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Filters
                  {hasActiveFilters && !showAdvancedFilters && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Advanced Filters (Collapsible) */}
            {showAdvancedFilters && (
              <div className="bg-slate-50 px-4 py-3 dark:bg-black/20 border-b border-slate-200/60 dark:border-white/5">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5 items-end">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Department</label>
                    <GlassySelect
                      value={filterDepartment}
                      onChange={(v) => setFilterDepartment(v)}
                      buttonClassName="py-1.5 px-3 text-xs sm:py-1.5"
                      options={[
                        { value: "all", label: "All Departments" },
                        ...departmentOptions.map((dept) => ({ value: dept, label: dept })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Location</label>
                    <GlassySelect
                      value={filterLocation}
                      onChange={(v) => setFilterLocation(v)}
                      buttonClassName="py-1.5 px-3 text-xs sm:py-1.5"
                      options={[
                        { value: "all", label: "All Locations" },
                        ...locationOptions.map((loc) => ({ value: loc, label: loc })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Employment type</label>
                    <GlassySelect
                      value={filterEmploymentType}
                      onChange={(v) => setFilterEmploymentType(v)}
                      buttonClassName="py-1.5 px-3 text-xs sm:py-1.5"
                      options={[
                        { value: "all", label: "All Types" },
                        ...employmentTypeOptions.map((t) => ({ value: t, label: t })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Experience</label>
                    <GlassySelect
                      value={filterExperience}
                      onChange={(v) => setFilterExperience(v)}
                      buttonClassName="py-1.5 px-3 text-xs sm:py-1.5"
                      options={[
                        { value: "all", label: "All Levels" },
                        ...experienceOptions.map((exp) => ({ value: exp, label: exp })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Sort by</label>
                    <GlassySelect
                      value={sortBy}
                      onChange={(v) => setSortBy(v as typeof sortBy)}
                      buttonClassName="py-1.5 px-3 text-xs sm:py-1.5"
                      options={[
                        { value: "newest", label: "Newest first" },
                        { value: "oldest", label: "Oldest first" },
                        { value: "updated", label: "Recently updated" },
                        { value: "openings", label: "Most openings" },
                      ]}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white disabled:opacity-30 transition"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}

            {/* Segmented Tabs for Quick Views */}
            <div className="flex items-center gap-6 overflow-x-auto px-4 pt-1 pb-0 scrollbar-hide text-sm font-medium">
              {[
                { id: "all", label: "All Roles", count: careers.length, active: filterStatus === "all" && filterFeatured === "all" },
                { id: "published", label: "Published", count: getStatusCount("published"), active: filterStatus === "published" },
                { id: "draft", label: "Drafts", count: getStatusCount("draft"), active: filterStatus === "draft" },
                { id: "closed", label: "Closed", count: getStatusCount("closed"), active: filterStatus === "closed" },
                { id: "featured", label: "Featured", count: featuredCount, active: filterFeatured === "featured" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "all") { setFilterStatus("all"); setFilterFeatured("all"); }
                    else if (tab.id === "featured") { setFilterFeatured("featured"); setFilterStatus("all"); }
                    else { setFilterStatus(tab.id); setFilterFeatured("all"); }
                    setFilterClosingSoon(false);
                  }}
                  className={`relative whitespace-nowrap px-1 py-3 text-sm transition-colors ${
                    tab.active
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white/90"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-white/10 dark:text-white/60">
                    {tab.count}
                  </span>
                  {tab.active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-slate-900 dark:bg-white" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {filteredCareers.length > 0 && (
            <section id="jobs-toolbar" className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-white/70">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                    Select all
                  </label>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-white/10 dark:text-white/60">
                    {filteredCareers.length} results
                  </span>
                  {selectedIds.length > 0 && (
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                      {selectedIds.length} selected
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsBulkMenuOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-white/70"
                    >
                      {getBulkActionLabel(bulkAction)}
                    </button>
                    {isBulkMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05050a] py-1 shadow-xl z-20">
                        {["publish", "draft", "feature", "unfeature", "close", "delete"].map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => {
                              setBulkAction(action);
                              setIsBulkMenuOpen(false);
                            }}
                            className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-white/10 ${
                              action === "delete" ? "text-red-600 dark:text-red-300" : "text-slate-700 dark:text-white/85"
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
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-opacity hover:opacity-90 disabled:opacity-40"
                    disabled={selectedIds.length === 0}
                  >
                    Apply
                  </button>
                  <div className="hidden items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-1 sm:flex">
                    <button
                      type="button"
                      onClick={() => setViewMode("cards")}
                      className={`rounded-full p-1.5 text-xs ${
                        viewMode === "cards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 dark:text-white/60"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`rounded-full p-1.5 text-xs ${
                        viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 dark:text-white/60"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {!loading && (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Job Listings</h3>
              <span className="text-xs text-slate-400 dark:text-white/50">
                {filteredCareers.length} roles
              </span>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl border border-slate-200/60 bg-white animate-pulse dark:border-white/5 dark:bg-white/5"
                />
              ))}
            </div>
          ) : filteredCareers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200/60 bg-white py-20 text-center dark:border-white/5 dark:bg-white/5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 dark:bg-white/5">
                <Search className="h-6 w-6 text-slate-400 dark:text-white/40" />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                No roles found
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
                Adjust your filters or create a new job opening.
              </p>
              <Link
                href="/dashboard/admin/careers/create"
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                Create Job
              </Link>
            </div>
          ) : (
            <div className={`grid gap-3 ${viewMode === "list" ? "" : ""}`}>
              {filteredCareers.map((career) => (
                <div
                  key={career._id}
                  onClick={() => setActiveCareer(career)}
                  className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 items-start gap-4 min-w-0">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-white/10 dark:bg-white/5 dark:checked:bg-white"
                        checked={selectedIds.includes(career._id)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => toggleSelect(career._id)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                          {career.title}
                        </h3>
                        <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${
                          career.status === "published" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                          career.status === "draft" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                          "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white/60"
                        }`}>
                          {career.status === "published" && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                          {career.status}
                        </span>
                        {career.featured && (
                          <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <Sparkles className="h-3 w-3" /> Featured
                          </span>
                        )}
                        {career.status === "published" && (career.openings ?? 0) <= 1 && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                            Closing Soon
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-white/50">
                        <span className="truncate">{career.department}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" />
                        <span className="truncate">{career.location}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" />
                        <span className="truncate">{career.employmentType}</span>
                        {career.salary?.min && career.salary?.max && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" />
                            <span className="truncate">{formatSalaryAdmin(career.salary)}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400 dark:text-white/40">
                        {career.createdAt && <span>Added {formatDate(career.createdAt)}</span>}
                        {career.updatedAt && <span>Updated {formatRelativeDays(career.updatedAt)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-8 sm:pl-0">
                    <Link
                      href={`/careers/${generateSlug(career.title)}`}
                      onClick={(event) => event.stopPropagation()}
                      className="hidden items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white sm:flex transition"
                    >
                      Preview
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingCareer(career);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center rounded-full border border-slate-200/60 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-[#0b0b12] dark:text-white/80 dark:hover:bg-white/5"
                    >
                      Edit
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((prev) => (prev === career._id ? null : career._id));
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white transition"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === career._id && (
                        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-44 rounded-xl border border-slate-200/60 bg-white py-1 shadow-xl z-20 dark:border-white/10 dark:bg-[#0b0b12]">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingCareer(career);
                              setIsModalOpen(true);
                              setOpenMenuId(null);
                            }}
                            className="block w-full px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100 dark:text-white/90 dark:hover:bg-white/10"
                          >
                            Edit job
                          </button>
                          {career.status === "draft" && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleStatusChange(career._id, "published");
                                setOpenMenuId(null);
                              }}
                              className="block w-full px-3 py-1.5 text-left text-xs text-slate-800 dark:text-white/90 hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                              Publish job
                            </button>
                          )}
                          {career.status === "published" && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleStatusChange(career._id, "closed");
                                setOpenMenuId(null);
                              }}
                              className="block w-full px-3 py-1.5 text-left text-xs text-slate-800 dark:text-white/90 hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                              Close role
                            </button>
                          )}
                          {career.status === "closed" && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleStatusChange(career._id, "published");
                                setOpenMenuId(null);
                              }}
                              className="block w-full px-3 py-1.5 text-left text-xs text-slate-800 dark:text-white/90 hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                              Reopen (publish)
                            </button>
                          )}
                          <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(career._id);
                              setOpenMenuId(null);
                            }}
                            className="block w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            Delete job
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {activeCareer && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm transition-opacity dark:bg-black/40"
          onClick={() => setActiveCareer(null)}
        >
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-md transform border-l border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-[#0b0b12]/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/50">
                  Role Details
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {activeCareer.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCareer(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white transition"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${
                activeCareer.status === "published" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                activeCareer.status === "draft" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white/60"
              }`}>
                {activeCareer.status === "published" && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {activeCareer.status}
              </span>
              {activeCareer.featured && (
                <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Sparkles className="h-3 w-3" /> Featured
                </span>
              )}
            </div>

            <div className="mt-8 space-y-6 text-sm text-slate-600 dark:text-white/70">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Overview</p>
                <p className="mt-2 text-slate-700 dark:text-white/80 leading-relaxed">{activeCareer.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-y border-slate-200/60 py-6 dark:border-white/5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Department</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">{activeCareer.department}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Location</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">{activeCareer.location}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Type</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">{activeCareer.employmentType}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Openings</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">{activeCareer.openings}</p>
                </div>
              </div>
              {(activeCareer.createdAt || activeCareer.updatedAt) && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-white/40">
                  {activeCareer.createdAt && <span>Added {formatDate(activeCareer.createdAt)}</span>}
                  {activeCareer.createdAt && activeCareer.updatedAt && <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" />}
                  {activeCareer.updatedAt && <span>Updated {formatRelativeDays(activeCareer.updatedAt)}</span>}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setEditingCareer(activeCareer);
                  setIsModalOpen(true);
                  setActiveCareer(null);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90 sm:w-auto"
              >
                Edit role
              </button>
              <Link
                href={`/careers/${generateSlug(activeCareer.title)}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200/60 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 sm:w-auto"
              >
                Preview <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              
              <div className="sm:ml-auto">
                {activeCareer.status === "published" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(activeCareer._id, "closed")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 sm:w-auto"
                  >
                    Close role
                  </button>
                )}
                {activeCareer.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(activeCareer._id, "published")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 sm:w-auto"
                  >
                    Publish role
                  </button>
                )}
                {activeCareer.status === "closed" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(activeCareer._id, "published")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200/60 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 sm:w-auto"
                  >
                    Reopen role
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity dark:bg-black/60 sm:p-6">
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#05050a]">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingCareer ? `Edit: ${editingCareer.title}` : "Create New Job"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCareer(null);
                }}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2 dark:[&::-webkit-scrollbar-thumb]:bg-white/10">
              <CareerForm
                initialData={editingCareer || undefined}
                isEditing={!!editingCareer}
                onSuccess={() => {
                  setIsModalOpen(false);
                  setEditingCareer(null);
                  fetchCareers();
                  fetchStats();
                }}
                onCancel={() => {
                  setIsModalOpen(false);
                  setEditingCareer(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity dark:bg-black/60">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-[#0b0b12] dark:border dark:border-white/10">
            <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-white">
              {confirmAction.title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-slate-500 dark:text-white/60">
                {confirmAction.message}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-lg border border-transparent bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  confirmAction.isDanger
                    ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
                    : "bg-cyan-600 hover:bg-cyan-700 focus-visible:ring-cyan-500"
                }`}
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
              >
                {confirmAction.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
