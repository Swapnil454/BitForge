"use client";

import { useRouter } from "next/navigation";
import { ProductType } from "./ProductCard";

export default function ThumbnailCard({ product }: { product: ProductType }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/marketplace/${product._id}`)}
      className="w-[120px] sm:w-[140px] md:w-[160px] flex-shrink-0 cursor-pointer group flex flex-col gap-1.5"
      title={product.title}
    >
      {/* ── Thumbnail ── */}
      <div className="w-full aspect-square relative flex items-center justify-center overflow-hidden rounded-xl bg-[#F7F7F7] dark:bg-[#0A101D] group-hover:shadow-md transition-shadow duration-300">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-400 p-2"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-[#0A101D] flex flex-col items-center justify-center text-center p-2">
            <span className="text-gray-400 dark:text-slate-600 text-[9px] font-medium uppercase tracking-wider mb-0.5">{product.category}</span>
          </div>
        )}
      </div>

      {/* ── Info (Minimal) ── */}
      <div className="px-0.5 flex flex-col gap-0.5">
        <h4 className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
          {product.title}
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
            ₹{product.price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
