"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showSuccess, showError } from "@/lib/toast";
import api from "@/lib/api";
import PageHeader from "../../../buyer/transactions/components/PageHeader";
import { Landmark, ShieldCheck, CreditCard, Building2, ChevronDown, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddBankAccountPage() {
  const router = useRouter();
  
  const [ifscLoading, setIfscLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Custom Dropdown State
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountTypeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      await api.post("/bank/add", formData);
      showSuccess("Bank account added");
      router.push("/dashboard/seller/bank-account");
    } catch (err: any) {
      showError(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_48%,#eef2f7_100%)] dark:bg-[linear-gradient(180deg,#05070c_0%,#0a1220_48%,#05070c_100%)] text-slate-900 dark:text-white pb-20">
      <PageHeader
        backHref="/dashboard/seller/bank-account"
        backLabel="Bank Accounts"
        title="Add Bank Account"
        subtitle="Add secure earnings payout account"
      />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Landmark className="w-6 h-6 text-cyan-500" />
              Bank Details
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Please ensure all details match your official bank records to avoid payout delays.
            </p>
          </div>

          <div>
            <form id="bank-form" onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Account Holder Name</label>
                <div className="relative">
                  <input
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all pl-11"
                  />
                  <ShieldCheck className="w-5 h-5 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Account Number</label>
                <div className="relative">
                  <input
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter account number"
                    required
                    type={showAccountNumberInput ? "text" : "password"}
                    className="w-full bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all pl-11 pr-12 font-mono tracking-widest"
                  />
                  <CreditCard className="w-5 h-5 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumberInput(!showAccountNumberInput)}
                    className="absolute right-2 top-2 p-1.5 text-zinc-500 hover:text-cyan-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    {showAccountNumberInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Account Type</label>
                <div 
                  onClick={() => setShowAccountTypeDropdown(!showAccountTypeDropdown)}
                  className="w-full bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white flex justify-between items-center cursor-pointer hover:border-cyan-500/50 transition-all"
                >
                  <span className="capitalize">{formData.accountType} Account</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-zinc-500 transition-transform ${showAccountTypeDropdown ? "rotate-180" : ""}`} />
                </div>
                
                <AnimatePresence>
                  {showAccountTypeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 top-[calc(100%+0.5rem)] left-0 w-full bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-xl overflow-hidden"
                    >
                      <div 
                        onClick={() => {
                          setFormData(prev => ({ ...prev, accountType: "savings" }));
                          setShowAccountTypeDropdown(false);
                        }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${formData.accountType === "savings" ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#27272a]"}`}
                      >
                        Savings Account
                      </div>
                      <div 
                        onClick={() => {
                          setFormData(prev => ({ ...prev, accountType: "current" }));
                          setShowAccountTypeDropdown(false);
                        }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${formData.accountType === "current" ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#27272a]"}`}
                      >
                        Current Account
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">IFSC Code</label>
                <div className="relative">
                  <input
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    placeholder="e.g. SBIN0001234"
                    required
                    className="w-full bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white uppercase placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all pl-11"
                  />
                  <Building2 className="w-5 h-5 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                  {ifscLoading && (
                    <span className="absolute right-3.5 top-3.5 h-4 w-4 border-2 border-slate-300 dark:border-white/20 border-t-cyan-500 rounded-full animate-spin" />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bank Name</label>
                <input
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Auto-filled via IFSC"
                  className="w-full bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Branch Name</label>
                <input
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleInputChange}
                  placeholder="Auto-filled via IFSC"
                  className="w-full bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
              </div>

            </form>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-[#27272a] flex flex-col-reverse sm:flex-row items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/seller/bank-account")}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#18181b] hover:bg-slate-50 dark:hover:bg-[#27272a] border border-slate-200 dark:border-[#27272a] rounded-xl transition-colors shadow-sm dark:shadow-none"
            >
              Cancel
            </button>
            <button 
              form="bank-form"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 text-sm font-bold bg-[linear-gradient(180deg,#06b6d4_0%,#0891b2_100%)] hover:bg-[linear-gradient(180deg,#22d3ee_0%,#06b6d4_100%)] text-white dark:text-[#05050a] rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <span className="h-4 w-4 border-2 border-white/30 dark:border-[#05050a]/30 border-t-white dark:border-t-[#05050a] rounded-full animate-spin" />}
              Add Account
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
