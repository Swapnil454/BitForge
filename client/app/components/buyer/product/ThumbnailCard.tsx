"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductType } from "./ProductCard";

export default function ThumbnailCard({ product }: { product: ProductType }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/product/${product.slug || product._id}`)}
      className="w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px] flex-shrink-0 cursor-pointer group/card flex flex-col gap-1.5"
      title={product.title}
    >
      {/* ── Thumbnail ── */}
      <div className="w-full h-[120px] sm:h-[140px] md:h-[160px] relative flex items-center justify-center overflow-hidden rounded-sm bg-[#F7F7F7] dark:bg-[#0A101D] group-hover/card:shadow-sm transition-shadow duration-300">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover/card:scale-105 transition-transform duration-400 p-2"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-[#0A101D] flex flex-col items-center justify-center text-center p-2">
            <Link 
              href={`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 dark:text-slate-600 text-[9px] font-medium uppercase tracking-wider mb-0.5 hover:text-[#c7511f] dark:hover:text-[#e47911] transition-colors"
            >
              {product.category}
            </Link>
          </div>
        )}
      </div>

      {/* ── Info (Minimal) ── */}
      <div className="px-0.5 flex flex-col gap-0.5">
        <h4 className="text-xs sm:text-[13px] font-medium text-[#007185] dark:text-[#52a6b8] line-clamp-2 leading-snug group-hover/card:text-[#c7511f] dark:group-hover/card:text-[#e47911] transition-colors">
          {product.title}
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[13px] sm:text-[15px] text-[#B12704] dark:text-[#f48570]">
            ₹{product.price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
