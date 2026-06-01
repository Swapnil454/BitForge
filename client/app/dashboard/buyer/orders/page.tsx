"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Check, Copy, MoreVertical, Loader2 } from "lucide-react";
import { buyerAPI } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import toast from "react-hot-toast";

import PageHeader from "../transactions/components/PageHeader";
import InlineSearchFilters, { FilterOption, SortOption } from "../transactions/components/InlineSearchFilters";
import MobileBottomNav from "@/app/components/buyer/layout/MobileBottomNav";

interface Order {
  _id: string;
  orderId: string;
  productName: string;
  productId: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  status: "success" | "pending" | "failed" | "refunded" | "paid" | "created";
  date: string;
}

const PAGE_SIZE = 10;

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const router = useRouter();
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle filter/search changes (reset to page 1)
  useEffect(() => {
    void fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, filterBy, debouncedSearch]);

  // Click outside for header menu
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

  const fetchPage = async (targetPage: number, isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const statusMap: Record<FilterOption, "all" | "success" | "pending" | "failed"> = {
        all: "all",
        paid: "success",
        created: "pending",
        failed: "failed",
      };
      const sortMap: Record<SortOption, "date_desc" | "date_asc"> = {
        newest: "date_desc",
        oldest: "date_asc",
      };

      const data = await buyerAPI.getAllTransactions({
        page: targetPage,
        limit: PAGE_SIZE,
        status: statusMap[filterBy],
        sortBy: sortMap[sortBy],
        search: debouncedSearch,
      });

      const incoming: Order[] = data.transactions || [];
      const pag = data.pagination;

      setOrders((prev) => (isInitial ? incoming : [...prev, ...incoming]));
      setHasNextPage(pag?.hasNextPage ?? false);
      setPage(targetPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore && !loading) {
          void fetchPage(page + 1, false);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, loading, page, sortBy, filterBy, debouncedSearch]);

  const handleCopyOrderId = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (!orderId) return;
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
      case "success":
        return {
          label: "Paid",
          badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/35",
          dotColor: "bg-emerald-500 dark:bg-emerald-400",
        };
      case "failed":
        return {
          label: "Failed",
          badgeClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/35",
          dotColor: "bg-red-500 dark:bg-red-400",
        };
      case "created":
      case "pending":
        return {
          label: "Pending",
          badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35",
          dotColor: "bg-amber-500 dark:bg-amber-400",
        };
      case "refunded":
        return {
          label: "Refunded",
          badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/35",
          dotColor: "bg-blue-500 dark:bg-blue-400",
        };
      default:
        return {
          label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
          badgeClass: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/35",
          dotColor: "bg-slate-400 dark:bg-gray-400",
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white scroll-smooth">
      <PageHeader
        backHref="/dashboard/buyer"
        backLabel="Dashboard"
        title="All Orders"
        subtitle="Manage all your purchases"
        rightSlot={
          <div className="relative shrink-0" ref={headerMenuRef}>
            <button
              onClick={() => setHeaderMenuOpen((prev) => !prev)}
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
                  className="absolute right-0 top-11 w-44 rounded-xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-xl shadow-slate-200 dark:shadow-black/40 z-50"
                >
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      router.push("/dashboard/buyer/orders/analytics");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-white/85 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
                  >
                    Analytics
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      <main className="max-w-5xl mx-auto px-4 pt-3 pb-28 md:pb-6 space-y-4">
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
                  className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12141c] overflow-hidden animate-pulse"
                >
                  {/* Skeleton header */}
                  <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="h-3.5 w-20 bg-slate-200 dark:bg-white/10 rounded" />
                      <div className="h-3.5 w-24 bg-slate-200 dark:bg-white/10 rounded" />
                    </div>
                    <div className="h-5 w-14 bg-slate-200 dark:bg-white/10 rounded" />
                  </div>
                  {/* Skeleton body */}
                  <div className="p-4 sm:px-5 flex gap-5">
                    <div className="flex-1 space-y-2.5">
                      <div className="h-5 w-3/5 bg-slate-200 dark:bg-white/10 rounded-lg" />
                      <div className="h-4 w-2/5 bg-slate-100 dark:bg-white/5 rounded-lg" />
                      <div className="h-6 w-24 bg-slate-200 dark:bg-white/10 rounded-lg mt-1" />
                    </div>
                    <div className="shrink-0 w-32 flex items-center justify-center border-l border-slate-100 dark:border-white/5 pl-5">
                      <div className="h-9 w-full bg-slate-100 dark:bg-white/5 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.02] p-12 text-center"
            >
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <CalendarDays className="w-7 h-7 text-slate-400 dark:text-white/30" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">No Orders Found</h3>
              <p className="text-slate-500 dark:text-white/45 text-sm max-w-xs mx-auto">
                {searchQuery || filterBy !== "all"
                  ? "No orders match your current filters."
                  : "You haven't placed any orders yet. Explore the marketplace to get started."}
              </p>
              {!searchQuery && filterBy === "all" && (
                <button
                  onClick={() => router.push("/marketplace")}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold text-sm transition shadow-md shadow-violet-500/25"
                >
                  Browse Marketplace
                </button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => {
                const statusConfig = getStatusConfig(order.status);

                return (
                  <motion.article
                    key={order._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => router.push(`/dashboard/buyer/transactions/${order._id}`)}
                    className="group bg-white dark:bg-[#12141c] cursor-pointer rounded-2xl border border-slate-200 dark:border-white/[0.07] shadow-sm hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-black/40 hover:border-violet-200 dark:hover:border-violet-500/25 hover:ring-1 hover:ring-violet-200/60 dark:hover:ring-violet-500/20 transition-all duration-200 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.025]">
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {new Date(order.date || Date.now()).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="text-slate-300 dark:text-white/10">•</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 dark:text-slate-500">Order</span>
                          <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                            #{order.orderId ? order.orderId.slice(-8).toUpperCase() : order._id?.slice(-8).toUpperCase()}
                          </span>
                          <button 
                            type="button"
                            onClick={(e) => handleCopyOrderId(e, order.orderId || order._id)}
                            className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            title="Copy Order ID"
                          >
                            {copiedId === (order.orderId || order._id) ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className={`flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig.badgeClass}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}></div>
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row gap-4 sm:gap-5">
                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <h2 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors duration-200">
                          {order.productName || "Product"}
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                          Sold by{" "}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {order.sellerName || "Unknown"}
                          </span>
                        </p>
                        <div className="mt-3 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          ₹{(order.amount || 0).toLocaleString("en-IN")}
                        </div>
                      </div>

                      {/* Actions Panel */}
                      <div className="shrink-0 w-full sm:w-36 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-white/[0.05] pt-4 sm:pt-0 sm:pl-5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/buyer/transactions/${order._id}`);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-violet-200 dark:border-violet-500/25 bg-violet-50 dark:bg-violet-500/10 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>

        <div ref={sentinelRef} className="h-4" />

        {loadingMore && (
          <div className="flex justify-center py-6">
            <div className="flex items-center gap-2 text-slate-500 dark:text-white/40 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
              <span>Loading more orders...</span>
            </div>
          </div>
        )}

        {!hasNextPage && !loadingMore && orders.length > 0 && (
          <p className="text-center text-xs text-slate-400 dark:text-white/25 py-4 tracking-wide">
            — You've reached the end —
          </p>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}
