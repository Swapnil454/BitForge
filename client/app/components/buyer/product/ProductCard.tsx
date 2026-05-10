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
  const cat    = categoryColors[product.category] || defaultCat;

  const BadgeEl = badge && (
    <span className={`self-start inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${
      badge === "bestseller" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
      badge === "trending"   ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" :
                               "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
    }`}>
      {badge === "bestseller" && <Award size={9} />}
      {badge === "trending"   && <TrendingUp size={9} />}
      {badge === "new"        && <Sparkles size={9} />}
      {badge === "bestseller" ? "Bestseller" : badge === "trending" ? "Trending" : "New"}
    </span>
  );

  return (
    <div
      onClick={() => router.push(`/marketplace/${product._id}`)}
      className={`w-full group flex flex-col cursor-pointer rounded-2xl bg-white dark:bg-[#0D1B2A] border border-gray-100 dark:border-slate-800/60 hover:border-cyan-400/40 dark:hover:border-cyan-600/40 shadow-sm hover:shadow-xl ${cat.glow} transition-all duration-300 overflow-hidden`}
    >
      {/* ── Thumbnail ── */}
      <div className="relative w-full aspect-[16/9] bg-gray-50 dark:bg-slate-900/50 overflow-hidden">
        {/* Wishlist */}
        <button
          onClick={(e) => onToggleWishlist(e, product._id)}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-gray-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-200"
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={13} className={isInWishlist ? "fill-pink-500 text-pink-500" : "text-gray-500 dark:text-slate-400"} />
        </button>

        {/* Discount badge */}
        {product.discount && product.discount > 0 && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 bg-red-500 text-slate-900 dark:text-white text-[10px] font-bold rounded-md shadow">
            -{product.discount}%
          </span>
        )}

        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
            <span className="text-gray-400 dark:text-slate-500 text-xs font-medium">{product.category}</span>
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="flex flex-col flex-grow p-3.5">
        {/* Badge + Category row */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {BadgeEl}
          {!badge && (
            <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.pill}`}>
              {product.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-[13px] text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
          {product.title}
        </h3>

        {/* Seller */}
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-1.5 truncate">
          by <span className="text-gray-600 dark:text-slate-400 font-medium">{product.sellerId?.name || "Unknown Seller"}</span>
        </p>

        {/* Description */}
        {product.description && (
          <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2.5">
          {rating ? (
            <>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={10} className={
                    s <= Math.round(Number(rating))
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200 dark:fill-slate-700 dark:text-slate-700"
                  } />
                ))}
              </div>
              <span className="text-[11px] font-bold text-gray-800 dark:text-slate-200">{rating}</span>
              {(product.buyers || 0) > 0 && (
                <span className="text-[10px] text-gray-400 dark:text-slate-500">({product.buyers} buyers)</span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 italic">No ratings yet</span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Price + Actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-slate-800/40 mt-1">
          <div className="flex flex-col leading-tight">
            {product.discount && product.discount > 0 ? (
              <>
                <span className="text-[10px] text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                <span className="font-extrabold text-base text-gray-900 dark:text-white">₹{finalPrice.toLocaleString()}</span>
              </>
            ) : (
              <span className="font-extrabold text-base text-gray-900 dark:text-white">₹{product.price.toLocaleString()}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(e, product._id); }}
              disabled={isAddingToCart || isInCart}
              title={isInCart ? "In Cart" : "Add to Cart"}
              className={`p-1.5 rounded-lg border transition-all duration-200 ${
                isInCart
                  ? "bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 cursor-not-allowed"
                  : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
              }`}
            >
              {isAddingToCart
                ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                : <ShoppingCart size={13} />
              }
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onBuyNow(e, product._id); }}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-900 dark:text-white transition-all duration-200 shadow-sm"
            >
              <Zap size={10} />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
