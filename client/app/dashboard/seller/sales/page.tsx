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
}

const PAGE_SIZE = 10;

/* ================= MAIN PAGE CONTENT ================= */

function SellerSalesPageContent() {
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SalesFilterOption>("all");
  const [sortBy, setSortBy] = useState<SalesSortOption>("newest");
  const [page, setPage] = useState(1);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchSales();
  }, [page, filterStatus, debouncedSearch, sortBy]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await sellerAPI.getAllSales({
        page,
        limit: PAGE_SIZE,
        status: filterStatus === "all" ? undefined : filterStatus,
        search: debouncedSearch || undefined,
      });
      setSales(res.sales || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

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

    const headers = ["Order ID", "Product", "Buyer", "Email", "Amount", "Platform Fee", "Seller Amount", "Status", "Date"];
    const rows = sales.map((s) => [
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
    setHeaderMenuOpen(false);
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
          badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
          dotColor: "bg-emerald-400",
        };
      case "failed":
        return {
          label: "Failed",
          badgeClass: "bg-red-500/15 text-red-300 border-red-500/35",
          dotColor: "bg-red-400",
        };
      case "created":
        return {
          label: "Pending",
          badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/35",
          dotColor: "bg-amber-400",
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
        title="Sales History"
        subtitle="Track all your sales in one place"
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
                    onClick={exportCSV}
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
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedSale(sale)}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#12141c] p-4 sm:p-5 cursor-pointer text-left transition-all duration-300 hover:bg-slate-50 dark:hover:bg-[#181a25] hover:border-slate-200 dark:hover:border-white/10 hover:shadow-xl hover:shadow-black/50 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl leading-tight font-semibold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors truncate">
                          {sale.productName}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-white/65 mt-1.5">
                          Bought by <span className="text-slate-800 dark:text-white/90 font-semibold">{sale.buyerName}</span>
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-slate-400 dark:text-white/50">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(sale.date).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="inline-flex items-center gap-1.5 font-mono">
                            ID: {sale.orderId.slice(-8)}
                            <button
                              type="button"
                              onClick={(e) => handleCopyOrderId(e, sale.orderId)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition"
                              title="Copy Order ID"
                            >
                              {copiedId === sale.orderId ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-white/65" />
                              )}
                            </button>
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5">
                        <div className="text-right">
                          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">₹{sale.amount.toLocaleString()}</p>
                          {sale.status === "paid" && (
                            <p className="text-xs text-emerald-400 font-medium mt-0.5">
                              Earned: ₹{sale.sellerAmount.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
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

        {/* ─── PAGINATION ─── */}
        {!loading && sales.length > 0 && (
          <div className="mt-2 space-y-3">
            <p className="text-center text-slate-400 dark:text-white/40 text-sm">
              Showing page {page} of {totalPages}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-white/15 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-200 text-sm font-semibold min-w-16 text-center">
                {page}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-white/15 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ─── DETAIL MODAL ─── */}
      <AnimatePresence>
        {selectedSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSale(null)}
            className="fixed inset-0 bg-white dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141c] shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/8">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sale Details</h2>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center transition"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-white/70" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Status badge */}
                <div className="flex justify-center">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusConfig(selectedSale.status).badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${getStatusConfig(selectedSale.status).dotColor}`} />
                    {getStatusConfig(selectedSale.status).label}
                  </span>
                </div>

                {/* Product & Buyer */}
                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/8 p-4 space-y-2 text-sm">
                  <Row label="Product" value={selectedSale.productName} />
                  <Row label="Order ID" value={selectedSale.orderId} mono />
                  {selectedSale.razorpayOrderId && <Row label="Razorpay Order" value={selectedSale.razorpayOrderId} mono />}
                  {selectedSale.razorpayPaymentId && <Row label="Payment ID" value={selectedSale.razorpayPaymentId} mono />}
                  <Row label="Date" value={new Date(selectedSale.date).toLocaleString()} />
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/8 p-4 space-y-2 text-sm">
                  <Row label="Buyer Name" value={selectedSale.buyerName} />
                  <Row label="Email" value={selectedSale.buyerEmail} />
                </div>

                {/* Financial Breakdown */}
                {selectedSale.status === "paid" && (
                  <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/8 p-4 space-y-3 text-sm">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/45 font-semibold">Financial Breakdown</p>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-white/60">Sale Amount</span><span className="font-semibold text-slate-900 dark:text-white">₹{selectedSale.amount.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-white/60">Platform Fee</span><span className="font-semibold text-red-300">−₹{selectedSale.platformFee.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-white/60">GST on Fee</span><span className="font-semibold text-orange-300">−₹{Math.round(selectedSale.platformFee * 0.18).toLocaleString()}</span></div>
                      <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white">You Received</span>
                        <span className="text-2xl font-black text-emerald-400">₹{selectedSale.sellerAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedSale.status === "failed" && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm">
                    <p className="text-red-300 font-semibold mb-1">Payment Failed</p>
                    <p className="text-red-300/70">The buyer's payment was unsuccessful. No amount was transferred.</p>
                  </div>
                )}

                {selectedSale.status === "created" && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm">
                    <p className="text-amber-300 font-semibold mb-1">Payment Pending</p>
                    <p className="text-amber-300/70">Awaiting buyer to complete the payment.</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-white/8">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= HELPER ROW ================= */
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400 dark:text-white/50 shrink-0">{label}</span>
      <span className={`text-slate-800 dark:text-white/90 text-right break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
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

/* ================= EXPORT ================= */

export default function SellerSalesPage() {
  return (
    <Suspense fallback={<SellerSalesFallback />}>
      <SellerSalesPageContent />
    </Suspense>
  );
}
