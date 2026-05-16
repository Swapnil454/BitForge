"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Book, LayoutTemplate, Box, Palette, Sparkles } from "lucide-react";
import { ProductType } from "../product/ProductCard";

const categories = [
  { id: "Course",        label: "Courses",       icon: BookOpen,       color: "text-blue-500",    hover: "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600" },
  { id: "eBook",         label: "eBooks",        icon: Book,           color: "text-violet-500",  hover: "hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600" },
  { id: "Template",      label: "Templates",     icon: LayoutTemplate, color: "text-emerald-500", hover: "hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600" },
  { id: "Software",      label: "Software",      icon: Box,            color: "text-amber-500",   hover: "hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600" },
  { id: "Design Asset",  label: "Design Assets", icon: Palette,        color: "text-pink-500",    hover: "hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600" },
  { id: "Other",         label: "More",          icon: Sparkles,       color: "text-cyan-500",    hover: "hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600" },
];

export default function CategoryPills({ products = [] }: { products?: ProductType[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const isAllActive = !currentCategory || searchParams.get("collection") === "All";

  const getCount = (id: string) => products.filter((p) => p.category === id).length;

  const activeClasses = "flex-shrink-0 flex items-center gap-1.5 sm:gap-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-[1.25rem] transition-all duration-300 snap-start group cursor-pointer shadow-md hover:shadow-lg shadow-indigo-500/20 border border-transparent";
  const getInactiveClasses = (hoverClass: string) => `flex-shrink-0 flex items-center gap-1.5 sm:gap-2.5 bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-slate-800 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-[1.25rem] transition-all duration-200 snap-start group cursor-pointer ${hoverClass} dark:hover:text-white`;

  return (
    <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/80 bg-white/75 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/45">
        <div className="flex overflow-x-auto gap-2.5 pb-1 scrollbar-hide snap-x">
          <button
            onClick={() => router.push(`/marketplace?collection=All`)}
            className={isAllActive ? activeClasses : getInactiveClasses("hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20")}
          >
            <div className="flex flex-col items-start leading-tight">
              <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${isAllActive ? "text-white drop-shadow-sm font-bold" : "text-gray-900 dark:text-white"}`}>
                Explore All
              </span>
              {products.length > 0 && (
                <span className={`text-[9px] sm:text-[10px] font-medium ${isAllActive ? "text-white/80" : "text-gray-400 dark:text-slate-500"}`}>
                  {products.length} {products.length === 1 ? "product" : "products"}
                </span>
              )}
            </div>
          </button>
          {categories.map((cat) => {
            const count = getCount(cat.id);
            const isActive = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => router.push(`/marketplace?category=${encodeURIComponent(cat.id)}`)}
                className={isActive ? activeClasses : getInactiveClasses(cat.hover)}
              >
                <div className="flex flex-col items-start leading-tight">
                  <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${isActive ? "text-white drop-shadow-sm font-bold" : "text-gray-900 dark:text-white"}`}>
                    {cat.label}
                  </span>
                  {count > 0 && (
                    <span className={`text-[9px] sm:text-[10px] font-medium ${isActive ? "text-white/80" : "text-gray-400 dark:text-slate-500"}`}>
                      {count} {count === 1 ? "product" : "products"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
