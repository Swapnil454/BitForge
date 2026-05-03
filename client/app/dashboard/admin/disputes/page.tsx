"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import { RefreshCw, Loader2 } from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

interface Dispute {
  _id: string;
  orderId: string;
  buyerName: string;
  sellerName: string;
  productName: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
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
    fetchDisputes();
  }, [router]);

  const fetchDisputes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await adminAPI.getOpenDisputes();
      setDisputes(data.disputes || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load disputes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveRefund = async (disputeId: string) => {
    if (!confirm("Approve refund for this dispute?")) return;
    setProcessing(disputeId);
    try {
      await adminAPI.approveRefund(disputeId);
      toast.success("Refund approved");
      fetchDisputes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve refund");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (disputeId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    setProcessing(disputeId);
    try {
      await adminAPI.rejectDispute(disputeId, reason);
      toast.success("Dispute rejected");
      fetchDisputes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject dispute");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a]">
        <div className="h-16 w-full border-b border-white/[0.05] bg-[#0a0a0f]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#16161e] border border-white/[0.05] rounded-2xl p-6">
              <div className="flex justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex gap-3">
                    <div className="h-6 w-16 bg-white/[0.04] rounded-full" />
                    <div className="h-6 w-40 bg-white/[0.03] rounded-lg" />
                  </div>
                  <div className="h-5 w-48 bg-white/[0.04] rounded-lg" />
                  <div className="h-14 w-full bg-white/[0.02] rounded-xl" />
                  <div className="h-4 w-32 bg-white/[0.03] rounded-md" />
                </div>
                <div className="flex flex-col gap-2 w-36">
                  <div className="h-10 w-full bg-white/[0.04] rounded-xl" />
                  <div className="h-10 w-full bg-white/[0.04] rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Back"
        title="Open Disputes"
        subtitle="Review and resolve customer disputes"
        rightSlot={
          <button
            onClick={() => fetchDisputes(true)}
            disabled={refreshing}
            className="h-9 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Empty State */}
        {disputes.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-white/70">No open disputes</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {disputes.map(dispute => (
              <div
                key={dispute._id}
                className="bg-[#16161e] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all"
              >
                {/* Top meta row */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-red-500/10 border border-red-400/20 text-red-400">
                    {dispute.status}
                  </span>
                  <span className="text-[10px] text-white/25 font-medium truncate">
                    Order #{dispute.orderId}
                  </span>
                </div>

                {/* Product name */}
                <h3 className="text-base font-bold mb-3 text-white/90">
                  {dispute.productName}
                </h3>

                {/* Buyer / Seller */}
                <div className="flex gap-6 text-xs text-white/50 mb-4">
                  <span>Buyer: <span className="text-white/80 font-semibold">{dispute.buyerName}</span></span>
                  <span>Seller: <span className="text-white/80 font-semibold">{dispute.sellerName}</span></span>
                </div>

                {/* Reason box */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="font-bold text-white/80">Reason: </span>
                    {dispute.reason}
                  </p>
                </div>

                {/* Footer row: amount + date + actions */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-emerald-400">
                      ₹{dispute.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/25 font-medium">
                      Filed {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveRefund(dispute._id)}
                      disabled={processing === dispute._id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition disabled:opacity-50"
                    >
                      {processing === dispute._id ? "Processing..." : "Approve Refund"}
                    </button>
                    <button
                      onClick={() => handleReject(dispute._id)}
                      disabled={processing === dispute._id}
                      className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-600/20 border border-white/[0.05] hover:border-rose-500/30 text-white/50 hover:text-rose-400 text-xs font-black uppercase tracking-widest transition disabled:opacity-50"
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
    </div>
  );
}
