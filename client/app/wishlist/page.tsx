"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { marketplaceAPI, cartAPI } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";
import PageHeader from "../dashboard/buyer/transactions/components/PageHeader";
import { ShoppingCart, HeartCrack, Trash2, Package, Sparkles, Loader2 } from "lucide-react";

type Product = {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  category: string;
  thumbnailUrl?: string;
  sellerId: {
    name?: string;
    email?: string;
  };
};

const PAGE_SIZE = 7;

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent("/wishlist");
      router.replace(`/login?next=${returnUrl}`);
      return;
    }
    setAuthChecked(true);
  }, [router]);

  // Load wishlist from localStorage and fetch products (only after auth check)
  useEffect(() => {
    if (!authChecked) return;
    
    let currentWishlist: string[] = [];
    const saved = localStorage.getItem("wishlist");
    if (saved) {
      try {
        currentWishlist = JSON.parse(saved);
        setWishlist(currentWishlist);
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
    
    void fetchPage(currentWishlist, 1, true);
  }, [authChecked]);

  const fetchPage = async (fullList: string[], targetPage: number, isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (fullList.length === 0) {
      setLoading(false);
      setHasFetchedInitial(true);
      isFetchingRef.current = false;
      return;
    }

    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const startIndex = (targetPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const idsToFetch = fullList.slice(startIndex, endIndex);

      const promises = idsToFetch.map(id => marketplaceAPI.getProductById(id).catch(() => null));
      const results = await Promise.all(promises);
      const incoming = results.filter(Boolean);

      setProducts(prev => isInitial ? incoming : [...prev, ...incoming]);
      setHasNextPage(endIndex < fullList.length);
      setPage(targetPage);
    } catch (error: any) {
      toast.error("Failed to load wishlist products");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setHasFetchedInitial(true);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore && !loading) {
          void fetchPage(wishlist, page + 1, false);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, loading, page, wishlist]);

  const removeFromWishlist = (productId: string, silent = false) => {
    const updated = wishlist.filter(id => id !== productId);
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    setProducts(products.filter(p => p._id !== productId));
    if (!silent) {
      toast.success("Removed from wishlist");
    }
  };

  const moveToCart = async (product: Product) => {
    try {
      await cartAPI.addToCart(product._id, 1);

      // Remove from wishlist without extra toast
      removeFromWishlist(product._id, true);

      toast.success("Moved to cart successfully!");
    } catch (err: any) {
      const message = err?.response?.data?.message?.toLowerCase?.() || "";
      if (message.includes("already") || message.includes("exists")) {
        toast.error("Product already in cart");
        return;
      }
      toast.error("Failed to move to cart");
    }
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A101D] text-slate-900 dark:text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 dark:border-white/10 border-t-indigo-600" />
          <p className="text-slate-500 text-sm font-bold tracking-wide">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A101D] text-slate-900 dark:text-white pb-20">
      <PageHeader
        backHref="/dashboard/buyer"
        backLabel="Back"
        title="My Wishlist"
        subtitle={`${wishlist.length} item${wishlist.length !== 1 ? "s" : ""} saved`}
        rightSlot={
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-xl bg-white dark:bg-[#12141c] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm font-bold shadow-sm transition"
            title="Go to Cart"
          >
            <ShoppingCart className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline sm:ml-2">Cart</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-16 sm:py-24 px-4">
            {/* Animated floating empty state icon */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, -2, 2, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="relative w-20 h-20 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-100/50 dark:shadow-none"
            >
              <HeartCrack className="w-10 h-10 text-slate-400 dark:text-white/40" />
            </motion.div>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-slate-500 dark:text-white/50 text-sm max-w-xs mb-8 leading-relaxed">
              Explore the marketplace to discover premium digital assets and save your favorite items here!
            </p>

            <button
              onClick={() => router.push("/marketplace")}
              className="group relative px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.45)] flex items-center gap-2"
            >
              <span>Explore Marketplace</span>
              <svg 
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4 max-w-3xl mx-auto">
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => {
                const finalPrice = product.discount > 0
                  ? Math.max(product.price - (product.price * product.discount) / 100, 0)
                  : product.price;

                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.04, 0.3) }}
                    className="bg-white dark:bg-[#12141c]/80 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all p-3 sm:p-4 flex flex-row gap-3 sm:gap-4 group"
                  >
                    {/* Thumbnail */}
                    <div 
                      className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-[#F7F7F7] dark:bg-[#0B1221] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden relative cursor-pointer flex items-center justify-center" 
                      onClick={() => router.push(`/marketplace/${product._id}`)}
                    >
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.title}
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Package className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-white/10" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h2 
                              className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer tracking-tight"
                              onClick={() => router.push(`/marketplace/${product._id}`)}
                            >
                              {product.title}
                            </h2>
                            {product.sellerId?.name && (
                              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                {product.sellerId.name}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromWishlist(product._id)}
                            className="shrink-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-1.5 rounded-lg transition"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-1 sm:line-clamp-2 mt-1.5 leading-relaxed hidden sm:block">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex flex-row items-center justify-between gap-2 mt-3 sm:mt-0 pt-2 sm:pt-0 sm:border-t-0 border-t border-gray-100 dark:border-white/5">
                        {/* Price Block */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                            ₹{finalPrice.toLocaleString()}
                          </span>
                          {product.discount > 0 && (
                            <>
                              <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
                                ₹{product.price.toLocaleString()}
                              </span>
                              <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-[9px] sm:text-[10px] font-bold tracking-wider">
                                -{product.discount}%
                              </span>
                            </>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => moveToCart(product)}
                          className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Move to Cart</span>
                          <span className="sm:hidden">Move</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div ref={sentinelRef} className="h-4" />

            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-2 text-slate-500 dark:text-white/40 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  <span>Loading more items...</span>
                </div>
              </div>
            )}

            {!hasNextPage && !loadingMore && products.length > 0 && (
              <p className="text-center text-xs text-slate-400 dark:text-white/25 py-4 tracking-wide">
                — You've reached the end —
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
