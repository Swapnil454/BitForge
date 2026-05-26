"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  Search,
  ChevronDown,
  Check,
  Download,
  MoreVertical,
  ShieldBan,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import UserSummaryPanel from "./UserSummaryPanel";

interface RecentOrder {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  productName?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  authProvider?: string;
  accountStatus?: string;
  purchases?: number;
  totalSpent?: number;
  lastPurchaseAt?: string;
  recentOrders?: RecentOrder[];
}

export interface UserDirectoryConfig {
  role: "all" | "buyer" | "seller";
  title: string;
  subtitle: string;
  rolePlural: string;
  roleSingular: string;
  exportSheetName: string;
  exportFilePrefix: string;
  countColumnLabel: string;
  countExportLabel: string;
  moneyColumnLabel: string;
  moneyExportLabel: string;
  sortMoneyLabel: string;
  sortCountLabel: string;
  filterAllLabel: string;
}

export const allDirectoryConfig: UserDirectoryConfig = {
  role: "all",
  title: "All Users",
  subtitle: "Manage buyers and sellers from one shared directory",
  rolePlural: "users",
  roleSingular: "user",
  exportSheetName: "All Users",
  exportFilePrefix: "all-users",
  countColumnLabel: "Activity",
  countExportLabel: "Activity Count",
  moneyColumnLabel: "Value",
  moneyExportLabel: "Value (INR)",
  sortMoneyLabel: "Highest value",
  sortCountLabel: "Most activity",
  filterAllLabel: "All Accounts",
};

export const buyerDirectoryConfig: UserDirectoryConfig = {
  role: "buyer",
  title: "Buyers",
  subtitle: "Manage & monitor buyer accounts",
  rolePlural: "buyers",
  roleSingular: "buyer",
  exportSheetName: "Buyers",
  exportFilePrefix: "buyers",
  countColumnLabel: "Purchases",
  countExportLabel: "Purchases",
  moneyColumnLabel: "Total Spent",
  moneyExportLabel: "Total Spent (INR)",
  sortMoneyLabel: "Highest spend",
  sortCountLabel: "Most purchases",
  filterAllLabel: "All Users",
};

export const sellerDirectoryConfig: UserDirectoryConfig = {
  role: "seller",
  title: "Sellers",
  subtitle: "Manage & monitor seller accounts",
  rolePlural: "sellers",
  roleSingular: "seller",
  exportSheetName: "Sellers",
  exportFilePrefix: "sellers",
  countColumnLabel: "Sales",
  countExportLabel: "Sales",
  moneyColumnLabel: "Total Earning",
  moneyExportLabel: "Total Earning (INR)",
  sortMoneyLabel: "Highest earning",
  sortCountLabel: "Most sales",
  filterAllLabel: "All Sellers",
};

const AVATAR_COLORS = [
  { bg: "#E6F1FB", text: "#185FA5" },
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#EEEDFE", text: "#534AB7" },
  { bg: "#FAEEDA", text: "#854F0B" },
  { bg: "#FAECE7", text: "#993C1D" },
];

function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0];
  const charCode = name.toUpperCase().charCodeAt(0);
  if (charCode < 65 || charCode > 90) return AVATAR_COLORS[0];
  const index = Math.floor((charCode - 65) / 5) % 5;
  return AVATAR_COLORS[index];
}

function timeSince(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hrs ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " secs ago";
}

export function UserDirectoryPage({ config }: { config: UserDirectoryConfig }) {
  const router = useRouter();
  const showRoleColumn = config.role === "all";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortParam, setSortParam] = useState("newest");
  const [isVerifiedParam, setIsVerifiedParam] = useState("all");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [verifiedDropdownOpen, setVerifiedDropdownOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalBuyers: 0,
    verifiedBuyers: 0,
    unverifiedBuyers: 0,
    totalSellers: 0,
    verifiedSellers: 0,
    unverifiedSellers: 0,
    totalUsersForRole: 0,
    verifiedUsersForRole: 0,
    unverifiedUsersForRole: 0,
    totalValueForRole: 0,
    platformTotalSpent: 0,
  });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const PAGE_SIZE = 15;
  const totalUsersForCurrentRole =
    config.role === "all"
      ? (stats.totalBuyers || 0) + (stats.totalSellers || 0)
      : stats.totalUsersForRole ||
        (config.role === "seller" ? stats.totalSellers : stats.totalBuyers);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const syncViewport = () => setIsMobileViewport(window.innerWidth < 640);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, sortParam, isVerifiedParam, isMobileViewport, config.role]);

  useEffect(() => {
    if (!isMobileViewport || loading || isLoadingMore || page >= totalPages) return;

    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || isFetchingRef.current) return;
        isFetchingRef.current = true;
        setPage((prev) => (prev < totalPages ? prev + 1 : prev));
      },
      { rootMargin: "220px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isMobileViewport, loading, isLoadingMore, page, totalPages, users.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest(".dropdown-trigger") || target.closest(".dropdown-content")) return;
      setSortDropdownOpen(false);
      setVerifiedDropdownOpen(false);
      setActionMenuOpenId(null);
      setMobileMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    const isLoadingNextMobilePage = isMobileViewport && page > 1;
    isFetchingRef.current = true;

    if (isLoadingNextMobilePage) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await adminAPI.getAllUsers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        role: config.role,
        sort: sortParam,
        isVerified: isVerifiedParam,
      });

      const incomingUsers = data.users || [];
      setUsers((prev) => {
        if (!isLoadingNextMobilePage) return incomingUsers;

        const existingIds = new Set(prev.map((user) => user._id));
        const nextUsers = incomingUsers.filter((user: User) => !existingIds.has(user._id));
        return [...prev, ...nextUsers];
      });
      setTotalPages(data.pagination?.pages || 1);

      if (data.stats) {
        setStats({
          totalBuyers: data.stats.totalBuyers || 0,
          verifiedBuyers: data.stats.verifiedBuyers || 0,
          unverifiedBuyers: data.stats.unverifiedBuyers || 0,
          totalSellers: data.stats.totalSellers || 0,
          verifiedSellers: data.stats.verifiedSellers || 0,
          unverifiedSellers: data.stats.unverifiedSellers || 0,
          totalUsersForRole: data.stats.totalUsersForRole || 0,
          verifiedUsersForRole: data.stats.verifiedUsersForRole || 0,
          unverifiedUsersForRole: data.stats.unverifiedUsersForRole || 0,
          totalValueForRole: data.stats.totalValueForRole || 0,
          platformTotalSpent: data.stats.platformTotalSpent || 0,
        });
      }

      if (!isLoadingNextMobilePage) {
        setSelectedRows(new Set());
      }
    } catch {
      toast.error(`Failed to load ${config.rolePlural}`);
    } finally {
      isFetchingRef.current = false;
      if (isLoadingNextMobilePage) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleExportCSV = (selectedOnly = false) => {
    const dataToExport = selectedOnly
      ? users.filter((u) => selectedRows.has(u._id))
      : users;

    if (dataToExport.length === 0) {
      toast.error(`No ${config.rolePlural} to export`);
      return;
    }

    const exportData = dataToExport.map((u) => ({
      "User ID": u._id,
      Name: u.name,
      Email: u.email,
      ...(config.role === "all" ? { Role: u.role } : {}),
      Status: u.accountStatus === "banned" ? "Suspended" : u.isVerified ? "Verified" : "Unverified",
      "Joined Date": new Date(u.createdAt).toLocaleDateString(),
      [config.countExportLabel]: u.purchases || 0,
      [config.moneyExportLabel]: u.totalSpent || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.exportSheetName);

    const dateStr = new Date().toISOString().split("T")[0];
    let filterStr = "";
    if (isVerifiedParam !== "all") {
      filterStr = `_${isVerifiedParam === "true" ? "verified" : "unverified"}`;
    }
    if (selectedOnly) filterStr = "_selected";

    XLSX.writeFile(wb, `${config.exportFilePrefix}${filterStr}_${dateStr}.csv`);
  };

  const handleCopyEmails = () => {
    const emails = users
      .filter((u) => selectedRows.has(u._id))
      .map((u) => u.email)
      .join(", ");
    if (emails) {
      navigator.clipboard.writeText(emails);
      toast.success("Copied selected emails to clipboard");
    }
  };

  const handleSelectRow = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === users.length && users.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(users.map((u) => u._id)));
    }
  };

  const goToUserProfile = (u: User) => {
    router.push(`/dashboard/admin/users/${u._id}?role=${config.role}`);
  };

  const sortOptions = [
    { value: "newest", label: "Newest joined" },
    { value: "oldest", label: "Oldest joined" },
    { value: "spend", label: config.sortMoneyLabel },
    { value: "purchases", label: config.sortCountLabel },
    { value: "az", label: "A - Z" },
  ];

  const verifiedOptions = [
    { value: "all", label: config.filterAllLabel },
    { value: "true", label: "Verified Only" },
    { value: "false", label: "Unverified Only" },
  ];

  const getEmptyStateMessage = () => {
    if (debouncedSearch) {
      return `No ${config.rolePlural} match '${debouncedSearch}'. Try a different name or email.`;
    }
    if (isVerifiedParam === "true") return `No verified ${config.rolePlural} found.`;
    if (isVerifiedParam === "false") return `All ${config.rolePlural} are verified.`;
    return `No ${config.roleSingular} accounts yet. ${config.title} will appear here once they register.`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        title={config.title}
        subtitle={config.subtitle}
        rightSlot={
          <>
            <button
              onClick={() => handleExportCSV(false)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-700 dark:text-white/80 shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <div className="sm:hidden relative z-50">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              <div
                className={`dropdown-content absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl transition-all z-50 p-2 flex flex-col gap-1 ${mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
              >
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleExportCSV(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
                {selectedRows.size > 0 && (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleExportCSV(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                    >
                      Export Selected
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleCopyEmails();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                    >
                      Copy Emails
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <UserSummaryPanel data={stats} role={config.role} />

        <div className="flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full h-12 pl-10 pr-4 bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => {
                    setVerifiedDropdownOpen(!verifiedDropdownOpen);
                    setSortDropdownOpen(false);
                  }}
                  className="dropdown-trigger flex items-center justify-between gap-2 w-auto min-w-[150px] px-4 py-3 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#1c1c24] transition-colors shadow-sm"
                >
                  <span className="truncate">{verifiedOptions.find((o) => o.value === isVerifiedParam)?.label}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${verifiedDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {verifiedDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="dropdown-content absolute right-0 sm:left-0 top-full mt-2 w-48 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      {verifiedOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setIsVerifiedParam(opt.value);
                            setPage(1);
                            setVerifiedDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isVerifiedParam === opt.value ? "text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-500/10" : "text-slate-700 dark:text-white/70"}`}
                        >
                          {opt.label}
                          {isVerifiedParam === opt.value && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setSortDropdownOpen(!sortDropdownOpen);
                    setVerifiedDropdownOpen(false);
                  }}
                  className="dropdown-trigger flex items-center justify-between gap-2 w-auto min-w-[190px] px-4 py-3 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#1c1c24] transition-colors shadow-sm"
                >
                  <span className="truncate text-slate-500 dark:text-white/50">
                    Sort: <span className="text-slate-900 dark:text-white">{sortOptions.find((o) => o.value === sortParam)?.label}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${sortDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {sortDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="dropdown-content absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortParam(opt.value);
                            setPage(1);
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${sortParam === opt.value ? "text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-500/10" : "text-slate-700 dark:text-white/70"}`}
                        >
                          {opt.label}
                          {sortParam === opt.value && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex sm:hidden overflow-x-auto gap-2 pb-1 scrollbar-hide snap-x items-center w-full">
            {[
              ...verifiedOptions.map((opt) => ({ ...opt, isVerified: true })),
              { value: "__sep__", label: "", separator: true },
              ...sortOptions.map((opt) => ({
                ...opt,
                isSort: true,
                mobileLabel:
                  opt.value === "newest"
                    ? "Newest"
                    : opt.value === "oldest"
                      ? "Oldest"
                      : opt.value === "spend"
                        ? config.role === "seller"
                          ? "Earning"
                          : config.role === "all"
                            ? "Value"
                          : "Spend"
                        : opt.value === "purchases"
                          ? config.role === "seller"
                            ? "Sales"
                            : config.role === "all"
                              ? "Activity"
                            : "Purchases"
                          : "A-Z",
                })),
            ].map((opt, i) => {
              if ((opt as { separator?: boolean }).separator) {
                return <div key={`sep-${i}`} className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />;
              }
              const isActive = (opt as { isVerified?: boolean }).isVerified ? isVerifiedParam === opt.value : sortParam === opt.value;
              return (
                <button
                  key={`${(opt as { isVerified?: boolean }).isVerified ? "verified" : "sort"}-${opt.value}`}
                  onClick={() => {
                    if ((opt as { isVerified?: boolean }).isVerified) {
                      setIsVerifiedParam(opt.value);
                    } else {
                      setSortParam(opt.value);
                    }
                    setPage(1);
                  }}
                  className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors snap-start border ${isActive ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent" : "bg-white dark:bg-[#0a0a14] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                  {"mobileLabel" in opt ? opt.mobileLabel : opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {selectedRows.size > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
            <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
              {selectedRows.size} {config.roleSingular}
              {selectedRows.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportCSV(true)}
                className="text-xs sm:text-sm px-3 py-1.5 font-medium bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition"
              >
                Export Selected
              </button>
              <button
                onClick={handleCopyEmails}
                className="text-xs sm:text-sm px-3 py-1.5 font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Copy Emails
              </button>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="text-xs sm:text-sm px-3 py-1.5 font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Clear
              </button>
            </div>
          </div>
        )}

        <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a14] shadow-sm overflow-hidden">
          <div className="overflow-x-auto relative custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-max sm:min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-[#0a0a0f] border-b border-slate-200 dark:border-white/10 sticky top-0 z-0">
                <tr>
                  <th className="hidden sm:table-cell w-8 sm:w-12 px-1.5 sm:px-4 py-2 sm:py-3 text-center sticky left-0 z-20 bg-slate-50 dark:bg-[#0a0a0f] shadow-[1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_rgba(255,255,255,0.05)] sm:shadow-none sm:bg-transparent">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 dark:border-white/20 text-indigo-500 focus:ring-indigo-500/50 bg-transparent cursor-pointer h-3 w-3 sm:h-4 sm:w-4"
                    />
                  </th>
                  <th className="w-[152px] min-w-[152px] sm:w-[30%] px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50 sticky left-0 sm:static z-20 bg-slate-50 dark:bg-[#0a0a0f] shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.5)] sm:shadow-none sm:bg-transparent">User</th>
                  {showRoleColumn && (
                    <th className="w-[88px] min-w-[88px] sm:w-[10%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">Role</th>
                  )}
                  <th className="w-[85px] min-w-[85px] sm:w-[12%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">Status</th>
                  <th className="w-[92px] min-w-[92px] sm:w-[12%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">Joined</th>
                  <th className="w-[74px] min-w-[74px] sm:w-[12%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">{config.countColumnLabel}</th>
                  <th className="w-[100px] min-w-[100px] sm:w-[12%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">{config.moneyColumnLabel}</th>
                  <th className="w-[92px] min-w-[92px] sm:w-[14%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">Last Active</th>
                  <th className="hidden sm:table-cell w-[46px] min-w-[46px] sm:w-[8%] px-1.5 sm:px-4 py-2 sm:py-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={showRoleColumn ? 9 : 8} className="py-20 text-center">
                      <div className="inline-block w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={showRoleColumn ? 9 : 8} className="py-24 text-center">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 text-slate-400 dark:text-white/20" />
                      </div>
                      <p className="text-slate-500 dark:text-white/40 font-medium">{getEmptyStateMessage()}</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSuspended = u.accountStatus === "banned";
                    const avatarStyle = getAvatarColor(u.name);
                    const lastActiveLabel = u.lastPurchaseAt
                      ? (config.role === "seller" || (config.role === "all" && u.role === "seller"))
                        ? "Last sale"
                        : "Last purchase"
                      : "Last seen";
                    const lastActiveDate = u.lastPurchaseAt || u.updatedAt || u.createdAt;

                    return (
                      <tr
                        key={u._id}
                        onClick={() => {
                          if (window.innerWidth < 640) goToUserProfile(u);
                        }}
                        className={`group bg-white dark:bg-[#05050a] hover:bg-slate-50 dark:hover:bg-[#0a0a14] transition border-l-[3px] cursor-pointer sm:cursor-default ${isSuspended ? "border-rose-400" : !u.isVerified ? "border-amber-400" : "border-transparent"} ${selectedRows.has(u._id) ? "bg-indigo-50/50 dark:bg-indigo-500/10" : ""}`}
                        style={{ opacity: isSuspended ? 0.6 : 1 }}
                      >
                        <td className="hidden sm:table-cell w-8 sm:w-12 px-1.5 sm:px-4 py-2 sm:py-3 text-center sticky left-0 z-10 bg-inherit shadow-[1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_rgba(255,255,255,0.05)] sm:shadow-none sm:bg-transparent">
                          <div className={`opacity-0 group-hover:opacity-100 ${selectedRows.has(u._id) ? "opacity-100" : ""} transition-opacity`}>
                            <input
                              type="checkbox"
                              checked={selectedRows.has(u._id)}
                              onChange={(e) => handleSelectRow(u._id, e)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-slate-300 dark:border-white/20 text-indigo-500 focus:ring-indigo-500/50 bg-transparent cursor-pointer h-3 w-3 sm:h-4 sm:w-4"
                            />
                          </div>
                        </td>
                        <td className="w-[152px] min-w-[152px] sm:w-[30%] px-2 sm:px-4 py-2 sm:py-3 sticky left-0 sm:static z-10 bg-inherit shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.5)] sm:shadow-none sm:bg-transparent">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-sm font-bold shrink-0"
                              style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
                            >
                              {u.name[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{u.name}</p>
                              <p className="text-[8px] sm:text-xs text-slate-500 dark:text-white/40 truncate leading-tight">{u.email}</p>
                              {showRoleColumn && (
                                <span className={`mt-1 inline-flex sm:hidden items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                                  u.role === "seller"
                                    ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                                    : "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
                                }`}>
                                  {u.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {showRoleColumn && (
                          <td className="w-[88px] min-w-[88px] sm:w-[10%] px-1.5 sm:px-4 py-2 sm:py-3">
                            <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              u.role === "seller"
                                ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                                : "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                        )}
                        <td className="w-[85px] min-w-[85px] sm:w-[12%] px-1.5 sm:px-4 py-2 sm:py-3">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                              Suspended
                            </span>
                          ) : u.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unverified
                            </span>
                          )}
                        </td>
                        <td className="w-[92px] min-w-[92px] sm:w-[12%] px-1.5 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-slate-600 dark:text-white/60">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="w-[74px] min-w-[74px] sm:w-[12%] px-1.5 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-semibold text-slate-700 dark:text-white/80">
                          {u.purchases || 0}
                        </td>
                        <td className="w-[100px] min-w-[100px] sm:w-[12%] px-1.5 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-bold font-mono text-slate-900 dark:text-white">
                          ₹{(u.totalSpent || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="w-[92px] min-w-[92px] sm:w-[14%] px-1.5 sm:px-4 py-2 sm:py-3">
                          <p className="text-[10px] sm:text-sm font-medium text-slate-700 dark:text-white/80">{timeSince(lastActiveDate)}</p>
                          <p className="text-[8px] sm:text-[10px] text-slate-500 dark:text-white/40 mt-0.5">{lastActiveLabel}</p>
                        </td>
                        <td className="hidden sm:table-cell w-[46px] min-w-[46px] sm:w-[8%] px-1.5 sm:px-4 py-2 sm:py-3 text-center">
                          <div className="flex items-center justify-center sm:justify-end gap-2">
                            <button
                              onClick={() => goToUserProfile(u)}
                              className="text-[9px] sm:text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300"
                            >
                              View
                            </button>

                            <div className="relative hidden sm:block">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuOpenId(actionMenuOpenId === u._id ? null : u._id);
                                }}
                                className="dropdown-trigger p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4 pointer-events-none" />
                              </button>

                              <AnimatePresence>
                                {actionMenuOpenId === u._id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.1 }}
                                    className="dropdown-content absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden text-left"
                                  >
                                    <button
                                      onClick={() => {
                                        setActionMenuOpenId(null);
                                        goToUserProfile(u);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white/80 transition-colors"
                                    >
                                      <Eye className="w-4 h-4" /> View Full Profile
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActionMenuOpenId(null);
                                        goToUserProfile(u);
                                      }}
                                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${isSuspended ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"} transition-colors`}
                                    >
                                      <ShieldBan className="w-4 h-4" /> {isSuspended ? "Unsuspend Account" : "Suspend Account"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActionMenuOpenId(null);
                                        goToUserProfile(u);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" /> Delete Account
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && users.length > 0 && isMobileViewport && (
            <div className="px-3 py-3 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0a0a14]">
              <div ref={loadMoreRef} className="flex items-center justify-center min-h-10">
                {isLoadingMore ? (
                  <div className="inline-block w-5 h-5 border-2 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin" />
                ) : page < totalPages ? (
                  <span className="text-[11px] font-medium text-slate-400 dark:text-white/35">
                    Scroll to load more {config.rolePlural}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 dark:text-white/35">
                    All {config.rolePlural} loaded
                  </span>
                )}
              </div>
            </div>
          )}

          {!loading && totalPages > 0 && !isMobileViewport && (
            <div className="px-3 sm:px-4 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0a0a0f] flex items-center justify-between">
              <span className="hidden sm:inline text-xs font-medium text-slate-500 dark:text-white/40">
                Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalUsersForCurrentRole)} of {totalUsersForCurrentRole} {config.role === "all" ? "users" : config.rolePlural}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:text-indigo-500 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:text-indigo-500 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="sm:hidden inline-flex items-center px-2 text-xs font-medium text-slate-500 dark:text-white/40">
                  {page}/{totalPages}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function UserDirectorySkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="w-48 h-8 bg-slate-200 dark:bg-white/10 rounded-xl" />
        <div className="w-full h-24 bg-slate-200 dark:bg-white/5 rounded-2xl" />
        <div className="w-full h-96 bg-slate-200 dark:bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}
