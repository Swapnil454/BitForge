"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Package, Search, ChevronRight, ChevronLeft, CheckCircle2, Clock, XCircle, MoreVertical, BarChart3 } from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import AdminProductFilters, { ProductStatusFilter, ProductSortOption } from "./components/AdminProductFilters";

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

export default function ProductsManagementPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [sortBy, setSortBy] = useState<ProductSortOption>("newest");
  
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  
  const PAGE_SIZE = 10;

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getAllProducts({
        page,
        limit: PAGE_SIZE,
        search: searchTerm,
        status: statusFilter,
        sortBy,
      });
      setProducts(data.products || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
      setStats(data.stats || { approved: 0, pending: 0, rejected: 0 });
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const handleClearAll = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "pending": return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case "rejected": return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-purple-500/30">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        title="Products"
        subtitle="Manage product approvals and catalog"
        rightSlot={
          <div className="flex items-center gap-4">
             
             <div className="relative" ref={headerMenuRef}>
                <button
                  onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                  className="h-11 w-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.08] transition shadow-xl"
                >
                  <MoreVertical className="h-5 w-5 text-white/70" />
                </button>

                <AnimatePresence>
                  {headerMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-48 rounded-2xl border border-white/10 bg-[#12121a] backdrop-blur-xl p-2 shadow-2xl z-50"
                    >
                      <button
                        onClick={() => {
                          router.push("/dashboard/admin/products-management/analytics");
                          setHeaderMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/[0.05] transition-all"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Filters */}
        <AdminProductFilters
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClearAll={handleClearAll}
        />

        {/* Products List */}
        <div className="space-y-4 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[120px] bg-[#1c1c24] border border-white/10 rounded-2xl animate-pulse" />
              ))
            ) : products.length > 0 ? (
              products.map((product, idx) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group relative bg-[#1c1c24] hover:bg-[#23232d] border border-white/[0.05] hover:border-blue-500/40 rounded-2xl p-4 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    {/* Compact Square Thumbnail */}
                    <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-black/40 overflow-hidden border border-white/5 shadow-xl">
                      {product.thumbnailUrl ? (
                        <img 
                          src={product.thumbnailUrl} 
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base sm:text-lg font-bold text-white/90 group-hover:text-white truncate tracking-tight uppercase">
                          {product.title}
                        </h3>
                        <div className={`shrink-0 flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                          product.status === "approved" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                          product.status === "pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        }`}>
                          {getStatusIcon(product.status)}
                          {product.status}
                        </div>
                      </div>
                      
                      <p className="text-sm text-white/40 line-clamp-1 mb-1 font-medium">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap opacity-60">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          <span className="text-white/30 uppercase tracking-widest text-[8px]">₹</span>
                          <span className="text-white">{product.price}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          <span className="text-white/30 uppercase tracking-widest text-[8px]">By</span>
                          <span className="text-white truncate max-w-[100px]">{product.sellerId?.name}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold">
                          <span className="text-white/30 uppercase tracking-widest text-[8px]">In</span>
                          <span className="text-white">{product.category || "General"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <button 
                      onClick={() => router.push(`/dashboard/admin/products-management/${product._id}`)}
                      className="shrink-0 h-8 px-4 rounded-lg bg-blue-500/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-600 text-[11px] font-black uppercase tracking-wider text-blue-400 hover:text-white transition-all duration-300 active:scale-95"
                    >
                      View
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-24 bg-[#1c1c24] border border-white/10 rounded-3xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-white/20" />
                </div>
                <h3 className="text-lg font-semibold text-white/60">No products found</h3>
                <p className="text-white/20 text-sm mt-1 px-4">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
              Showing {products.length} of {totalCount} products
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/10 text-white/40 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.08] transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  if (totalPages > 5 && Math.abs(p - page) > 2) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-10 w-10 rounded-xl text-xs font-black transition-all border ${
                        page === p
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                          : "bg-white/[0.03] border-white/5 text-white/30 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/10 text-white/40 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.08] transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
