"use client";

import ProductCard, { ProductType } from "../product/ProductCard";
import ProductCardSkeleton from "../product/ProductCardSkeleton";

interface ProductGridProps {
  title: string;
  subtitle?: string;
  products: ProductType[];
  isLoading?: boolean;
  wishlist: string[];
  cartItems: string[];
  addingToCart: string | null;
  onToggleWishlist: (e: React.MouseEvent, productId: string) => void;
  onAddToCart: (e: React.MouseEvent, productId: string) => void;
  onBuyNow: (e: React.MouseEvent, productId: string) => void;
}

export default function ProductGrid({
  title,
  subtitle,
  products,
  isLoading = false,
  wishlist,
  cartItems,
  addingToCart,
  onToggleWishlist,
  onAddToCart,
  onBuyNow
}: ProductGridProps) {
  
  if (!isLoading && products.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
           <span className="text-4xl">📦</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">No products found</h2>
        <p className="text-gray-500 dark:text-slate-400 max-w-md">
          There are currently no products available in this section.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mb-12 mt-6">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm md:text-base text-gray-500 dark:text-slate-400 mt-2">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
        {isLoading ? (
          Array(10).fill(0).map((_, idx) => (
            <ProductCardSkeleton key={`skel-grid-${idx}`} />
          ))
        ) : (
          products.map((product) => (
            <div key={product._id} className="w-full flex justify-center">
              <ProductCard
                product={product}
                isInWishlist={wishlist.includes(product._id)}
                isInCart={cartItems.includes(product._id)}
                isAddingToCart={addingToCart === product._id}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
