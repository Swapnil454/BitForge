"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, FileText, Search, ExternalLink, MessageCircleWarning, Clock, CheckCircle2, ShieldAlert, Filter } from "lucide-react";
import { reportAPI } from "@/lib/api";
import toast from "react-hot-toast";
import PageHeader from "../../buyer/transactions/components/PageHeader";

interface Report {
  _id: string;
  issueType: string;
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  proofs: string[];
  createdAt: string;
  adminNotes?: string;
}

export default function MyReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setFilterMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const cacheKey = "seller_reports_data";
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setReports(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }
    } catch (e) {
      setLoading(true);
    }

    try {
      const res = await reportAPI.getMyReports({ limit: 50 });
      setReports(res.reports);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(res.reports));
      } catch (e) {}
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load your reports");
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports
    .filter(r => {
      const matchesSearch = r.issueType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || 
                            r.status === statusFilter || 
                            (statusFilter === "under_review" && r.status === "investigating");
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const filterTabs = [
    { id: 'all', label: 'All Reports' },
    { id: 'pending', label: 'Pending Review' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'dismissed', label: 'Dismissed' }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "resolved": return { color: "text-emerald-500 dark:text-emerald-400", icon: CheckCircle2, label: "Resolved" };
      case "investigating":
      case "under_review": return { color: "text-amber-500 dark:text-amber-400", icon: Search, label: "Under Review" };
      case "dismissed": return { color: "text-rose-500 dark:text-rose-400", icon: ShieldAlert, label: "Dismissed" };
      case "pending":
      default: return { color: "text-indigo-500 dark:text-indigo-400", icon: Clock, label: "Pending" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="My Reports"
        subtitle="Track the status of submitted reports"
        rightSlot={
          <button
            onClick={() => router.push("/report")}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-colors shadow-sm"
          >
            <span className="text-lg leading-none mt-[1px]">+</span>
            <span className="hidden sm:inline">New Report</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 pt-4 pb-8">
        <div className="mb-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="h-5 w-5 text-slate-400 dark:text-white/45 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 pl-12 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition shadow-sm"
              />
            </div>

            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setFilterMenuOpen((prev) => !prev)}
                className="h-12 px-4 rounded-xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/25 inline-flex items-center justify-center transition shadow-sm dark:shadow-none"
              >
                <Filter className="h-5 w-5 text-slate-700 dark:text-white/80" />
              </button>

              {filterMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/95 backdrop-blur-xl p-2 shadow-xl dark:shadow-2xl dark:shadow-black/40 z-20"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-white/45 mb-1.5 px-1">Status</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {filterTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setStatusFilter(tab.id);
                            setFilterMenuOpen(false);
                          }}
                          className={`rounded-lg px-2.5 py-1.5 text-xs text-left transition border ${
                            statusFilter === tab.id
                              ? "border-cyan-400/45 bg-cyan-500/25 text-slate-900 dark:text-white"
                              : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-white/10">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-white/45 mb-1.5 px-1">Sort</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[{ id: 'newest', label: 'Newest First' }, { id: 'oldest', label: 'Oldest First' }].map((sort) => (
                        <button
                          key={sort.id}
                          onClick={() => {
                            setSortOrder(sort.id as "newest" | "oldest");
                            setFilterMenuOpen(false);
                          }}
                          className={`rounded-lg px-2.5 py-1.5 text-xs text-left transition border ${
                            sortOrder === sort.id
                              ? "border-cyan-400/45 bg-cyan-500/25 text-slate-900 dark:text-white"
                              : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {sort.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-16 sm:py-24 px-4">
            {/* Animated floating empty state icon */}
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, -1.5, 1.5, 0]
              }}
              transition={{ 
                duration: 4.5, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="relative w-20 h-20 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-100/50 dark:shadow-none"
            >
              <FileText className="h-9 w-9 text-slate-400 dark:text-white/40" />
            </motion.div>

            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">No Reports Found</h3>
            <p className="text-slate-500 dark:text-white/50 text-sm max-w-xs mb-8 leading-relaxed">
              You haven't submitted any reports yet, or none match your search criteria.
            </p>
            <button
              onClick={() => router.push("/report")}
              className="group relative px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.45)] flex items-center gap-2"
            >
              <span>Submit a Report</span>
              <svg 
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const status = getStatusConfig(report.status);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={report._id}
                    onClick={() => router.push(`/dashboard/seller/reports/${report._id}`)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full text-left p-5 md:p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                        <span className="text-lg font-bold text-slate-900 dark:text-white truncate">
                          {report.issueType}
                        </span>
                        <span className={`text-xs font-bold tracking-wide flex items-center gap-1.5 ${status.color}`}>
                          <StatusIcon className="w-4 h-4 shrink-0" />
                          <span className="whitespace-nowrap">{status.label}</span>
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-white/60 line-clamp-2 md:line-clamp-1 mb-3">
                        {report.description}
                      </p>
                      <div className="text-xs font-medium text-slate-400 dark:text-white/40 flex flex-wrap items-center gap-3 md:gap-4">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {new Date(report.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </span>
                        {report.proofs?.length > 0 && (
                          <span className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400 whitespace-nowrap">
                            <FileText className="w-3.5 h-3.5 shrink-0" /> 
                            {report.proofs.length} Attachment(s)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 group-hover:bg-indigo-500/10 transition-colors">
                      <ChevronLeft className="w-5 h-5 text-slate-400 dark:text-white/40 rotate-180 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
