"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { getStoredUser, clearAuthStorage } from "@/lib/cookies";

/* ================= TYPES ================= */

interface SellerDeletionRequest {
  _id: string;
  name: string;
  email: string;
  deletionRequestReason: string;
  deletionRequestDate: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

/* ================= PAGE ================= */

export default function SellerDeletionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<SellerDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SellerDeletionRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored) {
      router.push("/login");
      return;
    }

    if (stored.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setUser(stored);
    fetchRequests();
  }, [router]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getPendingSellerDeletions();
      setRequests(data || []);
    } catch (error: any) {
      console.error("Failed to fetch seller deletion requests:", error);
      showError("Failed to load deletion requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId: string) => {
    if (!confirm("Are you sure you want to approve this seller account deletion? This action cannot be undone.")) {
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.approveSellerDeletion(sellerId);
      showSuccess("Seller account deletion approved");
      setRequests((prev) => prev.filter((r) => r._id !== sellerId));
    } catch (error: any) {
      console.error("Failed to approve deletion:", error);
      showError(error.response?.data?.message || "Failed to approve deletion");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason || rejectionReason.trim().length < 3) {
      showError("Please provide a rejection reason (min 3 characters)");
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.rejectSellerDeletion(selectedRequest._id, rejectionReason.trim());
      showSuccess("Seller deletion request rejected");
      setRequests((prev) => prev.filter((r) => r._id !== selectedRequest._id));
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
    } catch (error: any) {
      console.error("Failed to reject deletion:", error);
      showError(error.response?.data?.message || "Failed to reject deletion");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const logout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  if (!user)
    return (
      <div className="w-full h-screen bg-linear-to-br from-[#0b0b14] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b0b14] to-[#1a1a2e]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-[#0b0b14]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Seller Account Deletions</h1>
            <p className="text-sm text-white/60">Review and manage seller deletion requests</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/admin")}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30"
          >
            <div className="text-sm text-orange-300">Pending Deletion Requests</div>
            <div className="text-3xl font-bold text-orange-400">{requests.length}</div>
          </motion.div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          <AnimatePresence>
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-white/60"
              >
                Loading deletion requests...
              </motion.div>
            ) : requests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-white/60"
              >
                No pending seller deletion requests
              </motion.div>
            ) : (
              requests.map((request, index) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-xl border-l-4 border-l-orange-500 bg-white/5 border-b border-r border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">🗑️</span>
                        <div>
                          <h3 className="text-xl font-bold text-white">{request.name}</h3>
                          <p className="text-sm text-white/60">{request.email}</p>
                          <p className="text-xs text-white/50 mt-1">
                            Requested: {formatDate(request.deletionRequestDate)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/10 p-4 rounded-lg border border-white/10 mb-4">
                        <p className="text-sm font-semibold text-white/80 mb-2">Reason for deletion:</p>
                        <p className="text-sm text-white/70 whitespace-pre-wrap">
                          {request.deletionRequestReason}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(request._id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition disabled:opacity-50 font-semibold"
                        title="Approve deletion"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition disabled:opacity-50 font-semibold"
                        title="Reject deletion"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowRejectModal(false);
              setSelectedRequest(null);
              setRejectionReason("");
            }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b0b14] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Reject Deletion Request</h2>
              <p className="text-white/70 mb-4">
                Rejecting deletion request for <strong>{selectedRequest.name}</strong>
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
                  placeholder="Explain why you're rejecting this deletion request (min 3 characters)"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {actionLoading ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
