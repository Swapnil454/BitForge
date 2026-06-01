"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
  slug?: string;
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
  /** Override layout to be always vertical instead of horizontal on mobile */
  layout?: "vertical" | "responsive";
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
  layout = "responsive",
}: ProductCardProps) {
  const router = useRouter();

  const finalPrice =
    product.discount && product.discount > 0
      ? Math.max(product.price - (product.price * product.discount) / 100, 0)
      : product.price;

  const rating = product.rating ? Number(product.rating).toFixed(1) : null;
  const badge  = getBadge(product, badgeProp);
  const catStyle = categoryColors[product.category] ?? defaultCat;

  return (
    <div
      onClick={() => router.push(`/product/${product.slug || product._id}`)}
      className={`
        w-full group cursor-pointer bg-white dark:bg-[#0f0f17] transition-all duration-200 shadow-sm
        ${layout === "vertical"
          ? "flex flex-col items-start rounded-[1.25rem] border border-gray-100 sm:dark:border-white/8 p-3 sm:hover:shadow-lg sm:hover:-translate-y-0.5"
          : "flex flex-row items-stretch gap-0 rounded-2xl border border-gray-100/80 dark:border-white/5 sm:flex-col sm:items-start sm:rounded-[1.25rem] sm:border sm:border-gray-100 sm:dark:border-white/8 sm:p-3 sm:hover:shadow-lg sm:hover:-translate-y-0.5"
        }
        lg:p-0 lg:rounded-sm lg:border-transparent lg:shadow-none lg:hover:shadow-none lg:hover:-translate-y-0 lg:bg-transparent lg:dark:bg-transparent
      `}
    >
      {/* ── Thumbnail ── */}
      <div className={`
        relative flex-shrink-0 bg-[#F7F7F7] dark:bg-[#0A101D] overflow-hidden
        flex items-center justify-center self-stretch
        ${layout === "vertical"
          ? "w-full h-auto aspect-square rounded-xl"
          : "w-[125px] sm:w-full sm:h-auto sm:aspect-square m-3 rounded-xl sm:m-0 sm:rounded-xl"
        }
        lg:rounded-none lg:aspect-auto lg:h-[220px] lg:bg-[#F7F7F7] lg:dark:bg-[#0A101D]
        transition-shadow duration-300 group-hover:shadow-md lg:group-hover:shadow-none
      `}>
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500 p-2 sm:p-3"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#0A101D]">
            <span className="text-gray-400 dark:text-slate-600 text-[9px] font-medium uppercase tracking-wider text-center px-1">{product.category}</span>
          </div>
        )}

        {/* Badge */}
        {badge && (
          <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold shadow-sm ${
            badge === "bestseller" ? "bg-orange-500 text-white" :
            badge === "trending"   ? "bg-cyan-500 text-white" :
                                     "bg-green-500 text-white"
          }`}>
            {badge === "bestseller" ? "Bestseller" : badge === "trending" ? "Trending" : "New"}
          </span>
        )}

        {/* Wishlist — sm+ only inside thumbnail */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(e, product._id); }}
          className="hidden sm:flex absolute bottom-2 left-2 w-8 h-8 bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-full items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95 border border-gray-100 dark:border-white/10"
        >
          <Heart size={14} className={`${isInWishlist ? "fill-pink-500 text-pink-500" : "text-gray-700 dark:text-gray-300"}`} />
        </button>
      </div>

      {/* ── Info Area ── */}
      <div className={`
        flex flex-col flex-1 min-w-0
        ${layout === "vertical"
          ? "pt-3 lg:p-2 lg:bg-white lg:dark:bg-[#0B1221] lg:w-full w-full"
          : "py-3.5 pr-3 sm:py-0 sm:pr-0 sm:pt-3 lg:p-2 lg:bg-white lg:dark:bg-[#0B1221] lg:w-full"
        }
      `}>

        {/* Category pill — visible on mobile */}
        <Link 
          href={`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`}
          onClick={(e) => e.stopPropagation()}
          className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${catStyle.pill} hover:opacity-80 transition-opacity`}
        >
          {product.category}
        </Link>

        {/* Title — bold & prominent */}
        <h3 className="font-extrabold text-[14.5px] sm:text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug tracking-tight lg:font-medium lg:text-[15px] lg:text-[#007185] lg:dark:text-[#52a6b8] lg:group-hover:text-[#c7511f]">
          {product.title}
        </h3>

        {/* Description — 3 lines */}
        {product.description && (
          <p className="text-[11.5px] text-gray-500 dark:text-slate-400 line-clamp-3 mt-0.5 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Rating — now visible on mobile too */}
        <div className="flex items-center gap-1 mt-1.5">
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
                {rating} <span className="text-gray-400">({product.buyers || 0})</span>
              </span>
            </>
          ) : (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 italic">No ratings yet</span>
          )}
        </div>

        {/* Price + discount inline */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="font-extrabold text-base sm:text-xl text-gray-900 dark:text-white tracking-tight lg:text-[#B12704] lg:dark:text-[#f48570] lg:text-[22px]">
            <span className="text-[11px] lg:text-[13px] font-semibold mr-0.5">₹</span>
            {finalPrice.toLocaleString()}
          </span>
          {(product.discount ?? 0) > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 line-through">
              ₹{product.price.toLocaleString()}
            </span>
          )}
          {(product.discount ?? 0) > 0 && (
            <span className="bg-[#CC0C39] text-white px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide">
              -{product.discount}%
            </span>
          )}
        </div>
        
        {/* Seller Info */}
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 flex items-center gap-1">
          <span className="italic">by</span> 
          {product.sellerId?.name ? (
            <Link 
              href={`/seller/${(product.sellerId as any).slug || product.sellerId.name.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-[#007185] dark:text-[#52a6b8] hover:text-[#c7511f] dark:hover:text-[#e47911] tracking-wide text-[10.5px] transition-colors"
            >
              {product.sellerId.name}
            </Link>
          ) : (
            <span className="font-medium text-gray-700 dark:text-slate-300 tracking-wide text-[10.5px]">Unknown</span>
          )}
        </p>

        {/* Delivery — sm+ only */}
        <p className="hidden sm:block text-[10px] text-gray-500 dark:text-slate-400 mt-1">
          FREE delivery <span className="font-bold text-gray-700 dark:text-slate-300">Tomorrow</span>
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2.5 sm:mt-3">
          {/* Mobile wishlist */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWishlist(e, product._id); }}
            className="sm:hidden flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/10 active:scale-95 transition-all"
          >
            <Heart size={13} className={`${isInWishlist ? "fill-pink-500 text-pink-500" : "text-gray-500 dark:text-gray-400"}`} />
          </button>

          {/* Add to Cart */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(e, product._id); }}
            disabled={isAddingToCart}
            className={`flex-1 py-2 sm:py-2.5 rounded-full font-bold text-[11.5px] sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 active:scale-95 ${
              isInCart
                ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/20"
            }`}
          >
            {isAddingToCart ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isInCart ? "Added to cart" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

