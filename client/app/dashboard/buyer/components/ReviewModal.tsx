"use client";

import { useState, useEffect, useRef } from "react";
import { reviewAPI } from "@/lib/api";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Star, AlertTriangle, Lightbulb, PenLine, X, Info, Check, Loader2, Camera } from "lucide-react";
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
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      }
    } catch (error: any) {
      console.error("Failed to check review eligibility:", error);
      setCanReview(false);
      setCanReviewReason("Failed to verify eligibility");
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (images.length + filesArray.length > 3) {
        toast.error("You can only upload a maximum of 3 images.");
        return;
      }
      
      const newImages = [...images, ...filesArray];
      setImages(newImages);
      
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviewUrls = [...previewUrls];
    URL.revokeObjectURL(newPreviewUrls[index]);
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("orderId", orderId);
      formData.append("rating", rating.toString());
      if (title.trim()) formData.append("title", title.trim());
      if (comment.trim()) formData.append("comment", comment.trim());
      
      images.forEach((image) => {
        formData.append("images", image);
      });

      await api.post("/reviews", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Review submitted successfully!");
      setRating(0);
      setTitle("");
      setComment("");
      setImages([]);
      setPreviewUrls([]);
      onReviewSubmitted?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset state when closed
  if (!isOpen && (rating > 0 || comment !== "" || title !== "")) {
    setRating(0);
    setHoverRating(0);
    setTitle("");
    setComment("");
    setImages([]);
    setPreviewUrls([]);
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
            <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col">
              {checkingEligibility ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-white/60 text-sm font-medium">Verifying your purchase...</p>
                </div>
              ) : !canReview ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Review Unavailable</h3>
                  <p className="text-slate-500 dark:text-white/60 text-sm max-w-xs mx-auto">
                    {canReviewReason || "You cannot review this product at this time."}
                  </p>
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

                  {/* Title */}
                  <div>
                    <label className="block text-slate-900 dark:text-white font-semibold text-sm mb-3">
                      Review Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What's most important to know?"
                      maxLength={150}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
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

                  {/* Images Upload */}
                  <div>
                    <label className="block text-slate-900 dark:text-white font-semibold text-sm mb-3">
                      Add Photos (Optional)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 group">
                          <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      
                      {images.length < 3 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-cyan-500 dark:hover:border-cyan-400 flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors bg-slate-50 dark:bg-white/5"
                        >
                          <Camera size={20} />
                          <span className="text-[10px] font-medium">Add Photo</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <p className="text-xs text-slate-500 mt-2">Up to 3 images allowed.</p>
                  </div>

                  {/* Review Guidelines */}
                  <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-xl p-4 mt-6">
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
