"use client";

import { useState, useEffect, useRef } from "react";
import { showSuccess, showError } from "@/lib/toast";
import api from "@/lib/api";

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
  num ? `XXXX XXXX ${num.slice(-4)}` : "";

export default function AdminBankAccountPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [stats, setStats] = useState<BankStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<BankAccount | null>(null);

  const [formData, setFormData] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    accountType: "current" as "savings" | "current",
    isPrimary: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [ifscLoading, setIfscLoading] = useState(false);

  const ifscCache = useRef<
    Map<string, { bankName: string; branchName: string }>
  >(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
    }
  };

  const fetchBankFromIFSC = async (ifsc: string) => {
    const cached = ifscCache.current.get(ifsc);
    if (cached) {
      setFormData((prev) => ({
        ...prev,
        bankName: cached.bankName,
        branchName: cached.branchName,
      }));
      return;
    }

    setIfscLoading(true);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (!res.ok) throw new Error("Invalid IFSC");

      const data = await res.json();

      const bankName = data.BANK || "";
      const branchName = data.BRANCH || "";

      ifscCache.current.set(ifsc, { bankName, branchName });

      setFormData((prev) => ({
        ...prev,
        bankName,
        branchName,
      }));

      showSuccess("Bank details auto-filled (editable)");
    } catch {
      showError("IFSC lookup failed. Enter details manually.");
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-white/10 rounded" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white/10 rounded-2xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-white/10 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-slate-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">
              Admin Bank Accounts
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Manage commission & payout accounts
            </p>
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="
                px-4 py-2 sm:px-6 sm:py-3
                text-sm sm:text-base
                bg-linear-to-r from-cyan-500 to-blue-600
                rounded-lg sm:rounded-xl
                hover:scale-105 transition
                w-fit
              "
            >
              + Add Bank Account
            </button>
          )}
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["Total Commission", stats?.totalCommissionEarned],
            ["Total Payouts", stats?.totalPayoutsMade],
            ["Net Balance", stats?.netBalance],
          ].map(([label, value], i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
            >
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-3xl font-bold mt-2">
                ₹{Number(value || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAccount ? "Edit Bank Account" : "Add Bank Account"}
            </h2>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">

              <input
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                placeholder="Account Holder Name"
                required
                className="bg-black/40 border border-white/20 rounded-lg px-4 py-3"
              />

              <input
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Account Number"
                required
                className="bg-black/40 border border-white/20 rounded-lg px-4 py-3"
              />

              {/* IFSC WITH SPINNER */}
              <div className="relative">
                <input
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ifscCode: e.target.value.toUpperCase(),
                    })
                  }
                  onBlur={(e) => {
                    if (e.target.value.length === 11) {
                      fetchBankFromIFSC(e.target.value);
                    }
                  }}
                  placeholder="IFSC Code"
                  maxLength={11}
                  required
                  className="bg-black/40 border border-white/20 rounded-lg px-4 py-3 pr-10 uppercase w-full"
                />
                {ifscLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
              </div>

              <input
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Bank Name (auto / manual)"
                className="bg-black/40 border border-white/20 rounded-lg px-4 py-3"
              />

              <input
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                placeholder="Branch Name (auto / manual)"
                className="bg-black/40 border border-white/20 rounded-lg px-4 py-3"
              />

              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleInputChange}
                className="bg-black/40 border border-white/20 rounded-lg px-4 py-3"
              >
                <option value="current">Current</option>
                <option value="savings">Savings</option>
              </select>

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-emerald-600 rounded-lg"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-white/10 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ACCOUNT LIST */}
        <div className="grid md:grid-cols-2 gap-6">
          {bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 ${
                acc.isPrimary ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              <div className="flex justify-between">
                <h3 className="text-lg font-bold">{acc.accountHolderName}</h3>
                {acc.isPrimary && (
                  <span className="text-xs bg-emerald-500 px-2 py-1 rounded-full">
                    PRIMARY
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm">{acc.bankName}</p>

              <div className="mt-3 space-y-1 text-sm">
                <p>Account: {maskAccountNumber(acc.accountNumber)}</p>
                <p>IFSC: {acc.ifscCode}</p>
                <p
                  className={
                    acc.isVerified
                      ? "text-emerald-400"
                      : "text-yellow-400"
                  }
                >
                  {acc.isVerified ? "✓ Verified" : "⏳ Pending"}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                {!acc.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(acc.id)}
                    className="flex-1 bg-emerald-600 py-2 rounded-lg"
                  >
                    Set Primary
                  </button>
                )}

                <button
                  onClick={() => handleEdit(acc)}
                  className="flex-1 bg-blue-600 py-2 rounded-lg"
                >
                  Edit
                </button>

                <button
                  disabled={acc.isPrimary}
                  onClick={() => handleDelete(acc)}
                  className={`flex-1 py-2 rounded-lg ${
                    acc.isPrimary
                      ? "bg-red-600/30 cursor-not-allowed"
                      : "bg-red-600"
                  }`}
                  title={
                    acc.isPrimary
                      ? "Primary account cannot be deleted"
                      : "Delete account"
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
