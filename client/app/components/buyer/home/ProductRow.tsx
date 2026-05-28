"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ThumbnailCard from "../product/ThumbnailCard";
import { ProductType } from "../product/ProductCard";

interface ProductRowProps {
  title: string;
  subtitle?: string;
  products: ProductType[];
  isLoading?: boolean;
  onSeeAll?: () => void;
}

export default function ProductRow({
  title,
  subtitle,
  products,
  isLoading = false,
  onSeeAll
}: ProductRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -1000, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 1000,  behavior: "smooth" });

  if (!isLoading && products.length === 0) return null;

  return (
    <div className="w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6 mb-8 sm:mb-10">
      <div className="bg-white dark:bg-[#0B1221] p-4 sm:p-5 relative group hover:shadow-xl transition-shadow border border-transparent dark:border-white/5">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-[19px] sm:text-[21px] font-bold text-[#0F1111] dark:text-white tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="text-[13px] sm:text-[14px] font-medium text-[#007185] dark:text-[#52a6b8] hover:text-[#c7511f] dark:hover:text-[#e47911] hover:underline transition-colors mt-1"
            >
              See all
            </button>
          )}
        </div>

        {/* Scroll arrows */}
        <button
          onClick={scrollLeft}
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-sm items-center justify-center shadow-[0_2px_5px_rgba(15,17,17,0.15)] text-[#0F1111] dark:text-slate-300 opacity-0 group-hover:opacity-100 hover:border-gray-300 transition-all duration-200 hover:bg-gray-50"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={scrollRight}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-sm items-center justify-center shadow-[0_2px_5px_rgba(15,17,17,0.15)] text-[#0F1111] dark:text-slate-300 opacity-0 group-hover:opacity-100 hover:border-gray-300 transition-all duration-200 hover:bg-gray-50"
        >
          <ChevronRight size={24} />
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-2 md:gap-3 pb-1 scrollbar-hide snap-x"
        >
          {isLoading
            ? Array(8).fill(0).map((_, idx) => (
                <div key={`skel-${idx}`} className="snap-start flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px] h-[120px] sm:h-[140px] md:h-[160px] bg-gray-100 dark:bg-slate-800/60 rounded-lg animate-pulse" />
              ))
            : products.map((product) => (
                <div key={product._id} className="snap-start">
                  <ThumbnailCard product={product} />
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
