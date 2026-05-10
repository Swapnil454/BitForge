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
    <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full flex flex-col">
      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">{title}</h3>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5 flex-grow">
        {items.slice(0, 4).map((item, idx) => (
          <button 
            key={idx}
            onClick={() => router.push(`/marketplace?category=${encodeURIComponent(categoryId)}`)}
            className="flex flex-col items-start gap-2 group text-left"
          >
            <div className={`w-full aspect-square rounded-xl ${item.imageColor || 'bg-gray-100 dark:bg-slate-800'} overflow-hidden relative`}>
               {item.imageUrl ? (
                 <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-slate-200 dark:bg-white/10 group-hover:bg-transparent transition-colors"></div>
               )}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 line-clamp-1 w-full transition-colors">
              {item.title}
            </span>
          </button>
        ))}
      </div>

      <button 
        onClick={() => router.push(`/marketplace?category=${encodeURIComponent(categoryId)}`)}
        className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors w-fit"
      >
        {linkText}
      </button>
    </div>
  );
}
