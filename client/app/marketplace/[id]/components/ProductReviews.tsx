"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import toast from "react-hot-toast";
import { Star, MessageCircle, Camera, X } from "lucide-react";

interface Review {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
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
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleEditClick = () => {
    if (!existingReview) return;
    setRating(existingReview.rating || 5);
    setTitle(existingReview.title || "");
    setComment(existingReview.comment || "");
    setImages([]); // we don't allow changing images via edit to keep it simple, or we can load them but let's clear for now
    setPreviewUrls(existingReview.images || []);
    setIsEditing(true);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async () => {
    if (!existingReview) return;
    const confirmDelete = window.confirm("Are you sure you want to delete your review?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/reviews/${existingReview._id}`);
      toast.success("Review deleted successfully!");
      setExistingReview(null);
      setCanReview(true); // User can review again
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && existingReview) {
        // PATCH request (does not handle image updates to keep it simple)
        await api.patch(`/reviews/${existingReview._id}`, {
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });
        toast.success("Review updated successfully!");
      } else {
        // POST request (new review)
        const canReviewRes = await api.get(`/reviews/can-review/${productId}`);
        const orderId = canReviewRes.data.orderId;

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
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Review submitted successfully!");
      }

      setShowReviewForm(false);
      setIsEditing(false);
      setComment("");
      setTitle("");
      setRating(5);
      setImages([]);
      setPreviewUrls([]);
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
    <div className="sm:bg-white sm:dark:bg-[#12141c]/60 sm:backdrop-blur-2xl sm:border sm:border-gray-100 sm:dark:border-white/5 sm:rounded-3xl sm:p-8 space-y-5 sm:space-y-8 sm:shadow-lg relative">
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white p-2 transition-colors rounded-full bg-black/50 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X size={28} />
          </button>
          <img 
            src={selectedImage} 
            alt="Review attachment" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reviews & Ratings</h2>
        {canReview && !showReviewForm && !existingReview && (
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

      {/* Existing Review Display */}
      {existingReview && !showReviewForm && (
        <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Star size={16} className="fill-indigo-500 text-indigo-500" />
              Your Review
            </h3>
            <div className="flex gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  className={`sm:w-3.5 sm:h-3.5 ${
                    star <= existingReview.rating
                      ? "fill-[#FFA41C] text-[#FFA41C]"
                      : "fill-gray-200 text-gray-200 dark:fill-slate-700 dark:text-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 mb-3 mt-[-4px]">
            <button 
              onClick={handleEditClick}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Edit
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button 
              onClick={handleDeleteReview}
              className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </div>
          {existingReview.title && (
            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">{existingReview.title}</h4>
          )}
          {existingReview.comment && (
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              {existingReview.comment}
            </p>
          )}
          {existingReview.images && existingReview.images.length > 0 && (
            <div className="flex gap-2 mb-2">
              {existingReview.images.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt="Review" 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-md object-cover cursor-pointer hover:opacity-80 transition"
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          )}
          <div className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 mt-3">
            {new Date(existingReview.createdAt).toLocaleDateString()}
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

          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Review Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's most important to know?"
              maxLength={150}
              className="w-full bg-white dark:bg-[#0A101D] border border-gray-200 dark:border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
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

          {/* Images Upload */}
          {!isEditing && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Add Photos (Optional)</label>
              <div className="flex flex-wrap gap-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 group">
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
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-indigo-500 dark:hover:border-indigo-400 flex flex-col items-center justify-center gap-1 sm:gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-gray-50 dark:bg-white/5"
                  >
                    <Camera size={20} className="sm:w-6 sm:h-6" />
                    <span className="text-[10px] sm:text-xs font-medium">Add Photo</span>
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
              <p className="text-[10px] sm:text-xs text-slate-500 mt-2">You can add up to 3 images. Show the product in use!</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowReviewForm(false);
                setIsEditing(false);
              }}
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

                  {review.title && (
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1.5">
                      {review.title}
                    </h4>
                  )}

                  {review.comment && (
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-2 sm:mb-2.5 leading-relaxed break-words">
                      {review.comment}
                    </p>
                  )}

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt="Review image" 
                          className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg object-cover cursor-pointer border border-gray-100 dark:border-white/10 hover:opacity-80 transition hover:shadow-sm"
                          onClick={() => setSelectedImage(img)}
                        />
                      ))}
                    </div>
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
