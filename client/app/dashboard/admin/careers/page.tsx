"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";

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

interface CareerFormData {
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

interface GlassyOption {
  value: string;
  label: string;
}

interface GlassySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassyOption[];
  className?: string;
}

function GlassySelect({ value, onChange, options, className }: GlassySelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[13px] text-white/90 hover:bg-white/10 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
      >
        <span className="truncate text-left">
          {selected ? selected.label : "Select"}
        </span>
        <svg
          className="ml-2 h-3 w-3 flex-shrink-0 text-white/70"
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
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-white/10 bg-[#05050a]/95 py-1 text-[13px] shadow-xl backdrop-blur-md">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left hover:bg-white/10 ${
                option.value === value ? "text-cyan-300" : "text-white/85"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCareersPage() {
  const router = useRouter();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
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

  const [formData, setFormData] = useState<CareerFormData>({
    title: "",
    department: "Engineering",
    location: "Remote",
    employmentType: "Full-time",
    experience: "0-2 years",
    description: "",
    responsibilities: [],
    requirements: [],
    niceToHave: [],
    benefits: [],
    salary: { min: null, max: null, currency: "INR" },
    status: "draft",
    applyUrl: "",
    applyEmail: "careers@bitforge.in",
    featured: false,
    openings: 1,
  });

  const departments = ["Engineering", "Product", "Design", "Operations", "Marketing", "Sales", "Support", "Other"];
  const employmentTypes = ["Full-time", "Part-time", "Contract", "Internship"];
  const experienceLevels = ["0-2 years", "2-5 years", "5-8 years", "8+ years"];

  useEffect(() => {
    fetchCareers();
    fetchStats();
  }, [filterStatus]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      if (editingCareer) {
        await api.put(`/careers/admin/${editingCareer._id}`, formData);
        showSuccess("Career updated successfully");
      } else {
        await api.post("/careers/admin/create", formData);
        showSuccess("Career created successfully");
      }
      
      setShowModal(false);
      resetForm();
      fetchCareers();
      fetchStats();
    } catch (error: any) {
      console.error("Error saving career:", error);
      showError(error.response?.data?.message || "Failed to save career");
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

  const openEditModal = (career: Career) => {
    setEditingCareer(career);
    setFormData({
      title: career.title,
      department: career.department,
      location: career.location,
      employmentType: career.employmentType,
      experience: career.experience,
      description: career.description,
      responsibilities: career.responsibilities || [],
      requirements: career.requirements || [],
      niceToHave: career.niceToHave || [],
      benefits: career.benefits || [],
      salary: career.salary || { min: null, max: null, currency: "INR" },
      status: career.status,
      applyUrl: career.applyUrl || "",
      applyEmail: career.applyEmail || "careers@bitforge.in",
      featured: career.featured || false,
      openings: career.openings || 1,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCareer(null);
    setFormData({
      title: "",
      department: "Engineering",
      location: "Remote",
      employmentType: "Full-time",
      experience: "0-2 years",
      description: "",
      responsibilities: [],
      requirements: [],
      niceToHave: [],
      benefits: [],
      salary: { min: null, max: null, currency: "INR" },
      status: "draft",
      applyUrl: "",
      applyEmail: "careers@bitforge.in",
      featured: false,
      openings: 1,
    });
  };

  const handleArrayFieldChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value.split("\n").filter(item => item.trim() !== ""),
    });
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

  const departmentOptions = Array.from(new Set(careers.map((c) => c.department))).sort();
  const locationOptions = Array.from(new Set(careers.map((c) => c.location))).sort();
  const employmentTypeOptions = Array.from(new Set(careers.map((c) => c.employmentType))).sort();
  const experienceOptions = Array.from(new Set(careers.map((c) => c.experience))).sort();

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

    const matchesDept = filterDepartment === "all" || career.department === filterDepartment;
    const matchesLocation = filterLocation === "all" || career.location === filterLocation;
    const matchesType =
      filterEmploymentType === "all" || career.employmentType === filterEmploymentType;
    const matchesExperience = filterExperience === "all" || career.experience === filterExperience;
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
    <div className="min-h-screen bg-[#05050a] text-white px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Careers Management
            </h1>
            <p className="text-white/60 text-sm mt-1">Create and manage job openings</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-[0_0_18px_rgba(56,189,248,0.45)]"
          >
            Create New Job
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-emerald-400">{getStatusCount("published")}</div>
                <div className="text-xs text-white/60 mt-1">Published</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-yellow-400">{getStatusCount("draft")}</div>
                <div className="text-xs text-white/60 mt-1">Drafts</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-400">{getStatusCount("closed")}</div>
                <div className="text-xs text-white/60 mt-1">Closed</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-cyan-400">{careers.length}</div>
                <div className="text-xs text-white/60 mt-1">Total Roles</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/60">
              <span>New roles created today: {newTodayCount}</span>
              <span>Average response time: 3–5 business days</span>
            </div>
          </div>
        )}

        {/* Status filters */}
        <div className="flex gap-2 mt-6 flex-wrap">
          {["all", "published", "draft", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === status
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Search + advanced filters */}
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-end">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Search jobs</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title or keyword"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-white/60 mb-1">Department</label>
              <GlassySelect
                value={filterDepartment}
                onChange={(v) => setFilterDepartment(v)}
                options={[
                  { value: "all", label: "All" },
                  ...departmentOptions.map((dept) => ({ value: dept, label: dept })),
                ]}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/60 mb-1">Location</label>
              <GlassySelect
                value={filterLocation}
                onChange={(v) => setFilterLocation(v)}
                options={[
                  { value: "all", label: "All" },
                  ...locationOptions.map((loc) => ({ value: loc, label: loc })),
                ]}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/60 mb-1">Employment type</label>
              <GlassySelect
                value={filterEmploymentType}
                onChange={(v) => setFilterEmploymentType(v)}
                options={[
                  { value: "all", label: "All" },
                  ...employmentTypeOptions.map((t) => ({ value: t, label: t })),
                ]}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/60 mb-1">Experience</label>
              <GlassySelect
                value={filterExperience}
                onChange={(v) => setFilterExperience(v)}
                options={[
                  { value: "all", label: "All" },
                  ...experienceOptions.map((exp) => ({ value: exp, label: exp })),
                ]}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/60 mb-1">Featured</label>
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
      {careers.length > 0 && (
        <div className="mt-4 mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
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
                <div className="absolute right-0 mt-1 w-44 rounded-lg border border-white/10 bg-[#05050a]/95 backdrop-blur-md shadow-xl z-20">
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
      )}

      {/* Careers List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white/60">Loading careers...</div>
        </div>
      ) : filteredCareers.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl mt-4">
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
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="mt-4 text-cyan-400 hover:text-cyan-300"
              >
                Create a new job posting
              </button>
            </>
          ) : (
            <>
              <p className="text-white/60 mb-2">No roles match your current search and filters.</p>
              <p className="text-white/50 text-sm">Clear some filters or adjust your search query.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCareers.map((career) => (
            <div
              key={career._id}
              className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-3.5 hover:bg-white/[0.08] transition-colors"
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
                <div className="flex sm:ml-4 justify-end">
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
                      <div className="absolute right-0 mt-2 w-44 rounded-lg border border-white/10 bg-[#05050a] py-1 shadow-lg z-10">
                        <button
                          type="button"
                          onClick={() => {
                            openEditModal(career);
                            setOpenMenuId(null);
                          }}
                          className="block w-full px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10"
                        >
                          Edit job
                        </button>
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-3xl w-full my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6">
                {editingCareer ? "Edit Career" : "Create New Career"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Job Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Department *</label>
                    <GlassySelect
                      value={formData.department}
                      onChange={(v) => setFormData({ ...formData, department: v })}
                      options={departments.map((dept) => ({ value: dept, label: dept }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Employment Type</label>
                    <GlassySelect
                      value={formData.employmentType}
                      onChange={(v) => setFormData({ ...formData, employmentType: v })}
                      options={employmentTypes.map((type) => ({ value: type, label: type }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Experience</label>
                    <GlassySelect
                      value={formData.experience}
                      onChange={(v) => setFormData({ ...formData, experience: v })}
                      options={experienceLevels.map((level) => ({ value: level, label: level }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Responsibilities (one per line)</label>
                  <textarea
                    value={formData.responsibilities.join("\n")}
                    onChange={(e) => handleArrayFieldChange("responsibilities", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[100px]"
                    placeholder="Design and implement features&#10;Collaborate with team members&#10;Review code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Requirements (one per line)</label>
                  <textarea
                    value={formData.requirements.join("\n")}
                    onChange={(e) => handleArrayFieldChange("requirements", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[100px]"
                    placeholder="5+ years experience&#10;Strong TypeScript skills&#10;Experience with React"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nice to Have (one per line)</label>
                  <textarea
                    value={formData.niceToHave.join("\n")}
                    onChange={(e) => handleArrayFieldChange("niceToHave", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[80px]"
                    placeholder="Experience with cloud platforms&#10;Open source contributions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Benefits (one per line)</label>
                  <textarea
                    value={formData.benefits.join("\n")}
                    onChange={(e) => handleArrayFieldChange("benefits", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[80px]"
                    placeholder="Health insurance&#10;Remote work&#10;Flexible hours"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Salary (Optional)</label>
                    <input
                      type="number"
                      value={formData.salary.min || ""}
                      onChange={(e) => setFormData({ ...formData, salary: { ...formData.salary, min: e.target.value ? Number(e.target.value) : null } })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Salary (Optional)</label>
                    <input
                      type="number"
                      value={formData.salary.max || ""}
                      onChange={(e) => setFormData({ ...formData, salary: { ...formData.salary, max: e.target.value ? Number(e.target.value) : null } })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="1000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <GlassySelect
                      value={formData.salary.currency}
                      onChange={(v) => setFormData({ ...formData, salary: { ...formData.salary, currency: v } })}
                      options={[
                        { value: "INR", label: "INR" },
                        { value: "USD", label: "USD" },
                        { value: "EUR", label: "EUR" },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Apply Email</label>
                    <input
                      type="email"
                      value={formData.applyEmail}
                      onChange={(e) => setFormData({ ...formData, applyEmail: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Apply URL (Optional)</label>
                    <input
                      type="url"
                      value={formData.applyUrl}
                      onChange={(e) => setFormData({ ...formData, applyUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Openings</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.openings}
                      onChange={(e) => setFormData({ ...formData, openings: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <GlassySelect
                      value={formData.status}
                      onChange={(v) => setFormData({ ...formData, status: v })}
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "published", label: "Published" },
                        { value: "closed", label: "Closed" },
                      ]}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Featured</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    {editingCareer ? "Update Career" : "Create Career"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
