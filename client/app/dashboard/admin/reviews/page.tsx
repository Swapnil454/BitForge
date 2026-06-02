"use client";

import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "@/lib/api";
import api from "@/lib/api";
import toast from "react-hot-toast";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import {
  Star,
  MessageCircle,
  Trash2,
  EyeOff,
  Eye,
  RefreshCw,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle2,
  User,
} from "lucide-react";

interface AdminReview {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isHidden: boolean;
  createdAt: string;
  productId?: {
    _id: string;
    title: string;
  };
  buyerId?: {
    _id: string;
    name: string;
    email: string;
  };
  sellerId?: {
    _id: string;
    name: string;
    email: string;
  };
  sellerResponse?: {
    text: string;
    respondedAt: string;
  };
}

type FilterStatus = "all" | "visible" | "hidden";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReviews = useCallback(async (page: number = 1, isRefresh = false) => {
    const cacheKey = `admin_reviews_page1_${filterStatus}_${debouncedSearch}`;

    if (page === 1) {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            setReviews(parsed.reviews || []);
            setPagination(parsed.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
            setLoading(false);
          } else {
            setLoading(true);
          }
        } catch (e) {
          setLoading(true);
        }
      }
    } else {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await api.get(`/admin/reviews?${params.toString()}`);
      setReviews(res.data.reviews || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      
      if (page === 1) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            reviews: res.data.reviews || [],
            pagination: res.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 }
          }));
        } catch (e) {}
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus, debouncedSearch]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handleToggleVisibility = async (review: AdminReview) => {
    setActionLoading(review._id);
    try {
      await api.patch(`/admin/reviews/${review._id}/hide`, { isHidden: !review.isHidden });
      toast.success(review.isHidden ? "Review made visible" : "Review hidden successfully");
      setReviews(prev =>
        prev.map(r => r._id === review._id ? { ...r, isHidden: !r.isHidden } : r)
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update review");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success("Review deleted successfully");
      setReviews(prev => prev.filter(r => r._id !== id));
      setConfirmDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total: pagination.total,
    hidden: reviews.filter(r => r.isHidden).length,
    visible: reviews.filter(r => !r.isHidden).length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—",
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      <PageHeader
        title="Reviews Moderation"
        subtitle="Monitor, hide, or delete user reviews across the platform"
        backHref="/dashboard/admin"
        backLabel="Back"
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6 pb-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Reviews", value: pagination.total, color: "slate" },
            { label: "Visible", value: stats.visible, color: "emerald" },
            { label: "Hidden", value: stats.hidden, color: "amber" },
            { label: "Avg Rating", value: stats.avgRating, color: "indigo" },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{s.label}</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by comment..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/40 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl gap-1 border border-slate-200 dark:border-white/[0.06]">
            {(["all", "visible", "hidden"] as FilterStatus[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  filterStatus === f
                    ? "bg-white dark:bg-[#202028] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.08]"
                    : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchReviews(pagination.page, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl text-xs font-bold text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Reviews List */}
        <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.02]">
            <MessageCircle className="w-4 h-4 text-indigo-500" />
            <h2 className="font-black text-sm text-slate-900 dark:text-white">All Reviews</h2>
            <span className="ml-auto px-3 py-1 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[10px] font-black text-slate-500 dark:text-white/40">
              {pagination.total}
            </span>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-5 animate-pulse flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.04] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 dark:bg-white/[0.04] rounded w-1/3" />
                    <div className="h-3 bg-slate-100 dark:bg-white/[0.04] rounded w-2/3" />
                    <div className="h-3 bg-slate-100 dark:bg-white/[0.04] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-slate-300 dark:text-white/10" />
              </div>
              <p className="font-black text-slate-400 dark:text-white/30">No reviews found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className={`p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all ${
                    review.isHidden ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Left: User & Product info */}
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center text-sm font-black text-indigo-700 dark:text-indigo-300 shrink-0">
                        {review.buyerId?.name?.charAt(0) || <User className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Buyer & badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {review.buyerId?.name || "Unknown Buyer"}
                          </span>
                          <span className="text-[9px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            Buyer
                          </span>
                          {review.isHidden && (
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                              <EyeOff className="w-2.5 h-2.5" /> Hidden
                            </span>
                          )}
                          {/* Stars */}
                          <div className="flex gap-0.5 ml-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                size={10}
                                className={s <= review.rating ? "fill-[#FFA41C] text-[#FFA41C]" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Product */}
                        {review.productId && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-[11px] text-slate-500 dark:text-white/40 truncate">
                              {review.productId.title}
                            </span>
                            {review.sellerId && (
                              <>
                                <span className="text-slate-300 dark:text-white/20">•</span>
                                <span className="text-[11px] text-slate-400 dark:text-white/30 truncate">
                                  by {review.sellerId.name}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Review text */}
                        {review.title && (
                          <p className="font-bold text-sm text-slate-800 dark:text-white mb-1">{review.title}</p>
                        )}
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {review.comment}
                        </p>

                        {/* Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {review.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt="Review attachment"
                                className="w-14 h-14 rounded-lg object-cover cursor-pointer border border-slate-200 dark:border-white/10 hover:opacity-80 transition"
                                onClick={() => setSelectedImage(img)}
                              />
                            ))}
                          </div>
                        )}

                        {/* Seller response (if any) */}
                        {review.sellerResponse && (
                          <div className="mt-2 bg-indigo-50/50 dark:bg-indigo-500/5 border-l-2 border-indigo-400 p-2.5 rounded-r-lg">
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> Seller Response
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{review.sellerResponse.text}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex sm:flex-col gap-2 shrink-0 items-center sm:items-end justify-end sm:justify-start mt-1">
                      <button
                        onClick={() => handleToggleVisibility(review)}
                        disabled={actionLoading === review._id}
                        title={review.isHidden ? "Make visible" : "Hide review"}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border disabled:opacity-50 ${
                          review.isHidden
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {actionLoading === review._id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : review.isHidden ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">{review.isHidden ? "Unhide" : "Hide"}</span>
                      </button>

                      <button
                        onClick={() => setConfirmDelete({ id: review._id, title: review.comment.substring(0, 50) })}
                        disabled={actionLoading === review._id}
                        title="Delete review"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-600 dark:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.02]">
              <span className="text-xs text-slate-400 dark:text-white/30">
                Page {pagination.page} of {pagination.pages} · {pagination.total} total
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchReviews(pagination.page - 1)}
                  className="px-4 py-2 bg-white dark:bg-[#1c1c24] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-700 dark:text-white disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchReviews(pagination.page + 1)}
                  className="px-4 py-2 bg-white dark:bg-[#1c1c24] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-700 dark:text-white disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </section>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 dark:bg-black/70 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.08] rounded-3xl w-full max-w-sm shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">Delete Review</h2>
                <p className="text-xs text-slate-400 dark:text-white/40">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 bg-slate-50 dark:bg-white/[0.04] p-3 rounded-xl border border-slate-200 dark:border-white/[0.06] italic line-clamp-3">
              &quot;{confirmDelete.title}...&quot;
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={actionLoading === confirmDelete.id}
                className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === confirmDelete.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </main>
  );
}
