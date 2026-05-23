


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import { Wallet, IndianRupee, ArrowUpRight, Clock, X, CheckCircle2, Landmark } from "lucide-react";
import { motion } from "framer-motion";

interface EarningsData {
  totalEarnings: number;
  withdrawn: number;
  availableBalance: number;
  pendingWithdrawals: number;
  pendingPayouts: Array<{
    _id: string;
    amount: number;
    requestedAt: string;
    status: string;
  }>;
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
  const router = useRouter();

  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) {
      router.push("/login");
      return;
    }

    if (parsed.role !== "seller") {
      router.push("/dashboard");
      return;
    }

    fetchEarnings();
  }, [router]);

  const fetchEarnings = async () => {
    try {
      const response = await sellerAPI.getEarnings();
      setData(response);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (withdrawAmount > (data?.availableBalance || 0)) {
      toast.error("Insufficient balance");
      return;
    }

    setWithdrawing(true);
    try {
      await sellerAPI.requestWithdrawal(withdrawAmount);
      toast.success("Withdrawal request submitted successfully");
      setAmount("");
      fetchEarnings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to request withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleCancelPayout = async (payoutId: string) => {
    if (!confirm("Are you sure you want to cancel this withdrawal request?")) {
      return;
    }

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
        <PageHeader
          backHref="/dashboard/seller"
          backLabel="Dashboard"
          title="Earnings & Withdrawals"
        />
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse shadow-sm dark:shadow-none" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse shadow-sm dark:shadow-none" />
            <div className="h-72 bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse shadow-sm dark:shadow-none" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Earnings & Withdrawals"
        subtitle="your earnings and request payouts"
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        {/* STATS GRID */}
        <div className="flex flex-col gap-4 lg:gap-5">
          {/* Top Row: Available Balance */}
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

          {/* Bottom Row: Total Earnings & Withdrawn */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* REQUEST WITHDRAWAL */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] p-5 lg:p-6 flex flex-col shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                 <IndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Payout</h2>
            </div>

            <div className="flex-1 flex flex-col justify-center">
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

          {/* PENDING PAYOUTS */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] p-5 lg:p-6 flex flex-col shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200/50 dark:border-white/10">
                 <Clock className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Requests</h2>
            </div>

            {data?.pendingPayouts && data.pendingPayouts.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {data.pendingPayouts.map((payout) => (
                  <div
                    key={payout._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-black/20 rounded-[16px] border border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors group shadow-sm dark:shadow-none"
                  >
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
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[20px] bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-sm dark:shadow-none">
                  <CheckCircle2 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-300 font-bold">No active requests</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-[250px]">When you request a payout, its status will appear here.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
