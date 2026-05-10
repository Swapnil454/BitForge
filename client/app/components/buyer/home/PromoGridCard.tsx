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
    <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">{title}</h3>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 mb-2 flex-grow">
        {displayItems.map((item, idx) => (
          <button 
            key={item._id || idx}
            onClick={() => router.push(`/marketplace/${item._id}`)}
            className="flex flex-col items-start gap-2 group text-left"
          >
            <div className="w-full aspect-square rounded-xl bg-gray-50 dark:bg-slate-900/50 overflow-hidden relative border border-gray-100 dark:border-slate-800/60 p-1 flex items-center justify-center">
               {item.thumbnailUrl ? (
                 <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-br from-cyan-100/30 to-blue-100/30 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center p-2 text-center">
                    <span className="text-[10px] text-gray-500 font-medium uppercase">{item.category}</span>
                 </div>
               )}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 line-clamp-1 w-full transition-colors">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
