"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Check, Copy, MoreVertical } from "lucide-react";
import { buyerAPI } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import toast from "react-hot-toast";

import PageHeader from "./components/PageHeader";
import InlineSearchFilters, { FilterOption, SortOption } from "./components/InlineSearchFilters";

interface Transaction {
  _id: string;
  orderId: string;
  productName: string;
  productId: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  status: "paid" | "created" | "failed";
  date: string;
}

interface PaginationState {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: PAGE_SIZE,
    totalRecords: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const router = useRouter();
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    void fetchTransactions();
  }, [page, sortBy, filterBy, debouncedSearch]);

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

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await buyerAPI.getAllTransactions({
        page,
        limit: PAGE_SIZE,
        status: filterBy,
        sortBy,
        search: debouncedSearch,
      });

      setTransactions(data.transactions || []);
      setPagination(
        data.pagination || {
          page: 1,
          limit: PAGE_SIZE,
          totalRecords: 0,
          totalPages: 1,
          hasPrevPage: false,
          hasNextPage: false,
        }
      );

      if (initialLoadDoneRef.current && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      initialLoadDoneRef.current = true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

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
      case "paid":
        return {
          label: "Success",
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
      default:
        return {
          label: "Unknown",
          badgeClass: "bg-gray-500/15 text-gray-300 border-gray-500/35",
          dotColor: "bg-gray-400",
        };
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleFilterChange = (value: FilterOption) => {
    setFilterBy(value);
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white scroll-smooth">
      <PageHeader
        backHref="/dashboard/buyer"
        backLabel="Dashboard"
        title="Transaction History"
        subtitle="Manage and track every payment in one place"
        rightSlot={
          <div className="relative shrink-0" ref={headerMenuRef}>
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
                  className="absolute right-0 top-11 w-44 rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-xl shadow-black/40"
                >
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      router.push("/dashboard/buyer/transactions/analytics");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition"
                  >
                    Analytics
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 pt-3 pb-6 space-y-4">
        <InlineSearchFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filterBy={filterBy}
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
                {searchQuery || filterBy !== "all"
                  ? "No transactions match your filters. Try a different status or sort."
                  : "You have no transactions yet. Explore marketplace to get started."}
              </p>
              {!searchQuery && filterBy === "all" && (
                <button
                  onClick={() => router.push("/marketplace")}
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold transition"
                >
                  Browse Marketplace
                </button>
              )}
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
                    onClick={() => router.push(`/dashboard/buyer/transactions/${transaction._id}`)}
                    className="relative overflow-hidden cursor-pointer rounded-2xl border border-white/5 bg-[#12141c] p-4 sm:p-5 text-left transition-all duration-300 hover:bg-[#181a25] hover:border-white/10 hover:shadow-xl hover:shadow-black/50 group"
                  >

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl leading-tight font-semibold text-white group-hover:text-violet-200 transition-colors truncate">
                          {transaction.productName}
                        </h3>
                        <p className="text-sm text-white/65 mt-1.5">
                          Sold by <span className="text-white/90 font-semibold">{transaction.sellerName}</span>
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
                        <p className="text-3xl font-bold tracking-tight text-white">₹{transaction.amount.toLocaleString()}</p>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-violet-300 text-sm font-medium group-hover:text-violet-200 transition-colors">
                        View Details
                      </span>
                      <span className="text-xs text-white/35">#{transaction._id.slice(-6)}</span>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>

        {!loading && pagination.totalRecords > 0 && (
          <div className="mt-2 space-y-3">
            <p className="text-center text-white/40 text-sm">
              Showing page {pagination.page} of {pagination.totalPages} • {pagination.totalRecords} total
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              <span className="px-4 py-2 rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-200 text-sm font-semibold min-w-16 text-center">
                {pagination.page}
              </span>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage}
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
