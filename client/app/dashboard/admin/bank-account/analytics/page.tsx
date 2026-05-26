"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2,
  ChevronLeft,
  Banknote,
  TrendingUp,
  Percent,
  Wallet,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import api from "@/lib/api";

ChartJS.register(ArcElement, CategoryScale, LinearScale, Tooltip);

interface BankStats {
  totalPaymentArrived: number;
  totalActualPayment: number;
  totalGST: number;
  totalBuyerCommission: number;
  totalSellerCommission: number;
  totalCommissionEarned: number;
  totalPayoutsMade: number;
  totalClaimableBySellers: number;
  netBalance: number;
}

export default function BankAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BankStats | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/bank-stats");
      setStats(res.data.stats);
    } catch (error) {
      toast.error("Failed to load bank analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (value: number) =>
    `₹${(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const donutData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ["Seller Commission (10%)", "Buyer Commission (2%)", "GST (5%)"],
      datasets: [
        {
          data: [stats.totalSellerCommission, stats.totalBuyerCommission, stats.totalGST],
          backgroundColor: ["#06b6d4", "#3b82f6", "#8b5cf6"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  }, [stats]);

  const donutOptions = useMemo(
    () => ({
      cutout: "70%",
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
    }),
    []
  );

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-white/60">
           <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
           <p className="text-sm font-medium">Loading bank analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0b0b12]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white absolute left-1/2 -translate-x-1/2">
              Bank Account Analytics
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* HERO STAT: NET PLATFORM BALANCE */}
        <section>
          <div className="rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-400 shadow-xl shadow-sky-500/20 p-5 sm:p-6 relative overflow-hidden group border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/30 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-300/40 rounded-full blur-2xl -ml-10 -mb-10"></div>
            <div className="flex items-center gap-3 mb-2 sm:mb-4 relative z-10">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/10">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/90">
                  Net Platform Balance
                </p>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white relative z-10 drop-shadow-sm">
              {formatCurrency(stats.netBalance)}
            </h2>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-sky-50 relative z-10 drop-shadow-sm">
              Current holding balance (Payments - Payouts)
            </p>
          </div>
        </section>

        {/* SECONDARY STATS */}
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 shadow-sm p-4 sm:p-5 relative overflow-hidden col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500">
                <Landmark className="w-4 h-4" />
              </div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 truncate">
                Payment Arrived
              </p>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(stats.totalPaymentArrived)}
            </h2>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 shadow-sm p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500">
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 truncate">
                Claimable
              </p>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(stats.totalClaimableBySellers)}
            </h2>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 shadow-sm p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500">
                <Banknote className="w-4 h-4" />
              </div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 truncate">
                Payouts Made
              </p>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(stats.totalPayoutsMade)}
            </h2>
          </div>
        </section>

        {/* BREAKDOWN ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70 mb-4 sm:mb-6">
                Payment Breakdown
              </h3>
              
              <div className="space-y-2 sm:space-y-3">
                {/* Product Actual Payment */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Actual Payment</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/50 mt-0.5 hidden sm:block">Base price after discounts</p>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalActualPayment)}</p>
                </div>

                {/* Seller Commission */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 shrink-0">
                      <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Seller Comm. (10%)</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/50 mt-0.5 hidden sm:block">Deducted from actual payment</p>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalSellerCommission)}</p>
                </div>

                {/* Buyer Commission */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                      <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Buyer Comm. (2%)</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/50 mt-0.5 hidden sm:block">Added on top of actual payment</p>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalBuyerCommission)}</p>
                </div>

                {/* GST */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Total GST (5%)</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/50 mt-0.5 hidden sm:block">Tax calculated on actual payment</p>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalGST)}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col items-center">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70 w-full text-left mb-4 sm:mb-6">
                Revenue Distribution
              </h3>
              
              <div className="h-40 w-40 sm:h-48 sm:w-48 mb-4 sm:mb-6">
                {donutData && <Doughnut data={donutData} options={donutOptions} />}
              </div>

              <div className="w-full space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-cyan-500"></div>
                    <span className="text-slate-600 dark:text-white/70">Seller Comm.</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(stats.totalSellerCommission)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500"></div>
                    <span className="text-slate-600 dark:text-white/70">Buyer Comm.</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(stats.totalBuyerCommission)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500"></div>
                    <span className="text-slate-600 dark:text-white/70">Total GST</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(stats.totalGST)}</span>
                </div>
              </div>
            </section>

            <section className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 sm:p-6 shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-1">
                Total Platform Earnings
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                {formatCurrency(stats.totalCommissionEarned)}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/60 leading-relaxed">
                Combined revenue from 10% Seller Commission and 2% Buyer Commission.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
