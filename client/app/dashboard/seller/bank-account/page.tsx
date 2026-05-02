"use client";

import { useEffect, useState, useRef } from "react";
import { showSuccess, showError } from "@/lib/toast";
import api from "@/lib/api";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import { Landmark, Plus, CheckCircle2, Clock, Trash2, ShieldCheck, X, Building2, CreditCard, Eye, EyeOff, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ================= TYPES ================= */

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

/* ================= PAGE ================= */

export default function BankAccountPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Custom Dropdown State
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Visibility states
  const [visibleAccounts, setVisibleAccounts] = useState<Record<string, boolean>>({});
  const [showAccountNumberInput, setShowAccountNumberInput] = useState(false);

  const [formData, setFormData] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    accountType: "savings" as "savings" | "current",
    isPrimary: false,
  });

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountTypeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const { data } = await api.get("/bank");
      setBankAccounts(data.bankAccounts || []);
    } catch {
      showError("Failed to fetch bank accounts");
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIONS ================= */

  const handleSetPrimary = async (accountId: string) => {
    try {
      await api.patch(`/bank/${accountId}/set-primary`);
      showSuccess("Primary account updated");
      fetchBankAccounts();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to set primary account");
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to remove this bank account?")) return;
    try {
      await api.delete(`/bank/${accountId}`);
      showSuccess("Bank account removed");
      fetchBankAccounts();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to remove account");
    }
  };

  /* ================= IFSC AUTO-FILL ================= */

  const fetchIFSCDetails = async (ifsc: string) => {
    if (ifsc.length !== 11) return;

    setIfscLoading(true);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        bankName: data.BANK || prev.bankName,
        branchName: data.BRANCH || prev.branchName,
      }));
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
      fetchBankAccounts();
    } catch (err: any) {
      showError(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingAccount(null);
    setFormData({
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      accountType: "savings",
      isPrimary: false,
    });
    setShowAccountNumberInput(false);
    setShowAccountTypeDropdown(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    if (name === "ifscCode") {
      fetchIFSCDetails(value.toUpperCase());
    }
  };

  const toggleAccountVisibility = (id: string) => {
    setVisibleAccounts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  /* ================= SKELETON ================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05050a] text-white">
        <PageHeader
          backHref="/dashboard/seller"
          backLabel="Dashboard"
          title="Bank Accounts"
        />
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="flex justify-between items-center">
            <div className="h-8 w-32 bg-[#0b0b14] rounded-md animate-pulse" />
            <div className="h-10 w-40 bg-[#0b0b14] border border-white/5 rounded-xl animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-[#0b0b14] border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </section>
      </main>
    );
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-[#05050a] text-white pb-20">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Bank Accounts"
        subtitle="Manage your secure payout and withdrawal accounts"
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* TOP ACTIONS */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Your Accounts</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#05050a] text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span className="hidden sm:inline">Add Account</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* MODAL FOR ADD / EDIT FORM */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0b0b14] border border-[#27272a] rounded-2xl w-full max-w-2xl shadow-2xl relative my-auto"
              >
                <div className="p-6 sm:p-8 border-b border-[#27272a] flex items-center justify-between sticky top-0 bg-[#0b0b14]/90 backdrop-blur-sm z-10 rounded-t-2xl">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-cyan-500" />
                    {editingAccount ? "Edit Bank Account" : "Add Bank Account"}
                  </h2>
                  <button onClick={resetForm} className="p-2 text-zinc-500 hover:text-white bg-[#18181b] hover:bg-[#27272a] rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
                  <form id="bank-form" onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Account Holder Name</label>
                      <div className="relative">
                        <input
                          name="accountHolderName"
                          value={formData.accountHolderName}
                          onChange={handleInputChange}
                          placeholder="e.g. John Doe"
                          required
                          className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all pl-11"
                        />
                        <ShieldCheck className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Account Number</label>
                      <div className="relative">
                        <input
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                          placeholder="Enter account number"
                          required
                          type={showAccountNumberInput ? "text" : "password"}
                          className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all pl-11 pr-12 font-mono tracking-widest"
                        />
                        <CreditCard className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowAccountNumberInput(!showAccountNumberInput)}
                          className="absolute right-2 top-2 p-1.5 text-zinc-500 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
                        >
                          {showAccountNumberInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">IFSC Code</label>
                      <div className="relative">
                        <input
                          name="ifscCode"
                          value={formData.ifscCode}
                          onChange={handleInputChange}
                          placeholder="e.g. SBIN0001234"
                          required
                          className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white uppercase placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all pl-11"
                        />
                        <Building2 className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3" />
                        {ifscLoading && (
                          <span className="absolute right-3.5 top-3.5 h-4 w-4 border-2 border-white/20 border-t-cyan-500 rounded-full animate-spin" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 relative" ref={dropdownRef}>
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Account Type</label>
                      <div 
                        onClick={() => setShowAccountTypeDropdown(!showAccountTypeDropdown)}
                        className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white flex justify-between items-center cursor-pointer hover:border-cyan-500/50 transition-all"
                      >
                        <span className="capitalize">{formData.accountType} Account</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showAccountTypeDropdown ? "rotate-180" : ""}`} />
                      </div>
                      
                      <AnimatePresence>
                        {showAccountTypeDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 top-[calc(100%+0.5rem)] left-0 w-full bg-[#18181b] border border-[#27272a] rounded-xl shadow-xl overflow-hidden"
                          >
                            <div 
                              onClick={() => {
                                setFormData(prev => ({ ...prev, accountType: "savings" }));
                                setShowAccountTypeDropdown(false);
                              }}
                              className={`px-4 py-3 text-sm cursor-pointer transition-colors ${formData.accountType === "savings" ? "bg-cyan-500/10 text-cyan-400" : "text-white hover:bg-[#27272a]"}`}
                            >
                              Savings Account
                            </div>
                            <div 
                              onClick={() => {
                                setFormData(prev => ({ ...prev, accountType: "current" }));
                                setShowAccountTypeDropdown(false);
                              }}
                              className={`px-4 py-3 text-sm cursor-pointer transition-colors ${formData.accountType === "current" ? "bg-cyan-500/10 text-cyan-400" : "text-white hover:bg-[#27272a]"}`}
                            >
                              Current Account
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Bank Name</label>
                      <input
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        placeholder="Auto-filled via IFSC"
                        className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Branch Name</label>
                      <input
                        name="branchName"
                        value={formData.branchName}
                        onChange={handleInputChange}
                        placeholder="Auto-filled via IFSC"
                        className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                      />
                    </div>
                  </form>
                </div>

                <div className="p-6 sm:p-8 border-t border-[#27272a] flex flex-col-reverse sm:flex-row items-center justify-end gap-3 bg-[#0b0b14]/90 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    form="bank-form"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3 text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-[#05050a] rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <span className="h-4 w-4 border-2 border-[#05050a]/30 border-t-[#05050a] rounded-full animate-spin" />}
                    {editingAccount ? "Save Changes" : "Add Account"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACCOUNTS LIST */}
        <div className="grid lg:grid-cols-2 gap-6">
          {bankAccounts.length === 0 ? (
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#27272a] rounded-3xl bg-[#0b0b14]/50">
              <div className="w-20 h-20 bg-[#18181b] rounded-full flex items-center justify-center mb-5 border border-[#27272a]">
                <Landmark className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Bank Accounts Added</h3>
              <p className="text-zinc-500 text-center max-w-md mb-6">
                You need to add at least one bank account to receive payouts for your earnings.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-cyan-500 text-[#05050a] font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
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
                className={`relative group bg-[#0b0b14] border rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
                  acc.isPrimary 
                    ? "border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.05)]" 
                    : "border-[#27272a] hover:border-zinc-500/50"
                }`}
              >
                {/* Primary Badge */}
                {acc.isPrimary && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-cyan-500 text-[#05050a] text-xs font-black tracking-widest uppercase rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    Primary Account
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{acc.accountHolderName}</h3>
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

                <div className="bg-[#12121a] border border-[#27272a] rounded-xl p-4 mb-5 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-medium shrink-0">Account No</span>
                    <div className="flex items-center justify-end gap-2 overflow-hidden w-full ml-4">
                      <span className={`text-white font-mono font-bold tracking-wider truncate text-right ${visibleAccounts[acc.id] ? "select-all" : ""}`}>
                        {visibleAccounts[acc.id] ? acc.accountNumber : `•••• •••• ${acc.accountNumber.slice(-4)}`}
                      </span>
                      <button 
                        onClick={() => toggleAccountVisibility(acc.id)} 
                        className="text-zinc-500 hover:text-cyan-400 transition-colors shrink-0 p-1.5 -mr-1.5 rounded-lg hover:bg-white/5"
                        title={visibleAccounts[acc.id] ? "Hide Account Number" : "Show Account Number"}
                      >
                        {visibleAccounts[acc.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="text-zinc-500 font-medium">IFSC Code</span>
                    <span className="text-zinc-300 font-mono tracking-wider text-right">
                      {acc.ifscCode}
                    </span>
                  </div>
                  {acc.branchName && (
                    <div className="flex justify-between items-center text-sm pt-3 mt-1 border-t border-[#27272a]/50">
                      <span className="text-zinc-500 font-medium">Branch</span>
                      <span className="text-zinc-400 text-right line-clamp-1 max-w-[180px]">
                        {acc.branchName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {!acc.isPrimary && (
                    <button 
                      onClick={() => handleSetPrimary(acc.id)}
                      className="flex-1 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Set Primary
                    </button>
                  )}
                  <button 
                    onClick={() => handleRemoveAccount(acc.id)}
                    disabled={acc.isPrimary}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      acc.isPrimary
                        ? "bg-red-500/5 text-red-500/30 border border-red-500/10 cursor-not-allowed"
                        : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

      </section>
    </main>
  );
}
