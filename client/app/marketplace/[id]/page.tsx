

"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";
import { cartAPI } from "@/lib/api";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isInCart, setIsInCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
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
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product
        const res = await api.get(`/marketplace/${id}`);
        setProduct(res.data);
        
        // Check if in cart
        try {
          const cartData = await cartAPI.getCart();
          const productIds = cartData.cart.items.map((item: any) => item.productId._id || item.productId);
          setIsInCart(productIds.includes(id as string));
        } catch (error) {
          console.error("Failed to fetch cart:", error);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Ensure Razorpay checkout script is available in client
    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [id]);

  const toggleWishlist = () => {
    const isAlreadyInWishlist = wishlist.includes(id as string);
    const updated = isAlreadyInWishlist
      ? wishlist.filter(pid => pid !== id)
      : [...wishlist, id as string];
    
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    
    if (isAlreadyInWishlist) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  };

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      
      if (isInCart) {
        await cartAPI.removeFromCart(id as string);
        setIsInCart(false);
        toast.success('Removed from cart');
      } else {
        await cartAPI.addToCart(id as string, 1);
        setIsInCart(true);
        toast.success('Added to cart!');
      }
    } catch (error: any) {
      console.error('Error with cart:', error);
      toast.error(error.response?.data?.message || 'Failed to update cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 text-xl mb-6">Product not found</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-6 py-3 bg-linear-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition shadow-lg"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const finalPrice = product.discount > 0 
    ? Math.max(product.price - (product.price * product.discount) / 100, 0)
    : product.price;

  const calculateOriginalPrice = () => product.price;

  const calculateDiscount = () => {
    if (product.discount && product.discount > 0) {
      return (product.price * product.discount) / 100;
    }
    return 0;
  };

  const calculatePriceAfterDiscount = () => finalPrice;

  const calculateGST = () => finalPrice * 0.05; // 5% GST

  const calculatePlatformFee = () => finalPrice * 0.02; // 2% Platform fee

  const calculateFinalTotal = () => {
    return finalPrice + calculateGST() + calculatePlatformFee();
  };

    const handleBuy = async () => {
      // Require login before creating order
      const token = getCookie("token");
      if (!token) {
        toast.error("Please login to purchase");
        const next = encodeURIComponent(`/marketplace/${id}`);
        router.push(`/login?next=${next}`);
        return;
      }

      try {
        const res = await api.post("/payments/create-order", {
          productId: product._id,
        });

        const options = {
          key: res.data.key,
          amount: res.data.amount,
          currency: "INR",
          name: "BitForge",
          description: product.title,
          order_id: res.data.razorpayOrderId,
          handler: function (response: any) {
            toast.success("Payment successful for " + product.title);
            // Give webhook a moment to process, then redirect
            setTimeout(() => {
              router.push("/dashboard/buyer");
            }, 1500);
          },
          modal: {
            ondismiss: function () {
              toast.error("Payment cancelled");
            }
          }
        } as any;

        if (!(window as any).Razorpay) {
          toast.error("Payment gateway not loaded. Please try again.");
          return;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to initiate payment");
      }
    };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-linear-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20 backdrop-blur-md border-b border-white/10 text-white py-5">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <button
            onClick={() => router.push('/marketplace')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="font-medium">Back to Marketplace</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleWishlist}
              className="relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 hover:border-pink-500/50 hover:from-pink-500/20 hover:to-pink-600/20 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-pink-500/50"
              title={wishlist.includes(id as string) ? "Remove from wishlist" : "Add to wishlist"}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                {wishlist.includes(id as string) ? "❤️" : "🤍"}
              </span>
            </button>
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
          </div>
        </div>
      </div>

      <div className="mx-auto">
        <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left Column - Product Image */}
            <div className="lg:border-r border-white/10">
              {product.thumbnailUrl ? (
                <div className="w-full bg-slate-900/60 mt-5 lg:mt-28 flex justify-center items-center aspect-video">
                  <img
                    src={product.thumbnailUrl}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full bg-linear-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center" style={{ height: '500px' }} >
                  <span className="text-8xl">📦</span>
                </div>
              )}
            </div>

            {/* Right Column - Product Details */}
            <div className="p-4 flex flex-col">
              {/* Category Badge */}
              {product.category && (
                <div className="mb-2 flex gap-2">
                  <span className="px-4 py-2 bg-white/10 text-white/80 text-sm rounded-xl border border-white/20">
                    {product.category}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {product.title}
                </h1>

                <p className="text-white/70 text-lg leading-relaxed mb-4">
                  {product.description}
                </p>

                <div className="flex items-center gap-2 text-sm text-white/60 mb-4 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="font-medium text-white/80">Seller:</span>
                  <span>{product.sellerId?.name || product.sellerId?.email}</span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  {/* Price Breakdown */}
                  <div className="space-y-3 mb-8 bg-linear-to-br from-white/5 to-white/10 p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      Price Breakdown
                    </h3>
                    
                    <div className="flex justify-between text-white/60">
                      <span>Original Price</span>
                      <span className="line-through">₹{calculateOriginalPrice().toLocaleString()}</span>
                    </div>

                    {calculateDiscount() > 0 && (
                      <>
                        <div className="flex justify-between text-green-400 font-semibold">
                          <span>Discount ({product.discount}%)</span>
                          <span>-₹{calculateDiscount().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-400 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                          <span className="font-semibold">You Save</span>
                          <span className="font-bold">₹{calculateDiscount().toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    <div className="border-t border-white/20 pt-3">
                      <div className="flex justify-between text-white">
                        <span>Price After Discount</span>
                        <span className="font-semibold">₹{calculatePriceAfterDiscount().toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-white/60 text-sm">
                      <span>GST (5%)</span>
                      <span>+₹{calculateGST().toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-white/60 text-sm">
                      <span>Platform Fee (2%)</span>
                      <span>+₹{calculatePlatformFee().toFixed(2)}</span>
                    </div>

                    <div className="border-t border-white/20 pt-3 bg-linear-to-r from-cyan-500/20 to-indigo-500/20 -mx-6 px-6 py-4 -mb-6">
                      <div className="flex justify-between text-xl font-bold">
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-indigo-300">Final Total</span>
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-indigo-300">₹{calculateFinalTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 ">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    isInCart
                      ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                      : 'bg-linear-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-cyan-500/30'
                  }`}
                >
                  {addingToCart ? 'Updating...' : isInCart ? 'Remove from Cart' : 'Add to Cart'}
                </button>
                <button
                  className="flex-1 bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transform"
                  onClick={handleBuy}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
