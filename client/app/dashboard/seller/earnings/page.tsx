"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import { Wallet, IndianRupee, ArrowUpRight, Clock, X, CheckCircle2, Landmark, Image as ImageIcon, Check, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";

interface PayoutRecord {
  _id: string;
  amount: number;
  requestedAt: string;
  status: string;
  utrNumber?: string;
  paymentDate?: string;
  paymentMode?: string;
  proofImageUrl?: string;
  rejectionReasons?: string[];
  rejectionMessage?: string;
}

interface EarningsData {
  totalEarnings: number;
  withdrawn: number;
  availableBalance: number;
  pendingWithdrawals: number;
  pendingPayouts: PayoutRecord[];
  payoutHistory?: PayoutRecord[];
  bankAccount?: {
    bankName: string;
    accountNumber: string;
  } | null;
}

export default function SellerEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  
  const [payoutToCancel, setPayoutToCancel] = useState<string | null>(null);

  // Tab for requests box
  const [tab, setTab] = useState<"pending" | "history">("pending");

  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const parsed = getStoredUser<any>();
    if (!parsed) return router.push("/login");
    if (parsed.role !== "seller") return router.push("/dashboard");
    setUser(parsed);
    fetchEarnings();
  }, [router]);

  const isApproved = user?.approvalStatus === "approved" || Boolean(user?.isApproved);

  const fetchEarnings = async () => {
    const cacheKey = "seller_earnings_data";
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }
    } catch (e) {
      setLoading(true);
    }

    try {
      const response = await sellerAPI.getEarnings();
      setData(response);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(response));
      } catch (e) {}
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) return toast.error("Please enter a valid amount");
    if (withdrawAmount > (data?.availableBalance || 0)) return toast.error("Insufficient balance");

    setWithdrawing(true);
    try {
      await sellerAPI.requestWithdrawal(withdrawAmount);
      toast.success("Withdrawal request submitted successfully");
      setAmount("");
      fetchEarnings();
      setTab("pending");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to request withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleCancelPayout = (payoutId: string) => {
    setPayoutToCancel(payoutId);
  };

  const confirmCancelPayout = async () => {
    if (!payoutToCancel) return;
    const payoutId = payoutToCancel;
    setPayoutToCancel(null);
    setCancelling(payoutId);
    try {
      await sellerAPI.cancelPayoutRequest(payoutId);
      toast.success("Withdrawal request cancelled successfully");
      fetchEarnings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel withdrawal");
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
        <PageHeader backHref="/dashboard/seller" backLabel="Dashboard" title="Earnings & Withdrawals" />
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse" />
            <div className="h-72 bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Earnings & Withdrawals"
        subtitle="Manage your earnings and payouts"
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        {/* STATS GRID */}
        <div className="flex flex-col gap-4 lg:gap-5">
          {/* Available Balance */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-800 rounded-[24px] p-5 lg:p-6 shadow-[0_8px_30px_rgba(6,182,212,0.2)] dark:shadow-[0_8px_30px_rgba(6,182,212,0.1)] relative overflow-hidden group text-white w-full">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
              <Wallet className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 shrink-0 rounded-full bg-white/20 flex items-center justify-center border border-white/20 backdrop-blur-md">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-50 mb-0.5">Available Balance</p>
                <p className="text-3xl font-black text-white">₹{data?.availableBalance?.toLocaleString() || 0}</p>
              </div>
            </div>
          </motion.div>

          {/* Total Earnings & Withdrawn */}
          <div className="grid grid-cols-2 gap-4 lg:gap-5">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[20px] p-4 lg:p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-none relative overflow-hidden group flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-[0.03] dark:opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 pointer-events-none">
                <IndianRupee className="w-16 h-16 text-slate-900 dark:text-white" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200/50 dark:border-white/10">
                  <IndianRupee className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Total Earnings</p>
                  <p className="text-lg lg:text-xl font-black text-slate-900 dark:text-white mt-0.5 truncate">₹{data?.totalEarnings?.toLocaleString() || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[20px] p-4 lg:p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-none relative overflow-hidden group flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 pointer-events-none">
                <ArrowUpRight className="w-16 h-16 text-orange-500" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 shrink-0 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center border border-orange-100 dark:border-orange-500/20">
                  <ArrowUpRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Withdrawn</p>
                  <p className="text-lg lg:text-xl font-black text-slate-900 dark:text-white mt-0.5 truncate">₹{data?.withdrawn?.toLocaleString() || 0}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          
          {/* REQUEST WITHDRAWAL */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] p-5 lg:p-6 flex flex-col shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-none sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                 <IndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Payout</h2>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {!isApproved ? (
                <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 rounded-2xl p-6 text-center shadow-sm">
                  <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Verification Required</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                    You must verify your identity before you can request payouts.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/seller/verify-identity")}
                    className="w-full px-5 py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
                  >
                    Verify Identity
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 ml-1">
                      Amount to withdraw
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-bold text-lg">₹</span>
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-[16px] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 pl-10 pr-5 py-4 text-xl font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 hover:border-slate-300 dark:hover:border-white/20 focus:bg-white dark:focus:bg-black/60 focus:border-cyan-500 dark:focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-sm"
                        disabled={withdrawing}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing || !data?.availableBalance || data.availableBalance <= 0}
                    className="w-full mt-2 flex justify-center items-center gap-2 rounded-[16px] bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 hover:from-cyan-500 hover:via-cyan-400 hover:to-cyan-300 text-slate-950 px-6 py-4 text-base font-black transition-all shadow-[0_8px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_10px_25px_rgba(6,182,212,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-cyan-400 disabled:hover:-translate-y-0 disabled:hover:shadow-[0_8px_20px_rgba(6,182,212,0.3)] relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-[16px]" />
                    <span className="relative z-10 flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      {withdrawing ? "Processing..." : "Submit Request"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {data?.pendingWithdrawals ? (
              <div className="mt-5 flex items-start gap-3 p-3 lg:p-4 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 rounded-[16px]">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold tracking-wide text-amber-600 dark:text-amber-500">Pending Funds</h4>
                  <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-0.5 leading-relaxed">
                    You have <span className="font-bold text-amber-600 dark:text-amber-400">₹{data.pendingWithdrawals.toLocaleString()}</span> in processing withdrawals.
                  </p>
                </div>
              </div>
            ) : null}
          </motion.div>

          {/* REQUESTS LIST */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] p-5 lg:p-6 flex flex-col shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-none min-h-[400px]">
            
            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-black/40 p-1 rounded-xl mb-6">
              <button onClick={() => setTab("pending")} className={`flex-1 py-2 text-xs font-black tracking-widest uppercase rounded-lg transition-all ${tab === 'pending' ? 'bg-white dark:bg-[#1c1c24] text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}>
                Pending ({data?.pendingPayouts?.length || 0})
              </button>
              <button onClick={() => setTab("history")} className={`flex-1 py-2 text-xs font-black tracking-widest uppercase rounded-lg transition-all ${tab === 'history' ? 'bg-white dark:bg-[#1c1c24] text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}>
                History
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
              {tab === "pending" ? (
                /* PENDING VIEW */
                data?.pendingPayouts && data.pendingPayouts.length > 0 ? (
                  data.pendingPayouts.map((payout) => (
                    <div key={payout._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-black/20 rounded-[16px] border border-slate-200/80 dark:border-white/5 shadow-sm dark:shadow-none">
                      <div>
                        <p className="text-xl font-black text-slate-900 dark:text-white">
                          ₹{payout.amount.toLocaleString()}
                        </p>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 flex items-center flex-wrap gap-1.5 font-medium">
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(payout.requestedAt).toLocaleDateString()}
                          </span>
                          {data?.bankAccount && (
                            <span className="flex items-center gap-1.5 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-white/5 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-white/5 ml-1">
                              <Landmark className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
                              {data.bankAccount.bankName} (•••• {data.bankAccount.accountNumber.slice(-4)})
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelPayout(payout._id)}
                        disabled={cancelling === payout._id}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 rounded-[10px] text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {cancelling === payout._id ? "Cancelling..." : "Cancel"}
                      </button>
                    </div>
                  ))
                ) : (
                  <EmptyState message="No pending payouts" subtitle="When you request a payout, its status will appear here." />
                )
              ) : (
                /* HISTORY VIEW */
                data?.payoutHistory && data.payoutHistory.length > 0 ? (
                  data.payoutHistory.map((payout) => (
                    <div key={payout._id} className="p-4 bg-white dark:bg-black/20 rounded-[16px] border border-slate-200/80 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                      
                      {/* Top Row: Amount & Badge */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xl font-black text-slate-900 dark:text-white">
                            ₹{payout.amount.toLocaleString()}
                          </p>
                          <p className="text-[12px] text-slate-500 mt-1">
                            Req: {new Date(payout.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                          payout.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {payout.status}
                        </span>
                      </div>

                      {/* Bottom Info Area */}
                      {payout.status === 'paid' ? (
                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-xs space-y-1.5">
                          <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className="font-semibold text-slate-700 dark:text-white/80">{payout.paymentMode || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">UTR / Ref Number</span><span className="font-mono text-slate-700 dark:text-white/80">{payout.utrNumber || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Processed</span><span className="text-slate-700 dark:text-white/80">{payout.paymentDate ? new Date(payout.paymentDate).toLocaleDateString() : 'N/A'}</span></div>
                          {payout.proofImageUrl && (
                            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-white/10">
                              <a href={payout.proofImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">
                                <ImageIcon className="w-3.5 h-3.5" /> View Payment Proof
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10 rounded-xl p-3 text-xs">
                          <p className="font-bold text-red-600 dark:text-red-400 mb-1">Reason for Rejection</p>
                          <p className="text-red-700/80 dark:text-red-400/80">{payout.rejectionReasons?.join(", ") || 'No specific reason provided'}</p>
                          {payout.rejectionMessage && (
                            <p className="mt-2 pt-2 border-t border-red-200/50 dark:border-red-500/20 text-red-700/90 dark:text-red-300">
                              "{payout.rejectionMessage}"
                            </p>
                          )}
                        </div>
                      )}

                    </div>
                  ))
                ) : (
                  <EmptyState message="No payout history" subtitle="Your processed payouts will appear here." />
                )
              )}
            </div>

          </motion.div>
        </div>
      </section>

      {/* CANCEL CONFIRMATION MODAL */}
      {payoutToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-[#0b0b14] w-full max-w-sm rounded-[24px] p-6 shadow-2xl border border-slate-200 dark:border-white/10"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20 mb-4">
              <X className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cancel Withdrawal?</h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to cancel this withdrawal request? The funds will be returned to your available balance.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPayoutToCancel(null)}
                className="flex-1 px-4 py-2.5 rounded-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={confirmCancelPayout}
                className="flex-1 px-4 py-2.5 rounded-[12px] font-bold text-white bg-red-600 hover:bg-red-700 shadow-[0_4px_12px_rgba(220,38,38,0.3)] transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

function EmptyState({ message, subtitle }: { message: string, subtitle: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[20px] bg-slate-50/50 dark:bg-white/[0.02]">
      <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-sm dark:shadow-none">
        <CheckCircle2 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-lg text-slate-700 dark:text-slate-300 font-bold">{message}</p>
      <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-[250px]">{subtitle}</p>
    </div>
  );
}
