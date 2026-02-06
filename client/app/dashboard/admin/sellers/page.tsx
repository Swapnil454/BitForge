"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";

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

export default function PendingSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectType, setRejectType] = useState<"approval" | "deletion">("approval");
  const router = useRouter();

  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) {
      router.push("/login");
      return;
    }

    if (parsed.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchSellers();
  }, [router]);

  const fetchSellers = async () => {
    try {
      const [pendingSellers, pendingDeletions] = await Promise.all([
        adminAPI.getPendingSellers(),
        adminAPI.getPendingSellerDeletions()
      ]);
      setSellers(pendingSellers || []);
      setDeletionRequests(pendingDeletions || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load sellers");
    } finally {
      setLoading(false);
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

  const handleReject = async (seller: Seller, type: "approval" | "deletion") => {
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
    if (!confirm("Are you sure you want to approve this seller account deletion? This action cannot be undone.")) {
      return;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading sellers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2"
          >
            <span>←</span> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Seller Management</h1>
          <p className="text-white/60 mt-2">Review seller applications and deletion requests</p>
        </div>

        {/* Deletion Requests Section */}
        {deletionRequests.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-2xl font-bold text-orange-400">🗑️ Account Deletion Requests</h2>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
                {deletionRequests.length}
              </span>
            </div>
            <div className="grid gap-4">
              {deletionRequests.map((seller) => (
                <div key={seller._id} className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{seller.name}</h3>
                      <p className="text-white/70">{seller.email}</p>
                      {seller.phone && <p className="text-white/70">{seller.phone}</p>}
                      <p className="text-sm text-white/50 mt-2">
                        Requested: {seller.deletionRequestDate ? new Date(seller.deletionRequestDate).toLocaleDateString() : 'N/A'}
                      </p>
                      {seller.deletionRequestReason && (
                        <div className="mt-3 bg-white/10 p-3 rounded-lg border border-white/10">
                          <p className="text-sm font-semibold text-white/80 mb-1">Reason for deletion:</p>
                          <p className="text-sm text-white/70">{seller.deletionRequestReason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApproveDeletion(seller._id)}
                        disabled={processing === seller._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold"
                      >
                        {processing === seller._id ? "Processing..." : "✓ Approve"}
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
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-2xl font-bold">📝 New Seller Applications</h2>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
              {sellers.length}
            </span>
          </div>
          {sellers.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
              <p className="text-white/60">No pending seller applications</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sellers.map((seller) => (
                <div key={seller._id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">{seller.name}</h3>
                      <p className="text-white/70">{seller.email}</p>
                      {seller.phone && <p className="text-white/70">{seller.phone}</p>}
                      <p className="text-sm text-white/50 mt-2">
                        Applied: {new Date(seller.createdAt).toLocaleDateString()}
                      </p>
                      <span className="inline-block px-3 py-1 mt-2 text-sm rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        {seller.approvalStatus}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(seller._id)}
                        disabled={processing === seller._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        {processing === seller._id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(seller, "approval")}
                        disabled={processing === seller._id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
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
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center mt-8">
            <p className="text-white/60">No pending requests</p>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && selectedSeller && (
          <div
            onClick={() => {
              setShowRejectModal(false);
              setSelectedSeller(null);
              setRejectionReason("");
            }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b0b14] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Reject {rejectType === "approval" ? "Seller Application" : "Deletion Request"}
              </h2>
              <p className="text-white/70 mb-4">
                Rejecting {rejectType === "approval" ? "application" : "deletion request"} for <strong>{selectedSeller.name}</strong>
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:outline-none resize-none"
                  placeholder="Explain why you're rejecting this request"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedSeller(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={processing === selectedSeller._id}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {processing === selectedSeller._id ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
