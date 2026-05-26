"use client";

import { useRouter } from "next/navigation";
import { ProductType } from "../product/ProductCard";

export interface PromoGridCardProps {
  title: string;
  items: ProductType[];
}

export default function PromoGridCard({ title, items }: PromoGridCardProps) {
  const router = useRouter();

  // Ensure we only have 4 items max
  const displayItems = items.slice(0, 4);

  return (
    <div className="bg-white dark:bg-[#0B1221] border border-gray-100 dark:border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 h-full flex flex-col transition-all duration-300 hover:bg-gray-50 dark:hover:bg-[#131F37] shadow-sm hover:shadow-md">
      <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white mb-3 sm:mb-4 tracking-tight">{title}</h3>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 flex-grow">
        {displayItems.map((item, idx) => (
          <button 
            key={item._id || idx}
            onClick={() => router.push(`/marketplace/${item._id}`)}
            className="flex flex-col items-start gap-1.5 sm:gap-2 group text-left"
          >
            <div className="w-full aspect-square rounded-lg sm:rounded-xl bg-gray-50 dark:bg-slate-900/50 overflow-hidden relative border border-gray-100 dark:border-slate-800/60 p-1 flex items-center justify-center">
               {item.thumbnailUrl ? (
                 <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-br from-cyan-100/30 to-blue-100/30 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center p-2 text-center">
                    <span className="text-[10px] text-gray-500 font-medium uppercase">{item.category}</span>
                 </div>
               )}
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 line-clamp-2 w-full transition-colors leading-tight">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
