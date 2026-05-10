"use client";

import { useRouter } from "next/navigation";
import { ProductType } from "./ProductCard";

export default function ThumbnailCard({ product }: { product: ProductType }) {
  const router = useRouter();

  return (
  <div
      onClick={() => router.push(`/marketplace/${product._id}`)}
      className="w-[130px] md:w-[155px] flex-shrink-0 cursor-pointer group"
      title={product.title}
    >
      <div className="w-full h-[102px] md:h-[120px] relative flex items-center justify-center overflow-hidden rounded-lg border border-gray-100 dark:border-slate-800/60">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-100/50 to-blue-100/50 dark:from-cyan-900/30 dark:to-blue-900/30 flex flex-col items-center justify-center text-center p-2">
            <span className="text-gray-400 dark:text-slate-500 text-[9px] font-medium uppercase tracking-wider mb-0.5">{product.category}</span>
            <span className="text-gray-700 dark:text-slate-300 text-[10px] font-bold line-clamp-2 leading-tight">{product.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}
