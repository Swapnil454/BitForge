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

  const activeClasses = "flex-shrink-0 flex items-center bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-3 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-300 snap-start cursor-pointer shadow-md shadow-indigo-500/20 border border-transparent";
  const getInactiveClasses = (hoverClass: string) => `flex-shrink-0 flex items-center bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-slate-800 px-3 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 snap-start cursor-pointer ${hoverClass} dark:hover:text-white`;

  return (
    <div className="relative z-10 w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6 mt-1 sm:mt-2">
      <div className="py-1 sm:py-1.5 flex justify-start">
        <div className="flex overflow-x-auto gap-2 p-1 sm:p-1.5 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-full shadow-sm border border-gray-200/50 dark:border-gray-800/50 scrollbar-hide snap-x w-fit max-w-full">
          <Link
            href="/marketplace?collection=All"
            className={isAllActive ? activeClasses : getInactiveClasses("hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20")}
          >
            <span className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap ${isAllActive ? "text-white drop-shadow-sm" : "text-gray-900 dark:text-white"}`}>
              Explore All
            </span>
          </Link>
          {categories.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/marketplace?category=${encodeURIComponent(cat.id)}`}
                className={isActive ? activeClasses : getInactiveClasses(cat.hover)}
              >
                <span className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap ${isActive ? "text-white drop-shadow-sm" : "text-gray-900 dark:text-white"}`}>
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
