import React from "react";
import Image from "next/image";
import { BadgeCheck, CalendarDays, Star } from "lucide-react";

export default function SellerHeader({ seller }: { seller: any }) {
  const joinDate = seller.createdAt 
    ? new Date(seller.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) 
    : "";

  return (
    <div className="w-full bg-white dark:bg-[#0f111a] border-b border-gray-200 dark:border-white/5 pt-8 pb-20 md:pt-12 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4 md:mb-6 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl">
          <div className="w-full h-full relative rounded-full overflow-hidden bg-white dark:bg-[#12141c]">
            {seller.profilePictureUrl ? (
              <Image 
                src={seller.profilePictureUrl}
                alt={seller.name}
                fill
                sizes="(max-width: 768px) 96px, 128px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-indigo-500">
                {seller.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {seller.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#0f111a] rounded-full p-1">
              <BadgeCheck className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
            </div>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          {seller.name}
        </h1>
        
        {seller.bio && (
          <p className="max-w-2xl text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-4 md:mb-6">
            {seller.bio}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
          {seller.stats?.ratingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-200 dark:border-yellow-500/20">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold">{seller.stats.averageRating.toFixed(1)}</span>
              <span>({seller.stats.ratingCount} reviews)</span>
            </div>
          )}
          {joinDate && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10">
              <CalendarDays className="w-4 h-4" />
              <span>Joined {joinDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
