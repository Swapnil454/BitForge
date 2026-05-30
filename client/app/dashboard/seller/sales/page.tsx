"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Check,
  Copy,
  MoreVertical,
  Download,
  BarChart3,
  ShoppingBag,
  X,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { sellerAPI } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import toast from "react-hot-toast";

import PageHeader from "../../buyer/transactions/components/PageHeader";
import SalesInlineSearchFilters, {
  SalesFilterOption,
  SalesSortOption,
} from "./components/SalesInlineSearchFilters";

/* ================= TYPES ================= */

interface Sale {
  _id: string;
  orderId: string;
  productName: string;
  productId: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  platformFee: number;
  sellerAmount: number;
  status: "paid" | "created" | "failed";
  date: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  thumbnailUrl?: string | null;
}

const PAGE_SIZE = 10;

/* ================= MAIN PAGE CONTENT ================= */

function SellerSalesPageContent() {
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SalesFilterOption>("all");
  const [sortBy, setSortBy] = useState<SalesSortOption>("newest");
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchSales(1, true);
  }, [filterStatus, debouncedSearch, sortBy, month]);

  useEffect(() => {
    if (page > 1) {
      fetchSales(page, false);
    }
  }, [page]);

  const fetchSales = async (pageNum: number, isInitial: boolean = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await sellerAPI.getAllSales({
        page: pageNum,
        limit: PAGE_SIZE,
        status: filterStatus === "all" ? undefined : filterStatus,
        search: debouncedSearch || undefined,
        month: month || undefined,
      });
      
      const newSales = res.sales || [];
      if (newSales.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setSales((prev) => 
        isInitial ? newSales : [...prev, ...newSales]
      );
    } catch {
      toast.error("Failed to load sales");
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

  /* ================= DEBOUNCE ================= */

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  /* ================= OUTSIDE CLICK ================= */

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!sales.length) return;

    let filteredSales = sales;

    if (exportFromDate) {
      const from = new Date(exportFromDate).getTime();
      filteredSales = filteredSales.filter((s) => new Date(s.date).getTime() >= from);
    }

    if (exportToDate) {
      const to = new Date(exportToDate);
      to.setHours(23, 59, 59, 999);
      filteredSales = filteredSales.filter((s) => new Date(s.date).getTime() <= to.getTime());
    }

    if (!filteredSales.length) {
      toast.error("No sales found in this date range");
      return;
    }

    const headers = ["Order ID", "Product", "Buyer", "Email", "Amount", "Platform Fee", "Seller Amount", "Status", "Date"];
    const rows = filteredSales.map((s) => [
      s.orderId,
      s.productName,
      s.buyerName,
      s.buyerEmail,
      s.amount,
      s.platformFee,
      s.sellerAmount,
      s.status,
      new Date(s.date).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales.csv";
    a.click();
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  /* ================= HELPERS ================= */

  const handleCopyOrderId = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      const copied = await copyText(orderId);
      if (!copied) { toast.error("Failed to copy"); return; }
      setCopiedId(orderId);
      toast.success("Order ID copied");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const getStatusConfig = (status: Sale["status"]) => {
    switch (status) {
      case "paid":
        return {
          label: "Paid",
          badgeClass: "text-emerald-600 dark:text-emerald-400 font-bold",
          Icon: CheckCircle2,
        };
      case "failed":
        return {
          label: "Failed",
          badgeClass: "text-red-600 dark:text-red-400 font-bold",
          Icon: XCircle,
        };
      case "created":
        return {
          label: "Pending",
          badgeClass: "text-amber-600 dark:text-amber-400 font-bold",
          Icon: Clock,
        };
    }
  };

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleFilterChange = (v: SalesFilterOption) => { setFilterStatus(v); setPage(1); };
  const handleSortChange = (v: SalesSortOption) => { setSortBy(v); setPage(1); };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white scroll-smooth">
      {/* ─── HEADER ─── */}
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Monthly Sales"
        subtitle="Track your sales and earnings over time"
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
                      router.push("/dashboard/seller/sales/analytics");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-900 dark:text-white hover:bg-cyan-50 dark:hover:bg-cyan-500/20 transition flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4 text-cyan-400" /> Analytics
                  </button>
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setIsExportModalOpen(true);
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-900 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition flex items-center gap-2"
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

        {/* ─── SEARCH + FILTERS ─── */}
        <SalesInlineSearchFilters
          searchQuery={search}
          onSearchChange={handleSearchChange}
          filterBy={filterStatus}
          onFilterChange={handleFilterChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          month={month}
          onMonthChange={(m) => { setMonth(m); setPage(1); }}
        />

        {/* ─── LIST ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          ) : sales.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-10 text-center shadow-sm dark:shadow-lg"
            >
              <ShoppingBag className="w-12 h-12 text-slate-200 dark:text-white/20 mx-auto mb-3" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">No Sales Found</h3>
              <p className="text-slate-500 dark:text-white/60 text-sm sm:text-base">
                {search || filterStatus !== "all"
                  ? "No sales match your filters. Try a different status or search."
                  : "You have no sales yet."}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sales.map((sale, index) => {
                const statusConfig = getStatusConfig(sale.status);
                return (
                  <motion.article
                    key={sale._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
                    className="group flex flex-row items-center sm:items-stretch p-3 sm:p-5 gap-3 sm:gap-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12141c] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md dark:shadow-none"
                  >
                    {/* Left Side: Thumbnail */}
                    <div className="w-20 sm:w-44 shrink-0">
                      <Thumbnail title={sale.productName} url={sale.thumbnailUrl} />
                    </div>

                    {/* Right Side: Details */}
                    <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5 sm:py-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-xl truncate">
                            {sale.productName}
                          </h2>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); }}
                            className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0"
                            title="View Details"
                          >
                             <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                        
                        <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                          Bought by <span className="font-semibold text-slate-900 dark:text-white">{sale.buyerName}</span>
                        </p>

                        <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-y-1 gap-x-2 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{new Date(sale.date).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}</span>
                          </div>
                          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 dark:text-slate-500">ID:</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">{sale.orderId.slice(-8)}</span>
                            <button 
                              onClick={(e) => handleCopyOrderId(e, sale.orderId)}
                              className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                              title="Copy ID"
                            >
                              {copiedId === sale.orderId ? (
                                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 sm:mt-4 flex items-center gap-2 sm:gap-3">
                          <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            ₹{sale.amount.toLocaleString()}
                          </div>
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                            sale.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" :
                            sale.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20" :
                            "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                          }`}>
                            <statusConfig.Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {statusConfig.label}
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors text-left"
                        >
                          View Details
                        </button>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {sale.status === "paid" && (
                            <div className="flex flex-col gap-1 flex-1 sm:w-36 text-left">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <span>Earned</span>
                                <span className="text-emerald-500">₹{sale.sellerAmount.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                                <div
                                  className="h-full rounded-full transition-all duration-500 bg-emerald-500 dark:bg-emerald-400"
                                  style={{ width: `${Math.min(100, Math.max((sale.sellerAmount / sale.amount) * 100, 0))}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>

        {/* ─── PAGINATION (Infinite Scroll) ─── */}
        {hasMore && !loading && (
          <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
            {loadingMore && (
              <div className="h-6 w-6 border-2 border-slate-300 dark:border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            )}
          </div>
        )}

        {!hasMore && sales.length > 0 && (
          <p className="text-center text-slate-400 dark:text-white/40 text-sm mt-6">
            You've reached the end of the list.
          </p>
        )}
      </main>

      {/* ─── DETAIL MODAL ─── */}
      <AnimatePresence>
        {selectedSale && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSale(null)}
              className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[1001] bg-white dark:bg-[#0b0b14] w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 p-6 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sale Details</h2>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto no-scrollbar pb-2">
                {/* Status badge */}
                <div className="flex justify-center mb-6">
                  <span className={`inline-flex items-center gap-2 text-base ${getStatusConfig(selectedSale.status).badgeClass}`}>
                    {(() => {
                      const Icon = getStatusConfig(selectedSale.status).Icon;
                      return <Icon className="w-5 h-5" />;
                    })()}
                    {getStatusConfig(selectedSale.status).label}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Product & Buyer */}
                  <div className="bg-slate-50 dark:bg-[#12141c] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5 space-y-3">
                    <Row label="Product" value={selectedSale.productName} />
                    <Row label="Order ID" value={selectedSale.orderId} mono />
                    {selectedSale.razorpayOrderId && <Row label="Razorpay Order" value={selectedSale.razorpayOrderId} mono />}
                    {selectedSale.razorpayPaymentId && <Row label="Payment ID" value={selectedSale.razorpayPaymentId} mono />}
                    <Row label="Date" value={new Date(selectedSale.date).toLocaleString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "numeric", minute: "numeric"
                          })} />
                  </div>

                  <div className="bg-slate-50 dark:bg-[#12141c] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5 space-y-3">
                    <Row label="Buyer Name" value={selectedSale.buyerName} />
                    <Row label="Email" value={selectedSale.buyerEmail} />
                  </div>

                  {/* Financial Breakdown */}
                  {selectedSale.status === "paid" && (
                    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-500/10 space-y-3 text-sm">
                      <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-emerald-500/70">Sale Amount</span><span className="font-semibold text-slate-900 dark:text-white">₹{selectedSale.amount.toLocaleString()}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-emerald-500/70">Platform Fee Deducted (10%)</span><span className="font-semibold text-red-500 dark:text-red-400">−₹{(selectedSale.amount - selectedSale.sellerAmount).toFixed(2)}</span></div>
                      <div className="pt-2 mt-2 border-t border-emerald-200/50 dark:border-emerald-500/20 flex justify-between items-center">
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Net Earnings</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{selectedSale.sellerAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {selectedSale.status === "failed" && (
                    <div className="bg-red-50/50 dark:bg-red-500/5 rounded-2xl p-4 sm:p-5 border border-red-100 dark:border-red-500/10 space-y-3 text-sm">
                      <p className="text-red-600 dark:text-red-400 font-semibold mb-1">Payment Failed</p>
                      <p className="text-red-500/80 dark:text-red-400/70">The buyer's payment was unsuccessful. No amount was transferred.</p>
                    </div>
                  )}

                  {selectedSale.status === "created" && (
                    <div className="bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl p-4 sm:p-5 border border-amber-100 dark:border-amber-500/10 space-y-3 text-sm">
                      <p className="text-amber-600 dark:text-amber-400 font-semibold mb-1">Payment Pending</p>
                      <p className="text-amber-500/80 dark:text-amber-400/70">Awaiting buyer to complete the payment.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 shrink-0">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="absolute inset-0 z-[1000] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a0a0f] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 z-[1001]"
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

/* ================= HELPER ROW ================= */
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500 dark:text-zinc-400 shrink-0">{label}</span>
      <span className={`font-semibold text-slate-900 dark:text-white text-right ml-4 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

/* ================= FALLBACK ================= */

function SellerSalesFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#05050a]">
      <div className="h-12 w-12 border-4 border-slate-300 dark:border-white/20 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

/* ================= THUMBNAIL ================= */

function Thumbnail({ title, url }: { title: string; url?: string | null }) {
  if (url) {
    return (
      <div className="h-20 w-20 sm:h-36 sm:w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-900/50">
        <img src={url} alt={title || "Product thumbnail"} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-20 w-20 sm:h-36 sm:w-full shrink-0 items-end rounded-xl border border-slate-200 dark:border-white/5 bg-gradient-to-br from-cyan-100 dark:from-cyan-500/10 to-slate-200 dark:to-slate-900/50 p-2 sm:p-4 text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
      <span className="hidden sm:inline">Sale</span>
    </div>
  );
}

/* ================= EXPORT ================= */

export default function SellerSalesPage() {
  return (
    <Suspense fallback={<SellerSalesFallback />}>
      <SellerSalesPageContent />
    </Suspense>
  );
}
