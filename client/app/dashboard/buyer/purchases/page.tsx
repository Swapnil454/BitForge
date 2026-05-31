"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MoreVertical, AlertTriangle } from "lucide-react";
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
      
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const data = JSON.parse(text);
        if (data.mode === "redirect" && data.downloadUrl) {
          window.location.href = data.downloadUrl;
          toast.dismiss(loadingToast);
          toast.success("Redirecting to secure download...");
          void fetchPage(1, true);
          return;
        }
      }

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

      // When responseType is "blob", Axios wraps the error body as a Blob.
      // We must read it back to text and parse JSON before checking the fields.
      let errData: any = error.response?.data;
      if (errData && typeof errData.text === 'function') {
        try {
          const text = await errData.text();
          try {
            errData = JSON.parse(text);
          } catch {
            console.error("Failed to parse JSON from blob, raw text:", text);
            errData = { message: text.substring(0, 100) + (text.length > 100 ? "..." : "") };
          }
        } catch {
          errData = error.response?.data;
        }
      } else if (errData && errData instanceof Blob) {
        // Fallback for older browsers using FileReader
        try {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(errData);
          });
          try {
            errData = JSON.parse(text);
          } catch {
            console.error("Failed to parse JSON from FileReader, raw text:", text);
            errData = { message: text.substring(0, 100) + (text.length > 100 ? "..." : "") };
          }
        } catch {
          errData = error.response?.data;
        }
      } else if (typeof errData === 'string') {
        try {
           errData = JSON.parse(errData);
        } catch {
           errData = { message: errData };
        }
      }

      if (error.response?.status === 404) {
        toast.error("This file is no longer available. Please contact support.");
      } else if (error.response?.status === 403 && errData?.downloadLimit) {
        const limit = errData.downloadLimit;
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-sm w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-amber-200 dark:border-amber-500/30 flex items-start gap-3 p-4`}
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">
                  Download Limit Reached
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  You&apos;ve used all {limit} downloads for this product.
                  Contact support if you need more access.
                </p>
                <button
                  onClick={() => { toast.dismiss(t.id); window.open("/dashboard/support", "_blank"); }}
                  className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Contact Support →
                </button>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-white transition text-lg leading-none"
              >
                ×
              </button>
            </div>
          ),
          { duration: 6000 }
        );
      } else {
        toast.error(errData?.message || error.message || "Download failed");
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
        subtitle="Order History & Downloads"
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
                  className="absolute right-0 top-11 w-52 rounded-xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-xl shadow-black/5 dark:shadow-black/40 z-20"
                >
                  <button
                    type="button"
                    onClick={() => { setHeaderMenuOpen(false); router.push("/marketplace"); }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-white/85 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
                  >
                    Browse Marketplace
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeaderMenuOpen(false); router.push("/dashboard/buyer/disputes"); }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-white/85 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
                  >
                    View My Disputes
                  </button>

                  <button
                    type="button"
                    onClick={() => { setHeaderMenuOpen(false); router.push("/dashboard/buyer/purchases/analytics"); }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-white/85 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
                  >
                    View Purchase Analytics
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
