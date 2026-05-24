"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";
import { Star, MessageCircle } from "lucide-react";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  buyerId: {
    _id: string;
    name: string;
    profilePictureUrl?: string;
  };
  sellerResponse?: {
    text: string;
    respondedAt: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    [key: number]: number;
  };
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/product/${productId}`);
      setReviews(res.data.reviews);
      setStats(res.data.stats);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    const token = getCookie("token");
    if (!token) return;

    try {
      const res = await api.get(`/reviews/can-review/${productId}`);
      setCanReview(res.data.canReview);
      if (res.data.existingReview) {
        setExistingReview(res.data.existingReview);
      }
    } catch (error) {
      // User not logged in or error
    }
  };

  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const canReviewRes = await api.get(`/reviews/can-review/${productId}`);
      const orderId = canReviewRes.data.orderId;

      await api.post("/reviews", {
        productId,
        orderId,
        rating,
        comment: comment.trim()
      });

      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setComment("");
      setRating(5);
      fetchReviews();
      checkCanReview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#12141c]/60 border border-gray-100 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:bg-white sm:dark:bg-[#12141c]/60 sm:backdrop-blur-2xl sm:border sm:border-gray-100 sm:dark:border-white/5 sm:rounded-3xl sm:p-8 space-y-5 sm:space-y-8 sm:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reviews & Ratings</h2>
        {canReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-sm"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Stats Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex items-center gap-6 sm:gap-10 pb-5 sm:pb-6 border-b border-gray-100 dark:border-white/10">
          <div className="text-center min-w-[80px]">
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-1.5 sm:mb-2 tracking-tighter">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex gap-0.5 justify-center mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  className={`sm:w-3.5 sm:h-3.5 ${
                    star <= Math.round(stats.averageRating)
                      ? "fill-[#FFA41C] text-[#FFA41C]"
                      : "fill-gray-200 text-gray-200 dark:fill-slate-700 dark:text-slate-700"
                  }`}
                />
              ))}
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">{stats.totalReviews} reviews</div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1.5 sm:space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium w-4 sm:w-6 flex items-center gap-0.5">
                  {star}<Star size={10} className="fill-current" />
                </span>
                <div className="flex-1 h-1.5 sm:h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFA41C] rounded-full"
                    style={{
                      width: `${stats.totalReviews > 0 ? ((stats.distribution[star] || 0) / stats.totalReviews) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-slate-500 dark:text-slate-400 w-4 sm:w-6 text-right font-medium text-[10px] sm:text-xs">
                  {stats.distribution[star] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 dark:bg-[#12141c]/80 border border-gray-100 dark:border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Write Your Review</h3>
          
          {/* Star Rating */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Rating</label>
            <div className="flex gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star
                    size={28}
                    className={`${
                      star <= rating
                        ? "fill-[#FFA41C] text-[#FFA41C]"
                        : "fill-gray-200 text-gray-200 dark:fill-slate-700 dark:text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={3}
              maxLength={1000}
              className="w-full bg-white dark:bg-[#0A101D] border border-gray-200 dark:border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
            />
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-right font-medium">{comment.length}/1000</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowReviewForm(false)}
              className="flex-1 px-4 py-2 sm:py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl font-bold text-xs sm:text-sm transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="flex-1 px-4 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm disabled:opacity-50 flex items-center justify-center"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3 sm:space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-gray-50 dark:bg-[#12141c]/50 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-gray-50 dark:bg-[#12141c]/80 border border-gray-100 dark:border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar */}
                {review.buyerId.profilePictureUrl ? (
                  <img
                    src={review.buyerId.profilePictureUrl}
                    alt={review.buyerId.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white dark:border-white/10 object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border-2 border-white dark:border-white/10 flex items-center justify-center text-base sm:text-lg font-bold text-indigo-700 dark:text-indigo-300 shadow-sm shrink-0">
                    {review.buyerId.name?.charAt(0) || "?"}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 sm:mb-1.5 gap-1">
                    <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {review.buyerId.name}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={`sm:w-3.5 sm:h-3.5 ${
                            star <= review.rating
                              ? "fill-[#FFA41C] text-[#FFA41C]"
                              : "fill-gray-200 text-gray-200 dark:fill-slate-700 dark:text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-2 sm:mb-2.5 leading-relaxed break-words">
                      {review.comment}
                    </p>
                  )}

                  <div className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>

                  {/* Seller Response */}
                  {review.sellerResponse && (
                    <div className="mt-3 sm:mt-4 pl-3 sm:pl-4 border-l-2 border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/5 p-3 rounded-lg">
                      <div className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1.5 flex items-center gap-1.5">
                        <MessageCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span>Seller Response</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{review.sellerResponse.text}</p>
                      <div className="text-[9px] sm:text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2">
                        {new Date(review.sellerResponse.respondedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
