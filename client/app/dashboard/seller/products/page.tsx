"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import { MoreVertical, Calendar, Package, Plus, Pencil, Trash2, X, Megaphone, Star, Eye, Search, SlidersHorizontal } from "lucide-react";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

type ProductStatus = "pending" | "approved" | "rejected";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  status: ProductStatus;
  category?: string;
  rating?: number;
  buyers?: number;
  changeRequest?: "none" | "pending_update" | "pending_deletion";
  fileUrl: string;
  fileKey: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

const categoryColors: Record<string, { pill: string; glow: string }> = {
  Course:        { pill: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",   glow: "group-hover:shadow-blue-100 dark:group-hover:shadow-blue-900/30" },
  eBook:         { pill: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400", glow: "group-hover:shadow-violet-100 dark:group-hover:shadow-violet-900/30" },
  Template:      { pill: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", glow: "group-hover:shadow-emerald-100 dark:group-hover:shadow-emerald-900/30" },
  Software:      { pill: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",  glow: "group-hover:shadow-amber-100 dark:group-hover:shadow-amber-900/30" },
  "Design Asset":{ pill: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",    glow: "group-hover:shadow-pink-100 dark:group-hover:shadow-pink-900/30" },
};
const defaultCat = { pill: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400", glow: "group-hover:shadow-cyan-100 dark:group-hover:shadow-cyan-900/20" };
const categoryOptions = ["all", ...Object.keys(categoryColors)];
const priceRangeOptions = [
  { value: "all", label: "All Prices" },
  { value: "0-99", label: "Under Rs. 100", min: 0, max: 99 },
  { value: "100-499", label: "Rs. 100 - 499", min: 100, max: 499 },
  { value: "500-999", label: "Rs. 500 - 999", min: 500, max: 999 },
  { value: "1000-plus", label: "Rs. 1000+", min: 1000, max: null },
];

export default function MyProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshingFilters, setIsRefreshingFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const router = useRouter();
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const hasLoadedOnceRef = useRef(false);



  /* ================= DELETE STATE ================= */
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ================= MENU STATE ================= */
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = useCallback(async (pageToFetch: number) => {
    try {
      if (pageToFetch === 1) {
        if (!hasLoadedOnceRef.current) setLoading(true);
        else setIsRefreshingFilters(true);
      } else {
        setLoadingMore(true);
      }

      const activePriceRange = priceRangeOptions.find((option) => option.value === selectedPriceRange);
      const res = await api.get("/products/mine", {
        params: {
          page: pageToFetch,
          limit: 8,
          search: debouncedSearch || undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          minPrice: activePriceRange && activePriceRange.value !== "all" ? activePriceRange.min : undefined,
          maxPrice: activePriceRange && activePriceRange.value !== "all" ? activePriceRange.max : undefined,
        },
      });
      
      const newProducts = res.data.products || res.data || [];
      const totalPages = res.data.totalPages || 1;

      if (pageToFetch === 1) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => {
          const existingIds = new Set(prev.map(p => p._id));
          const uniqueNew = newProducts.filter((p: Product) => !existingIds.has(p._id));
          return [...prev, ...uniqueNew];
        });
      }

      setHasMore(pageToFetch < totalPages && newProducts.length > 0);
      setPage(pageToFetch);
    } catch {
      showError("Failed to load products");
    } finally {
      hasLoadedOnceRef.current = true;
      setLoading(false);
      setIsRefreshingFilters(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, selectedCategory, selectedPriceRange]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchProducts(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchProducts]);

  const hasActiveFilters = debouncedSearch.length > 0 || selectedCategory !== "all" || selectedPriceRange !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSelectedPriceRange("all");
  };

  /* ================= HANDLERS ================= */
  const handleDeleteClick = (id: string) => {
    setDeletingProductId(id);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProductId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/products/${deletingProductId}`);
      setProducts((prev) => prev.filter((p) => p._id !== deletingProductId));
      showSuccess("Product deleted successfully");
    } catch (error: any) {
      showError(error.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
      setDeletingProductId(null);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
        <PageHeader
          backHref="/dashboard/seller"
          backLabel="Dashboard"
          title="My Products"
        />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col bg-white dark:bg-[#0b0b14] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden animate-pulse">
                {/* Thumbnail Skeleton */}
                <div className="w-full aspect-video bg-slate-100 dark:bg-white/5" />
                
                {/* Content Skeleton */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div className="h-5 bg-slate-200 dark:bg-white/10 rounded-md w-3/4" />
                  <div className="space-y-2 mt-1">
                    <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-4/5" />
                  </div>
                  
                  {/* Price & Footer Skeleton */}
                  <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-100 dark:border-white/5">
                    <div className="h-7 bg-slate-200 dark:bg-white/10 rounded-md w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  /* ================= RENDER ================= */

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="My Products"
        subtitle={products.length > 0 ? "Manage your listings" : "No products yet"}
        rightSlot={
          <button
            onClick={() => router.push("/dashboard/seller/upload")}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#05050a] px-4 sm:px-5 py-2 text-sm font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span className="hidden sm:inline">Upload Product</span>
          </button>
        }
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111826] pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
              />
              {isRefreshingFilters && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-cyan-500/25 border-t-cyan-500 rounded-full animate-spin" />
              )}
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="relative min-w-[210px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
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

              <div className="relative min-w-[210px]">
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="w-full h-11 appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111826] px-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
                >
                  {priceRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex sm:hidden overflow-x-auto gap-2 pb-1 scrollbar-hide snap-x items-center">
            {categoryOptions.map((option) => {
              const isActive = selectedCategory === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedCategory(option)}
                  className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors snap-start border ${
                    isActive
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                      : "bg-white dark:bg-[#0a0a14] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {option === "all" ? "All Categories" : option}
                </button>
              );
            })}
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {products.map((p) => {
            const approved = p.status === "approved";
            const finalPrice =
              p.discount > 0
                ? Math.max(p.price - (p.price * p.discount) / 100, 0)
                : p.price;
            
            const rating = p.rating ? Number(p.rating).toFixed(1) : null;
            const catStyle = categoryColors[p.category || ""] ?? defaultCat;

            return (
              <div
                key={p._id}
                onClick={() => router.push(`/dashboard/seller/products/${p._id}`)}
                className={`
                  w-full group bg-white dark:bg-slate-900/40 transition-all duration-300
                  flex flex-col cursor-pointer
                  rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-lg hover:-translate-y-1
                  ${!approved ? "opacity-90" : ""}
                `}
              >
                {/* TOP BAR (Status + Category + Menu) */}
                <div className="w-full flex justify-between items-start px-3 pt-3 sm:px-4 sm:pt-4 pb-2 bg-transparent relative">
                  <div className="flex items-center gap-2 flex-wrap z-10">
                    <span
                      className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm
                        ${
                          approved
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : p.status === "rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        }`}
                    >
                      {p.status}
                    </span>

                    {approved && p.changeRequest && p.changeRequest !== "none" && (
                      <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                        <span className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />
                        {p.changeRequest === "pending_update" ? "Update" : "Delete"}
                      </span>
                    )}
                  </div>
                  
                  {/* Category pill */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-3 sm:top-4 z-0 pointer-events-none">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${catStyle.pill}`}>
                      {p.category || "Product"}
                    </span>
                  </div>

                  {/* MENU */}
                  <div className="relative shrink-0 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        setOpenMenuId(openMenuId === p._id ? null : p._id);
                      }}
                      className="h-8 w-8 grid place-items-center rounded-full bg-transparent hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer -mt-1 -mr-1"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {openMenuId === p._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, transformOrigin: "top right" }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-2xl z-30 overflow-hidden"
                        >
                          <MenuItem
                            label="View Product"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => router.push(`/dashboard/seller/products/${p._id}`)}
                          />
                          <MenuItem
                            label="Edit Details"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            disabled={p.changeRequest === "pending_update" || p.changeRequest === "pending_deletion"}
                            onClick={() => router.push(`/dashboard/seller/products/${p._id}/edit`)}
                            tooltip={approved && p.changeRequest === "none" ? "Changes require admin approval" : undefined}
                          />
                          <MenuItem
                            label="Delete Product"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            danger
                            disabled={p.changeRequest === "pending_update" || p.changeRequest === "pending_deletion"}
                            onClick={() => handleDeleteClick(p._id)}
                            tooltip={approved && p.changeRequest === "none" ? "Deletion requires admin approval" : undefined}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* BODY (Thumbnail + Info) */}
                <div className="flex flex-row sm:flex-col items-start px-3 pb-3 sm:px-4 sm:pb-4 pt-1 sm:pt-0">
                  {/* THUMBNAIL AREA */}
                  <div className="relative w-1/3 sm:w-full shrink-0 aspect-square sm:aspect-video bg-gray-50 dark:bg-[#0A101D] overflow-hidden rounded-xl">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#0A101D]">
                        <Package className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* INFO AREA */}
                  <div className="flex flex-col flex-1 w-full pl-3 sm:pl-0 sm:pt-3 min-w-0">

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-[15px] text-gray-900 dark:text-white line-clamp-2 leading-snug tracking-tight">
                    {p.title}
                  </h3>
                  
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {p.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {rating ? (
                      <>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} size={11} className={
                              s <= Math.round(Number(rating))
                                ? "fill-[#FFA41C] text-[#FFA41C]"
                                : "fill-gray-200 text-gray-200 dark:fill-slate-700 dark:text-slate-700"
                            } />
                          ))}
                        </div>
                        <span className="text-[10px] font-medium text-[#007185] dark:text-cyan-400 ml-0.5">
                          {rating} <span className="text-gray-400">({p.buyers || 0})</span>
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 italic">No ratings yet</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-auto pt-2 sm:pt-4 flex-wrap">
                    <span className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white tracking-tight">
                      <span className="text-[10px] sm:text-[11px] font-semibold mr-0.5">₹</span>
                      {finalPrice.toLocaleString()}
                    </span>
                    {p.discount > 0 && (
                      <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 line-through">
                        ₹{p.price.toLocaleString()}
                      </span>
                    )}
                    {p.discount > 0 && (
                      <span className="bg-[#CC0C39] text-white px-1 sm:px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold tracking-wide">
                        -{p.discount}%
                      </span>
                    )}
                  </div>

                  {/* Date & Actions */}
                  <div className="flex flex-row items-center justify-between gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/5 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    {approved && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/seller/promotions/create?productId=${p._id}`);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-500/15"
                      >
                        <Megaphone className="h-3 w-3" />
                        Promote
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* LOADING INDICATOR / SENSOR */}
        {hasMore && (
          <div ref={observerTarget} className="flex justify-center items-center py-6">
            {loadingMore ? (
              <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            ) : null}
          </div>
        )}
        
        {!hasMore && products.length > 0 && (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">
            You've reached the end of your products.
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-[#0b0b14] rounded-2xl border border-slate-200 dark:border-white/5">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No products found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 mb-4">
              {hasActiveFilters
                ? "Try a different search, category, or price range."
                : "You haven't uploaded any products yet."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-2 text-sm font-bold text-slate-700 dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" strokeWidth={3} />
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => router.push("/dashboard/seller/upload")}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 text-[#05050a] px-5 py-2 text-sm font-bold transition-all hover:bg-cyan-400"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
                Upload Product
              </button>
            )}
          </div>
        )}

      </section>


      {/* ================= DELETE MODAL ================= */}
      {deletingProductId && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div className="bg-white dark:bg-[#0b0b14] border border-red-200 dark:border-red-500/20 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h2 className="text-lg font-black text-red-500 dark:text-red-400">Delete Product?</h2>
            <p className="text-sm text-slate-600 dark:text-white/60">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingProductId(null)} className="flex-1 py-2 bg-slate-200 dark:bg-white/10 rounded-lg text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="flex-1 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

/* ================= MENU ITEM ================= */

function MenuItem({
  label,
  icon,
  onClick,
  disabled,
  danger,
  tooltip,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="relative group">
      <button
        onClick={disabled ? undefined : onClick}
        className={`w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm transition-colors
          ${disabled
            ? "opacity-40 cursor-not-allowed"
            : danger
            ? "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300"
            : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"}
        `}
      >
        {icon}
        {label}
      </button>
      {tooltip && (
        <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-max text-[10px] uppercase font-bold tracking-wider bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          {tooltip}
        </div>
      )}
    </div>
  );
}
