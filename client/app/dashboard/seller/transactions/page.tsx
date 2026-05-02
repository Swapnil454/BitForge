"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Check, Copy, MoreVertical, Download, BarChart3 } from "lucide-react";
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

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const initialLoadDoneRef = useRef(false);

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchTransactions();
  }, [page, status, debouncedSearch, sortBy, period]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await sellerAPI.getTransactions({
        page,
        limit: PAGE_SIZE,
        status: status === "all" ? undefined : status,
        search: debouncedSearch || undefined,
      });
      setTransactions(res.transactions || []);
      
      if (initialLoadDoneRef.current && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      initialLoadDoneRef.current = true;
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

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

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE) || 1;
  const visibleTransactions = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    if (!transactions.length) return;

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

    const rows = transactions.map((t) => [
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
    setHeaderMenuOpen(false);
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
          badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
          dotColor: "bg-emerald-400",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          badgeClass: "bg-red-500/15 text-red-300 border-red-500/35",
          dotColor: "bg-red-400",
        };
      case "pending":
        return {
          label: "Pending",
          badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/35",
          dotColor: "bg-amber-400",
        };
      default:
        return {
          label: "Unknown",
          badgeClass: "bg-gray-500/15 text-gray-300 border-gray-500/35",
          dotColor: "bg-gray-400",
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
    <div className="min-h-screen bg-[#05050a] text-white scroll-smooth">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title={period === "month" ? "This Month's Transactions" : "Your Transactions"}
        subtitle="Manage and track your sales in one place"
        rightSlot={
          <div className="relative shrink-0 flex items-center gap-2" ref={headerMenuRef}>
            <button
              onClick={() => setHeaderMenuOpen((prev) => !prev)}
              className="h-10 w-10 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 inline-flex items-center justify-center transition"
              aria-label="Open actions"
            >
              <MoreVertical className="h-5 w-5 text-white/80" />
            </button>

            <AnimatePresence>
              {headerMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 top-11 w-48 rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-xl shadow-black/40 z-50 flex flex-col gap-1"
                >
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      router.push("/dashboard/seller/transactions/analytics");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white hover:text-white hover:bg-cyan-500/20 transition flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4 text-cyan-400" /> Analytics
                  </button>
                  <button
                    onClick={exportCSV}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white hover:text-white hover:bg-emerald-500/20 transition flex items-center gap-2"
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
                  className="rounded-2xl border border-white/5 bg-[#12141c] p-4 sm:p-5 shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-48 bg-white/10 rounded-lg" />
                      <div className="h-4 w-32 bg-white/5 rounded-lg" />
                      <div className="h-4 w-24 bg-white/5 rounded-lg" />
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-7 w-20 bg-white/10 rounded-lg ml-auto" />
                      <div className="h-6 w-16 bg-white/5 rounded-full ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center shadow-lg"
            >
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Transactions Found</h3>
              <p className="text-white/60 mb-5 text-sm sm:text-base">
                {search || status !== "all"
                  ? "No transactions match your filters. Try a different status or search."
                  : "You have no transactions yet."}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {visibleTransactions.map((transaction, index) => {
                const statusConfig = getStatusConfig(transaction.status);

                return (
                  <motion.article
                    key={transaction._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#12141c] p-4 sm:p-5 text-left transition-all duration-300 hover:bg-[#181a25] hover:border-white/10 hover:shadow-xl hover:shadow-black/50 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl leading-tight font-semibold text-white group-hover:text-cyan-200 transition-colors truncate">
                          {transaction.productName}
                        </h3>
                        <p className="text-sm text-white/65 mt-1.5">
                          Bought by <span className="text-white/90 font-semibold">{transaction.buyerName}</span>
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-white/50">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(transaction.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="inline-flex items-center gap-1.5 font-mono">
                            ID: {transaction.orderId.slice(-8)}
                            <button
                              type="button"
                              onClick={(e) => handleCopyOrderId(e, transaction.orderId)}
                              className="p-1 rounded hover:bg-white/10 transition"
                              title="Copy Order ID"
                            >
                              {copiedId === transaction.orderId ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-white/65" />
                              )}
                            </button>
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5">
                        <div className="text-right">
                          <p className="text-3xl font-bold tracking-tight text-white">₹{transaction.saleAmount.toLocaleString()}</p>
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

        {!loading && transactions.length > 0 && (
          <div className="mt-2 space-y-3">
            <p className="text-center text-white/40 text-sm">
              Showing page {page} of {totalPages}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              <span className="px-4 py-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-200 text-sm font-semibold min-w-16 text-center">
                {page}
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SellerTransactionsFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05050a]">
      <div className="h-12 w-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
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


