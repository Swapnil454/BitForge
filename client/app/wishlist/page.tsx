"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { marketplaceAPI, cartAPI } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";
import PageHeader from "../dashboard/buyer/transactions/components/PageHeader";
import { ShoppingCart, HeartCrack, Trash2, Package, Tag } from "lucide-react";

type Product = {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  category: string;
  thumbnailUrl?: string;
  sellerId: {
    name?: string;
    email?: string;
  };
};

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent("/wishlist");
      router.replace(`/login?next=${returnUrl}`);
      return;
    }
    setAuthChecked(true);
  }, [router]);

  // Load wishlist from localStorage (only after auth check)
  useEffect(() => {
    if (!authChecked) return;
    
    const saved = localStorage.getItem("wishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
    setLoading(false);
  }, [authChecked]);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await marketplaceAPI.getAllProducts();
        const allProducts = data.products || data || [];
        // Filter to only show wishlist items
        const wishlistItems = allProducts.filter((p: Product) => wishlist.includes(p._id));
        setProducts(wishlistItems);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load products");
      }
    };

    if (wishlist.length > 0) {
      fetchProducts();
    }
  }, [wishlist]);

  const removeFromWishlist = (productId: string, silent = false) => {
    const updated = wishlist.filter(id => id !== productId);
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    setProducts(products.filter(p => p._id !== productId));
    if (!silent) {
      toast.success("Removed from wishlist");
    }
  };

  const moveToCart = async (product: Product) => {
    try {
      await cartAPI.addToCart(product._id, 1);

      // Remove from wishlist without extra toast
      removeFromWishlist(product._id, true);

      toast.success("Moved to cart successfully!");
    } catch (err: any) {
      const message = err?.response?.data?.message?.toLowerCase?.() || "";
      if (message.includes("already") || message.includes("exists")) {
        toast.error("Product already in cart");
        return;
      }
      toast.error("Failed to move to cart");
    }
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
          <p className="text-slate-400 text-sm font-medium tracking-wide">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white pb-20">
      <PageHeader
        backHref="/dashboard/buyer"
        backLabel="Dashboard"
        title="My Wishlist"
        subtitle={`${wishlist.length} item${wishlist.length !== 1 ? "s" : ""} saved`}
        rightSlot={
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-xl sm:rounded-lg bg-white hover:bg-slate-200 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-white/5 transition"
            title="Go to Cart"
          >
            <ShoppingCart className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline sm:ml-2">Cart</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        {products.length === 0 ? (
          <div className="bg-[#08111d] border border-white/5 rounded-3xl p-10 sm:p-12 text-center max-w-lg mx-auto shadow-2xl mt-12 sm:mt-24">
            <HeartCrack className="w-16 h-16 text-slate-700 mx-auto mb-6" />
            <p className="text-white text-xl font-bold tracking-tight mb-2">Your wishlist is empty</p>
            <p className="text-slate-400 text-sm mb-8">Start adding products you love</p>
            <button
              onClick={() => router.push("/marketplace")}
              className="w-full bg-white hover:bg-slate-200 text-slate-950 px-6 py-3.5 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2"
            >
              Explore Marketplace
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4 max-w-4xl mx-auto">
            {products.map((product) => {
              const finalPrice = product.discount > 0
                ? Math.max(product.price - (product.price * product.discount) / 100, 0)
                : product.price;

              return (
                <div
                  key={product._id}
                  className="bg-[#08111d] border border-white/5 rounded-2xl shadow-xl hover:border-indigo-500/20 transition-all p-3 sm:p-5 flex flex-row gap-3 sm:gap-5 group"
                >
                  {/* Thumbnail */}
                  <div 
                    className="w-24 h-24 sm:w-48 sm:h-auto sm:aspect-[16/9] shrink-0 bg-[#05050a] rounded-xl border border-white/5 overflow-hidden relative cursor-pointer flex items-center justify-center" 
                    onClick={() => router.push(`/marketplace/${product._id}`)}
                  >
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <Package className="w-8 h-8 sm:w-12 sm:h-12 text-slate-700" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h2 
                          className="font-bold text-sm sm:text-lg text-white line-clamp-1 hover:text-indigo-400 cursor-pointer tracking-tight"
                          onClick={() => router.push(`/marketplace/${product._id}`)}
                        >
                          {product.title}
                        </h2>
                        <button
                          onClick={() => removeFromWishlist(product._id)}
                          className="shrink-0 text-slate-500 hover:text-rose-400 p-1 -mr-1 -mt-1 transition"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 sm:pt-0 sm:border-t-0 border-t border-white/5 flex flex-row items-end justify-between gap-3">
                      {/* Price Block */}
                      <div>
                        {product.discount > 0 ? (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-sm sm:text-xl font-bold text-white tracking-tight">
                              ₹{finalPrice.toLocaleString()}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-500 line-through font-mono">
                              ₹{product.price.toLocaleString()}
                            </span>
                            <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded text-[9px] sm:text-[10px] font-bold border border-rose-500/20 tracking-wider">
                              -{product.discount}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm sm:text-xl font-bold text-white tracking-tight">
                            ₹{product.price.toLocaleString()}
                          </span>
                        )}
                        {product.sellerId?.name && (
                          <p className="text-[9px] sm:text-xs text-slate-500 uppercase tracking-wider mt-0.5 sm:mt-1 truncate max-w-[120px] sm:max-w-[200px]">
                            By {product.sellerId.name}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => moveToCart(product)}
                        className="bg-indigo-100/10 hover:bg-white/10 border border-white/10 text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Move to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Ensure Razorpay script is loaded */}
      {typeof window !== "undefined" && !(window as any).Razorpay && (
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
          onLoad={() => {
            // Razorpay script loaded
          }}
        />
      )}
    </div>
  );
}
