"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  BarChart3,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import { ProductStatusFilter, ProductSortOption } from "./components/AdminProductFilters";

interface Seller {
  _id: string;
  name: string;
  email: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: "approved" | "pending" | "rejected";
  sellerId: Seller;
  thumbnailUrl?: string;
  createdAt: string;
  rejectionReason?: string;
}

const categoryColors: Record<string, { pill: string; glow: string }> = {
  Course: { pill: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", glow: "group-hover:shadow-blue-100 dark:group-hover:shadow-blue-900/30" },
  eBook: { pill: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400", glow: "group-hover:shadow-violet-100 dark:group-hover:shadow-violet-900/30" },
  Template: { pill: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", glow: "group-hover:shadow-emerald-100 dark:group-hover:shadow-emerald-900/30" },
  Software: { pill: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", glow: "group-hover:shadow-amber-100 dark:group-hover:shadow-amber-900/30" },
  "Design Asset": { pill: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400", glow: "group-hover:shadow-pink-100 dark:group-hover:shadow-pink-900/30" },
};

const defaultCategoryStyle = {
  pill: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
  glow: "group-hover:shadow-cyan-100 dark:group-hover:shadow-cyan-900/20",
};

const categoryOptions = ["all", "Course", "eBook", "Template", "Software", "Design Asset"];

export default function ProductsManagementPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<ProductSortOption>("newest");

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 12;

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = useCallback(async () => {
    if (page === 1) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const data = await adminAPI.getAllProducts({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
        category: categoryFilter,
        sortBy,
      });
      if (page === 1) {
        setProducts(data.products || []);
      } else {
        setProducts((prev) => {
          const newProducts = (data.products || []).filter(
            (newProd: Product) => !prev.some((p) => p._id === newProd._id)
          );
          return [...prev, ...newProducts];
        });
      }
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [categoryFilter, debouncedSearch, page, sortBy, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, sortBy]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < totalPages && !loading && !isLoadingMore) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "100px" }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [page, totalPages, loading, isLoadingMore]);

  const handleClearAll = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortBy("newest");
  };

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    sortBy !== "newest";

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "pending":
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case "rejected":
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        title="Products"
        subtitle="product approvals and catalog"
        rightSlot={
          <div className="relative" ref={headerMenuRef}>
            <button
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
            >
              <MoreVertical className="h-5 w-5 text-slate-600 dark:text-white/70" />
            </button>

            <AnimatePresence>
              {headerMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#12121a] backdrop-blur-xl p-2 shadow-2xl shadow-gray-200/50 dark:shadow-black/40 z-50"
                >
                  <button
                    onClick={() => {
                      router.push("/dashboard/admin/products-management/analytics");
                      setHeaderMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 dark:text-white/60  dark:hover:text-white  dark:bg-white/[0.05] transition-all"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-1 pb-6 space-y-2 sm:space-y-4">
        <div className="space-y-2">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product title, description, or seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111826] pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
              />
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="relative min-w-[180px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-11 appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111826] px-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All Categories" : option}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
              </div>

              <div className="relative min-w-[170px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProductStatusFilter)}
                  className="w-full h-11 appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111826] px-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
              </div>

              <div className="relative min-w-[170px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
                  className="w-full h-11 appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111826] px-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_high">Highest Price</option>
                  <option value="price_low">Lowest Price</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="sm:hidden">
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide snap-x items-center">
              {(["approved", "pending", "rejected"] as ProductStatusFilter[]).map((status) => {
                const isActive = statusFilter === status;
                return (
                  <button
                    key={`status-${status}`}
                    type="button"
                    onClick={() => setStatusFilter(isActive ? "all" : status)}
                    className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors snap-start border ${
                      isActive
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                        : "bg-white dark:bg-[#0a0a14] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                );
              })}
              <span className="flex-shrink-0 text-slate-900 dark:text-white select-none">|</span>
              {categoryOptions
                .filter((category) => category !== "all")
                .map((category) => {
                  const isActive = categoryFilter === category;
                  return (
                    <button
                      key={`category-${category}`}
                      type="button"
                      onClick={() => setCategoryFilter(isActive ? "all" : category)}
                      className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors snap-start border ${
                        isActive
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                          : "bg-white dark:bg-[#0a0a14] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col bg-white dark:bg-[#0b0b14] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden animate-pulse">
                    <div className="w-full aspect-video bg-slate-100 dark:bg-white/5" />
                    <div className="p-4 flex flex-col flex-1 gap-3">
                      <div className="h-5 bg-slate-200 dark:bg-white/10 rounded-md w-3/4" />
                      <div className="space-y-2 mt-1">
                        <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-full" />
                        <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-4/5" />
                      </div>
                      <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-100 dark:border-white/5">
                        <div className="h-7 bg-slate-200 dark:bg-white/10 rounded-md w-1/3" />
                        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-lg w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {products.map((product, idx) => {
                  const categoryStyle = categoryColors[product.category || ""] ?? defaultCategoryStyle;

                  return (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => router.push(`/dashboard/admin/products-management/${product._id}`)}
                      className={`w-full group bg-white dark:bg-slate-900/40 transition-all duration-300 flex flex-col cursor-pointer rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-lg hover:-translate-y-1 ${categoryStyle.glow}`}
                    >
                      <div className="w-full flex justify-between items-start px-3 pt-3 sm:px-4 sm:pt-4 pb-2 bg-transparent relative">
                        <div className="flex items-center gap-2 flex-wrap z-10">
                          <span
                            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm ${
                              product.status === "approved"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : product.status === "rejected"
                                  ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                            }`}
                          >
                            {product.status}
                          </span>
                        </div>

                        <div className="absolute left-1/2 -translate-x-1/2 top-3 sm:top-4 z-0 pointer-events-none">
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${categoryStyle.pill}`}>
                            {product.category || "Product"}
                          </span>
                        </div>

                      </div>

                      <div className="flex flex-row sm:flex-col items-start px-3 pb-3 sm:px-4 sm:pb-4 pt-1 sm:pt-0">
                        <div className="relative w-1/3 sm:w-full shrink-0 aspect-square sm:aspect-video bg-gray-50 dark:bg-[#0A101D] overflow-hidden rounded-xl">
                          {product.thumbnailUrl ? (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#0A101D]">
                              <Package className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        <div className="flex flex-col flex-1 w-full pl-3 sm:pl-0 sm:pt-3 min-w-0">
                          <h3 className="font-extrabold text-[15px] text-gray-900 dark:text-white line-clamp-2 leading-snug tracking-tight">
                            {product.title}
                          </h3>

                          <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {product.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400">by</span>
                              <span className="text-slate-700 dark:text-slate-200 truncate max-w-[130px]">{product.sellerId?.name || "Unknown Seller"}</span>
                            </span>
                            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                            <span>{new Date(product.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2 mt-auto pt-2 sm:pt-4 flex-wrap">
                            <span className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white tracking-tight">
                              <span className="text-[10px] sm:text-[11px] font-semibold mr-0.5">₹</span>
                              {product.price.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex flex-row items-center justify-between gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/5 w-full">
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                              {getStatusIcon(product.status)}
                              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/admin/products-management/${product._id}`);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-500/15"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-[#0b0b14] rounded-2xl border border-slate-200 dark:border-white/5">
                <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-slate-400 dark:text-white/20" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No products found</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1 mb-4 px-4">Try adjusting your filters or search terms.</p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-2 text-sm font-bold text-slate-700 dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/10"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {products.length > 0 && page < totalPages && (
          <div ref={loaderRef} className="py-8 flex justify-center items-center w-full">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-[#111826] rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading more...</span>
            </div>
          </div>
        )}
        {products.length > 0 && page >= totalPages && totalPages > 1 && (
          <div className="py-8 flex justify-center w-full">
            <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold">
              End of results
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
