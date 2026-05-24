import { Star, Heart, Check, Info } from "lucide-react";

export default function ProductCardSkeleton() {
  return (
    <div className="w-[220px] md:w-[260px] flex-shrink-0 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full aspect-[16/9] bg-gray-200 dark:bg-slate-800"></div>

      <div className="p-4 flex flex-col gap-3">
        {/* Title Skeleton */}
        <div className="w-full h-5 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
        <div className="w-2/3 h-5 bg-gray-200 dark:bg-slate-800 rounded-md"></div>

        {/* Seller Skeleton */}
        <div className="w-1/2 h-3 bg-gray-200 dark:bg-slate-800 rounded-md mt-1"></div>

        {/* Metadata Skeleton */}
        <div className="w-3/4 h-3 bg-gray-200 dark:bg-slate-800 rounded-md"></div>

        {/* Rating Skeleton */}
        <div className="w-1/3 h-4 bg-gray-200 dark:bg-slate-800 rounded-md"></div>

        {/* Price & Action Skeleton */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-800/50">
          <div className="w-1/3 h-6 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
          <div className="w-16 h-8 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
