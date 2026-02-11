"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function SellerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "reviews">("products");

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sellers/${id}`);
        setSeller(res.data.seller);
        setProducts(res.data.products);
        setReviews(res.data.reviews);
      } catch (error: any) {
        console.error("Failed to fetch seller profile:", error);
        toast.error("Failed to load seller profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSellerProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Loading seller profile...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 text-xl mb-6">Seller not found</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition shadow-lg"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20 backdrop-blur-md border-b border-white/10 text-white py-5">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Seller Info Header */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {seller.profilePictureUrl ? (
                <img
                  src={seller.profilePictureUrl}
                  alt={seller.name}
                  className="w-24 h-24 rounded-full border-4 border-white/20 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-4 border-white/20 flex items-center justify-center text-4xl font-bold text-white">
                  {seller.name?.charAt(0) || "?"}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{seller.name}</h1>
                {seller.isVerified && seller.identityVerifiedAt && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 text-sm">
                    <span>✔</span>
                    Verified Seller
                  </span>
                )}
              </div>

              {seller.bio && (
                <p className="text-white/70 text-lg mb-4">{seller.bio}</p>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{seller.totalSalesCount || 0}</div>
                  <div className="text-xs text-white/60 mt-1">Total Sales</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">{products.length}</div>
                  <div className="text-xs text-white/60 mt-1">Products</div>
                </div>
                {seller.ratingCount > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">⭐ {seller.averageRating.toFixed(1)}</div>
                    <div className="text-xs text-white/60 mt-1">{seller.ratingCount} Reviews</div>
                  </div>
                )}
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                  <div className="text-sm font-semibold text-white">{formatDate(seller.memberSince)}</div>
                  <div className="text-xs text-white/60 mt-1">Member Since</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "products"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "reviews"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "products" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                onClick={() => router.push(`/marketplace/${product._id}`)}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition cursor-pointer group"
              >
                {product.thumbnailUrl ? (
                  <div className="aspect-video bg-slate-900/60 overflow-hidden">
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                    <span className="text-4xl">📄</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-white truncate">{product.title}</h3>
                  <p className="text-sm text-white/60 line-clamp-2 mt-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-cyan-400 font-bold">
                      ₹{product.discount > 0 
                        ? Math.max(product.price - (product.price * product.discount) / 100, 0)
                        : product.price
                      }
                    </div>
                    {product.discount > 0 && (
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-white/60">No products yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-start gap-4">
                  {review.buyerId?.profilePictureUrl ? (
                    <img
                      src={review.buyerId.profilePictureUrl}
                      alt={review.buyerId.name}
                      className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-2 border-white/20 flex items-center justify-center text-lg font-bold text-white">
                      {review.buyerId?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white">{review.buyerId?.name}</div>
                        {review.productId && (
                          <div className="text-sm text-white/60">on {review.productId.title}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        {"⭐".repeat(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-white/80 mb-2">{review.comment}</p>
                    )}
                    {review.sellerResponse && (
                      <div className="mt-3 pl-4 border-l-2 border-cyan-500/30 bg-cyan-500/5 p-3 rounded">
                        <div className="text-xs text-cyan-400 font-semibold mb-1">Seller Response:</div>
                        <p className="text-sm text-white/80">{review.sellerResponse.text}</p>
                      </div>
                    )}
                    <div className="text-xs text-white/50 mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/60">No reviews yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
