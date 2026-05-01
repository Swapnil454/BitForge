"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import ReviewModal from "../components/ReviewModal";
import PageHeader from "../transactions/components/PageHeader";
import PurchaseCard from "./components/PurchaseCard";
import PurchaseCardSkeleton from "./components/PurchaseCardSkeleton";
import PurchasesEmptyState from "./components/PurchasesEmptyState";
import PurchasesPagination from "./components/PurchasesPagination";
import RaiseDisputeModal from "./components/RaiseDisputeModal";
import { Purchase, PurchasePagination } from "./types";

const PAGE_SIZE = 7;

const defaultPagination: PurchasePagination = {
  page: 1,
  limit: PAGE_SIZE,
  totalRecords: 0,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false,
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PurchasePagination>(defaultPagination);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Purchase | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedDisputePurchase, setSelectedDisputePurchase] = useState<Purchase | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const router = useRouter();
  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) {
      router.push("/login");
      return;
    }

    if (parsed.role !== "buyer") {
      router.push("/dashboard");
      return;
    }

    void fetchPurchases(1, false);
  }, [router]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (headerMenuRef.current && !headerMenuRef.current.contains(target)) {
        setHeaderMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchPurchases = async (targetPage: number, backgroundLoad = true) => {
    if (backgroundLoad) {
      setPageLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await buyerAPI.getAllPurchases({
        page: targetPage,
        limit: PAGE_SIZE,
        sortBy: "newest",
      });

      setPurchases(data.purchases || []);
      setPagination(data.pagination || defaultPagination);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load purchases");
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const handlePageChange = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === page ||
      pageLoading
    ) {
      return;
    }

    setPage(nextPage);
    void fetchPurchases(nextPage, true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const download = async (orderId: string) => {
    const loadingToast = toast.loading("Preparing secure download...");
    setDownloadingOrderId(orderId);

    try {
      const response = await api.get(`/download/${orderId}`, {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const contentDisposition = response.headers["content-disposition"];
      let filename = "download.pdf";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"|filename=([^;\s]+)/);
        if (filenameMatch) {
          filename = filenameMatch[1] || filenameMatch[2];
        }
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
      await fetchPurchases(page, true);
    } catch (error: any) {
      toast.dismiss(loadingToast);

      if (error.response?.status === 404) {
        toast.error("This file is no longer available. Please contact support.");
      } else if (
        error.response?.status === 403 &&
        error.response?.data?.downloadLimit
      ) {
        toast.error(`Download limit reached (${error.response.data.downloadLimit}).`);
      } else {
        toast.error(error.response?.data?.message || error.message || "Download failed");
      }
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const openDisputeModal = (purchase: Purchase) => {
    setSelectedDisputePurchase(purchase);
    setDisputeModalOpen(true);
  };

  // Removed the full screen loading block in favor of skeletons

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
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
              className="h-10 w-10 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 inline-flex items-center justify-center transition"
              aria-label="Open actions"
            >
              <MoreVertical className="h-5 w-5 text-white/80" />
            </button>

            <AnimatePresence>
              {headerMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 top-11 w-52 rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-xl shadow-black/40"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      router.push("/marketplace");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition"
                  >
                    Browse Marketplace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      router.push("/dashboard/buyer/disputes");
                    }}
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

      <main className="max-w-5xl mx-auto px-4 pt-4 pb-8 space-y-4">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <PurchaseCardSkeleton key={i} />)
        ) : purchases.length === 0 ? (
          <PurchasesEmptyState />
        ) : (
          <>
            {purchases.map((purchase) => (
              <PurchaseCard
                key={purchase._id}
                purchase={purchase}
                downloading={downloadingOrderId === purchase._id}
                onDownload={download}
                onReview={(item) => {
                  setSelectedOrder(item);
                  setReviewModalOpen(true);
                }}
                onViewProduct={(productId) => {
                  if (!productId) return;
                  router.push(`/marketplace/${productId}`);
                }}
                onRaiseDispute={(orderId) => {
                  const p = purchases.find((x) => x._id === orderId);
                  if (p) openDisputeModal(p);
                }}
              />
            ))}

            <PurchasesPagination
              pagination={pagination}
              loading={pageLoading}
              onChangePage={handlePageChange}
            />
          </>
        )}
      </main>

      {selectedOrder && selectedOrder.productId && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedOrder(null);
          }}
          productId={selectedOrder.productId}
          productTitle={selectedOrder.productName}
          orderId={selectedOrder._id}
          onReviewSubmitted={() => {
            toast.success("Thank you for your review!");
          }}
        />
      )}

      {selectedDisputePurchase && (
        <RaiseDisputeModal
          isOpen={disputeModalOpen}
          onClose={() => {
            setDisputeModalOpen(false);
            setSelectedDisputePurchase(null);
          }}
          orderId={selectedDisputePurchase._id}
          orderNumber={selectedDisputePurchase.orderId.slice(-8).toUpperCase()}
          productName={selectedDisputePurchase.productName}
          onSuccess={() => {
            toast.success("Dispute submitted successfully!");
            void fetchPurchases(page, true);
          }}
        />
      )}
    </div>
  );
}
