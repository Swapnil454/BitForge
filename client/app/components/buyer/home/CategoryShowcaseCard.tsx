"use client";

import { useRouter } from "next/navigation";

export interface SubCategory {
  title: string;
  imageColor?: string; // Tailwind class for mock image background
  imageUrl?: string;
}

export interface CategoryShowcaseProps {
  title: string;
  categoryId: string; // Used for routing
  items: SubCategory[];
  linkText: string;
}

export default function CategoryShowcaseCard({ title, categoryId, items, linkText }: CategoryShowcaseProps) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-[#0B1221] border border-gray-100 dark:border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 h-full flex flex-col transition-all duration-300 hover:bg-gray-50 dark:hover:bg-[#131F37] shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white tracking-tight">{title}</h3>
      </div>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 flex-grow">
        {items.slice(0, 4).map((item, idx) => (
          <button 
            key={idx}
            onClick={() => router.push(`/marketplace?category=${encodeURIComponent(categoryId)}`)}
            className="flex flex-col items-start gap-1.5 sm:gap-2 group text-left"
          >
            <div className={`w-full aspect-square rounded-lg sm:rounded-xl ${item.imageColor || 'bg-gray-50 dark:bg-slate-800/50'} overflow-hidden relative border border-gray-100 dark:border-white/5`}>
               {item.imageUrl ? (
                 <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
               ) : (
                 <div className="w-full h-full bg-slate-100 dark:bg-white/5 group-hover:bg-transparent transition-colors"></div>
               )}
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 line-clamp-2 w-full transition-colors leading-tight">
              {item.title}
            </span>
          </button>
        ))}
      </div>

      <button 
        onClick={() => router.push(`/marketplace?category=${encodeURIComponent(categoryId)}`)}
        className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors w-fit mt-auto"
      >
        {linkText}
      </button>
    </div>
  );
}
