"use client";

import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { Search, Filter, X, ChevronDown, Check, MoreHorizontal, MoreVertical } from "lucide-react";

import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import TransactionSidebar from "./components/TransactionSidebar";
import TransactionSummaryPanel from "./components/TransactionSummaryPanel";

interface Transaction {
  _id: string;
  type: "buyer_to_admin" | "admin_to_seller";
  orderId: string;
  buyerName?: string;
  buyerEmail?: string;
  sellerName?: string;
  sellerEmail?: string;
  productName: string;
  amount: number;
  status: "success" | "failed" | "pending";
  date: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  errorReason?: string;
}

interface SummaryData {
  total: { count: number; amount: number };
  success: { count: number; amount: number };
  pending: { count: number; amount: number };
  failed: { count: number; amount: number };
}

const EMPTY_SUMMARY: SummaryData = {
  total: { count: 0, amount: 0 },
  success: { count: 0, amount: 0 },
  pending: { count: 0, amount: 0 },
  failed: { count: 0, amount: 0 },
};

function TransactionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyerEmail = searchParams.get("buyer");
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [dateRange, setDateRange] = useState("30d");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState(buyerEmail || "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFilteredRows, setTotalFilteredRows] = useState(0);
  const [limit, setLimit] = useState(25);

  // UI State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [density, setDensity] = useState<"compact" | "default" | "comfortable">("default");

  // Dropdown states
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [densityDropdownOpen, setDensityDropdownOpen] = useState(false);

  // Load density from local storage
  useEffect(() => {
    const saved = localStorage.getItem("adminTxDensity");
    if (saved === "compact" || saved === "default" || saved === "comfortable") {
      setDensity(saved);
    }
  }, []);

  const handleDensityChange = (newDensity: "compact" | "default" | "comfortable") => {
    setDensity(newDensity);
    localStorage.setItem("adminTxDensity", newDensity);
  };

  const observerTarget = useRef<HTMLDivElement>(null);
  const isAppending = useRef(false);

  useEffect(() => {
    isAppending.current = false;
    setTransactions([]);
    setPage(1);
  }, [typeFilter, statusFilter, searchTerm, dateRange, limit]);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, statusFilter, searchTerm, dateRange, limit]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getAllTransactions({
        page,
        limit,
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        dateRange: dateRange,
        sortBy: "date_desc"
      });
      if (isAppending.current) {
        setTransactions(prev => {
          const newTxs = data.transactions || [];
          const existingIds = new Set(prev.map(t => t._id));
          const uniqueNewTxs = newTxs.filter((t: any) => !existingIds.has(t._id));
          return [...prev, ...uniqueNewTxs];
        });
        isAppending.current = false;
      } else {
        setTransactions(data.transactions || []);
      }
      setTotalPages(data.pagination?.pages || 1);
      setTotalFilteredRows(data.pagination?.total || 0);
      setSummary({
        total: data.summary?.total || EMPTY_SUMMARY.total,
        success: data.summary?.success || EMPTY_SUMMARY.success,
        pending: data.summary?.pending || EMPTY_SUMMARY.pending,
        failed: data.summary?.failed || EMPTY_SUMMARY.failed,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load transactions");
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && page < totalPages && !loading) {
          isAppending.current = true;
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current && window.innerWidth < 640) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [page, totalPages, loading]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /* ================= EXPORT ================= */
  const exportCSV = async () => {
    const toastId = toast.loading("Preparing export...");
    try {
      const data = await adminAPI.getAllTransactions({
        limit: 5000,
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        dateRange: dateRange,
      });

      if (!data.transactions?.length) {
        toast.error("No data to export", { id: toastId });
        return;
      }

      const rows = data.transactions.map((t: Transaction) => ({
        "Transaction ID": t.orderId,
        "Date": new Date(t.date).toISOString(),
        "Type": t.type === "buyer_to_admin" ? "Buyer Payment" : "Seller Payout",
        "Parties": `${t.buyerName} -> ${t.sellerName}`,
        "Product": t.productName,
        "Amount": t.amount,
        "Status": t.status,
        "Gateway ID": t.razorpayPaymentId || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      
      const today = new Date().toISOString().split("T")[0];
      const filename = `transactions_${statusFilter}_${typeFilter}_${dateRange}_${today}.csv`;
      
      XLSX.writeFile(workbook, filename);
      toast.success(`Exported ${rows.length} rows successfully`, { id: toastId });
    } catch (error) {
      toast.error("Export failed", { id: toastId });
    }
  };

  /* ================= ROW SELECTION ================= */
  const handleSelectAll = () => {
    if (selectedRows.size === transactions.length && transactions.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(transactions.map(t => t._id)));
    }
  };

  const handleSelectRow = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const handleBulkMarkReviewed = async () => {
    const ids = Array.from(selectedRows);
    const toastId = toast.loading(`Marking ${ids.length} transaction${ids.length > 1 ? "s" : ""} as reviewed...`);
    try {
      const result = await adminAPI.bulkMarkTransactionsReviewed(ids);
      toast.success(result.message || "Marked as reviewed", { id: toastId });
      setSelectedRows(new Set());
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to mark as reviewed", { id: toastId });
    }
  };

  /* ================= ACTIVE FILTERS ================= */
  const activeFiltersCount = (statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSearchTerm("");
  };

  // Row height mapping
  const rowHeightClass = density === "compact" ? "py-1.5" : density === "comfortable" ? "py-5" : "py-3";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      {/* GLOBAL DROPDOWN BACKDROP */}
      {(mobileMenuOpen || dateDropdownOpen || densityDropdownOpen || typeDropdownOpen || statusDropdownOpen) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setMobileMenuOpen(false);
            setDateDropdownOpen(false);
            setDensityDropdownOpen(false);
            setTypeDropdownOpen(false);
            setStatusDropdownOpen(false);
          }}
        />
      )}

      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        title="Transaction History"
        subtitle="Manage & audit platform payments"
        rightSlot={
          <>
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-3 relative z-50">
              <button
                onClick={exportCSV}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-white/80 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition flex items-center gap-2"
              >
                Export CSV
              </button>
              
              {/* Desktop Custom Date Range Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-white/80 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition flex items-center gap-2 outline-none"
                >
                  {dateRange === "7d" ? "Last 7 days" : dateRange === "30d" ? "Last 30 days" : dateRange === "90d" ? "Last 90 days" : "All time"}
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </button>
                {dateDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                    {[
                      { val: "7d", label: "Last 7 days" },
                      { val: "30d", label: "Last 30 days" },
                      { val: "90d", label: "Last 90 days" },
                      { val: "all", label: "All time" }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => { setDateRange(opt.val); setDateDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 flex justify-between items-center"
                      >
                        {opt.label}
                        {dateRange === opt.val && <Check className="h-4 w-4 text-cyan-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop Custom Density Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setDensityDropdownOpen(!densityDropdownOpen)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition outline-none"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {densityDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 px-2">Row Density</p>
                    {(["compact", "default", "comfortable"] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => { handleDensityChange(d); setDensityDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg flex justify-between items-center capitalize"
                      >
                        {d}
                        {density === d && <Check className="h-4 w-4 text-cyan-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Actions Dropdown */}
            <div className="sm:hidden relative z-50">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              <div className={`absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl transition-all z-50 p-2 flex flex-col gap-1 ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <button
                  onClick={() => { setMobileMenuOpen(false); router.push("/dashboard/admin/transactions/analytics"); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                >
                  Analytics
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); exportCSV(); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                >
                  Export CSV
                </button>
                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                
                <p className="text-[10px] uppercase font-bold text-slate-400 px-2 mt-1 mb-1">Date Range</p>
                {[
                  { val: "7d", label: "Last 7 days" },
                  { val: "30d", label: "Last 30 days" },
                  { val: "90d", label: "Last 90 days" },
                  { val: "all", label: "All time" }
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => { setDateRange(opt.val); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg flex justify-between items-center"
                  >
                    {opt.label}
                    {dateRange === opt.val && <Check className="h-4 w-4 text-cyan-500 shrink-0" />}
                  </button>
                ))}
                
                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                
                <p className="text-[10px] uppercase font-bold text-slate-400 px-2 mt-1 mb-1">Row Density</p>
                {(["compact", "default", "comfortable"] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => { handleDensityChange(d); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg flex justify-between items-center capitalize"
                  >
                    {d}
                    {density === d && <Check className="h-4 w-4 text-cyan-500" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        }
      />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 space-y-6">
        
        {/* SUMMARY STRIP - Hidden on mobile */}
        {summary && (
          <div className="hidden sm:block">
            <TransactionSummaryPanel
              totalVolume={summary.total.amount}
              totalCount={summary.total.count}
              successful={summary.success}
              pending={summary.pending}
              failed={summary.failed}
              dateLabel={
                dateRange === "7d" ? "Last 7 days" :
                dateRange === "30d" ? "Last 30 days" :
                dateRange === "90d" ? "Last 90 days" : "All time"
              }
            />
          </div>
        )}

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order ID, product name, email, or gateway ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-10 pr-4 bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white"
              />
            </div>

            <div className="hidden sm:flex items-center gap-3 shrink-0">
              {/* Type Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setStatusDropdownOpen(false); }}
                  className="h-12 px-4 text-sm font-medium bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/10 transition"
                >
                  {typeFilter === "all" ? "All Types" : typeFilter === "buyer_to_admin" ? "Buyer Payments" : "Seller Payouts"}
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </button>
                {typeDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-20 py-1">
                    {[
                      { val: "all", label: "All Types" },
                      { val: "buyer_to_admin", label: "Buyer Payments" },
                      { val: "admin_to_seller", label: "Seller Payouts" }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => { setTypeFilter(opt.val); setTypeDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 flex justify-between items-center"
                      >
                        {opt.label}
                        {typeFilter === opt.val && <Check className="h-4 w-4 text-cyan-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setTypeDropdownOpen(false); }}
                  className="h-12 px-4 text-sm font-medium bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/10 transition"
                >
                  {statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-20 py-1">
                    {["all", "success", "pending", "failed"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setStatusFilter(opt); setStatusDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 flex justify-between items-center capitalize"
                      >
                        {opt === "all" ? "All Status" : opt}
                        {statusFilter === opt && <Check className="h-4 w-4 text-cyan-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Inline Filter Pills */}
          <div className="flex sm:hidden overflow-x-auto gap-2 pb-1 scrollbar-hide snap-x items-center w-full">
            {[
              { val: "buyer_to_admin", label: "Buyer Payments", isType: true },
              { val: "admin_to_seller", label: "Seller Payouts", isType: true },
              { separator: true },
              { val: "success", label: "Success", isStatus: true },
              { val: "pending", label: "Pending", isStatus: true },
              { val: "failed", label: "Failed", isStatus: true }
            ].map((opt, i) => {
              if (opt.separator) {
                return <div key={`sep-${i}`} className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />;
              }
              const isActive = opt.isType ? typeFilter === opt.val : statusFilter === opt.val;
              return (
                <button
                  key={`${opt.isType ? 'type' : 'status'}-${opt.val}`}
                  onClick={() => {
                    if (opt.isType) {
                      setTypeFilter(isActive ? "all" : opt.val!);
                    } else {
                      setStatusFilter(isActive ? "all" : opt.val!);
                    }
                  }}
                  className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors snap-start border ${
                    isActive 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' 
                      : 'bg-white dark:bg-[#0a0a14] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a14] shadow-sm overflow-hidden">
          
          {/* Bulk Action Bar (Sticky inside container) */}
          {selectedRows.size > 0 && (
            <div className="absolute top-0 left-0 w-full h-14 bg-indigo-50 dark:bg-indigo-500/10 border-b border-indigo-100 dark:border-indigo-500/20 flex items-center px-6 justify-between z-10">
              <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
                {selectedRows.size} transaction{selectedRows.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={handleBulkMarkReviewed}
                  className="text-sm px-3 py-1.5 font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
                  Mark as Reviewed
                </button>
                <button onClick={() => setSelectedRows(new Set())} className="text-sm px-3 py-1.5 font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition flex items-center gap-1">
                  <X className="h-4 w-4" /> Clear
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse min-w-max sm:min-w-[1000px]">
              <thead className="bg-slate-50 dark:bg-[#0a0a14] border-b border-slate-200 dark:border-white/10 sticky top-0 z-0">
                <tr>
                  <th className="w-8 sm:w-10 px-1.5 sm:px-4 py-2 sm:py-3 text-center sticky left-0 z-20 bg-slate-50 dark:bg-[#0a0a14] shadow-[1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_rgba(255,255,255,0.05)] sm:shadow-none sm:bg-transparent">
                    <input 
                      type="checkbox" 
                      checked={selectedRows.size === transactions.length && transactions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-500 focus:ring-cyan-500/50 bg-transparent h-3 w-3 sm:h-4 sm:w-4"
                    />
                  </th>
                  <th className="w-[110px] min-w-[110px] sm:w-[18%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50 sticky left-8 sm:static z-20 bg-slate-50 dark:bg-[#0a0a14] shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.5)] sm:shadow-none sm:bg-transparent">Transaction</th>
                  <th className="w-[85px] min-w-[85px] sm:w-[14%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">Type</th>
                  <th className="w-[140px] min-w-[140px] sm:w-[22%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">Parties</th>
                  <th className="w-[120px] min-w-[120px] sm:w-[20%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">Product</th>
                  <th className="w-[90px] min-w-[90px] sm:w-[120px] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50 text-right">Amount</th>
                  <th className="w-[80px] min-w-[80px] sm:w-[10%] px-1.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50 text-center">Status</th>
                  <th className="w-[40px] min-w-[40px] sm:w-[4%] px-1.5 sm:px-4 py-2 sm:py-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-slate-400">Loading transactions...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-slate-400">No transactions found for the current filters.</td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr 
                      key={t._id} 
                      onClick={() => { if (window.innerWidth < 640) setSelectedTx(t); }}
                      className={`group bg-white dark:bg-[#05050a] hover:bg-slate-50 dark:hover:bg-[#0a0a14] transition border-l-[3px] cursor-pointer sm:cursor-default ${
                        t.status === "pending" ? "border-amber-400" :
                        t.status === "failed" ? "border-rose-400" : "border-transparent"
                      } ${selectedRows.has(t._id) ? "bg-indigo-50/50 dark:bg-indigo-500/10" : ""}`}
                    >
                      <td className={`px-1.5 sm:px-4 ${rowHeightClass} text-center sticky left-0 z-10 bg-inherit shadow-[1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_rgba(255,255,255,0.05)] sm:shadow-none sm:bg-transparent`}>
                        <div className={`opacity-0 group-hover:opacity-100 ${selectedRows.has(t._id) ? "opacity-100" : ""} transition-opacity`}>
                          <input 
                            type="checkbox" 
                            checked={selectedRows.has(t._id)}
                            onChange={(e) => handleSelectRow(t._id, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-slate-300 dark:border-white/20 text-cyan-500 focus:ring-cyan-500/50 bg-transparent cursor-pointer h-3 w-3 sm:h-4 sm:w-4"
                          />
                        </div>
                      </td>
                      <td className={`px-1.5 sm:px-4 ${rowHeightClass} sticky left-8 sm:static z-10 bg-inherit shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.5)] sm:shadow-none sm:bg-transparent`}>
                        <p className="font-mono text-[10px] sm:text-sm text-slate-900 dark:text-white/90">
                          {t.type === "admin_to_seller" && !t.orderId.startsWith("payout_") 
                            ? `payout_${t.orderId.substring(0, 5)}...`
                            : t.orderId.length > 12 ? `${t.orderId.substring(0, 12)}...` : t.orderId}
                        </p>
                        <p className="text-[8px] sm:text-[11px] text-slate-500 dark:text-white/40 mt-0.5">
                          {new Date(t.date).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </td>
                      <td className={`px-1.5 sm:px-4 ${rowHeightClass}`}>
                        {t.type === "buyer_to_admin" ? (
                          <span className="inline-flex px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                            Buyer → Admin
                          </span>
                        ) : (
                          <span className="inline-flex px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                            Admin → Seller
                          </span>
                        )}
                      </td>
                      <td className={`px-1.5 sm:px-4 ${rowHeightClass}`}>
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-sm font-medium text-slate-900 dark:text-white/90 truncate max-w-[110px] sm:max-w-[200px]">
                            {t.buyerName}
                          </span>
                          <span className="text-[8px] sm:text-xs text-slate-400 dark:text-white/40">
                            → {t.sellerName}
                          </span>
                        </div>
                      </td>
                      <td className={`px-1.5 sm:px-4 ${rowHeightClass}`}>
                        <p className="text-[10px] sm:text-sm text-slate-700 dark:text-white/70 truncate max-w-[100px] sm:max-w-[180px]">
                          {t.productName}
                        </p>
                      </td>
                      <td className={`px-1.5 sm:px-4 ${rowHeightClass} text-right`}>
                        <p className="font-mono text-[10px] sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatAmount(t.amount)}
                        </p>
                      </td>
                      <td className={`px-1.5 sm:px-4 ${rowHeightClass} text-center`}>
                        <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold tracking-wider ${
                          t.status === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                          t.status === "failed" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                          <span className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${
                            t.status === "success" ? "bg-emerald-500" :
                            t.status === "failed" ? "bg-rose-500" : "bg-amber-500"
                          }`} />
                          <span className="capitalize">{t.status}</span>
                        </span>
                      </td>
                      <td className={`px-1.5 sm:px-4 ${rowHeightClass} text-center`}>
                        <button 
                          onClick={() => setSelectedTx(t)}
                          className="text-[9px] sm:text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="hidden sm:flex px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0a0a14] flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-white/50">
              <span>Showing {totalFilteredRows === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, totalFilteredRows)} of {totalFilteredRows} transactions</span>
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select 
                  value={limit} 
                  onChange={e => setLimit(Number(e.target.value))}
                  className="bg-transparent border-none outline-none font-medium text-slate-700 dark:text-white/80 cursor-pointer"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  // Simple logic to show current pages around active page
                  if (totalPages > 5 && page > 3) {
                    p = page - 2 + i;
                    if (p > totalPages) return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium transition ${
                        page === p 
                          ? "bg-cyan-500 text-white" 
                          : "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>

              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition"
              >
                Next
              </button>
            </div>
          </div>

          {/* Mobile Infinite Scroll Target */}
          <div className="sm:hidden w-full py-6 flex justify-center items-center" ref={observerTarget}>
            {loading && page > 1 && (
              <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full"></span>
                Loading more...
              </span>
            )}
            {!loading && page < totalPages && (
              <span className="text-xs font-medium text-slate-400 dark:text-white/30">Scroll for more</span>
            )}
            {!loading && page >= totalPages && transactions.length > 0 && (
              <span className="text-xs font-medium text-slate-400 dark:text-white/30">End of results</span>
            )}
          </div>
        </div>
      </main>

      <TransactionSidebar 
        transaction={selectedTx} 
        onClose={() => setSelectedTx(null)} 
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading transactions...</div>}>
      <TransactionsPageContent />
    </Suspense>
  );
}
