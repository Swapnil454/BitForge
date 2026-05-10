"use client";

import { useState, useEffect } from "react";
import { reviewAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Star, AlertTriangle, Lightbulb, PenLine, X, Info, Check } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  orderId: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  orderId,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(true);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  useEffect(() => {
    if (isOpen && productId && orderId) {
      checkReviewEligibility();
    }
  }, [isOpen, productId, orderId]);

  const checkReviewEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const result = await reviewAPI.canReview(productId, orderId);
      setCanReview(result.canReview);
      if (!result.canReview) {
        toast.error(result.message || "You cannot review this product");
      }
    } catch (error: any) {
      console.error("Failed to check review eligibility:", error);
      setCanReview(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    try {
      setSubmitting(true);
      await reviewAPI.createReview({
        productId,
        orderId,
        rating,
        comment: comment.trim(),
      });
      toast.success("Review submitted successfully!");
      setRating(0);
      setComment("");
      onReviewSubmitted?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20 backdrop-blur-md border-b border-slate-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PenLine className="w-6 h-6 text-cyan-400" />
                Write a Review
              </h2>
              <p className="text-slate-500 dark:text-white/60 mt-1 line-clamp-1">{productTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center transition"
            >
              <X className="w-5 h-5 text-slate-700 dark:text-white/80" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {checkingEligibility ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-slate-500 dark:text-white/60">Checking eligibility...</p>
            </div>
          ) : !canReview ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-white/60">You cannot review this product at this time.</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-slate-200 dark:bg-white/10 hover:bg-white/20 rounded-lg text-slate-900 dark:text-white transition"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Star Rating */}
              <div>
                <label className="block text-slate-900 dark:text-white font-semibold mb-3">
                  Your Rating <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      {star <= (hoverRating || rating) ? (
                        <Star className="w-9 h-9 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                      ) : (
                        <Star className="w-9 h-9 text-slate-200 dark:text-white/20" />
                      )}
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-3 text-slate-500 dark:text-white/60">
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </span>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-slate-900 dark:text-white font-semibold mb-3">
                  Your Review (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) {
                      setComment(e.target.value);
                    }
                  }}
                  placeholder="Share your experience with this product... What did you like? How was the quality? Would you recommend it?"
                  className="w-full h-32 px-4 py-3 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-slate-400 dark:text-white/40 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-cyan-400" />
                    Tip: Mention quality, accuracy, and value for money
                  </p>
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    {comment.length}/1000
                  </p>
                </div>
              </div>

              {/* Review Guidelines */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <h3 className="text-cyan-300 font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Review Guidelines
                </h3>
                <ul className="text-sm text-slate-600 dark:text-white/70 space-y-1 ml-7">
                  <li>• Be honest and constructive</li>
                  <li>• Focus on product quality and value</li>
                  <li>• No offensive language or personal attacks</li>
                  <li>• Help other buyers make informed decisions</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-slate-200 dark:border-white/5">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg font-medium transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-900 dark:text-white text-sm rounded-lg font-medium transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
