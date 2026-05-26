"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { showSuccess, showError } from "@/lib/toast";
import api from "@/lib/api";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import {
  Landmark,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  ShieldCheck,
  X,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  ChevronDown,
  PencilLine,
  MoreVertical,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Banknote,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BankAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: "savings" | "current";
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface BankStats {
  totalCommissionEarned: number;
  totalPayoutsMade: number;
  netBalance: number;
}

const maskAccountNumber = (num: string) =>
  num ? `•••• •••• ${num.slice(-4)}` : "";

export default function AdminBankAccountPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [stats, setStats] = useState<BankStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleAccounts, setVisibleAccounts] = useState<Record<string, boolean>>({});
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, accountsRes] = await Promise.all([
        api.get("/admin/bank-stats"),
        api.get("/bank"),
      ]);
      setStats(statsRes.data.stats);
      setBankAccounts(accountsRes.data.bankAccounts || []);
    } catch {
      showError("Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (acc: BankAccount) => {
    if (acc.isPrimary) return;
    if (!confirm("Delete this bank account?")) return;
    try {
      await api.delete(`/bank/${acc.id}`);
      showSuccess("Deleted");
      fetchData();
    } catch {
      showError("Delete failed");
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await api.patch(`/bank/${id}/set-primary`);
      showSuccess("Set as primary account");
      fetchData();
    } catch {
      showError("Failed to set primary account");
    }
  };

  const toggleAccountVisibility = (id: string) => {
    setVisibleAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* === SKELETON === */
  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_48%,#eef2f7_100%)] dark:bg-[linear-gradient(180deg,#05070c_0%,#0a1220_48%,#05070c_100%)] text-slate-900 dark:text-white">
        <PageHeader
          backHref="/dashboard/admin"
          backLabel="Dashboard"
          title="Bank Accounts"
        />
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-6 w-36 bg-white dark:bg-[#16161e] rounded-lg" />
            <div className="h-10 w-32 bg-white dark:bg-[#16161e] rounded-xl" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-2xl" />
            ))}
          </div>
        </section>
      </main>
    );
  }

  /* === UI === */
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_48%,#eef2f7_100%)] dark:bg-[linear-gradient(180deg,#05070c_0%,#0a1220_48%,#05070c_100%)] text-slate-900 dark:text-white pb-20">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Back"
        title="Bank Accounts"
        subtitle="Manage commission & payout accounts"
        rightSlot={
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="absolute right-0 top-11 w-44 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => { router.push("/dashboard/admin/bank-account/analytics"); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Analytics
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-white/[0.04] mx-3" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">


        {/* Section heading */}
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payout Accounts</h2>
          <button
            onClick={() => router.push("/dashboard/admin/bank-account/add")}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#05050a] text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span className="hidden sm:inline">Add Account</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* ACCOUNTS LIST */}
        <div className="grid lg:grid-cols-2 gap-5">
          {bankAccounts.length === 0 ? (
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-12 border border-dashed border-slate-300 dark:border-white/[0.06] rounded-3xl bg-white dark:bg-[#16161e]/30">
              <div className="w-16 h-16 bg-white dark:bg-[#16161e] rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-white/[0.05]">
                <Landmark className="w-8 h-8 text-slate-300 dark:text-white/10" />
              </div>
              <h3 className="text-sm font-black text-slate-500 dark:text-white/30 mb-1">No Accounts Added</h3>
              <p className="text-xs text-slate-400 dark:text-white/15 font-medium mb-6 text-center">Add a bank account to manage commission payouts.</p>
              <button
                onClick={() => router.push("/dashboard/admin/bank-account/add")}
                className="px-5 py-2.5 bg-cyan-500 text-[#05050a] text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Account
              </button>
            </div>
          ) : (
            [...bankAccounts]
              .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
              .map((acc, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={acc.id}
                  className={`relative group border rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-lg ${
                    acc.isPrimary 
                      ? "bg-[linear-gradient(180deg,#ffffff_0%,#f0fdfa_100%)] dark:bg-[linear-gradient(180deg,#0a151c_0%,#050c12_100%)] border-cyan-400 dark:border-cyan-500/50 shadow-[0_12px_30px_rgba(6,182,212,0.15)]" 
                      : "bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,#12141c_0%,#0b0b14_100%)] border-slate-200 dark:border-white/10 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-[0_12px_30px_rgba(6,182,212,0.08)]"
                  }`}
                >
                  {/* Primary Badge */}
                  {acc.isPrimary && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-black tracking-widest uppercase rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                      Primary Account
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{acc.accountHolderName}</h3>
                      <p className="text-sm font-medium text-cyan-400 mt-0.5 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5" />
                        {acc.bankName || "Unknown Bank"}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 ${
                      acc.isVerified 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {acc.isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{acc.isVerified ? "Verified" : "Pending"}</span>
                    </div>
                  </div>

                  <div className={`border rounded-xl p-4 mb-5 space-y-2 backdrop-blur-sm ${
                    acc.isPrimary
                      ? "bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-100 dark:border-cyan-900/30"
                      : "bg-slate-50/80 dark:bg-[#151722]/60 border-slate-200/60 dark:border-white/5"
                  }`}>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-zinc-500 font-medium shrink-0">Account No</span>
                      <div className="flex items-center justify-end gap-2 overflow-hidden w-full ml-4">
                        <span className={`text-slate-900 dark:text-white font-mono font-bold tracking-wider truncate text-right ${visibleAccounts[acc.id] ? "select-all" : ""}`}>
                          {visibleAccounts[acc.id] ? acc.accountNumber : maskAccountNumber(acc.accountNumber)}
                        </span>
                        <button 
                          onClick={() => toggleAccountVisibility(acc.id)} 
                          className="text-slate-500 dark:text-zinc-500 hover:text-cyan-400 transition-colors shrink-0 p-1.5 -mr-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5"
                        >
                          {visibleAccounts[acc.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200 dark:border-[#27272a]/50">
                      <span className="text-slate-500 dark:text-zinc-500 font-medium">IFSC Code</span>
                      <span className="text-slate-700 dark:text-zinc-300 font-mono tracking-wider text-right">
                        {acc.ifscCode}
                      </span>
                    </div>
                    {acc.branchName && (
                      <div className="flex justify-between items-center text-sm pt-3 mt-1 border-t border-slate-200 dark:border-[#27272a]/50">
                        <span className="text-slate-500 dark:text-zinc-500 font-medium">Branch</span>
                        <span className="text-slate-600 dark:text-zinc-400 text-right line-clamp-1 max-w-[180px]">
                          {acc.branchName}
                        </span>
                      </div>
                    )}
                  </div>

                  {acc.isPrimary ? (
                    <div className="text-center py-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        You can't remove primary account
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-3 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex-wrap">
                      <button 
                        onClick={() => handleSetPrimary(acc.id)}
                        className="flex-1 bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200 dark:hover:bg-[#27272a] border border-slate-200 dark:border-[#27272a] text-slate-900 dark:text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Set Primary
                      </button>
                      <button 
                        onClick={() => handleDelete(acc)}
                        className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
          )}
        </div>
      </section>

    </main>
  );
}
