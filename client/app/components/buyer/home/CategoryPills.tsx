"use client";

import { useRouter } from "next/navigation";
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

  const getCount = (id: string) => products.filter((p) => p.category === id).length;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mt-4 mb-4">
      <div className="flex overflow-x-auto gap-2.5 pb-1 scrollbar-hide snap-x">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const count = getCount(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => router.push(`/marketplace?category=${encodeURIComponent(cat.id)}`)}
              className={`flex-shrink-0 flex items-center gap-2.5 bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-slate-800 px-4 py-2.5 rounded-xl transition-all duration-200 snap-start group cursor-pointer ${cat.hover} dark:hover:text-slate-900 dark:hover:text-white`}
            >
              {/* <Icon size={15} className={`${cat.color} group-hover:scale-110 transition-transform duration-200`} /> */}
              <div className="flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  {cat.label}
                </span>
                {count > 0 && (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">
                    {count} {count === 1 ? "product" : "products"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
