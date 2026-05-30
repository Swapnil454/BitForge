"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const isAllActive = searchParams.get("collection") === "All";

  const getCount = (id: string) => products.filter((p) => p.category === id).length;

  const activeClasses = "flex-shrink-0 flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full sm:rounded-2xl transition-all duration-300 snap-start group cursor-pointer shadow-md hover:shadow-lg shadow-indigo-500/20 border border-transparent";
  const getInactiveClasses = (hoverClass: string) => `flex-shrink-0 flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-slate-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full sm:rounded-2xl transition-all duration-200 snap-start group cursor-pointer ${hoverClass} dark:hover:text-white`;

  return (
    <div className="relative z-10 w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6">
      <div className="py-1 sm:py-1.5">
        <div className="flex overflow-x-auto gap-2.5 pb-1 scrollbar-hide snap-x">
          <Link
            href="/marketplace?collection=All"
            className={isAllActive ? activeClasses : getInactiveClasses("hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20")}
          >
            <div className="flex flex-col items-start leading-tight">
              <span className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap ${isAllActive ? "text-white drop-shadow-sm font-bold" : "text-gray-900 dark:text-white"}`}>
                Explore All
              </span>
              {products.length > 0 && (
                <span className={`hidden sm:inline text-[8px] sm:text-[9px] font-medium ${isAllActive ? "text-white/80" : "text-gray-400 dark:text-slate-500"}`}>
                  {products.length} {products.length === 1 ? "product" : "products"}
                </span>
              )}
            </div>
          </Link>
          {categories.map((cat) => {
            const count = getCount(cat.id);
            const isActive = currentCategory === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/marketplace?category=${encodeURIComponent(cat.id)}`}
                className={isActive ? activeClasses : getInactiveClasses(cat.hover)}
              >
                <div className="flex flex-col items-start leading-tight">
                  <span className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap ${isActive ? "text-white drop-shadow-sm font-bold" : "text-gray-900 dark:text-white"}`}>
                    {cat.label}
                  </span>
                  {count > 0 && (
                    <span className={`hidden sm:inline text-[8px] sm:text-[9px] font-medium ${isActive ? "text-white/80" : "text-gray-400 dark:text-slate-500"}`}>
                      {count} {count === 1 ? "product" : "products"}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
