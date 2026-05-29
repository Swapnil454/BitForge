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
    <div className="h-full flex flex-col">
      {/* Mobile Title - Outside the box */}
      <div className="md:hidden flex items-center justify-between mb-2.5 px-0.5 ml-[3px]">
        <h3 className="font-bold text-[19px] sm:text-[21px] text-[#0F1111] dark:text-white tracking-tight">{title}</h3>
      </div>

      <div className="bg-white dark:bg-[#0B1221] p-4 sm:p-5 h-full flex flex-col hover:shadow-xl transition-shadow border border-transparent dark:border-white/5 rounded-xl md:rounded-none">
        {/* Desktop Title - Inside the box */}
        <div className="hidden md:flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="font-bold text-[19px] sm:text-[21px] text-[#0F1111] dark:text-white tracking-tight">{title}</h3>
        </div>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-5 sm:gap-y-6 mb-6 flex-grow">
        {items.slice(0, 4).map((item, idx) => (
          <button 
            key={idx}
            onClick={() => router.push(`/marketplace?category=${encodeURIComponent(categoryId)}`)}
            className="flex flex-col items-start gap-1.5 sm:gap-2 group text-left"
          >
            <div className={`w-full aspect-square ${item.imageColor || 'bg-gray-50 dark:bg-slate-800/50'} overflow-hidden relative`}>
               {item.imageUrl ? (
                 <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500" />
               ) : (
                 <div className="w-full h-full bg-slate-100 dark:bg-white/5 transition-colors"></div>
               )}
            </div>
            <span className="text-xs sm:text-[13px] font-medium text-[#0F1111] dark:text-slate-200 line-clamp-1 w-full leading-tight">
              {item.title}
            </span>
          </button>
        ))}
      </div>

      <button 
        onClick={() => router.push(`/marketplace?category=${encodeURIComponent(categoryId)}`)}
        className="text-[13px] sm:text-[14px] font-medium text-[#007185] dark:text-[#52a6b8] hover:text-[#c7511f] dark:hover:text-[#e47911] hover:underline transition-colors w-fit mt-auto"
      >
        {linkText}
      </button>
      </div>
    </div>
  );
}
