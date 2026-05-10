"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import AuthModal from "@/app/components/AuthModal";
import toast from "react-hot-toast";
import { cartAPI } from "@/lib/api";
import ProductReviews from "./components/ProductReviews";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import { Heart, ShoppingCart, Info, Archive, CheckCircle, BadgeCheck, Star, Sparkles, Download, FileText } from "lucide-react";

function TrustRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full shrink-0 transition-colors ${
          active
            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
        }`}
      >
        {active ? <CheckCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
      </span>
      <span className={active ? "text-slate-700 dark:text-slate-200 text-sm font-medium" : "text-slate-500 dark:text-slate-400 text-sm"}>{label}</span>
    </div>
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isInCart, setIsInCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const router = useRouter();
  
  const { 
    isAuthenticated, 
    requireAuth, 
    showAuthModal, 
    pendingAction, 
    closeAuthModal, 
    goToLogin, 
    goToRegister 
  } = useAuth();

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
        const res = await api.get(`/marketplace/${id}`);
        setProduct(res.data);
        
        if (isAuthenticated) {
          try {
            const cartData = await cartAPI.getCart();
            const productIds = cartData.cart.items.map((item: any) => item.productId._id || item.productId);
            setIsInCart(productIds.includes(id as string));
          } catch (error) {
            console.error("Failed to fetch cart:", error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [id, isAuthenticated]);

  const toggleWishlist = () => {
    requireAuth("add to wishlist", () => {
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
    });
  };

  const handleAddToCart = async () => {
    requireAuth("add to cart", async () => {
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
    });
  };

  const finalPrice = product?.discount > 0 
    ? Math.max(product.price - (product.price * product.discount) / 100, 0)
    : product?.price;

  const calculateOriginalPrice = () => product?.price || 0;

  const calculateDiscount = () => {
    if (product?.discount && product.discount > 0) {
      return (product.price * product.discount) / 100;
    }
    return 0;
  };

  const calculateGST = () => finalPrice * 0.05;
  const calculatePlatformFee = () => finalPrice * 0.02;

  const calculateFinalTotal = () => {
    return finalPrice + calculateGST() + calculatePlatformFee();
  };
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "-";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  const handleDownloadPreview = () => {
    if (!product?.previewPdfUrl) {
      toast.error("Preview not available");
      return;
    }
    window.open(product.previewPdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleBuy = async () => {
    requireAuth("buy", async () => {
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
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a]">
        <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0a0a0f]/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="relative flex min-h-[58px] items-center justify-center">
              <div className="h-8 w-24 bg-slate-200 dark:bg-white/5 rounded absolute left-0 animate-pulse"></div>
              <div className="h-6 w-48 bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-slate-200 dark:bg-white/5 rounded-xl absolute right-0 animate-pulse"></div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 w-full">
          <div className="bg-white dark:bg-[#12141c]/60 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl">
            <div className="p-5 sm:p-8 lg:p-10 flex flex-col lg:flex-row gap-8 lg:gap-12">
              <div className="w-full lg:w-5/12 space-y-4">
                <div className="w-full aspect-[4/3] bg-slate-200 dark:bg-[#0a0a0f]/50 rounded-2xl animate-pulse"></div>
                <div className="h-12 w-full bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
              </div>
              <div className="w-full lg:w-7/12 space-y-6">
                <div className="h-6 w-24 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse"></div>
                <div className="h-10 w-3/4 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                  <div className="h-4 w-[90%] bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                  <div className="h-4 w-[80%] bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-16 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 text-xl mb-6">Product not found</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition shadow-lg"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a]">
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.title,
              description: product.description,
              image: product.thumbnailUrl,
              sku: product._id,
              brand: {
                "@type": "Brand",
                name: "BitForge",
              },
              offers: {
                "@type": "Offer",
                url: `https://bittforge.in/marketplace/${product._id}`,
                priceCurrency: "INR",
                price: finalPrice,
                availability: "https://schema.org/InStock",
              },
              ...(product.sellerStats?.ratingCount > 0 && {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.sellerStats.averageRating,
                  reviewCount: product.sellerStats.ratingCount,
                },
              }),
            }),
          }}
        />
      )}

      {/* Header with Back Button */}
      <PageHeader
        backLabel="Back"
        title="Product Details"
        rightSlot={
          <div className="flex items-center gap-3">
            <button
              onClick={toggleWishlist}
              className="relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-pink-500/50 hover:bg-pink-50 dark:hover:bg-pink-500/10 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-sm"
              title={wishlist.includes(id as string) ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wishlist.includes(id as string) ? (
                <Heart className="w-5 h-5 fill-pink-500 text-pink-500 group-hover:scale-110 transition-transform" />
              ) : (
                <Heart className="w-5 h-5 text-slate-600 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110 transition-transform" />
              )}
            </button>
            <button
              onClick={() => requireAuth("view cart", () => router.push("/cart"))}
              className="relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-sm"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-slate-600 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        {/* Archived Product Banner */}
        {product.isDeleted && (
          <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-400 text-lg mb-1">This product has been archived</h3>
                <p className="text-amber-700 dark:text-amber-200/70 text-sm">
                  {product.deletedMessage || "This product is no longer available for new purchases. You can still download your purchased files."}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-[#0A101D] sm:dark:bg-[#12141c]/60 sm:backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-gray-100 sm:border-slate-200 dark:border-white/5 overflow-hidden shadow-lg sm:shadow-xl">
          <div className="p-4 sm:p-8 lg:p-10 flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 items-start">
            
            {/* Left Column - Main Content */}
            <div className="w-full lg:w-2/3 flex flex-col gap-5 sm:gap-8">
              
              {/* Main Image */}
              {product.thumbnailUrl ? (
                <div className="w-full aspect-[4/3] sm:aspect-auto sm:h-auto rounded-xl sm:rounded-2xl overflow-hidden shadow-sm relative group bg-[#F7F7F7] dark:bg-[#0B1221] flex items-center justify-center border border-gray-100 dark:border-white/5">
                  <img
                    src={product.thumbnailUrl}
                    alt={product.title}
                    className="w-full h-full sm:h-auto object-contain sm:object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105 p-2 sm:p-0"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-black/20 transition-colors duration-500 pointer-events-none" />
                </div>
              ) : (
                <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-[#0a0a0f]/50 flex items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                  <Archive className="w-16 h-16 text-slate-300 dark:text-white/10" />
                </div>
              )}

              {/* Title & Description */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div>
                  {product.category && (
                    <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 mb-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-500/20">
                      {product.category}
                    </span>
                  )}
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                    {product.title}
                  </h1>
                </div>

                <div className="max-w-none">
                  <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* Product Info Grid */}
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Product Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-gray-50 dark:bg-[#12141c] border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-500/30">
                    <div className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Format</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-200">{product.format ?? "-"}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#12141c] border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-500/30">
                    <div className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Pages</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-200">{product.pageCount ?? "-"}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#12141c] border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-500/30">
                    <div className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">File Size</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-200">{formatFileSize(product.fileSizeBytes)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#12141c] border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-500/30">
                    <div className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Language</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-200">{product.language || "-"}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#12141c] border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-500/30">
                    <div className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Level</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-200">{product.intendedAudience || "-"}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#12141c] border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-500/30">
                    <div className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Updated</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-200">{formatDate(product.lastUpdatedAt)}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column - Sticky Sidebar */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4 sm:gap-6 lg:sticky lg:top-24">
              
              {/* Pricing & CTA */}
              {product.isDeleted ? (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-200 dark:border-emerald-500/20 flex flex-col gap-3 shadow-sm">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-100 mb-1">Already Purchased</h3>
                    <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300/80 mb-3 sm:mb-4">You own this product. Go to your purchases to download.</p>
                    <button
                      onClick={() => router.push(`/dashboard/buyer/purchases`)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl font-bold text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 w-full"
                    >
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Go to My Purchases
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-[#12141c]/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-white/10 shadow-md">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span className="text-xs sm:text-sm font-medium">Original Price</span>
                      <span className="line-through text-xs sm:text-sm font-semibold">₹{calculateOriginalPrice().toLocaleString()}</span>
                    </div>

                    {calculateDiscount() > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 p-2 sm:p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                        <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Discount ({product.discount}%)
                        </span>
                        <span className="text-xs sm:text-sm font-bold">-₹{calculateDiscount().toLocaleString()}</span>
                      </div>
                    )}

                    <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Final Total</span>
                      <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400">
                        ₹{calculateFinalTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2.5 sm:gap-3 mt-4 sm:mt-6">
                    <button
                      className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white py-3 sm:py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base transition shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
                      onClick={handleBuy}
                    >
                      Buy Now
                    </button>
                    <div className="flex gap-2.5 sm:gap-3 w-full">
                      <button
                        onClick={toggleWishlist}
                        className={`flex-1 py-3 sm:py-3.5 px-2 sm:px-4 rounded-xl font-bold text-[11px] sm:text-sm transition shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 border ${
                          wishlist.includes(id as string)
                            ? 'bg-pink-50 dark:bg-pink-500/10 hover:bg-pink-100 dark:hover:bg-pink-500/20 border-pink-200 dark:border-pink-500/20 text-pink-600 dark:text-pink-400'
                            : 'bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${wishlist.includes(id as string) ? 'fill-pink-500 text-pink-500' : ''}`} />
                        <span className="truncate">Wishlist</span>
                      </button>
                      <button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className={`flex-1 py-3 sm:py-3.5 px-2 sm:px-4 rounded-xl font-bold text-[11px] sm:text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 border ${
                          isInCart
                            ? 'bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'
                        }`}
                      >
                        <ShoppingCart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isInCart ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="truncate">{addingToCart ? 'Updating...' : isInCart ? 'Remove' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Preview */}
              {product.previewPdfUrl && (
                <button
                  type="button"
                  onClick={handleDownloadPreview}
                  className="w-full py-3 sm:py-3.5 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 group"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Download Free Preview
                </button>
              )}

              {/* Trust Guarantee */}
              <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-400/20 rounded-xl p-4 sm:p-5 space-y-2 sm:space-y-3">
                <div className="font-bold text-xs sm:text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2 sm:mb-3">
                  <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-emerald-500"></span>
                  </span>
                  Trusted Purchase Guarantee
                </div>
                <TrustRow label="File scanned for malware" active={!!product.malwareScanned} />
                <TrustRow label="Content reviewed by admin" active={product.contentReviewed === "manually_reviewed" || product.status === "approved"} />
                <TrustRow label="Refund protected" active={product.refundEligible !== false} />
                <TrustRow label="Secure payment encryption" active={true} />
              </div>

              {/* Seller Profile */}
              <div className="bg-gray-50 dark:bg-[#12141c]/50 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  {product.sellerId?.profilePictureUrl ? (
                    <img
                      src={product.sellerId.profilePictureUrl}
                      alt={product.sellerId.name}
                      className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-gray-200 dark:border-white/20 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-gray-200 dark:border-white/20 flex items-center justify-center text-lg sm:text-xl font-bold text-indigo-700 dark:text-indigo-300">
                      {product.sellerId?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5 sm:mb-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                        {product.sellerId?.name || product.sellerId?.email}
                      </span>
                      
                      {product.sellerId?.isVerified && product.sellerStats?.identityVerifiedAt && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                          <BadgeCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Verified
                        </span>
                      )}
                    </div>
                    
                    {product.sellerStats?.ratingCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-yellow-500 dark:text-yellow-400">
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current drop-shadow-sm" />
                        <span className="font-bold">
                          {product.sellerStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px] sm:text-xs">
                          ({product.sellerStats.ratingCount} ratings)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {product.sellerId?.bio && (
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs mt-2 mb-3 sm:mb-4 line-clamp-2 leading-relaxed border-t border-gray-200 dark:border-white/10 pt-2 sm:pt-3">{product.sellerId.bio}</p>
                )}

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  <div className="bg-white dark:bg-[#1a1c26] border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl px-1 py-1.5 sm:py-2 text-center shadow-sm">
                    <div className="text-slate-500 dark:text-slate-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-0.5">Sales</div>
                    <div className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                      {product.sellerStats?.totalSales ?? 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#1a1c26] border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl px-1 py-1.5 sm:py-2 text-center shadow-sm">
                    <div className="text-slate-500 dark:text-slate-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-0.5">Items</div>
                    <div className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                      {product.sellerStats?.productCount ?? 1}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#1a1c26] border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl px-1 py-1.5 sm:py-2 text-center shadow-sm">
                    <div className="text-slate-500 dark:text-slate-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-0.5">Joined</div>
                    <div className="font-bold text-slate-900 dark:text-white text-[9px] sm:text-[11px] mt-0.5">
                      {(product.sellerStats?.memberSince || product.sellerId?.createdAt)
                        ? new Date(product.sellerStats?.memberSince || product.sellerId?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : '-'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="mt-8">
          <ProductReviews productId={id as string} />
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        onLogin={goToLogin}
        onRegister={goToRegister}
        action={pendingAction}
      />
    </div>
  );
}

