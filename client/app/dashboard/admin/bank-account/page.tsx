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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
  const [visibleAccounts, setVisibleAccounts] = useState<Record<string, boolean>>({});
  const [showAccountNumberInput, setShowAccountNumberInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    accountType: "current" as "savings" | "current",
    isPrimary: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountTypeDropdown(false);
      }
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

  const fetchBankFromIFSC = async (ifsc: string) => {
    if (ifsc.length !== 11) return;
    setIfscLoading(true);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (!res.ok) throw new Error("Invalid IFSC");
      const data = await res.json();
      setFormData((prev) => ({ ...prev, bankName: data.BANK || prev.bankName, branchName: data.BRANCH || prev.branchName }));
    } catch {
      // manual override allowed
    } finally {
      setIfscLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAccount) {
        await api.put(`/bank/${editingAccount.id}`, formData);
        showSuccess("Bank account updated");
      } else {
        await api.post("/bank/add", formData);
        showSuccess("Bank account added");
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await api.patch(`/bank/${id}/set-primary`);
      showSuccess("Primary account updated");
      fetchData();
    } catch {
      showError("Failed to set primary");
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

  const handleEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setFormData({
      accountHolderName: acc.accountHolderName,
      accountNumber: "",
      ifscCode: acc.ifscCode,
      bankName: acc.bankName,
      branchName: acc.branchName,
      accountType: acc.accountType,
      isPrimary: acc.isPrimary,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingAccount(null);
    setShowAccountNumberInput(false);
    setShowAccountTypeDropdown(false);
    setFormData({
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      accountType: "current",
      isPrimary: false,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "ifscCode") fetchBankFromIFSC(value.toUpperCase());
  };

  const toggleAccountVisibility = (id: string) => {
    setVisibleAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* === SKELETON === */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#05050a] text-white">
        <div className="h-16 w-full border-b border-white/[0.05] bg-[#0a0a0f]" />
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-6 w-36 bg-[#16161e] rounded-lg" />
            <div className="h-10 w-32 bg-[#16161e] rounded-xl" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-[#16161e] border border-white/[0.05] rounded-2xl" />
            ))}
          </div>
        </section>
      </main>
    );
  }

  /* === UI === */
  return (
    <main className="min-h-screen bg-[#05050a] text-white pb-20">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Back"
        title="Bank Accounts"
        subtitle="Manage commission & payout accounts"
        rightSlot={
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="absolute right-0 top-11 w-44 bg-[#16161e] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => { router.push("/dashboard/admin/bank-account/analytics"); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Analytics
                  </button>
                  <div className="h-px bg-white/[0.04] mx-3" />
                  <button
                    onClick={() => { fetchData(true); setShowMenu(false); }}
                    disabled={refreshing}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">


        {/* Section heading */}
        <div className="flex justify-between items-center px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-0.5">Registered</p>
            <h2 className="text-sm font-black text-white/70">Payout Accounts</h2>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#05050a] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            <span className="hidden sm:inline">Add Account</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* ACCOUNTS LIST */}
        <div className="grid lg:grid-cols-2 gap-5">
          {bankAccounts.length === 0 ? (
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-12 border border-dashed border-white/[0.06] rounded-3xl bg-[#16161e]/30">
              <div className="w-16 h-16 bg-[#16161e] rounded-full flex items-center justify-center mb-4 border border-white/[0.05]">
                <Landmark className="w-8 h-8 text-white/10" />
              </div>
              <h3 className="text-sm font-black text-white/30 mb-1">No Accounts Added</h3>
              <p className="text-xs text-white/15 font-medium mb-6 text-center">Add a bank account to manage commission payouts.</p>
              <button
                onClick={() => setShowAddForm(true)}
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
                  key={acc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative group bg-[#16161e] border rounded-2xl p-5 transition-all duration-300 ${
                    acc.isPrimary
                      ? "border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.05)]"
                      : "border-white/[0.05] hover:border-white/10"
                  }`}
                >
                  {/* Primary badge */}
                  {acc.isPrimary && (
                    <div className="absolute -top-2.5 left-5 px-2.5 py-0.5 bg-cyan-500 text-[#05050a] text-[9px] font-black tracking-widest uppercase rounded-full">
                      Primary
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-black text-white/90">{acc.accountHolderName}</h3>
                      <p className="text-xs text-cyan-400/70 font-medium mt-0.5 flex items-center gap-1">
                        <Landmark className="w-3 h-3" />
                        {acc.bankName || "Unknown Bank"}
                      </p>
                    </div>
                    <div className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1 ${
                      acc.isVerified
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {acc.isVerified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span className="hidden sm:inline">{acc.isVerified ? "Verified" : "Pending"}</span>
                    </div>
                  </div>

                  {/* Account details */}
                  <div className="bg-[#1c1c24] border border-white/[0.04] rounded-xl p-4 mb-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/30 font-medium">Account No</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono font-bold tracking-wider">
                          {visibleAccounts[acc.id] ? acc.accountNumber : maskAccountNumber(acc.accountNumber)}
                        </span>
                        <button
                          onClick={() => toggleAccountVisibility(acc.id)}
                          className="text-white/20 hover:text-cyan-400 transition-colors p-1 rounded-lg hover:bg-white/5"
                        >
                          {visibleAccounts[acc.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/[0.03]">
                      <span className="text-white/30 font-medium">IFSC Code</span>
                      <span className="text-white/70 font-mono tracking-wider">{acc.ifscCode}</span>
                    </div>
                    {acc.branchName && (
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-white/[0.03]">
                        <span className="text-white/30 font-medium">Branch</span>
                        <span className="text-white/50 text-right line-clamp-1 max-w-[160px]">{acc.branchName}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {!acc.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(acc.id)}
                        className="flex-1 py-2 bg-[#1c1c24] hover:bg-white/[0.08] border border-white/[0.05] text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(acc)}
                      className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      disabled={acc.isPrimary}
                      onClick={() => handleDelete(acc)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-1.5 transition-all ${
                        acc.isPrimary
                          ? "bg-red-500/5 text-red-500/20 border-red-500/10 cursor-not-allowed"
                          : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))
          )}
        </div>
      </section>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={resetForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#16161e] border border-white/[0.08] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between">
                <h2 className="text-sm font-black flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-cyan-500" />
                  {editingAccount ? "Edit Bank Account" : "Add Bank Account"}
                </h2>
                <button onClick={resetForm} className="p-2 text-white/30 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-xl transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[65vh] overflow-y-auto">
                <form id="bank-form" onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
                  {/* Account Holder Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Account Holder Name</label>
                    <div className="relative">
                      <input
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleInputChange}
                        placeholder="e.g. Company Pvt Ltd"
                        required
                        className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
                      />
                      <ShieldCheck className="w-4 h-4 text-white/20 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Account Number</label>
                    <div className="relative">
                      <input
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        placeholder="Enter account number"
                        required
                        type={showAccountNumberInput ? "text" : "password"}
                        className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-3 pl-11 pr-12 text-sm text-white font-mono tracking-widest placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
                      />
                      <CreditCard className="w-4 h-4 text-white/20 absolute left-3.5 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowAccountNumberInput(!showAccountNumberInput)}
                        className="absolute right-3 top-3 p-1 text-white/20 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
                      >
                        {showAccountNumberInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* IFSC */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">IFSC Code</label>
                    <div className="relative">
                      <input
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        placeholder="e.g. SBIN0001234"
                        required
                        maxLength={11}
                        className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-3 pl-11 text-sm text-white uppercase placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
                      />
                      <Building2 className="w-4 h-4 text-white/20 absolute left-3.5 top-3.5" />
                      {ifscLoading && (
                        <span className="absolute right-3.5 top-3.5 h-4 w-4 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin" />
                      )}
                    </div>
                  </div>

                  {/* Account Type dropdown */}
                  <div className="space-y-1.5 relative" ref={dropdownRef}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Account Type</label>
                    <div
                      onClick={() => setShowAccountTypeDropdown(!showAccountTypeDropdown)}
                      className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white flex justify-between items-center cursor-pointer hover:border-cyan-500/40 transition-all"
                    >
                      <span className="capitalize">{formData.accountType} Account</span>
                      <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${showAccountTypeDropdown ? "rotate-180" : ""}`} />
                    </div>
                    <AnimatePresence>
                      {showAccountTypeDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute z-50 top-[calc(100%+0.5rem)] left-0 w-full bg-[#1c1c24] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden"
                        >
                          {["current", "savings"].map((type) => (
                            <div
                              key={type}
                              onClick={() => { setFormData((p) => ({ ...p, accountType: type as any })); setShowAccountTypeDropdown(false); }}
                              className={`px-4 py-3 text-sm cursor-pointer capitalize transition-colors ${formData.accountType === type ? "bg-cyan-500/10 text-cyan-400" : "text-white hover:bg-white/[0.04]"}`}
                            >
                              {type} Account
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bank Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Bank Name</label>
                    <input
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      placeholder="Auto-filled via IFSC"
                      className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all"
                    />
                  </div>

                  {/* Branch Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Branch Name</label>
                    <input
                      name="branchName"
                      value={formData.branchName}
                      onChange={handleInputChange}
                      placeholder="Auto-filled via IFSC"
                      className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all"
                    />
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-5 border-t border-white/[0.05] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-6 py-3 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  form="bank-form"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3 text-xs font-black uppercase tracking-widest bg-cyan-500 hover:bg-cyan-400 text-[#05050a] rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <span className="h-4 w-4 border-2 border-[#05050a]/30 border-t-[#05050a] rounded-full animate-spin" />}
                  {editingAccount ? "Save Changes" : "Add Account"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
