"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useHeroBgColor } from "@/lib/useHeroBgColor";
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
  const { heroBgColor, heroIsDarkText } = useHeroBgColor();

  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -640, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 640,  behavior: "smooth" });

  if (!isLoading && products.length === 0) return null;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mb-6 sm:mb-8">
      <div className="relative bg-white/80 dark:bg-[#0B1221]/80 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 group transition-all duration-300 hover:bg-white dark:hover:bg-[#131F37] shadow-sm hover:shadow-md z-10">
        
        {/* Dynamic Hero Tint Overlay */}
        {heroBgColor && (
          <div 
            className="absolute inset-0 pointer-events-none transition-colors duration-700 -z-10 rounded-xl sm:rounded-2xl" 
            style={{ backgroundColor: heroBgColor, opacity: heroIsDarkText ? 0.15 : 0.25 }}
          />
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-all duration-200"
            >
              See all <ArrowRight size={12} />
            </button>
          )}
        </div>

        {/* Scroll arrows */}
        <button
          onClick={scrollLeft}
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full items-center justify-center shadow-md text-gray-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={scrollRight}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full items-center justify-center shadow-md text-gray-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
        >
          <ChevronRight size={18} />
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-2 md:gap-3 pb-1 scrollbar-hide snap-x relative z-10"
        >
          {isLoading
            ? Array(8).fill(0).map((_, idx) => (
                <div key={`skel-${idx}`} className="snap-start flex-shrink-0 w-[130px] md:w-[155px] h-[102px] md:h-[120px] bg-gray-100 dark:bg-slate-800/60 rounded-lg animate-pulse" />
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
