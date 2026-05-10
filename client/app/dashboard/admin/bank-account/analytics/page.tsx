"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { showError } from "@/lib/toast";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import {
  TrendingUp,
  Banknote,
  Wallet,
  RefreshCw,
  ArrowUpRight,
  Landmark,
  ShieldCheck,
  Clock,
} from "lucide-react";

interface BankStats {
  totalCommissionEarned: number;
  totalPayoutsMade: number;
  netBalance: number;
}

interface BankAccount {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  isPrimary: boolean;
  isVerified: boolean;
  accountType: string;
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a]">
      <div className="h-16 w-full border-b border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-[#0a0a0f]" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-2xl" />
          ))}
        </div>
        <div className="h-5 w-40 bg-white dark:bg-[#16161e] rounded-xl" />
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function BankAnalyticsPage() {
  const [stats, setStats] = useState<BankStats | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, accountsRes] = await Promise.all([
        api.get("/admin/bank-stats"),
        api.get("/bank"),
      ]);
      setStats(statsRes.data.stats);
      setAccounts(accountsRes.data.bankAccounts || []);
    } catch {
      showError("Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <PageSkeleton />;

  const statCards = [
    {
      label: "Total Commission",
      value: stats?.totalCommissionEarned ?? 0,
      icon: TrendingUp,
      color: "emerald",
      description: "Lifetime platform commission earned",
    },
    {
      label: "Total Payouts",
      value: stats?.totalPayoutsMade ?? 0,
      icon: Banknote,
      color: "blue",
      description: "Total disbursed to sellers",
    },
    {
      label: "Net Balance",
      value: stats?.netBalance ?? 0,
      icon: Wallet,
      color: "purple",
      description: "Commission minus payouts",
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/10",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/10",
  };

  const glowMap: Record<string, string> = {
    emerald: "shadow-[0_0_30px_rgba(16,185,129,0.04)]",
    blue: "shadow-[0_0_30px_rgba(59,130,246,0.04)]",
    purple: "shadow-[0_0_30px_rgba(168,85,247,0.04)]",
  };

  const verifiedCount = accounts.filter((a) => a.isVerified).length;
  const primaryAccount = accounts.find((a) => a.isPrimary);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <PageHeader
        backHref="/dashboard/admin/bank-account"
        backLabel="Accounts"
        title="Financial Analytics"
        subtitle="Commission, payouts & balance overview"
        rightSlot={
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="h-9 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Hero Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, description }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-2xl p-5 ${glowMap[color]}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 border ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200 dark:text-white/20 mb-1">
                {label}
              </p>
              <p className="text-3xl font-black tracking-tight mb-1">
                ₹{Number(value).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-200 dark:text-white/20 font-medium leading-relaxed">
                {description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quick Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center"
        >
          <div className="flex flex-col">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-200 dark:text-white/20 mb-0.5">Total Accounts</p>
            <p className="text-lg font-black">{accounts.length}</p>
          </div>
          <div className="w-px h-8 bg-white/[0.04] hidden sm:block" />
          <div className="flex flex-col">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-200 dark:text-white/20 mb-0.5">Verified</p>
            <p className="text-lg font-black text-emerald-400">{verifiedCount}</p>
          </div>
          <div className="w-px h-8 bg-white/[0.04] hidden sm:block" />
          <div className="flex flex-col">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-200 dark:text-white/20 mb-0.5">Pending Verification</p>
            <p className="text-lg font-black text-amber-400">{accounts.length - verifiedCount}</p>
          </div>
          {primaryAccount && (
            <>
              <div className="w-px h-8 bg-white/[0.04] hidden sm:block" />
              <div className="flex flex-col">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-200 dark:text-white/20 mb-0.5">Primary Bank</p>
                <p className="text-sm font-black text-cyan-400">{primaryAccount.bankName || "—"}</p>
              </div>
            </>
          )}
        </motion.div>

        {/* Account Breakdown */}
        {accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <div className="px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200 dark:text-white/20 mb-0.5">Breakdown</p>
              <h3 className="text-sm font-black text-slate-500 dark:text-white/60">Registered Accounts</h3>
            </div>

            {accounts
              .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
              .map((acc, i) => (
                <motion.div
                  key={acc.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className={`bg-white dark:bg-[#16161e] border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 ${
                    acc.isPrimary ? "border-cyan-500/20" : "border-slate-200 dark:border-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      acc.isPrimary ? "bg-cyan-500/10 text-cyan-400" : "bg-slate-100 dark:bg-white/[0.03] text-slate-200 dark:text-white/20"
                    }`}>
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-black text-slate-700 dark:text-white/80">{acc.accountHolderName}</p>
                        {acc.isPrimary && (
                          <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-cyan-500/20">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/25 font-medium">
                        {acc.bankName || "Unknown Bank"} · ···· {acc.accountNumber?.slice(-4)}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border shrink-0 ${
                    acc.isVerified
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {acc.isVerified ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span className="hidden sm:inline">{acc.isVerified ? "Verified" : "Pending"}</span>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}

        {/* Payout Efficiency */}
        {stats && stats.totalCommissionEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-2xl p-5 space-y-4"
          >
            <div className="px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200 dark:text-white/20 mb-0.5">Metrics</p>
              <h3 className="text-sm font-black text-slate-500 dark:text-white/60">Payout Efficiency</h3>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[10px] font-black text-slate-300 dark:text-white/30 mb-2">
                <span>Payouts / Commission</span>
                <span>
                  {Math.min(100, Math.round((stats.totalPayoutsMade / stats.totalCommissionEarned) * 100))}%
                </span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (stats.totalPayoutsMade / stats.totalCommissionEarned) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-200 dark:text-white/20 mb-1">Disbursed</p>
                <p className="text-base font-black text-blue-400">₹{Number(stats.totalPayoutsMade).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-200 dark:text-white/20 mb-1">Retained</p>
                <p className="text-base font-black text-purple-400">₹{Number(stats.netBalance).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
