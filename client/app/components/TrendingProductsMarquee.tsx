"use client";

import { useEffect, useState } from "react";
import { marketplaceAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";

export default function TrendingProductsMarquee() {
  const [isHovered, setIsHovered] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Fetch the 8 newest or trending products
        const data = await marketplaceAPI.getAllProducts({ limit: 8, sort: "newest" });
        if (data && data.products) {
          setProducts(data.products.slice(0, 8)); // Ensure exactly up to 8
        }
      } catch (err) {
        console.error("Failed to fetch products for marquee:", err);
      }
    };
    fetchTrending();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="w-full mt-0">
      <div className="text-center mb-4">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white inline-flex items-center gap-3">
          Trending Products <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">What other creators and buyers are getting right now.</p>
      </div>

      <div 
        className="w-full overflow-hidden py-4 relative before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-slate-50 dark:before:from-[#05050a] before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-slate-50 dark:after:from-[#05050a] after:to-transparent"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className="flex w-max animate-marquee hover:[animation-play-state:paused]"
          style={{ animationPlayState: isHovered ? "paused" : "running" }}
        >
          <div className="flex shrink-0 gap-6 px-3">
            {products.map((product) => (
              <CleanProductCard key={product._id} product={product} />
            ))}
          </div>
          <div className="flex shrink-0 gap-6 px-3">
            {products.map((product) => (
              <CleanProductCard key={`${product._id}-dup`} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CleanProductCard({ product }: { product: any }) {
  const finalPrice = product.discount && product.discount > 0
    ? Math.max(product.price - (product.price * product.discount) / 100, 0)
    : product.price;

  return (
    <Link 
      href={`/marketplace/${product._id}`}
      className="group relative flex w-[220px] sm:w-[260px] flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12121a] overflow-hidden hover:border-cyan-400/50 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:-translate-y-1 flex-shrink-0"
    >
      <div className="relative h-40 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800">
            <span className="text-gray-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">{product.category}</span>
          </div>
        )}
        {/* <div className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1">
          🔥 {product.buyers || 0} sold this week
        </div> */}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-500 transition-colors">
          {product.title}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-white/50 mt-1">
          By {product.sellerId?.name || "Unknown Creator"}
        </p>
        
        <div className="mt-auto pt-3 flex items-center gap-2">
          <span className="text-lg font-black text-slate-900 dark:text-white">₹{finalPrice.toLocaleString()}</span>
          {product.discount > 0 && (
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              -{product.discount}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
