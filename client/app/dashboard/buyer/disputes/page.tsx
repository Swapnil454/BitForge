"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { buyerAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import toast from "react-hot-toast";
import PageHeader from "../transactions/components/PageHeader";
import { AlertCircle, ShieldAlert, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

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

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case "open":
      return {
        icon: AlertCircle,
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
        stripe: "bg-amber-500",
      };
    case "approved":
      return {
        icon: CheckCircle2,
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        stripe: "bg-emerald-500",
      };
    case "rejected":
      return {
        icon: XCircle,
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/20",
        stripe: "bg-rose-500",
      };
    default:
      return {
        icon: ShieldAlert,
        bg: "bg-slate-200 dark:bg-white/10",
        text: "text-slate-300",
        border: "border-slate-300 dark:border-white/20",
        stripe: "bg-slate-500",
      };
  }
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
    return d.toLocaleString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
        {/* Skeleton Header matching PageHeader */}
        <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-linear-to-r from-black via-slate-950 to-black/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="relative flex min-h-[58px] items-center justify-center">
              <div className="absolute left-0 flex items-center gap-2 opacity-50">
                <div className="h-8 w-8 rounded-md bg-slate-200 dark:bg-white/10 animate-pulse" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-white/10 rounded animate-pulse hidden sm:block" />
              </div>

              <div className="px-16 text-center space-y-2 flex flex-col items-center opacity-50">
                <div className="h-6 w-40 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-32 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#08111d] rounded-xl border border-slate-200 dark:border-white/5 p-4 sm:p-5 pl-5 sm:pl-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 dark:bg-white/5 animate-pulse" />
              
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="flex-1 space-y-3">
                  {/* Top row */}
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                  </div>
                  {/* Title */}
                  <div className="h-5 w-3/4 max-w-[200px] bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                  {/* Subtitle */}
                  <div className="h-3 w-1/2 max-w-[150px] bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                </div>
                {/* Amount */}
                <div className="flex flex-col items-end space-y-2">
                  <div className="h-6 w-20 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                </div>
              </div>

              {/* Reason line */}
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex justify-center">
                <div className="h-9 w-32 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <PageHeader
        backLabel="Back"
        title="My Disputes"
        subtitle="Track the status of disputes you have raised"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        {disputes.length === 0 ? (
          <div className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-3xl p-10 sm:p-12 text-center max-w-lg mx-auto shadow-2xl mt-12 sm:mt-24">
            <ShieldAlert className="w-16 h-16 text-slate-700 mx-auto mb-6" />
            <h2 className="text-xl font-bold tracking-tight mb-2">No disputes</h2>
            <p className="text-slate-400 text-sm">You have not raised any disputes yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4 max-w-3xl mx-auto">
            {disputes.map((d) => {
              const config = getStatusConfig(d.status);
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={d._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden relative group hover:border-slate-200 dark:hover:border-white/10 transition-all shadow-xl p-4 sm:p-5 pl-5 sm:pl-6"
                >
                  {/* Left accent stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.stripe}`} />

                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-transparent ${config.text} border ${config.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {d.status}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDate(d.createdAt)}
                        </span>
                      </div>
                      
                      <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight leading-tight mb-1 truncate">
                        {d.productName}
                      </h2>
                      <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                        {d.orderId && <span className="font-mono">Order #{d.orderId.substring(0, 8)} • </span>}
                        <span className="text-slate-300 font-medium">{d.sellerName}</span>
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">₹{d.amount.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Disputed</p>
                    </div>
                  </div>

                  {/* Reason & Notes */}
                  <div className="mt-3.5 text-[11px] sm:text-xs leading-relaxed space-y-1.5">
                    <p className="text-slate-300">
                      <span className="text-slate-500 font-semibold mr-1.5">Reason:</span>
                      {d.reason}
                    </p>

                    {d.adminNote && (
                      <p className="text-amber-200/90">
                        <span className="text-amber-500/70 font-semibold mr-1.5">Admin:</span>
                        {d.adminNote}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex justify-center">
                    {d.orderId && (
                      <button
                        onClick={() => router.push(`/dashboard/buyer/purchases/${d.orderId}`)}
                        className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" /> View Order
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
