export default function ProductCardSkeleton({
  layout = "responsive",
}: {
  layout?: "vertical" | "responsive";
}) {
  return (
    <div
      className={`
        w-full group bg-white dark:bg-[#0f0f17] transition-all duration-200 shadow-sm animate-pulse
        ${layout === "vertical"
          ? "flex flex-col items-start rounded-[1.25rem] border border-gray-100 sm:dark:border-white/8 p-3"
          : "flex flex-row items-stretch gap-0 rounded-2xl border border-gray-100/80 dark:border-white/5 sm:flex-col sm:items-start sm:rounded-[1.25rem] sm:border sm:border-gray-100 sm:dark:border-white/8 sm:p-3"
        }
        lg:p-0 lg:rounded-sm lg:border-transparent lg:shadow-none lg:bg-transparent lg:dark:bg-transparent
      `}
    >
      {/* ── Thumbnail ── */}
      <div className={`
        relative flex-shrink-0 bg-[#f0f0f0] dark:bg-[#151b2b] overflow-hidden
        flex items-center justify-center self-stretch
        ${layout === "vertical"
          ? "w-full h-auto aspect-square rounded-xl"
          : "w-[125px] sm:w-full sm:h-auto sm:aspect-square m-3 rounded-xl sm:m-0 sm:rounded-xl"
        }
        lg:rounded-none lg:aspect-auto lg:h-[220px] lg:bg-[#f0f0f0] lg:dark:bg-[#151b2b]
      `}>
        {/* Wishlist circle on sm+ */}
        <div className="hidden sm:flex absolute bottom-2 left-2 w-8 h-8 bg-white/50 dark:bg-slate-800/50 rounded-full shadow-sm" />
      </div>

      {/* ── Info Area ── */}
      <div className={`
        flex flex-col flex-1 min-w-0
        ${layout === "vertical"
          ? "pt-3 lg:p-2 lg:bg-white lg:dark:bg-[#0B1221] lg:w-full w-full"
          : "py-3.5 pr-3 sm:py-0 sm:pr-0 sm:pt-3 lg:p-2 lg:bg-white lg:dark:bg-[#0B1221] lg:w-full"
        }
      `}>

        {/* Category pill */}
        <div className="self-start w-14 h-4 bg-gray-200 dark:bg-slate-800 rounded-full mb-1"></div>

        {/* Title */}
        <div className="w-full h-[14.5px] sm:h-[14px] lg:h-[15px] bg-gray-200 dark:bg-slate-800 rounded mb-1 mt-0.5"></div>
        <div className="w-3/4 h-[14.5px] sm:h-[14px] lg:h-[15px] bg-gray-200 dark:bg-slate-800 rounded mb-1"></div>

        {/* Description */}
        <div className="w-full h-[11.5px] bg-gray-200 dark:bg-slate-800 rounded mt-1.5"></div>
        <div className="w-5/6 h-[11.5px] bg-gray-200 dark:bg-slate-800 rounded mt-1.5"></div>

        {/* Rating */}
        <div className="w-20 h-[10px] bg-gray-200 dark:bg-slate-800 rounded mt-2"></div>

        {/* Price */}
        <div className="w-20 h-4 sm:h-5 lg:h-[22px] bg-gray-200 dark:bg-slate-800 rounded mt-2"></div>
        
        {/* Seller Info */}
        <div className="w-24 h-[10.5px] bg-gray-200 dark:bg-slate-800 rounded mt-2"></div>

        {/* Delivery (hidden on mobile) */}
        <div className="hidden sm:block w-32 h-[10px] bg-gray-200 dark:bg-slate-800 rounded mt-1.5"></div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2.5 sm:mt-3">
          {/* Mobile wishlist */}
          <div className="sm:hidden flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-slate-800 rounded-full border border-gray-100 dark:border-white/5"></div>

          {/* Add to Cart */}
          <div className="flex-1 py-2 sm:py-2.5 h-8 sm:h-9 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
