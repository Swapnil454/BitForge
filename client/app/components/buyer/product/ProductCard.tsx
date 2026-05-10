"use client";

import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Zap, Star, TrendingUp, Sparkles, Award } from "lucide-react";

export interface ProductType {
  _id: string;
  title: string;
  description?: string;
  price: number;
  discount?: number;
  category: string;
  thumbnailUrl?: string;
  fileUrl?: string;
  sellerId: { name?: string };
  rating?: number;
  buyers?: number;
  createdAt?: string;
}

interface ProductCardProps {
  product: ProductType;
  isInWishlist: boolean;
  isInCart: boolean;
  isAddingToCart: boolean;
  onToggleWishlist: (e: React.MouseEvent, productId: string) => void;
  onAddToCart: (e: React.MouseEvent, productId: string) => void;
  onBuyNow: (e: React.MouseEvent, productId: string) => void;
  /** Optional context badge override — passed by parent sections */
  badge?: "bestseller" | "trending" | "new" | null;
}

function getBadge(product: ProductType, overrideBadge?: "bestseller" | "trending" | "new" | null) {
  if (overrideBadge) return overrideBadge;
  if (!product.createdAt) return null;
  const daysSince = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 14) return "new";
  if ((product.buyers || 0) > 50) return "bestseller";
  if ((product.rating || 0) >= 4.5) return "trending";
  return null;
}

const categoryColors: Record<string, { pill: string; glow: string }> = {
  Course:        { pill: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",   glow: "group-hover:shadow-blue-100 dark:group-hover:shadow-blue-900/30" },
  eBook:         { pill: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400", glow: "group-hover:shadow-violet-100 dark:group-hover:shadow-violet-900/30" },
  Template:      { pill: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", glow: "group-hover:shadow-emerald-100 dark:group-hover:shadow-emerald-900/30" },
  Software:      { pill: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",  glow: "group-hover:shadow-amber-100 dark:group-hover:shadow-amber-900/30" },
  "Design Asset":{ pill: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",    glow: "group-hover:shadow-pink-100 dark:group-hover:shadow-pink-900/30" },
};
const defaultCat = { pill: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400", glow: "group-hover:shadow-cyan-100 dark:group-hover:shadow-cyan-900/20" };

export default function ProductCard({
  product,
  isInWishlist,
  isInCart,
  isAddingToCart,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  badge: badgeProp,
}: ProductCardProps) {
  const router = useRouter();

  const finalPrice =
    product.discount && product.discount > 0
      ? Math.max(product.price - (product.price * product.discount) / 100, 0)
      : product.price;

  const rating = product.rating ? Number(product.rating).toFixed(1) : null;
  const badge  = getBadge(product, badgeProp);

  return (
    <div
      onClick={() => router.push(`/marketplace/${product._id}`)}
      className="w-full h-full group flex flex-col cursor-pointer bg-transparent"
    >
      {/* ── Thumbnail Area ── */}
      <div className="relative w-full aspect-square bg-[#F7F7F7] dark:bg-[#0A101D] rounded-xl overflow-hidden flex items-center justify-center group-hover:shadow-md transition-shadow duration-300">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500 p-2 sm:p-4"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#0A101D]">
            <span className="text-gray-400 dark:text-slate-600 text-xs font-medium uppercase tracking-widest">{product.category}</span>
          </div>
        )}

        {/* Floating Wishlist Button (Matches the bottom-left icon in the reference) */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(e, product._id); }}
          className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95 border border-gray-100 dark:border-white/10"
        >
          <Heart size={16} className={`${isInWishlist ? "fill-pink-500 text-pink-500" : "text-gray-700 dark:text-gray-300"}`} />
        </button>

        {/* Badge Overlay */}
        {badge && (
          <span className={`absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold shadow-sm ${
            badge === "bestseller" ? "bg-orange-500 text-white" :
            badge === "trending"   ? "bg-cyan-500 text-white" :
                                     "bg-green-500 text-white"
          }`}>
            {badge === "bestseller" ? "Bestseller" : badge === "trending" ? "Trending" : "New"}
          </span>
        )}
      </div>

      {/* ── Info Area ── */}
      <div className="flex flex-col flex-grow pt-3 px-1">
        {/* Category (Like "Sponsored") */}
        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium mb-1 truncate">
          {product.category}
        </p>

        {/* Brand / Seller */}
        <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
          {product.sellerId?.name || "Unknown Seller"}
        </h3>

        {/* Title */}
        <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 line-clamp-2 mt-0.5 leading-snug font-medium">
          {product.title}
        </p>

        {/* Description (1-2 lines) */}
        {product.description && (
          <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5 mb-1">
          {rating ? (
            <>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={12} className={
                    s <= Math.round(Number(rating))
                      ? "fill-[#FFA41C] text-[#FFA41C]"
                      : "fill-gray-200 text-gray-200 dark:fill-slate-700 dark:text-slate-700"
                  } />
                ))}
              </div>
              <span className="text-[11px] sm:text-xs text-[#007185] dark:text-cyan-400 hover:underline cursor-pointer ml-0.5">
                ({product.buyers || 0})
              </span>
            </>
          ) : (
            <span className="text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 italic">No ratings yet</span>
          )}
        </div>

        {/* Spacer to push price and button to bottom */}
        <div className="flex-grow" />

        {/* Price & Discounts */}
        <div className="flex flex-col mt-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-bold text-lg sm:text-2xl text-gray-900 dark:text-white tracking-tight">
              <span className="text-sm sm:text-base mr-0.5 font-medium">₹</span>
              {finalPrice.toLocaleString()}
            </span>
            {(product.discount ?? 0) > 0 && (
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 line-through decoration-gray-400">
                M.R.P: ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>
          {(product.discount ?? 0) > 0 && (
            <p className="text-[11px] sm:text-xs text-gray-700 dark:text-slate-300 mt-1 line-clamp-2">
              <span className="bg-[#CC0C39] text-white px-1.5 py-0.5 rounded text-[10px] font-bold mr-1">
                Save {product.discount}%
              </span>
              with selected offers
            </p>
          )}
        </div>

        {/* Delivery info */}
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mt-2">
          FREE delivery <span className="font-bold text-gray-700 dark:text-slate-300">Tomorrow</span>
        </p>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onAddToCart(e, product._id); }}
          disabled={isAddingToCart}
          className={`w-full mt-3 py-2.5 sm:py-3 rounded-full font-bold text-[13px] sm:text-sm transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95 ${
            isInCart
              ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-300 dark:border-slate-600"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/25"
          }`}
        >
          {isAddingToCart ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isInCart ? (
            "Added to cart"
          ) : (
            "Add to cart"
          )}
        </button>
      </div>
    </div>
  );
}
