

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { marketplaceAPI, cartAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
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

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const router = useRouter();
  const user = getStoredUser<{ role?: string }>();

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("wishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await marketplaceAPI.getAllProducts();
      setProducts(data.products || data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const data = await cartAPI.getCart();
      const productIds = data.cart.items.map((item: any) => item.productId._id || item.productId);
      setCartItems(productIds);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSearch = () => {
    setSearchQuery(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const isAlreadyInWishlist = wishlist.includes(productId);
    const updated = isAlreadyInWishlist
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
    
    // Update state
    setWishlist(updated);
    
    // Update localStorage
    localStorage.setItem("wishlist", JSON.stringify(updated));
    
    // Show toast notification
    if (isAlreadyInWishlist) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const isInCart = cartItems.includes(productId);
    
    try {
      setAddingToCart(productId);
      
      if (isInCart) {
        // Remove from cart
        await cartAPI.removeFromCart(productId);
        setCartItems(prev => prev.filter(id => id !== productId));
        toast.success('Removed from cart');
      } else {
        // Add to cart
        await cartAPI.addToCart(productId, 1);
        setCartItems(prev => [...prev, productId]);
        toast.success('Added to cart! 🛒');
      }
    } catch (error: any) {
      console.error('Error with cart:', error);
      toast.error(error.response?.data?.message || 'Failed to update cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-linear-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20 backdrop-blur-md border-b border-white/10 text-white py-5">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const role = user?.role || "buyer";
                router.push(`/dashboard/${role}`);
              }}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition text-sm"
              aria-label="Back to dashboard"
            >
              ←
            </button>
            <div>
            <h1 className="text-3xl md:text-4xl font-bold">Content Marketplace</h1>
            <p className="text-white/70">Discover and purchase premium digital content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/cart")}
              className="relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 hover:border-cyan-500/50 hover:from-cyan-500/20 hover:to-indigo-600/20 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
              title="Cart"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/wishlist")}
              className="relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 hover:border-pink-500/50 hover:from-pink-500/20 hover:to-pink-600/20 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-pink-500/50"
              title="Wishlist"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">❤️</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-linear-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg shadow-pink-500/50">
                  {wishlist.length > 9 ? '9+' : wishlist.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 outline-none"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-linear-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition shadow-lg shadow-cyan-500/30"
          >
            Search
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-12 text-center">
            <p className="text-white/70 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              const finalPrice = product.discount > 0 
                ? Math.max(product.price - (product.price * product.discount) / 100, 0)
                : product.price;

              return (
                <div
                  key={product._id}
                  className="relative bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push(`/marketplace/${product._id}`)}
                >
                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => toggleWishlist(e, product._id)}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/20 border border-white/30 backdrop-blur-md hover:bg-white/30 transition group-hover:scale-110"
                  >
                    <span className="text-xl">
                      {isInWishlist(product._id) ? "❤️" : "🤍"}
                    </span>
                  </button>

                  {product.thumbnailUrl ? (
                    <div className="w-full h-44 mt-5 sm:h-56 bg-slate-900/60 overflow-hidden flex items-center justify-center">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 sm:h-56 bg-linear-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  
                  <div className="p-5">
                    <h2 className="font-semibold text-xl text-white mb-2 line-clamp-1 group-hover:text-cyan-300 transition">
                      {product.title}
                    </h2>
                    <p className="text-white/70 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    
                    {/* Price Section */}
                    <div className="mb-3">
                      {product.discount > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/40 line-through">
                              ₹{product.price.toLocaleString()}
                            </span>
                            <span className="text-xs bg-linear-to-r from-red-500 to-rose-500 text-white px-2 py-0.5 rounded-full font-semibold shadow-lg shadow-red-500/30">
                              -{product.discount}% OFF
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-indigo-300">
                            ₹{finalPrice.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-indigo-300">
                          ₹{product.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      {product.category && (
                        <span className="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full border border-white/20">
                          {product.category}
                        </span>
                      )}
                      
                      {product.sellerId?.name && (
                        <p className="text-xs text-white/50">
                          by {product.sellerId.name}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={(e) => handleAddToCart(e, product._id)}
                        disabled={addingToCart === product._id}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                          cartItems.includes(product._id)
                            ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-lg'
                            : 'bg-linear-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-lg shadow-cyan-500/30'
                        }`}
                      >
                        {addingToCart === product._id 
                          ? 'Updating...' 
                          : cartItems.includes(product._id) 
                          ? 'Remove from Cart' 
                          : 'Add to Cart'
                        }
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/marketplace/${product._id}`);
                        }}
                        className="px-4 py-2.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl font-semibold transition text-sm"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
