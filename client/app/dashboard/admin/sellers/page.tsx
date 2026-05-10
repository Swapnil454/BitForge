"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Loader2 } from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

interface Seller {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  approvalStatus: string;
  createdAt: string;
  deletionRequestStatus?: string;
  deletionRequestReason?: string;
  deletionRequestDate?: string;
}

// --- Skeleton ---
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a]">
      <div className="h-16 w-full border-b border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-[#0a0a0f]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Section title */}
        <div className="h-5 w-48 bg-white dark:bg-[#16161e] rounded-xl animate-pulse" />
        {/* Cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 animate-pulse space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-white/[0.04] rounded-lg" />
                <div className="h-3 w-56 bg-slate-100 dark:bg-white/[0.03] rounded-md" />
                <div className="h-3 w-32 bg-slate-100 dark:bg-white/[0.03] rounded-md" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-white/[0.04] rounded-lg" />
                <div className="h-9 w-20 bg-white/[0.04] rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectType, setRejectType] = useState<"approval" | "deletion">("approval");
  const router = useRouter();

  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) { router.push("/login"); return; }
    if (parsed.role !== "admin") { router.push("/dashboard"); return; }
    fetchSellers();
  }, [router]);

  const fetchSellers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [pendingSellers, pendingDeletions] = await Promise.all([
        adminAPI.getPendingSellers(),
        adminAPI.getPendingSellerDeletions(),
      ]);
      setSellers(pendingSellers || []);
      setDeletionRequests(pendingDeletions || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load sellers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await adminAPI.approveSeller(id);
      toast.success("Seller approved successfully");
      fetchSellers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve seller");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (seller: Seller, type: "approval" | "deletion") => {
    setSelectedSeller(seller);
    setRejectType(type);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedSeller || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessing(selectedSeller._id);
    try {
      if (rejectType === "approval") {
        await adminAPI.rejectSeller(selectedSeller._id, rejectionReason.trim());
        toast.success("Seller application rejected");
      } else {
        await adminAPI.rejectSellerDeletion(selectedSeller._id, rejectionReason.trim());
        toast.success("Seller deletion request rejected");
      }
      setShowRejectModal(false);
      setSelectedSeller(null);
      setRejectionReason("");
      fetchSellers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveDeletion = async (id: string) => {
    if (!confirm("Are you sure you want to approve this seller account deletion? This action cannot be undone.")) return;
    setProcessing(id);
    try {
      await adminAPI.approveSellerDeletion(id);
      toast.success("Seller account deletion approved");
      fetchSellers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve deletion");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Back"
        title="Seller Management"
        subtitle="Review applications and deletion requests"
        rightSlot={
          <button
            onClick={() => fetchSellers(true)}
            disabled={refreshing}
            className="h-9 px-4 rounded-xl bg-slate-200/50 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] text-slate-900 dark:text-white text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto p-6">

        {/* Deletion Requests Section */}
        {deletionRequests.length > 0 && (
          <div className="mb-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/20 mb-1">Pending Review</p>
                <h2 className="text-lg font-black text-orange-600 dark:text-orange-400 flex items-center gap-2">🗑️ Account Deletion Requests
                  <span className="px-2.5 py-0.5 bg-orange-500/15 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black border border-orange-500/20">
                    {deletionRequests.length}
                  </span>
                </h2>
              </div>
            </div>
            <div className="grid gap-4">
              {deletionRequests.map((seller) => (
                <div key={seller._id} className="bg-orange-500/[0.06] border border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/30 transition-all">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{seller.name}</h3>
                      <p className="text-slate-600 dark:text-white/70">{seller.email}</p>
                      {seller.phone && <p className="text-slate-600 dark:text-white/70">{seller.phone}</p>}
                      <p className="text-sm text-slate-400 dark:text-white/50 mt-2">
                        Requested: {seller.deletionRequestDate ? new Date(seller.deletionRequestDate).toLocaleDateString() : "N/A"}
                      </p>
                      {seller.deletionRequestReason && (
                        <div className="mt-3 bg-slate-200 dark:bg-white/10 p-3 rounded-lg border border-slate-200 dark:border-white/10">
                          <p className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-1">Reason for deletion:</p>
                          <p className="text-sm text-slate-600 dark:text-white/70">{seller.deletionRequestReason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 sm:ml-4 shrink-0">
                      <button
                        onClick={() => handleApproveDeletion(seller._id)}
                        disabled={processing === seller._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold flex items-center gap-2"
                      >
                        {processing === seller._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "✓"} Approve
                      </button>
                      <button
                        onClick={() => handleReject(seller, "deletion")}
                        disabled={processing === seller._id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-semibold"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Seller Applications Section */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white/20 mb-1">Applications</p>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">New Seller Applications
                <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-full text-xs font-black border border-purple-500/20">
                  {sellers.length}
                </span>
              </h2>
            </div>
          </div>
          {sellers.length === 0 ? (
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-8 text-center">
              <p className="text-slate-500 dark:text-white/60">No pending seller applications</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sellers.map((seller) => (
                <div key={seller._id} className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 hover:border-slate-300 dark:hover:border-white/10 transition-all">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{seller.name}</h3>
                      <p className="text-slate-600 dark:text-white/70">{seller.email}</p>
                      {seller.phone && <p className="text-slate-600 dark:text-white/70">{seller.phone}</p>}
                      <p className="text-sm text-slate-400 dark:text-white/50 mt-2">
                        Applied: {new Date(seller.createdAt).toLocaleDateString()}
                      </p>
                      <span className="inline-block px-3 py-1 mt-2 text-sm rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-black uppercase tracking-widest text-[10px]">
                        {seller.approvalStatus}
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(seller._id)}
                        disabled={processing === seller._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2 font-semibold"
                      >
                        {processing === seller._id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(seller, "approval")}
                        disabled={processing === seller._id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {sellers.length === 0 && deletionRequests.length === 0 && (
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-8 text-center mt-8">
            <p className="text-slate-500 dark:text-white/60">No pending requests</p>
          </div>
        )}

        {/* Rejection Modal */}
        <AnimatePresence>
          {showRejectModal && selectedSeller && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowRejectModal(false); setSelectedSeller(null); setRejectionReason(""); }}
              className="fixed inset-0 bg-white dark:bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Reject {rejectType === "approval" ? "Seller Application" : "Deletion Request"}
                </h2>
                <p className="text-slate-600 dark:text-white/70 mb-4">
                  Rejecting {rejectType === "approval" ? "application" : "deletion request"} for <strong>{selectedSeller.name}</strong>
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 focus:border-red-500 focus:outline-none resize-none"
                    placeholder="Explain why you're rejecting this request"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowRejectModal(false); setSelectedSeller(null); setRejectionReason(""); }}
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg transition font-semibold border border-slate-200 dark:border-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReject}
                    disabled={processing === selectedSeller._id}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                  >
                    {processing === selectedSeller._id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Confirm Reject
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
