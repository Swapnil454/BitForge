"use client";

import { useState, useEffect } from "react";
import { reviewAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Star, AlertTriangle, Lightbulb, PenLine, X, Info, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [canReviewReason, setCanReviewReason] = useState("");
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
        const reason = result.reason || result.message || "You cannot review this product";
        setCanReviewReason(reason);
        toast.error(reason);
      }
    } catch (error: any) {
      console.error("Failed to check review eligibility:", error);
      setCanReview(false);
      setCanReviewReason("Failed to verify eligibility");
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

  // Reset state when closed
  if (!isOpen && (rating > 0 || comment !== "")) {
    setRating(0);
    setHoverRating(0);
    setComment("");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-[900]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:w-[480px] bg-white dark:bg-[#16161e] shadow-2xl border-l border-slate-200 dark:border-white/10 z-[1000] flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#16161e]">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PenLine className="w-5 h-5 text-cyan-500" />
                  Write a Review
                </h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{productTitle}</p>
              </div>
              <button
                onClick={onClose}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {checkingEligibility ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-white/60 text-sm">Checking eligibility...</p>
                </div>
              ) : !canReview ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-white/60 text-sm">{canReviewReason || "You cannot review this product at this time."}</p>
                </div>
              ) : (
                <>
                  {/* Star Rating */}
                  <div>
                    <label className="block text-slate-900 dark:text-white font-semibold text-sm mb-3">
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
                            <Star className="w-9 h-9 text-slate-200 dark:text-white/10" />
                          )}
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-3 text-slate-600 dark:text-white/60 text-sm font-medium">
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
                    <label className="block text-slate-900 dark:text-white font-semibold text-sm mb-3">
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
                      className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-cyan-500/50 resize-none transition-colors"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-cyan-500" />
                        Tip: Mention quality, accuracy, and value
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {comment.length}/1000
                      </p>
                    </div>
                  </div>

                  {/* Review Guidelines */}
                  <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-xl p-4">
                    <h3 className="text-cyan-700 dark:text-cyan-300 font-semibold text-sm mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Review Guidelines
                    </h3>
                    <ul className="text-xs text-slate-600 dark:text-white/70 space-y-1.5 ml-6 list-disc">
                      <li>Be honest and constructive</li>
                      <li>Focus on product quality and value</li>
                      <li>No offensive language or personal attacks</li>
                      <li>Help other buyers make informed decisions</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            {canReview && !checkingEligibility ? (
              <div className="p-5 pb-8 sm:pb-5 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#16161e] flex gap-3">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="flex-[2] px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
            ) : (
              <div className="p-5 pb-8 sm:pb-5 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#16161e] flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
