"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import { RefreshCw, Package, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

import ToolbarRow from "./components/ToolbarRow";
import ProductModerationCard from "./components/ProductModerationCard";
import ProductModerationModal from "./components/ProductModerationModal";
import RejectReasonModal from "./components/RejectReasonModal";
import RequestChangesModal from "./components/RequestChangesModal";
import { ModerationProduct } from "@/types/moderation";

// Helper mapper until backend sends exact structure
const mapToModerationProduct = (p: any): ModerationProduct => ({
  id: p._id,
  title: p.title || 'Untitled Product',
  description: p.description || '',
  category: p.category || 'other',
  fileType: p.fileType || 'zip',
  fileCount: p.files?.length || 1,
  thumbnail: p.thumbnailUrl || p.images?.[0] || undefined,
  price: p.price || 0,
  discountPercent: p.discount || 0,
  finalPrice: p.discount ? Number((p.price - (p.price * (p.discount / 100))).toFixed(2)) : (p.price || 0),
  status: p.status || 'pending',
  uploadedAt: p.createdAt || new Date().toISOString(),
  seller: {
    id: p.sellerId?._id || p.seller?._id || 'unknown',
    name: p.sellerId?.name || p.seller?.name || 'Unknown Seller',
    email: p.sellerId?.email || p.seller?.email || 'unknown@example.com',
    emailVerified: p.sellerId?.isVerified ?? p.seller?.emailVerified ?? true,
    totalProducts: p.sellerId?.totalProducts ?? p.seller?.sellerStats?.totalProducts ?? 0,
    approvedProducts: p.sellerId?.approvedProducts ?? p.seller?.sellerStats?.approvedProducts ?? 0,
    rejectedProducts: p.sellerId?.rejectedProducts ?? p.seller?.sellerStats?.rejectedProducts ?? 0,
    disputes: p.sellerId?.disputes ?? p.seller?.sellerStats?.disputes ?? 0,
    status: p.sellerId?.status || p.seller?.status || 'active',
    joinedAt: p.sellerId?.createdAt || p.seller?.joinedAt || new Date().toISOString(),
  },
  history: p.moderationHistory || [
    { action: 'Submitted by seller', timestamp: p.createdAt || new Date().toISOString() }
  ]
});

export default function AdminProductsPage() {
  const router = useRouter();

  // Core data state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState<ModerationProduct[]>([]);
  const [changes, setChanges] = useState<ModerationProduct[]>([]);
  const [approvedTodayCount, setApprovedTodayCount] = useState(0);
  const [rejectedTodayCount, setRejectedTodayCount] = useState(0);
  const [approvedList, setApprovedList] = useState<ModerationProduct[]>([]);
  const [rejectedList, setRejectedList] = useState<ModerationProduct[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'new' | 'changes' | 'approved' | 'rejected'>('new');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'price_high' | 'price_low'>('newest');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<ModerationProduct | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ModerationProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [requestChangesModalOpen, setRequestChangesModalOpen] = useState(false);

  useEffect(() => {
    const user = getStoredUser<{ role?: string }>();
    if (!user || user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    loadAll(false, 1);
  }, [search, categoryFilter, sortOrder]);

  const loadAll = async (isRefresh = false, pageNum = 1) => {
    if (pageNum > 1) {
      setLoadingMore(true);
    } else if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // API calls
      const pendingRes = await adminAPI.getPendingProducts({ 
        page: pageNum, 
        limit: 20, 
        search, 
        category: categoryFilter, 
        sort: sortOrder 
      });
      const changesRes = await adminAPI.getPendingProductChanges();
      
      const statsRes = await adminAPI.getProductStats();

      const pendingMapped = (Array.isArray(pendingRes) ? pendingRes : pendingRes.products || []).map(mapToModerationProduct);
      const changesMapped = (Array.isArray(changesRes) ? changesRes : changesRes.products || []).map(mapToModerationProduct);

      if (pageNum > 1) {
        setPending(prev => [...prev, ...pendingMapped]);
      } else {
        setPending(pendingMapped);
      }
      
      setHasMore(pendingMapped.length === 20 && pageNum < (pendingRes.totalPages || Infinity));
      setPage(pageNum);

      setChanges(changesMapped);
      
      // Real counts from backend stats API
      setApprovedTodayCount(statsRes.approvedToday || 0);
      setRejectedTodayCount(statsRes.rejectedToday || 0);

      // Note: approvedList and rejectedList are cleared out here since pagination wasn't built yet,
      // and we just wanted counts for the stats. We leave them empty to focus the UI on moderation tabs.
      setApprovedList([]);
      setRejectedList([]);

    } catch (error) {
      toast.error("Failed to fetch product data");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleApprove = async (product: ModerationProduct, note: string) => {
    try {
      await adminAPI.approveProduct(product.id, note);
      toast.success("Product approved successfully!");
      setModalOpen(false);
      loadAll(true);
    } catch (error) {
      toast.error("Failed to approve product");
    }
  };

  const handleRejectSubmit = async (reasons: string[], note: string) => {
    if (!rejectTarget) return;
    try {
      await adminAPI.rejectProduct(rejectTarget.id, reasons, note);
      toast.success("Product rejected");
      setRejectModalOpen(false);
      setModalOpen(false);
      loadAll(true);
    } catch (error) {
      toast.error("Failed to reject product");
    }
  };

  const openReject = (product: ModerationProduct) => {
    setRejectTarget(product);
    setRejectModalOpen(true);
  };

  const openRequestChanges = (product: ModerationProduct) => {
    setRejectTarget(product); // Reusing rejectTarget to pass into the modal
    setRequestChangesModalOpen(true);
  };

  const handleRequestChangesSubmit = async (reasons: string[], note: string) => {
    if (!rejectTarget) return;
    try {
      await adminAPI.requestProductChanges(rejectTarget.id, reasons, note);
      toast.success("Changes requested successfully");
      setRequestChangesModalOpen(false);
      setModalOpen(false);
      loadAll(true);
    } catch (error) {
      toast.error("Failed to request changes");
    }
  };

  const openReviewDetails = (product: ModerationProduct) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  // Determine current list to render
  const getCurrentList = () => {
    let list = pending;
    if (activeTab === 'changes') list = changes;
    if (activeTab === 'approved') list = approvedList;
    if (activeTab === 'rejected') list = rejectedList;

    // Filter
    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.seller.email.toLowerCase().includes(q));
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      if (sortOrder === 'price_high') return b.finalPrice - a.finalPrice;
      if (sortOrder === 'price_low') return a.finalPrice - b.finalPrice;
      return 0;
    });
  };

  const displayList = getCurrentList();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Back"
        title="Product Moderation"
        subtitle="Review uploads, pricing, compliance"
        // rightSlot={
        //   <button
        //     onClick={() => loadAll(true)}
        //     disabled={refreshing}
        //     className="h-9 px-4 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-all disabled:opacity-50 text-sm font-semibold text-slate-700 dark:text-white/80"
        //   >
        //     <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        //     Refresh
        //   </button>
        // }
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        


        {/* TOOLBAR ROW */}
        <ToolbarRow 
          search={search} setSearch={setSearch}
          categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
        />

        {/* TABS */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(['new', 'changes', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap rounded-xl transition-all shadow-sm ${
                activeTab === tab
                  ? "bg-slate-200 text-slate-800 border border-slate-300 shadow-sm hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 dark:bg-slate-700/90 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-200 dark:hover:border-blue-700"
                  : "bg-white dark:bg-[#16161e] text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10"
              }`}
            >
              {tab === 'new' && `New Products (${pending.length})`}
              {tab === 'changes' && `Pending Changes (${changes.length})`}
              {tab === 'approved' && `Approved (${approvedList.length})`}
              {tab === 'rejected' && `Rejected (${rejectedList.length})`}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No products pending review</h3>
              <p className="text-slate-500 dark:text-white/60">All submitted products have been reviewed. New seller uploads will appear here.</p>
            </div>
          ) : (
            <>
              {displayList.map(product => (
                <ProductModerationCard
                  key={product.id}
                  product={product}
                  onPreview={() => window.open(`/dashboard/seller/products/${product.id}`, '_blank')}
                  onReviewDetails={() => openReviewDetails(product)}
                  onRejectClick={() => openReject(product)}
                />
              ))}

              {activeTab === 'new' && hasMore && (
                <div className="pt-4 pb-8 flex justify-center">
                  <button
                    onClick={() => loadAll(false, page + 1)}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    {loadingMore && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* MODALS */}
      <ProductModerationModal
        isOpen={modalOpen}
        product={selectedProduct}
        onClose={() => setModalOpen(false)}
        onApprove={handleApprove}
        onRejectClick={() => {
          openReject(selectedProduct!);
        }}
        onRequestChangesClick={() => {
          openRequestChanges(selectedProduct!);
        }}
      />

      <RejectReasonModal
        isOpen={rejectModalOpen}
        productName={rejectTarget?.title || ""}
        onClose={() => setRejectModalOpen(false)}
        onReject={handleRejectSubmit}
      />

      <RequestChangesModal
        isOpen={requestChangesModalOpen}
        product={rejectTarget}
        onClose={() => setRequestChangesModalOpen(false)}
        onSubmit={handleRequestChangesSubmit}
      />
    </main>
  );
}
