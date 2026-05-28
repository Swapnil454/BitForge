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
    <div className="bg-white dark:bg-[#0B1221] p-4 sm:p-5 h-full flex flex-col hover:shadow-xl transition-shadow border border-transparent dark:border-white/5">
      <h3 className="font-bold text-[19px] sm:text-[21px] text-[#0F1111] dark:text-white mb-3 sm:mb-4 tracking-tight">{title}</h3>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-5 sm:gap-y-6 mb-2 flex-grow">
        {displayItems.map((item, idx) => (
          <button 
            key={item._id || idx}
            onClick={() => router.push(`/marketplace/${item._id}`)}
            className="flex flex-col items-start gap-1.5 sm:gap-2 group text-left"
          >
            <div className="w-full aspect-square bg-gray-50 dark:bg-slate-900/50 overflow-hidden relative border border-gray-100 dark:border-slate-800/60 p-1 flex items-center justify-center">
               {item.thumbnailUrl ? (
                 <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-br from-cyan-100/30 to-blue-100/30 dark:from-cyan-900/20 dark:to-blue-900/20 flex items-center justify-center p-2 text-center">
                    <span className="text-[10px] text-gray-500 font-medium uppercase">{item.category}</span>
                 </div>
               )}
            </div>
            <span className="text-xs sm:text-[13px] font-medium text-[#0F1111] dark:text-slate-200 line-clamp-1 w-full leading-tight">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
