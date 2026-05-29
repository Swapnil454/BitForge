"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cartAPI, searchAPI, wishlistAPI } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useInfiniteProducts } from "@/lib/useInfiniteProducts";
import toast from "react-hot-toast";
import Image from "next/image";

import BuyerHeader from "@/app/components/buyer/layout/BuyerHeader";
import BuyerFooter from "@/app/components/buyer/layout/BuyerFooter";
import HeroAds from "@/app/components/buyer/home/HeroAds";
import HeroSkeleton from "@/app/components/buyer/home/HeroSkeleton";
import CategoryPills from "@/app/components/buyer/home/CategoryPills";
import MobileBottomNav from "@/app/components/buyer/layout/MobileBottomNav";
import CategoryShowcaseGrid from "@/app/components/buyer/home/CategoryShowcaseGrid";
import ProductRow from "@/app/components/buyer/home/ProductRow";
import PromoGridRow from "@/app/components/buyer/home/PromoGridRow";
import ProductCardSkeleton from "@/app/components/buyer/product/ProductCardSkeleton";
import ProductCard, { ProductType } from "@/app/components/buyer/product/ProductCard";
import { marketplaceSections } from "@/app/components/buyer/data/marketplaceSections";

// ─── Skeleton grid used in loading states ────────────────────────────────────
function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array(count).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

// ─── Infinite-scroll product grid ─────────────────────────────────────────────
function InfiniteProductGrid({
  title,
  subtitle,
  category,
  sort,
  search,
  wishlist,
  cartItems,
  addingToCart,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
}: {
  title?: string;
  subtitle?: string;
  category?: string;
  sort?: "newest" | "trending" | "rating";
  search?: string;
  wishlist: string[];
  cartItems: string[];
  addingToCart: string | null;
  onToggleWishlist: (e: React.MouseEvent, id: string) => void;
  onAddToCart: (e: React.MouseEvent, id: string) => void;
  onBuyNow: (e: React.MouseEvent, id: string) => void;
}) {
  const { products, isLoading, isFetchingMore, hasMore, error, sentinelRef } =
    useInfiniteProducts({ category, sort, search });

  if (isLoading) return <GridSkeleton />;

  if (error) {
    return (
      <div className="py-20 text-center text-red-500 dark:text-red-400 font-medium">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="pt-10 -mt-8 pb-32 flex flex-col items-center justify-center text-center px-4">
        <div className="mb-1 relative w-64 h-64 md:w-80 md:h-80">
          <Image 
            src="/no_product_found_placeholder.png" 
            alt="No products found" 
            fill
            className="object-contain drop-shadow-md"
            priority
          />
        </div>
        <h3 className="text-2xl -mt-6 font-black text-gray-900 dark:text-white mb-2 tracking-tight">No products found</h3>
        <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          We couldn't find anything matching your current filters. Try adjusting your search or exploring a different category!
        </p>
      </div>
    );
  }

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            isInWishlist={wishlist.includes(product._id)}
            isInCart={cartItems.includes(product._id)}
            isAddingToCart={addingToCart === product._id}
            onToggleWishlist={onToggleWishlist}
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
          />
        ))}
      </div>

      {/* Invisible sentinel — triggers next page load */}
      {hasMore && (
        <div ref={sentinelRef as any} className="w-full h-4 mt-4" />
      )}

      {/* Spinner while fetching more */}
      {isFetchingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-3">
          <GridSkeleton count={4} />
        </div>
      )}
    </div>
  );
}

// ─── HomeView — the main landing page rows (unchanged, fast, client-side) ────
// We still load a "reasonable" set of products for the home sliders.
function HomeView({
  homeProducts,
  homeLoading,
  searchQuery,
  wishlist,
  cartItems,
  addingToCart,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
}: {
  homeProducts: ProductType[];
  homeLoading: boolean;
  searchQuery: string;
  wishlist: string[];
  cartItems: string[];
  addingToCart: string | null;
  onToggleWishlist: (e: React.MouseEvent, id: string) => void;
  onAddToCart: (e: React.MouseEvent, id: string) => void;
  onBuyNow: (e: React.MouseEvent, id: string) => void;
}) {
  const router = useRouter();


  // Section filtering + padding logic
  const getSectionProducts = (type: string, categoryFilter?: string, limit?: number) => {
    let filtered = [...homeProducts];
    if (type === "Category" && categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    } else if (type === "Trending") {
      filtered = [...filtered].sort((a, b) => ((b.buyers as number) || 0) - ((a.buyers as number) || 0));
    } else if (type === "Recommended") {
      filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (type === "NewArrivals") {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    let result = limit ? filtered.slice(0, limit) : filtered;
    // Pad to limit by repeating
    if (limit && result.length > 0 && result.length < limit) {
      const original = [...result];
      let i = 0;
      while (result.length < limit) {
        result.push({ ...original[i % original.length], _id: `${original[i % original.length]._id}-pad-${result.length}` } as any);
        i++;
      }
    }
    return result;
  };

  // seeAll URL per section type
  const seeAllUrl = (section: typeof marketplaceSections[0]) => {
    if (section.categoryFilter) return `/marketplace?category=${encodeURIComponent(section.categoryFilter)}`;
    if (section.type === "Trending")    return `/marketplace?collection=Trending`;
    if (section.type === "Recommended") return `/marketplace?collection=Recommended`;
    if (section.type === "NewArrivals") return `/marketplace?collection=All`;
    return `/marketplace?collection=All`;
  };

  if (homeLoading) {
    return (
      <>
        <HeroSkeleton />
        <div className="w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6 mt-10">
          <GridSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      {!searchQuery && <CategoryShowcaseGrid products={homeProducts} />}

      {marketplaceSections.map((section) => {
        const sectionProducts = getSectionProducts(section.type, section.categoryFilter, section.limit);
        if (sectionProducts.length === 0) return null;

        return (
          <React.Fragment key={section.id}>
            {section.id === "best-courses" && <PromoGridRow products={homeProducts} />}
            {section.id === "top-ebooks" && <PromoGridRow products={homeProducts} variant="tools" />}
            <ProductRow
              title={section.title}
              subtitle={section.subtitle}
              products={sectionProducts}
              onSeeAll={() => router.push(seeAllUrl(section))}
            />
          </React.Fragment>
        );
      })}

      {/* "See All" CTA */}
      <div className="w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6 mb-8 flex flex-col items-center gap-2">
        <p className="text-sm text-gray-400 dark:text-slate-500">Showing a curated selection from our catalogue</p>
        <button
          onClick={() => router.push("/marketplace?collection=All")}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
        >
          Explore All Products
          <span className="text-lg">→</span>
        </button>
      </div>
    </>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────
export default function MarketplaceClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  // Hoisted state for home products so CategoryPills can use it everywhere
  const [homeProducts, setHomeProducts] = useState<ProductType[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);

  useEffect(() => {
    import("@/lib/api").then(({ marketplaceAPI }) => {
      marketplaceAPI.getAllProducts({ limit: 50 })
        .then((data) => setHomeProducts(data.products || []))
        .catch(() => {})
        .finally(() => setHomeLoading(false));
    });
  }, []);

  const { isAuthenticated, requireAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") || undefined;
  const collectionParam = searchParams.get("collection") || undefined;

  // Determine grid view mode
  const isGridView = !!(categoryParam || collectionParam || searchQuery);

  // Map collection param to sort
  const collectionSort = (): "newest" | "trending" | "rating" | undefined => {
    if (collectionParam === "Trending") return "trending";
    if (collectionParam === "Recommended") return "rating";
    if (collectionParam === "All") return "newest";
    return undefined;
  };

  // Grid view title/subtitle
  const gridTitle = () => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (categoryParam) return ""; // Replaced by highlighted CategoryPill
    if (collectionParam === "Trending") return "Trending Products";
    if (collectionParam === "Recommended") return "Best Selling & Highly Rated";
    if (collectionParam === "All") return ""; // Replaced by Explore All Pill
    return "";
  };

  const gridSubtitle = () => {
    if (searchQuery) return "Scroll to load more results";
    if (categoryParam) return ""; // Replaced by highlighted CategoryPill
    if (collectionParam === "Trending") return "The most popular products right now";
    if (collectionParam === "Recommended") return "Our top picks for you";
    if (collectionParam === "All") return ""; // Replaced by Explore All Pill
    return "";
  };

  // Load wishlist
  useEffect(() => {
    if (isAuthenticated) {
      wishlistAPI.getWishlist()
        .then((data) => {
          setWishlist(data.wishlist || []);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Load cart
  useEffect(() => {
    if (isAuthenticated) {
      cartAPI.getCart()
        .then((data) => {
          const ids = data.cart.items.map((item: any) => item.productId._id || item.productId);
          setCartItems(ids);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const toggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); e.preventDefault();
    requireAuth("add to wishlist", async () => {
      const isIn = wishlist.includes(productId);
      try {
        await wishlistAPI.toggleWishlist(productId);
        const updated = isIn ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
        setWishlist(updated);
        toast.success(isIn ? "Removed from wishlist" : "Added to wishlist");
      } catch (error) {
        toast.error("Failed to update wishlist");
      }
    });
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); e.preventDefault();
    requireAuth("add to cart", async () => {
      const isIn = cartItems.includes(productId);
      try {
        setAddingToCart(productId);
        if (isIn) {
          await cartAPI.removeFromCart(productId);
          setCartItems((prev) => prev.filter((id) => id !== productId));
          toast.success("Removed from cart");
        } else {
          await cartAPI.addToCart(productId, 1);
          setCartItems((prev) => [...prev, productId]);
          toast.success("Added to cart! 🛒");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to update cart");
      } finally {
        setAddingToCart(null);
      }
    });
  };

  const handleBuyNow = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); e.preventDefault();
    requireAuth("buy now", async () => {
      const isIn = cartItems.includes(productId);
      if (!isIn) {
        try {
          setAddingToCart(productId);
          await cartAPI.addToCart(productId, 1);
          setCartItems((prev) => [...prev, productId]);
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to update cart");
          setAddingToCart(null);
          return;
        }
      }
      router.push("/cart");
    });
  };

  // ── Committed search: update query state + save history ─────────────────
  const handleSearch = (term?: string) => {
    const q = (term ?? searchTerm).trim();
    if (term) setSearchTerm(term);
    setSearchQuery(q);
    if (q.length >= 2 && isAuthenticated) {
      searchAPI.saveHistory(q).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#020617] text-gray-900 dark:text-slate-50 transition-colors duration-200 flex flex-col">
      <BuyerHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        cartCount={cartItems.length}
        wishlistCount={wishlist.length}
        isCollectionPage={isGridView}
        onBackClick={() => router.back()}
      />

      <main className="flex-grow">
        {/* Global Hero Ads and Category Pills */}
        {!searchQuery && <HeroAds />}
        {!searchQuery && (
          <div className="mt-0 mb-1 sm:mb-2 relative z-10">
            <CategoryPills products={homeProducts} />
          </div>
        )}

        {/* Grid view: search / category / collection / all */}
        {isGridView ? (
          <div className="relative z-10 w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6 py-6">
            <InfiniteProductGrid
                title={gridTitle()}
                subtitle={gridSubtitle()}
                category={categoryParam}
                sort={collectionSort()}
                search={searchQuery || undefined}
                wishlist={wishlist}
                cartItems={cartItems}
                addingToCart={addingToCart}
                onToggleWishlist={toggleWishlist}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            </div>
        ) : (
          /* Home view: hero + sections + rows */
          <div className="relative z-10">
            <HomeView
              homeProducts={homeProducts}
              homeLoading={homeLoading}
              searchQuery={searchQuery}
              wishlist={wishlist}
              cartItems={cartItems}
              addingToCart={addingToCart}
              onToggleWishlist={toggleWishlist}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          </div>
        )}
      </main>

      {!isGridView && <BuyerFooter />}
      <MobileBottomNav />
    </div>
  );
}
