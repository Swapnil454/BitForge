"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { getCookie } from "@/lib/cookies";
import { useAuth } from "@/lib/useAuth";
import AuthModal from "@/app/components/AuthModal";
import toast from "react-hot-toast";
import { cartAPI } from "@/lib/api";
import ProductReviews from "./components/ProductReviews";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import { Heart, ShoppingCart, Info, Archive, CheckCircle, BadgeCheck, Star, Sparkles } from "lucide-react";

function TrustRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
          active
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
            : "bg-white/5 text-white/40 border border-white/10"
        }`}
      >
        {active ? <CheckCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
      </span>
      <span className={active ? "text-white/80" : "text-white/50 text-sm"}>{label}</span>
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
  
  // Auth hook for gating actions
  const { 
    isAuthenticated, 
    requireAuth, 
    showAuthModal, 
    pendingAction, 
    closeAuthModal, 
    goToLogin, 
    goToRegister 
  } = useAuth();

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
        // Fetch product (public)
        const res = await api.get(`/marketplace/${id}`);
        setProduct(res.data);
        
        // Check if in cart (only if authenticated)
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

    // Ensure Razorpay checkout script is available in client
    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        {/* Skeleton Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="relative flex min-h-[58px] items-center justify-center">
              <div className="h-8 w-24 bg-white/5 rounded absolute left-0 animate-pulse"></div>
              <div className="h-6 w-48 bg-white/5 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-white/5 rounded-xl absolute right-0 animate-pulse"></div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
          <div className="bg-[#12141c]/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-xl">
            <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">
              
              {/* Skeleton Category */}
              <div className="h-5 w-20 bg-white/5 rounded animate-pulse"></div>

              {/* Skeleton Preview */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-6 w-32 bg-white/5 rounded animate-pulse"></div>
                  <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse"></div>
                </div>
                <div className="w-full bg-[#0a0a0f]/50 rounded-xl border border-white/5 h-[200px] sm:h-[280px] animate-pulse"></div>
                <div className="h-3 w-48 bg-white/5 rounded mx-auto mt-2 animate-pulse"></div>
              </div>

              {/* Skeleton Description */}
              <div className="space-y-2">
                <div className="h-6 w-40 bg-white/5 rounded animate-pulse"></div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-white/5 rounded animate-pulse"></div>
                  <div className="h-3 w-[90%] bg-white/5 rounded animate-pulse"></div>
                  <div className="h-3 w-[75%] bg-white/5 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Skeleton Grid */}
              <div className="space-y-2 sm:space-y-3">
                <div className="h-6 w-32 bg-white/5 rounded animate-pulse"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-[#12141c] border border-white/5 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5 animate-pulse">
                      <div className="h-2 w-16 bg-white/10 rounded mb-1.5"></div>
                      <div className="h-3 w-20 bg-white/5 rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="h-10 w-full sm:w-1/2 bg-white/5 rounded-lg animate-pulse mt-2"></div>
              </div>

              {/* Skeleton Seller Info */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="h-6 w-40 bg-white/5 rounded animate-pulse"></div>
                <div className="h-32 w-full bg-white/5 rounded-xl animate-pulse"></div>
              </div>

            </div>
          </div>
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

  const previewFileName = `${(product.title || "preview")
    .toString()
    .replace(/[^a-z0-9_\-]+/gi, "_")
    .toLowerCase()}_preview.pdf`;

  const handleDownloadPreview = () => {
    if (!product?.previewPdfUrl) {
      toast.error("Preview not available");
      return;
    }

    // Open preview PDF directly (Cloudinary handles format properly)
    window.open(product.previewPdfUrl, "_blank", "noopener,noreferrer");
  };

    const handleBuy = async () => {
      // Use requireAuth hook for consistent UX
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
      });
    };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      { /* product data flow schema  */}
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

              // Add aggregateRating here
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
        title={product.title}
        rightSlot={
          <div className="flex items-center gap-3">
            <button
              onClick={toggleWishlist}
              className="relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/50 hover:bg-pink-500/10 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-lg"
              title={wishlist.includes(id as string) ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wishlist.includes(id as string) ? (
                <Heart className="w-5 h-5 fill-pink-500 text-pink-500 group-hover:scale-110 transition-transform" />
              ) : (
                <Heart className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-transform" />
              )}
            </button>
            <button
              onClick={() => requireAuth("view cart", () => router.push("/cart"))}
              className="relative h-10 w-10 md:h-11 md:w-11 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 grid place-items-center transition-all duration-300 group hover:scale-105 shadow-lg"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Archived Product Banner */}
        {product.isDeleted && (
          <div className="mb-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-400 text-lg mb-1">This product has been archived</h3>
                <p className="text-amber-200/70 text-sm">
                  {product.deletedMessage || "This product is no longer available for new purchases. You can still download your purchased files."}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-[#12141c]/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-xl">
          <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">
            
            {/* Product Category */}
            {product.category && (
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/5 text-white/70 text-[10px] font-semibold uppercase tracking-wider rounded border border-white/10">
                  {product.category}
                </span>
              </div>
            )}

            {/* Product Thumbnail with Preview Download */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg font-bold text-white/90">Product Preview</h2>
                {product.previewPdfUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadPreview}
                    className="py-1 px-2.5 sm:py-1.5 sm:px-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download Preview
                  </button>
                )}
              </div>
              
              {/* Thumbnail */}
              {product.thumbnailUrl ? (
                <div className="w-full bg-[#0a0a0f]/50 flex justify-center items-center rounded-xl overflow-hidden border border-white/5 shadow-inner">
                  <img
                    src={product.thumbnailUrl}
                    alt={product.title}
                    className="w-full h-full object-contain max-h-[200px] sm:max-h-[280px]"
                  />
                </div>
              ) : (
                <div className="w-full bg-[#0a0a0f]/50 flex items-center justify-center rounded-xl border border-white/5 shadow-inner" style={{ height: '200px' }}>
                  <Archive className="w-10 h-10 text-white/10" />
                </div>
              )}
              
              {product.previewPdfUrl && (
                <p className="text-[11px] sm:text-xs text-white/50 text-center flex items-center justify-center gap-1.5 mt-1.5">
                  <Info className="w-3 h-3 text-cyan-400" />
                  Click "Download Preview" to view a sample
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-white">About this product</h2>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white">Product Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-[#12141c] border border-white/5 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <div className="text-white/40 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Format</div>
                  <div className="font-medium text-xs sm:text-sm text-white/90">{product.format ?? "-"}</div>
                </div>
                <div className="bg-[#12141c] border border-white/5 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <div className="text-white/40 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Pages</div>
                  <div className="font-medium text-xs sm:text-sm text-white/90">{product.pageCount ?? "-"}</div>
                </div>
                <div className="bg-[#12141c] border border-white/5 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <div className="text-white/40 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">File size</div>
                  <div className="font-medium text-xs sm:text-sm text-white/90">{formatFileSize(product.fileSizeBytes)}</div>
                </div>
                <div className="bg-[#12141c] border border-white/5 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <div className="text-white/40 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Language</div>
                  <div className="font-medium text-xs sm:text-sm text-white/90">{product.language || "-"}</div>
                </div>
                <div className="bg-[#12141c] border border-white/5 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <div className="text-white/40 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Level</div>
                  <div className="font-medium text-xs sm:text-sm text-white/90">{product.intendedAudience || "-"}</div>
                </div>
                <div className="bg-[#12141c] border border-white/5 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <div className="text-white/40 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5">Last updated</div>
                  <div className="font-medium text-xs sm:text-sm text-white/90">{formatDate(product.lastUpdatedAt)}</div>
                </div>
              </div>
              
              {/* Trust checklist */}
              <div className="mt-2 bg-emerald-500/5 border border-emerald-400/20 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs text-white/80 space-y-1 sm:space-y-1.5">
                <div className="font-semibold flex items-center gap-2 text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Trusted purchase
                </div>
                <TrustRow
                  label="File scanned for malware"
                  active={!!product.malwareScanned}
                />
                <TrustRow
                  label="Content reviewed by admin"
                  active={product.contentReviewed === "manually_reviewed" || product.status === "approved"}
                />
                <TrustRow
                  label="Refund protected"
                  active={product.refundEligible !== false}
                />
                <TrustRow label="Secure payment" active={true} />
              </div>
            </div>

            {/* Seller Information */}
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">Seller Information</h2>
              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 sm:p-3">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {product.sellerId?.profilePictureUrl ? (
                    <img
                      src={product.sellerId.profilePictureUrl}
                      alt={product.sellerId.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center text-lg">
                      {product.sellerId?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white text-lg">
                        {product.sellerId?.name || product.sellerId?.email}
                      </span>
                      
                      {product.sellerId?.isVerified && product.sellerStats?.identityVerifiedAt && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                      
                      {product.sellerStats?.isNewSeller && product.sellerId?.isVerified && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          New
                        </span>
                      )}
                    </div>
                    
                    {product.sellerStats?.ratingCount > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-yellow-400 mt-1.5">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                        <span className="font-bold">
                          {product.sellerStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-white/40">
                          ({product.sellerStats.ratingCount} ratings)
                        </span>
                      </div>
                    )}
                    
                    {product.sellerId?.bio && (
                      <p className="text-white/60 text-xs mt-0.5 line-clamp-2">{product.sellerId.bio}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-center">
                    <div className="text-white/50 text-[9px] sm:text-[10px] mb-0.5">Total Sales</div>
                    <div className="font-semibold text-white text-sm sm:text-base">
                      {product.sellerStats?.totalSales ?? 0}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-center">
                    <div className="text-white/50 text-[9px] sm:text-[10px] mb-0.5">Products</div>
                    <div className="font-semibold text-white text-sm sm:text-base">
                      {product.sellerStats?.productCount ?? 1}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-center">
                    <div className="text-white/50 text-[9px] sm:text-[10px] mb-0.5">Member Since</div>
                    <div className="font-semibold text-white text-[10px] sm:text-xs">
                      {(product.sellerStats?.memberSince || product.sellerId?.createdAt)
                        ? new Date(product.sellerStats?.memberSince || product.sellerId?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : '-'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">Pricing</h2>
              {product.isDeleted ? (
                <div className="bg-[#12141c] p-3 sm:p-4 rounded-lg border border-emerald-500/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <div className="flex items-center gap-3 pl-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-white mb-0.5">Already Purchased</p>
                      <p className="text-[10px] sm:text-xs text-white/60">You own this product. Go to your purchases to download.</p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="bg-gradient-to-br from-white/5 to-white/10 p-3 sm:p-4 rounded-lg border border-white/10">
                <div className="space-y-1.5 sm:space-y-2">
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

                  <div className="border-t border-white/20 pt-2 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 -mx-3 sm:-mx-4 px-3 sm:px-4 py-2 sm:py-2.5 -mb-3 sm:-mb-4 rounded-b-lg">
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">Final Total</span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">₹{calculateFinalTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                {product.isDeleted ? (
                  /* For archived products - show download button only */
                  <button
                    onClick={() => router.push(`/dashboard/buyer/purchases`)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white py-2 px-3 rounded-lg font-bold text-sm transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Go to My Purchases
                  </button>
                ) : (
                  /* Normal product - show cart and buy buttons */
                  <>
                    <button
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className={`flex-1 px-3 py-2 sm:py-2.5 rounded-lg font-bold text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        isInCart
                          ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white'
                      }`}
                    >
                      {addingToCart ? 'Updating...' : isInCart ? 'Remove from Cart' : 'Add to Cart'}
                    </button>
                    <button
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white py-2 px-3 sm:py-2.5 rounded-lg font-bold text-sm transition shadow-sm"
                      onClick={handleBuy}
                    >
                      Buy Now
                    </button>
                  </>
                )}
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
