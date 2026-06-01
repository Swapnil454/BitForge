"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Star,
  MessageCircle,
  Send,
  FileText,
  Search,
  Loader2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import PageHeader from "../../buyer/transactions/components/PageHeader";

/* ─── Types ─── */
interface Review {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  createdAt: string;
  productId?: {
    _id: string;
    title: string;
    thumbnailUrl?: string;
  } | null;
  buyerId: {
    _id: string;
    name: string;
    email: string;
    profilePictureUrl?: string;
  };
  sellerResponse?: {
    text: string;
    respondedAt: string;
  };
}

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";
type ResponseFilter = "all" | "replied" | "pending";

const RATING_FILTERS: { value: RatingFilter; label: string }[] = [
  { value: "all", label: "All Stars" },
  { value: "5", label: "★ 5" },
  { value: "4", label: "★ 4" },
  { value: "3", label: "★ 3" },
  { value: "2", label: "★ 2" },
  { value: "1", label: "★ 1" },
];

const RESPONSE_FILTERS: { value: ResponseFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Needs Reply" },
  { value: "replied", label: "Replied" },
];

/* ─── Star row ─── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={
            s <= rating
              ? "fill-[#FFA41C] text-[#FFA41C]"
              : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
          }
        />
      ))}
    </div>
  );
}

/* ─── Pill button ─── */
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/65 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Main Page ─── */
export default function SellerReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>("all");

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Build query params ── */
  const buildParams = useCallback(
    (page: number) => {
      const p = new URLSearchParams({ page: String(page), limit: "10" });
      if (ratingFilter !== "all") p.set("rating", ratingFilter);
      if (responseFilter === "replied") p.set("hasResponse", "true");
      if (responseFilter === "pending") p.set("hasResponse", "false");
      if (debouncedSearch) p.set("search", debouncedSearch);
      return p.toString();
    },
    [ratingFilter, responseFilter, debouncedSearch]
  );

  /* ── Fetch (reset) ── */
  const fetchReviews = useCallback(
    async (page = 1, append = false) => {
      try {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        const res = await api.get(`/seller/reviews?${buildParams(page)}`);
        const incoming: Review[] = res.data.reviews || [];
        const pag = res.data.pagination || {};

        setReviews((prev) => (append ? [...prev, ...incoming] : incoming));
        setCurrentPage(pag.page || page);
        setHasNextPage(pag.hasNextPage ?? false);
        setTotal(pag.total || 0);
      } catch {
        toast.error("Failed to load reviews");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams]
  );

  /* ── Re-fetch when filters change ── */
  useEffect(() => {
    setReviews([]);
    setCurrentPage(1);
    fetchReviews(1, false);
  }, [ratingFilter, responseFilter, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Infinite scroll observer ── */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !loadingMore &&
          !loading
        ) {
          fetchReviews(currentPage + 1, true);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, loading, currentPage, fetchReviews]);

  /* ── Reply ── */
  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await api.post(`/reviews/${reviewId}/response`, { text: replyText });
      toast.success("Response posted");
      setReplyingTo(null);
      setReplyText("");
      // Optimistically update locally
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                sellerResponse: {
                  text: replyText,
                  respondedAt: new Date().toISOString(),
                },
              }
            : r
        )
      );
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to post response");
    } finally {
      setSubmittingReply(false);
    }
  };

  /* ── Clear all filters ── */
  const hasActiveFilters =
    ratingFilter !== "all" || responseFilter !== "all" || debouncedSearch;

  const clearFilters = () => {
    setSearch("");
    setRatingFilter("all");
    setResponseFilter("all");
  };

  /* ─────────── Render ─────────── */
  return (
    <div className="min-h-screen bg-slate-50 pb-28 dark:bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_36%),linear-gradient(180deg,#030712_0%,#111827_100%)]">
      <PageHeader
        title="Customer Reviews"
        subtitle={total > 0 ? `${total} review${total !== 1 ? "s" : ""}` : "No reviews yet"}
        backHref="/dashboard/seller"
        backLabel="Dashboard"
      />

      <div className="mx-auto mt-4 max-w-5xl px-4 sm:px-6 space-y-4">

        {/* ── Search bar ── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews by comment or title..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Filter pills — single scrollable row ── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {RESPONSE_FILTERS.map((f) => (
            <Pill
              key={f.value}
              active={responseFilter === f.value}
              onClick={() => setResponseFilter(f.value)}
            >
              {f.label}
            </Pill>
          ))}

          {/* Divider */}
          <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-1" />

          {RATING_FILTERS.map((f) => (
            <Pill
              key={f.value}
              active={ratingFilter === f.value}
              onClick={() => setRatingFilter(f.value)}
            >
              {f.label}
            </Pill>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl border border-slate-200 bg-white/80 animate-pulse dark:border-white/10 dark:bg-white/5"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, -2, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-100/50 dark:shadow-none"
            >
              <MessageCircle className="h-9 w-9 text-slate-400 dark:text-white/40" />
            </motion.div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {hasActiveFilters ? "No Reviews Found" : "No Reviews Yet"}
            </h3>
            <p className="text-slate-500 dark:text-white/50 text-sm max-w-xs leading-relaxed">
              {hasActiveFilters
                ? "Try adjusting your filters or search query."
                : "When buyers leave reviews on your products, they will appear here."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-5 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold dark:bg-white dark:text-slate-900 hover:opacity-90 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                replyingTo={replyingTo}
                replyText={replyText}
                submittingReply={submittingReply}
                onStartReply={(id) => { setReplyingTo(id); setReplyText(""); }}
                onCancelReply={() => { setReplyingTo(null); setReplyText(""); }}
                onReplyChange={setReplyText}
                onReplySubmit={handleReplySubmit}
                onImageClick={setSelectedImage}
              />
            ))}
          </div>
        )}

        {/* ── Infinite scroll sentinel ── */}
        <div ref={sentinelRef} className="h-10 w-full" />

        {loadingMore && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        )}
      </div>

      {/* ── Image preview modal ── */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  );
}

/* ─── Review Card ─── */
function ReviewCard({
  review,
  replyingTo,
  replyText,
  submittingReply,
  onStartReply,
  onCancelReply,
  onReplyChange,
  onReplySubmit,
  onImageClick,
}: {
  review: Review;
  replyingTo: string | null;
  replyText: string;
  submittingReply: boolean;
  onStartReply: (id: string) => void;
  onCancelReply: () => void;
  onReplyChange: (v: string) => void;
  onReplySubmit: (id: string) => void;
  onImageClick: (url: string) => void;
}) {
  const isReplying = replyingTo === review._id;
  const hasReplied = !!review.sellerResponse?.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-slate-200 bg-white/90 dark:border-white/[0.07] dark:bg-white/[0.04] shadow-sm backdrop-blur-sm overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        {/* ── Header row: product + buyer ── */}
        <div className="flex gap-3 mb-3">
          {/* Product thumbnail */}
          <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-slate-100 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            {review.productId?.thumbnailUrl ? (
              <img
                src={review.productId.thumbnailUrl}
                alt={review.productId.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <FileText className="w-5 h-5 text-slate-400 dark:text-white/20" />
            )}
          </div>

          {/* Product + buyer info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate leading-tight">
              {review.productId?.title || "Deleted Product"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {/* Buyer avatar */}
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {review.buyerId?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-white/70 truncate">
                {review.buyerId?.name}
              </span>
              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0">
                Buyer
              </span>
            </div>
          </div>

          {/* Right: stars + date */}
          <div className="shrink-0 text-right">
            <Stars rating={review.rating} />
            <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">
              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* ── Review content ── */}
        {review.title && (
          <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            {review.title}
          </p>
        )}
        <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
          {review.comment}
        </p>

        {/* ── Images ── */}
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mt-3">
            {review.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Review image ${idx + 1}`}
                className="w-14 h-14 rounded-xl object-cover cursor-pointer border border-slate-200 dark:border-white/10 hover:opacity-80 active:scale-95 transition"
                onClick={() => onImageClick(img)}
              />
            ))}
          </div>
        )}

        {/* ── Seller response ── */}
        {hasReplied ? (
          <div className="mt-3 bg-indigo-50 dark:bg-indigo-500/[0.08] border-l-2 border-indigo-400 pl-3 pr-3 py-2.5 rounded-r-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <MessageCircle size={10} />
                Your Response
              </span>
              <span className="text-[9px] text-slate-400 dark:text-white/30">
                {new Date(review.sellerResponse!.respondedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-white/60 leading-relaxed">
              {review.sellerResponse!.text}
            </p>
          </div>
        ) : isReplying ? (
          <div className="mt-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl p-3">
            <textarea
              value={replyText}
              onChange={(e) => onReplyChange(e.target.value)}
              placeholder="Write a public response to this review..."
              className="w-full bg-white dark:bg-[#0A101D] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={onCancelReply}
                className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onReplySubmit(review._id)}
                disabled={submittingReply || !replyText.trim()}
                className="px-4 py-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingReply ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Send size={10} />
                )}
                Post Reply
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onStartReply(review._id)}
            className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1.5 transition"
          >
            <MessageCircle size={12} />
            Reply to Buyer
          </button>
        )}
      </div>
    </motion.div>
  );
}
