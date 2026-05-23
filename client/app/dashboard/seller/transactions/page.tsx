"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Check, Copy, MoreVertical, Download, BarChart3, X, CheckCircle2, XCircle, Clock } from "lucide-react";
import { sellerAPI } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import toast from "react-hot-toast";

import PageHeader from "../../buyer/transactions/components/PageHeader";
import SellerInlineSearchFilters, { FilterOption, SortOption } from "./components/SellerInlineSearchFilters";

/* ================= TYPES ================= */

interface SellerTransaction {
  _id: string;
  orderId: string;
  productName: string;
  buyerName: string;
  buyerEmail: string;
  saleAmount: number;
  platformFee: number;
  gstOnFee: number;
  netAmount: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
}

const PAGE_SIZE = 10;

/* ================= PAGE ================= */

function SellerTransactionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get("period");

  const [transactions, setTransactions] = useState<SellerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<SellerTransaction | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const initialLoadDoneRef = useRef(false);

  /* ================= FETCH ================= */

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchTransactions(1, true);
  }, [status, debouncedSearch, sortBy, period]);

  useEffect(() => {
    if (page > 1) {
      fetchTransactions(page, false);
    }
  }, [page]);

  const fetchTransactions = async (pageNum: number, isInitial: boolean = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await sellerAPI.getTransactions({
        page: pageNum,
        limit: PAGE_SIZE,
        status: status === "all" ? undefined : status,
        search: debouncedSearch || undefined,
      });
      
      const newTransactions = res.transactions || [];
      if (newTransactions.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setTransactions((prev) => 
        isInitial ? newTransactions : [...prev, ...newTransactions]
      );
      
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadingMore]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (headerMenuRef.current && !headerMenuRef.current.contains(target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!transactions.length) return;

    let filteredTransactions = transactions;

    if (exportFromDate) {
      const from = new Date(exportFromDate).getTime();
      filteredTransactions = filteredTransactions.filter((t) => new Date(t.date).getTime() >= from);
    }

    if (exportToDate) {
      const to = new Date(exportToDate);
      to.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter((t) => new Date(t.date).getTime() <= to.getTime());
    }

    if (!filteredTransactions.length) {
      toast.error("No transactions found in this date range");
      return;
    }

    const headers = [
      "Order ID",
      "Product",
      "Buyer",
      "Email",
      "Sale Amount",
      "Platform Fee",
      "GST",
      "Net Amount",
      "Status",
      "Date",
    ];

    const rows = filteredTransactions.map((t) => [
      t.orderId,
      t.productName,
      t.buyerName,
      t.buyerEmail,
      t.saleAmount,
      t.platformFee,
      t.gstOnFee,
      t.netAmount,
      t.status,
      new Date(t.date).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  /* ================= HELPERS ================= */

  const handleCopyOrderId = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      const copied = await copyText(orderId);
      if (!copied) {
        toast.error("Failed to copy");
        return;
      }
      setCopiedId(orderId);
      toast.success("Order ID copied");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          label: "Completed",
          badgeClass: "text-emerald-600 dark:text-emerald-400 font-bold",
          Icon: CheckCircle2,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          badgeClass: "text-red-600 dark:text-red-400 font-bold",
          Icon: XCircle,
        };
      case "pending":
        return {
          label: "Pending",
          badgeClass: "text-amber-600 dark:text-amber-400 font-bold",
          Icon: Clock,
        };
      default:
        return {
          label: "Unknown",
          badgeClass: "text-gray-600 dark:text-gray-400 font-bold",
          Icon: Clock,
        };
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value: FilterOption) => {
    setStatus(value);
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(1);
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_48%,#eef2f7_100%)] dark:bg-[linear-gradient(180deg,#05070c_0%,#0a1220_48%,#05070c_100%)] text-slate-900 dark:text-white scroll-smooth pb-20">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title={period === "month" ? "This Month" : "Your Transactions"}
        subtitle="Track your sales in one place"
        rightSlot={
          <div className="relative shrink-0 flex items-center gap-2" ref={headerMenuRef}>
            <button
              onClick={() => setHeaderMenuOpen((prev) => !prev)}
              className="h-10 w-10 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/30 inline-flex items-center justify-center transition shadow-sm dark:shadow-none"
              aria-label="Open actions"
            >
              <MoreVertical className="h-5 w-5 text-slate-700 dark:text-white/80" />
            </button>

            <AnimatePresence>
              {headerMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 top-11 w-48 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-xl dark:shadow-black/40 z-50 flex flex-col gap-1"
                >
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      router.push("/dashboard/seller/transactions/analytics");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-cyan-50 dark:hover:bg-cyan-500/20 transition flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4 text-cyan-400" /> Analytics
                  </button>
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setIsExportModalOpen(true);
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-400" /> Export CSV
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 pt-3 pb-6 space-y-4">
        <SellerInlineSearchFilters
          searchQuery={search}
          onSearchChange={handleSearchChange}
          filterBy={status}
          onFilterChange={handleFilterChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-3"
        >
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#12141c] p-4 sm:p-5 shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-48 bg-slate-200 dark:bg-white/10 rounded-lg" />
                      <div className="h-4 w-32 bg-slate-100 dark:bg-white/5 rounded-lg" />
                      <div className="h-4 w-24 bg-slate-100 dark:bg-white/5 rounded-lg" />
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-7 w-20 bg-slate-200 dark:bg-white/10 rounded-lg ml-auto" />
                      <div className="h-6 w-16 bg-slate-100 dark:bg-white/5 rounded-full ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] p-10 text-center shadow-lg"
            >
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">No Transactions Found</h3>
              <p className="text-slate-500 dark:text-white/60 mb-5 text-sm sm:text-base">
                {search || status !== "all"
                  ? "No transactions match your filters. Try a different status or search."
                  : "You have no transactions yet."}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {transactions.map((transaction, index) => {
                const statusConfig = getStatusConfig(transaction.status);

                return (
                  <motion.article
                    key={transaction._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedTx(transaction)}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0b14] p-5 sm:p-6 text-left transition-all duration-300 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-[0_12px_30px_rgba(6,182,212,0.08)] cursor-pointer group shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl leading-tight font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                          {transaction.productName}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5">
                          Bought by <span className="text-slate-800 dark:text-zinc-200 font-bold">{transaction.buyerName}</span>
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-500 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-slate-400 dark:text-zinc-600" />
                            {new Date(transaction.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">•</span>
                          <span className="inline-flex items-center gap-1.5 font-mono bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md text-slate-600 dark:text-zinc-400">
                            ID: {transaction.orderId.slice(-8)}
                            <button
                              type="button"
                              onClick={(e) => handleCopyOrderId(e, transaction.orderId)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition ml-1"
                              title="Copy Order ID"
                            >
                              {copiedId === transaction.orderId ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                              )}
                            </button>
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                        <div className="text-right">
                          <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">₹{transaction.saleAmount.toLocaleString()}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 text-sm ${statusConfig.badgeClass}`}
                        >
                          <statusConfig.Icon className="w-4 h-4" />
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Infinite Scroll Sentinel */}
        {hasMore && !loading && (
          <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
            {loadingMore && (
              <div className="h-6 w-6 border-2 border-slate-300 dark:border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            )}
          </div>
        )}

        {!hasMore && transactions.length > 0 && (
          <p className="text-center text-slate-400 dark:text-white/40 text-sm mt-6">
            You've reached the end of the list.
          </p>
        )}
      </main>

      {/* TRANSACTION DETAILS MODAL */}
      <AnimatePresence>
        {selectedTx && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] bg-white dark:bg-[#0b0b14] w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 p-6 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sale Details</h2>
                <button onClick={() => setSelectedTx(null)} className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar pb-2">
                {(() => {
                  const statusConf = getStatusConfig(selectedTx.status);
                  return (
                    <div className="flex justify-center mb-6">
                      <span className={`inline-flex items-center gap-2 text-base ${statusConf.badgeClass}`}>
                        <statusConf.Icon className="w-5 h-5" />
                        {statusConf.label}
                      </span>
                    </div>
                  );
                })()}

                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-[#12141c] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-zinc-400">Product</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right ml-4 truncate">{selectedTx.productName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-zinc-400">Order ID</span>
                      <span className="font-mono text-slate-900 dark:text-white text-right ml-4 truncate">{selectedTx.orderId}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-zinc-400">Date</span>
                      <span className="text-slate-900 dark:text-white text-right ml-4">
                        {new Date(selectedTx.date).toLocaleString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "numeric", minute: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#12141c] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-zinc-400">Buyer Name</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-right ml-4 truncate">{selectedTx.buyerName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-zinc-400">Email</span>
                      <span className="text-slate-900 dark:text-white text-right ml-4 truncate">{selectedTx.buyerEmail}</span>
                    </div>
                  </div>

                  {selectedTx.status === "completed" && (
                    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-500/10 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-emerald-500/70">Sale Amount</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{selectedTx.saleAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-emerald-500/70">Platform Fee Deducted (10%)</span>
                        <span className="font-semibold text-red-500 dark:text-red-400">-₹{(selectedTx.platformFee + selectedTx.gstOnFee).toFixed(2)}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-emerald-200/50 dark:border-emerald-500/20 flex justify-between items-center">
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Net Earnings</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{selectedTx.netAmount}</span>
                      </div>
                    </div>
                  )}

                  {selectedTx.status === "pending" && (
                    <div className="bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl p-4 sm:p-5 border border-amber-100 dark:border-amber-500/10">
                      <h4 className="text-sm font-bold text-amber-600 dark:text-amber-500 mb-1">Payment Pending</h4>
                      <p className="text-xs sm:text-sm text-amber-700/70 dark:text-amber-500/70">
                        Awaiting buyer to complete the payment. Your dashboard will update once the payment is successful.
                      </p>
                    </div>
                  )}

                  {selectedTx.status === "cancelled" && (
                    <div className="bg-red-50/50 dark:bg-red-500/5 rounded-2xl p-4 sm:p-5 border border-red-100 dark:border-red-500/10">
                      <h4 className="text-sm font-bold text-red-600 dark:text-red-500 mb-1">Payment Failed / Cancelled</h4>
                      <p className="text-xs sm:text-sm text-red-700/70 dark:text-red-500/70">
                        The buyer did not complete the payment or the payment failed.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 shrink-0">
                <button onClick={() => setSelectedTx(null)} className="w-full py-3 sm:py-3.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a0a0f] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-cyan-500" />
                  Export CSV
                </h2>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">From Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={exportFromDate}
                      onChange={(e) => setExportFromDate(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-cyan-500/50 min-h-[48px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative z-10 ${
                        exportFromDate ? "text-slate-900 dark:text-white" : "text-transparent dark:text-transparent"
                      }`}
                    />
                    {!exportFromDate && (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none z-20">
                        mm/dd/yyyy
                      </span>
                    )}
                    <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">To Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={exportToDate}
                      onChange={(e) => setExportToDate(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-cyan-500/50 min-h-[48px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative z-10 ${
                        exportToDate ? "text-slate-900 dark:text-white" : "text-transparent dark:text-transparent"
                      }`}
                    />
                    {!exportToDate && (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none z-20">
                        mm/dd/yyyy
                      </span>
                    )}
                    <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-20" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={exportCSV}
                  className="flex-1 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SellerTransactionsFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#05050a]">
      <div className="h-12 w-12 border-4 border-slate-300 dark:border-white/20 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

export default function SellerTransactionsPage() {
  return (
    <Suspense fallback={<SellerTransactionsFallback />}>
      <SellerTransactionsPageContent />
    </Suspense>
  );
}


