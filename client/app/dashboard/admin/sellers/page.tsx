"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Loader2, Search, Eye, Check, X, Calendar, Mail, Clock } from "lucide-react";
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
        <div className="h-5 w-48 bg-white dark:bg-[#16161e] rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 animate-pulse space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-slate-100 dark:bg-white/[0.04] rounded-lg" />
                <div className="h-3 w-56 bg-slate-100 dark:bg-white/[0.03] rounded-md" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-slate-100 dark:bg-white/[0.04] rounded-lg" />
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
  const [searchQuery, setSearchQuery] = useState("");
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

  const getInitials = (name: string) => {
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "S";
  };

  const filteredSellers = sellers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">

        {/* Deletion Requests Section */}
        {deletionRequests.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-2">
                Account Deletions
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 rounded-md">
                  {deletionRequests.length}
                </span>
              </h2>
            </div>
            <div className="grid gap-4">
              {deletionRequests.map((seller) => (
                <div key={seller._id} className="bg-orange-50/50 dark:bg-[#1a1a24] border border-orange-200/60 dark:border-orange-500/20 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-orange-300 dark:hover:border-orange-500/40 transition-all shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5">
                  <div className="flex items-start sm:items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                      {getInitials(seller.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">{seller.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-white/50 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Mail className="w-3.5 h-3.5" /> {seller.email}
                      </p>
                      {seller.deletionRequestReason && (
                        <div className="mt-3 bg-white dark:bg-white/5 border border-orange-100 dark:border-white/10 rounded-xl p-3 inline-block shadow-sm">
                          <p className="text-xs font-medium text-orange-800 dark:text-orange-300">
                            <span className="font-bold">Reason:</span> {seller.deletionRequestReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-orange-100 dark:border-white/5">
                    <button
                      onClick={() => handleApproveDeletion(seller._id)}
                      disabled={processing === seller._id}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/20 text-sm font-semibold transition-all shadow-sm hover:shadow"
                    >
                      {processing === seller._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve Deletion
                    </button>
                    <button
                      onClick={() => handleReject(seller, "deletion")}
                      disabled={processing === seller._id}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 text-sm font-semibold transition-all shadow-sm hover:shadow"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Seller Applications Section */}
        <div>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest flex items-center gap-2">
              New Applications
            </h2>
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 dark:group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Search sellers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white dark:bg-[#16161e] border border-slate-200/80 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10 focus:border-slate-300 dark:focus:border-white/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {filteredSellers.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a24] border border-slate-200/60 dark:border-white/[0.08] rounded-3xl p-12 text-center text-slate-500 dark:text-white/40 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)]">
              <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-white/5">
                 <Search className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-white/70 text-lg">No pending applications found</p>
              <p className="text-sm mt-1">Check back later for new seller registrations.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSellers.map((seller) => (
                <div key={seller._id} className="group bg-white dark:bg-[#1a1a24] border border-slate-200/60 dark:border-white/[0.08] rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                      {getInitials(seller.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">{seller.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-white/50 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Mail className="w-3.5 h-3.5" /> {seller.email}
                      </p>
                      <div className="flex items-center gap-3 mt-2.5 text-[11px] sm:text-xs font-semibold">
                        <span className="flex items-center gap-1 text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/5">
                          <Calendar className="w-3.5 h-3.5" />
                          Applied {new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 rounded-lg flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          {seller.approvalStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2.5 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-white/5">
                    <button 
                      onClick={() => router.push(`/dashboard/admin/users/${seller._id}`)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 text-sm font-semibold text-slate-700 dark:text-white/80 transition-all shadow-sm hover:shadow"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button 
                      onClick={() => handleApprove(seller._id)}
                      disabled={processing === seller._id}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-emerald-500/10 border border-slate-200/80 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:border-emerald-200 dark:hover:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold transition-all shadow-sm hover:shadow"
                    >
                      {processing === seller._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(seller, "approval")}
                      disabled={processing === seller._id}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-rose-500/10 border border-slate-200/80 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:border-rose-200 dark:hover:border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-semibold transition-all shadow-sm hover:shadow"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-8 pb-4 text-center text-xs font-medium text-slate-400 dark:text-white/30 flex items-center justify-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Last refreshed just now &middot; Data updates every 15 minutes
        </div>

        {/* Rejection Modal */}
        <AnimatePresence>
          {showRejectModal && selectedSeller && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowRejectModal(false); setSelectedSeller(null); setRejectionReason(""); }}
              className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Reject {rejectType === "approval" ? "Application" : "Deletion Request"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Rejecting {rejectType === "approval" ? "application" : "deletion request"} for <strong>{selectedSeller.name}</strong>
                </p>
                <div className="mb-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50 mb-2">Rejection Reason <span className="text-rose-500">*</span></label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                    placeholder="Explain why you're rejecting this..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowRejectModal(false); setSelectedSeller(null); setRejectionReason(""); }}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReject}
                    disabled={processing === selectedSeller._id}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
