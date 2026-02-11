"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";

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
      // Get the order ID from the canReview check
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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Reviews & Ratings</h2>
        {canReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-lg font-semibold text-sm transition"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Stats Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex items-center gap-8 pb-6 border-b border-white/10">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex gap-0.5 justify-center mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= Math.round(stats.averageRating) ? "text-yellow-400" : "text-white/20"}>
                  ⭐
                </span>
              ))}
            </div>
            <div className="text-sm text-white/60">{stats.totalReviews} reviews</div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="text-white/70 w-6">{star}★</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{
                      width: `${stats.totalReviews > 0 ? ((stats.distribution[star] || 0) / stats.totalReviews) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-white/60 w-8 text-right">{stats.distribution[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Write Your Review</h3>
          
          {/* Star Rating */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-3xl hover:scale-110 transition"
                >
                  {star <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              maxLength={1000}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
            <div className="text-xs text-white/50 mt-1 text-right">{comment.length}/1000</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowReviewForm(false)}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {review.buyerId.profilePictureUrl ? (
                  <img
                    src={review.buyerId.profilePictureUrl}
                    alt={review.buyerId.name}
                    className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-2 border-white/20 flex items-center justify-center text-lg font-bold text-white">
                    {review.buyerId.name?.charAt(0) || "?"}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-white">{review.buyerId.name}</div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? "text-yellow-400" : "text-white/20"}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-white/80 mb-2">{review.comment}</p>
                  )}

                  <div className="text-xs text-white/50">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>

                  {/* Seller Response */}
                  {review.sellerResponse && (
                    <div className="mt-4 pl-4 border-l-2 border-cyan-500/30 bg-cyan-500/5 p-4 rounded">
                      <div className="text-xs text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                        <span>💬</span>
                        <span>Seller Response</span>
                      </div>
                      <p className="text-sm text-white/80">{review.sellerResponse.text}</p>
                      <div className="text-xs text-white/50 mt-2">
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
