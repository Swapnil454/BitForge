


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import { Wallet, IndianRupee, ArrowUpRight, Clock, X, CheckCircle2 } from "lucide-react";
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
        subtitle="Manage your earnings and request payouts"
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 hover:border-slate-300 dark:hover:border-zinc-500 transition-colors shadow-sm dark:shadow-none">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-300" /> Total Earnings
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">₹{data?.totalEarnings?.toLocaleString() || 0}</p>
          </motion.div>

          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 hover:border-orange-500/30 transition-colors shadow-sm dark:shadow-none">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-orange-500" /> Withdrawn
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">₹{data?.withdrawn?.toLocaleString() || 0}</p>
          </motion.div>

          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-200 dark:border-cyan-500/20 rounded-xl p-5 hover:border-cyan-300 dark:hover:border-cyan-500/40 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.05)]">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400/80 mb-1.5 flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Available Balance
            </p>
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">₹{data?.availableBalance?.toLocaleString() || 0}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* REQUEST WITHDRAWAL */}
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} className="bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col shadow-sm dark:shadow-none">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Request Withdrawal</h2>
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-2">
                    Withdrawal Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] px-5 py-4 text-xl font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 placeholder:font-normal hover:border-slate-300 dark:hover:border-zinc-600 focus:bg-white dark:focus:bg-[#1f1f22] focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:focus:ring-cyan-500/50 transition-all shadow-sm"
                    disabled={withdrawing}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm px-1">
                  <span className="text-slate-500 dark:text-zinc-500 font-medium">Available to withdraw:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">₹{data?.availableBalance?.toLocaleString() || 0}</span>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !data?.availableBalance || data.availableBalance <= 0}
                  className="w-full mt-2 flex justify-center items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#05050a] px-6 py-3.5 text-base font-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-500 disabled:hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  <Wallet className="w-5 h-5" />
                  {withdrawing ? "Processing..." : "Request Withdrawal"}
                </button>
              </div>
            </div>

            {data?.pendingWithdrawals ? (
              <div className="mt-8 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold tracking-wide text-amber-600 dark:text-amber-500">Pending Withdrawals</h4>
                  <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mt-1 leading-relaxed">
                    You have <span className="font-bold text-amber-600 dark:text-amber-400">₹{data.pendingWithdrawals.toLocaleString()}</span> in pending withdrawals waiting for approval.
                  </p>
                </div>
              </div>
            ) : null}
          </motion.div>

          {/* PENDING PAYOUTS */}
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.4}} className="bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col shadow-sm dark:shadow-none">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Pending Requests</h2>
            
            {data?.pendingPayouts && data.pendingPayouts.length > 0 ? (
              <div className="space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {data.pendingPayouts.map((payout) => (
                  <div
                    key={payout._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#27272a] hover:border-slate-300 dark:hover:border-white/10 transition-colors group shadow-sm dark:shadow-none"
                  >
                    <div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        ₹{payout.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1.5 flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
                        Requested {new Date(payout.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelPayout(payout._id)}
                      disabled={cancelling === payout._id}
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" strokeWidth={3} />
                      {cancelling === payout._id ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-[#27272a] rounded-2xl bg-slate-50 dark:bg-[#18181b]/50">
                <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-sm dark:shadow-none">
                  <CheckCircle2 className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                </div>
                <p className="text-lg text-slate-700 dark:text-zinc-300 font-bold">No pending requests</p>
                <p className="text-sm text-slate-500 dark:text-zinc-500 mt-2 max-w-[250px]">Your withdrawal history is clear. Request a payout to see it here.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
