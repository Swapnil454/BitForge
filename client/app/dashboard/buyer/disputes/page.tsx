"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { buyerAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import toast from "react-hot-toast";

interface BuyerDispute {
  _id: string;
  orderId: string | null;
  productName: string;
  sellerName: string;
  amount: number;
  reason: string;
  status: string;
  adminNote: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  approved: "bg-green-500/20 text-green-300 border-green-500/40",
  rejected: "bg-red-500/20 text-red-300 border-red-500/40",
};

export default function BuyerDisputesPage() {
  const [disputes, setDisputes] = useState<BuyerDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser<{ role?: string }>();
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "buyer") {
      router.push("/dashboard");
      return;
    }
    fetchDisputes();
  }, [router]);

  const fetchDisputes = async () => {
    try {
      const data = await buyerAPI.getMyDisputes();
      setDisputes(data.disputes || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string) => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20 backdrop-blur-md border-b border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/buyer")}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 flex items-center justify-center transition-all hover:scale-105"
            aria-label="Back to dashboard"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Disputes</h1>
            <p className="text-white/70 text-sm md:text-base">Track the status of disputes you have raised</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {disputes.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">No disputes</h2>
            <p className="text-white/60">You have not raised any disputes yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((d) => (
              <motion.div
                key={d._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-5 flex flex-col md:flex-row md:items-stretch gap-4"
              >
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        "px-3 py-1 text-xs rounded-full border font-semibold uppercase tracking-wide " +
                        (statusColors[d.status] || "bg-white/10 text-white/70 border-white/20")
                      }
                    >
                      {d.status}
                    </span>
                    {d.orderId && (
                      <span className="text-xs text-white/50">Order #{d.orderId}</span>
                    )}
                    <span className="text-xs text-white/40">Filed {formatDate(d.createdAt)}</span>
                  </div>

                  <h2 className="text-lg font-semibold truncate">{d.productName}</h2>
                  <p className="text-sm text-white/70">Seller: {d.sellerName}</p>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white/80">
                    <span className="font-semibold text-white">Your reason: </span>
                    {d.reason}
                  </div>

                  {d.adminNote && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
                      <span className="font-semibold text-white">Admin note: </span>
                      {d.adminNote}
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col justify-between md:justify-center items-end md:items-end gap-3 min-w-[150px]">
                  <div className="text-right">
                    <p className="text-xs text-white/50 mb-1">Disputed amount</p>
                    <p className="text-xl font-bold text-emerald-400">₹{d.amount.toLocaleString()}</p>
                  </div>
                  {d.orderId && (
                    <button
                      onClick={() => router.push(`/dashboard/buyer/transactions/${d.orderId}`)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition"
                    >
                      View Order
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
