"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MoreVertical } from "lucide-react";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import ReviewModal from "../components/ReviewModal";
import PageHeader from "../transactions/components/PageHeader";
import PurchaseCard from "./components/PurchaseCard";
import PurchaseCardSkeleton from "./components/PurchaseCardSkeleton";
import PurchasesEmptyState from "./components/PurchasesEmptyState";
import RaiseDisputeModal from "./components/RaiseDisputeModal";
import { Purchase } from "./types";
import MobileBottomNav from "@/app/components/buyer/layout/MobileBottomNav";

const PAGE_SIZE = 7;

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Purchase | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedDisputePurchase, setSelectedDisputePurchase] = useState<Purchase | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  const router = useRouter();
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false); // prevents duplicate fetches

  // ─── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) { router.push("/login"); return; }
    if (parsed.role !== "buyer") { router.push("/dashboard"); return; }
    void fetchPage(1, true);
  }, [router]);

  // ─── Header menu outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ─── Fetch a single page ─────────────────────────────────────────────────────
  const fetchPage = async (targetPage: number, isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await buyerAPI.getAllPurchases({
        page: targetPage,
        limit: PAGE_SIZE,
        sortBy: "newest",
      });

      const incoming: Purchase[] = data.purchases || [];
      const pag = data.pagination;

      setPurchases((prev) => (isInitial ? incoming : [...prev, ...incoming]));
      setHasNextPage(pag?.hasNextPage ?? false);
      setPage(targetPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load purchases");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  // ─── IntersectionObserver for infinite scroll ────────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore && !loading) {
          void fetchPage(page + 1, false);
        }
      },
      { rootMargin: "200px" } // trigger 200 px before the sentinel reaches the viewport
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, loading, page]);

  // ─── Download ────────────────────────────────────────────────────────────────
  const download = useCallback(async (orderId: string) => {
    const loadingToast = toast.loading("Preparing secure download...");
    setDownloadingOrderId(orderId);

    try {
      const response = await api.get(`/download/${orderId}`, { responseType: "blob" });

      const contentType = response.headers["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const contentDisposition = response.headers["content-disposition"];
      let filename = "download.pdf";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"|filename=([^;\s]+)/);
        if (match) filename = match[1] || match[2];
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success("Download started successfully");

      // Refresh the current visible list in-place (don't reset scroll)
      void fetchPage(1, true);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      if (error.response?.status === 404) {
        toast.error("This file is no longer available. Please contact support.");
      } else if (error.response?.status === 403 && error.response?.data?.downloadLimit) {
        toast.error(`Download limit reached (${error.response.data.downloadLimit}).`);
      } else {
        toast.error(error.response?.data?.message || error.message || "Download failed");
      }
    } finally {
      setDownloadingOrderId(null);
    }
  }, []);

  const openDisputeModal = (purchase: Purchase) => {
    setSelectedDisputePurchase(purchase);
    setDisputeModalOpen(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/buyer"
        backLabel="Dashboard"
        title="My Purchases"
        subtitle="View your order history, downloads and disputes"
        rightSlot={
          <div className="relative shrink-0" ref={headerMenuRef}>
            <button
              type="button"
              onClick={() => setHeaderMenuOpen((prev) => !prev)}
              className="h-10 w-10 rounded-xl border border-white/15 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 hover:border-white/30 inline-flex items-center justify-center transition"
              aria-label="Open actions"
            >
              <MoreVertical className="h-5 w-5 text-slate-700 dark:text-white/80" />
            </button>

            <AnimatePresence>
              {headerMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 top-11 w-52 rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-xl shadow-black/40 z-20"
                >
                  <button
                    type="button"
                    onClick={() => { setHeaderMenuOpen(false); router.push("/marketplace"); }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition"
                  >
                    Browse Marketplace
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeaderMenuOpen(false); router.push("/dashboard/buyer/disputes"); }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition"
                  >
                    View My Disputes
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      <main className="max-w-5xl mx-auto px-4 pt-4 pb-28 md:pb-12 space-y-4">
        {/* Initial skeleton */}
        {loading ? (
          Array.from({ length: PAGE_SIZE }).map((_, i) => <PurchaseCardSkeleton key={i} />)
        ) : purchases.length === 0 ? (
          <PurchasesEmptyState />
        ) : (
          <>
            <AnimatePresence initial={false}>
              {purchases.map((purchase, idx) => (
                <motion.div
                  key={purchase._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(idx * 0.04, 0.3) }}
                >
                  <PurchaseCard
                    purchase={purchase}
                    downloading={downloadingOrderId === purchase._id}
                    onDownload={download}
                    onReview={(item) => { setSelectedOrder(item); setReviewModalOpen(true); }}
                    onViewProduct={(productId) => { if (productId) router.push(`/marketplace/${productId}`); }}
                    onRaiseDispute={(orderId) => {
                      const p = purchases.find((x) => x._id === orderId);
                      if (p) openDisputeModal(p);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {/* Loading more spinner */}
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-2 text-slate-500 dark:text-white/40 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                  <span>Loading more purchases...</span>
                </div>
              </div>
            )}

            {/* End of list indicator */}
            {!hasNextPage && !loadingMore && purchases.length > 0 && (
              <p className="text-center text-xs text-slate-400 dark:text-white/25 py-4 tracking-wide">
                — You've reached the end —
              </p>
            )}
          </>
        )}
      </main>

      {/* Review Modal */}
      {selectedOrder && selectedOrder.productId && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => { setReviewModalOpen(false); setSelectedOrder(null); }}
          productId={selectedOrder.productId}
          productTitle={selectedOrder.productName}
          orderId={selectedOrder._id}
          onReviewSubmitted={() => { toast.success("Thank you for your review!"); }}
        />
      )}

      {/* Dispute Modal */}
      {selectedDisputePurchase && (
        <RaiseDisputeModal
          isOpen={disputeModalOpen}
          onClose={() => { setDisputeModalOpen(false); setSelectedDisputePurchase(null); }}
          orderId={selectedDisputePurchase._id}
          orderNumber={selectedDisputePurchase.orderId.slice(-8).toUpperCase()}
          productName={selectedDisputePurchase.productName}
          onSuccess={() => {
            toast.success("Dispute submitted successfully!");
            void fetchPage(1, true);
          }}
        />
      )}
      <MobileBottomNav />
    </div>
  );
}
