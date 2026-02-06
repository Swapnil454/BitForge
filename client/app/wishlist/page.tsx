"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { marketplaceAPI, cartAPI } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";

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
  const router = useRouter();

  // Load wishlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
    setLoading(false);
  }, []);

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
    const token = getCookie("token");
    if (!token) {
      toast.error("Please login to add to cart");
      const next = encodeURIComponent(`/marketplace/${product._id}`);
      router.push(`/login?next=${next}`);
      return;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-pink-600/20 via-rose-600/20 to-red-600/20 backdrop-blur-md border-b border-white/10 text-white py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard/buyer")}
                className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-pink-500/50 hover:from-pink-500/20 hover:to-pink-600/20 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-pink-500/50"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-4xl">❤️</span>
                <div>
                  <h1 className="text-2xl font-bold">My Wishlist</h1>
                  <p className="text-white/70 text-sm">
                    {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} saved
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/cart")}
              className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-rose-400/60 hover:from-rose-500/20 hover:to-pink-500/20 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-rose-500/40"
              title="Go to Cart"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {products.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center text-5xl mx-auto mb-6">
              💔
            </div>
            <p className="text-white text-xl font-semibold mb-2">Your wishlist is empty</p>
            <p className="text-white/60 text-sm mb-6">Start adding products you love</p>
            <button
              onClick={() => router.push("/marketplace")}
              className="inline-block bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-pink-500/30 transition"
            >
              Explore Marketplace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const finalPrice = product.discount > 0
                ? Math.max(product.price - (product.price * product.discount) / 100, 0)
                : product.price;

              return (
                <div
                  key={product._id}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden hover:border-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300"
                >
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-56 object-cover cursor-pointer hover:opacity-80 transition"
                      onClick={() => router.push(`/marketplace/${product._id}`)}
                    />
                  ) : (
                    <div className="w-full h-56 bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}

                  <div className="p-5">
                    <h2 className="font-bold text-lg text-white mb-2 line-clamp-1 hover:text-pink-400 transition cursor-pointer"
                      onClick={() => router.push(`/marketplace/${product._id}`)}
                    >
                      {product.title}
                    </h2>
                    <p className="text-white/70 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price Section */}
                    <div className="mb-4">
                      {product.discount > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/40 line-through">
                              ₹{product.price.toLocaleString()}
                            </span>
                            <span className="text-xs bg-gradient-to-r from-red-500 to-rose-500 text-white px-2 py-0.5 rounded-full font-semibold shadow-lg shadow-red-500/30">
                              -{product.discount}% OFF
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                            ₹{finalPrice.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                          ₹{product.price.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Seller Info */}
                    {product.sellerId?.name && (
                      <p className="text-xs text-white/50 mb-4">
                        by {product.sellerId.name}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveToCart(product)}
                        className="flex-1 bg-gradient-to-r from-rose-500/50 to-red-500/50 hover:from-rose-500/60 hover:to-red-500/60 text-white py-2.5 rounded-xl font-semibold transition shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        Move to Cart
                      </button>
                      <button
                        onClick={() => removeFromWishlist(product._id)}
                        className="px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 py-2.5 rounded-xl transition"
                        title="Remove from wishlist"
                      >
                        💔
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
