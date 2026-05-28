"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { marketplaceAPI, cartAPI, wishlistAPI } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";
import PageHeader from "../dashboard/buyer/transactions/components/PageHeader";
import { ShoppingCart, HeartCrack, Trash2, Package, Sparkles, Loader2 } from "lucide-react";
import ProductCard from "@/app/components/buyer/product/ProductCard";

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
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

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

  // Load wishlist from database (only after auth check)
  useEffect(() => {
    if (!authChecked) return;
    
    wishlistAPI.getWishlist()
      .then((data) => {
        const currentWishlist = data.wishlist || [];
        setWishlist(currentWishlist);
        void fetchPage(currentWishlist, 1, true);
      })
      .catch((e) => {
        console.error("Failed to fetch wishlist", e);
        setLoading(false);
        setHasFetchedInitial(true);
      });
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

  const removeFromWishlist = async (productId: string, silent = false) => {
    try {
      await wishlistAPI.toggleWishlist(productId);
      const updated = wishlist.filter(id => id !== productId);
      setWishlist(updated);
      setProducts(products.filter(p => p._id !== productId));
      if (!silent) {
        toast.success("Removed from wishlist");
      }
    } catch (error) {
      if (!silent) {
        toast.error("Failed to remove from wishlist");
      }
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    removeFromWishlist(productId);
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setAddingToCartId(productId);
    try {
      await cartAPI.addToCart(productId, 1);
      removeFromWishlist(productId, true);
      toast.success("Moved to cart successfully!");
    } catch (err: any) {
      const message = err?.response?.data?.message?.toLowerCase?.() || "";
      if (message.includes("already") || message.includes("exists")) {
        toast.error("Product already in cart");
      } else {
        toast.error("Failed to move to cart");
      }
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    await handleAddToCart(e, productId);
    router.push("/cart");
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductCard
                    product={product as any}
                    isInWishlist={true}
                    isInCart={false}
                    isAddingToCart={addingToCartId === product._id}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

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
            <p className="text-center text-xs text-slate-400 dark:text-white/25 py-8 tracking-wide">
              — You've reached the end —
            </p>
          )}
          </>
        )}
      </main>
    </div>
  );
}
