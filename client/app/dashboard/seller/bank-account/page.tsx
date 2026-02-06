// "use client";

// import { useEffect, useState } from "react";
// import { showSuccess, showError } from "@/lib/toast";
// import api from "@/lib/api";

// /* ================= TYPES ================= */

// interface BankAccount {
//   id: string;
//   accountHolderName: string;
//   accountNumber: string;
//   ifscCode: string;
//   bankName: string;
//   branchName: string;
//   accountType: "savings" | "current";
//   isPrimary: boolean;
//   isVerified: boolean;
//   createdAt: string;
// }

// /* ================= PAGE ================= */

// export default function BankAccountPage() {
//   const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

//   const [ifscLoading, setIfscLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     accountHolderName: "",
//     accountNumber: "",
//     ifscCode: "",
//     bankName: "",
//     branchName: "",
//     accountType: "savings" as "savings" | "current",
//     isPrimary: false,
//   });

//   useEffect(() => {
//     fetchBankAccounts();
//   }, []);

//   const fetchBankAccounts = async () => {
//     try {
//       const { data } = await api.get("/bank");
//       setBankAccounts(data.bankAccounts || []);
//     } catch {
//       showError("Failed to fetch bank accounts");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= IFSC AUTO-FILL ================= */

//   const fetchIFSCDetails = async (ifsc: string) => {
//     if (ifsc.length !== 11) return;

//     setIfscLoading(true);
//     try {
//       const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
//       if (!res.ok) throw new Error();

//       const data = await res.json();
//       setFormData((prev) => ({
//         ...prev,
//         bankName: data.BANK || prev.bankName,
//         branchName: data.BRANCH || prev.branchName,
//       }));
//     } catch {
//       // manual override allowed
//     } finally {
//       setIfscLoading(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       if (editingAccount) {
//         await api.put(`/bank/${editingAccount.id}`, formData);
//         showSuccess("Bank account updated");
//       } else {
//         await api.post("/bank/add", formData);
//         showSuccess("Bank account added");
//       }
//       resetForm();
//       fetchBankAccounts();
//     } catch (err: any) {
//       showError(err.response?.data?.message || "Operation failed");
//     }
//   };

//   const resetForm = () => {
//     setShowAddForm(false);
//     setEditingAccount(null);
//     setFormData({
//       accountHolderName: "",
//       accountNumber: "",
//       ifscCode: "",
//       bankName: "",
//       branchName: "",
//       accountType: "savings",
//       isPrimary: false,
//     });
//   };

//   const handleInputChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type } = e.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
//     }));

//     if (name === "ifscCode") {
//       fetchIFSCDetails(value.toUpperCase());
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center">
//         <div className="h-12 w-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white p-6">
//       <div className="max-w-6xl mx-auto space-y-8">

//         {/* HEADER */}
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold">Bank Accounts</h1>
//             <p className="text-gray-400">
//               Secure payout & withdrawal accounts
//             </p>
//           </div>
//           {!showAddForm && (
//             <button
//               onClick={() => setShowAddForm(true)}
//               className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:scale-105 transition"
//             >
//               + Add Bank Account
//             </button>
//           )}
//         </div>

//         {/* ADD / EDIT FORM */}
//         {showAddForm && (
//           <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
//             <h2 className="text-xl font-semibold mb-4">
//               {editingAccount ? "Edit Bank Account" : "Add Bank Account"}
//             </h2>

//             <form
//               onSubmit={handleSubmit}
//               className="grid md:grid-cols-2 gap-4"
//             >
//               <input
//                 name="accountHolderName"
//                 value={formData.accountHolderName}
//                 onChange={handleInputChange}
//                 placeholder="Account Holder Name"
//                 required
//                 className="glass-input"
//               />

//               <input
//                 name="accountNumber"
//                 value={formData.accountNumber}
//                 onChange={handleInputChange}
//                 placeholder="Account Number"
//                 required
//                 className="glass-input"
//               />

//               {/* IFSC with spinner */}
//               <div className="relative">
//                 <input
//                   name="ifscCode"
//                   value={formData.ifscCode}
//                   onChange={handleInputChange}
//                   placeholder="IFSC Code"
//                   required
//                   className="glass-input pr-10"
//                 />
//                 {ifscLoading && (
//                   <span className="absolute right-3 top-3 h-4 w-4 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin" />
//                 )}
//               </div>

//               <input
//                 name="bankName"
//                 value={formData.bankName}
//                 onChange={handleInputChange}
//                 placeholder="Bank Name (auto / manual)"
//                 className="glass-input"
//               />

//               <input
//                 name="branchName"
//                 value={formData.branchName}
//                 onChange={handleInputChange}
//                 placeholder="Branch Name (auto / manual)"
//                 className="glass-input"
//               />

//               <select
//                 name="accountType"
//                 value={formData.accountType}
//                 onChange={handleInputChange}
//                 className="glass-input"
//               >
//                 <option value="savings">Savings</option>
//                 <option value="current">Current</option>
//               </select>

//               <div className="flex gap-3 mt-4 md:col-span-2">
//                 <button className="px-6 py-3 bg-emerald-600 rounded-lg">
//                   Save
//                 </button>
//                 <button
//                   type="button"
//                   onClick={resetForm}
//                   className="px-6 py-3 bg-white/10 rounded-lg"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         )}

//         {/* ACCOUNTS */}
//         <div className="grid md:grid-cols-2 gap-6">
//           {bankAccounts.map((acc) => (
//             <div
//               key={acc.id}
//               className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 ${
//                 acc.isPrimary ? "ring-2 ring-emerald-400" : ""
//               }`}
//             >
//               <div className="flex justify-between">
//                 <h3 className="font-bold">{acc.accountHolderName}</h3>
//                 {acc.isPrimary && (
//                   <span className="text-xs bg-emerald-500 px-3 py-1 rounded-full">
//                     PRIMARY
//                   </span>
//                 )}
//               </div>

//               <p className="text-gray-400 text-sm">{acc.bankName}</p>

//               <div className="mt-3 space-y-1 text-sm">
//                 <p>Account: XXXX XXXX {acc.accountNumber.slice(-4)}</p>
//                 <p>IFSC: {acc.ifscCode}</p>

//                 {/* VERIFICATION TIMELINE */}
//                 <div className="mt-2">
//                   {acc.isVerified ? (
//                     <p className="text-emerald-400">✓ Verified</p>
//                   ) : (
//                     <p className="text-yellow-400">⏳ Verification Pending</p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex gap-2 mt-4">
//                 {!acc.isPrimary && (
//                   <button className="flex-1 bg-blue-600 py-2 rounded-lg">
//                     Edit
//                   </button>
//                 )}

//                 <button
//                   disabled={acc.isPrimary}
//                   className={`flex-1 py-2 rounded-lg ${
//                     acc.isPrimary
//                       ? "bg-red-900/40 text-red-400 cursor-not-allowed"
//                       : "bg-red-600 hover:bg-red-700"
//                   }`}
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>

//       </div>

//       {/* GLOBAL INPUT STYLE */}
//       <style jsx>{`
//         .glass-input {
//           background: rgba(0, 0, 0, 0.4);
//           border: 1px solid rgba(255, 255, 255, 0.2);
//           border-radius: 0.5rem;
//           padding: 0.75rem 1rem;
//           color: white;
//         }
//       `}</style>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import api from "@/lib/api";

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

  /* ================= SKELETON ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 animate-pulse">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-neutral-800 rounded" />
              <div className="h-4 w-64 bg-neutral-800 rounded" />
            </div>
            <div className="h-10 w-40 bg-neutral-800 rounded-xl" />
          </div>

          {/* Cards skeleton */}
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 bg-neutral-800 rounded-2xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">
              Add Bank Accounts
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Secure payout & withdrawal accounts
            </p>
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="
                px-4 py-2 sm:px-6 sm:py-3
                text-sm sm:text-base
                bg-gradient-to-r from-cyan-500 to-blue-600
                rounded-lg sm:rounded-xl
                hover:scale-105 transition
                w-fit
              "
            >
              + Add Bank Account
            </button>
          )}
        </div>

        {/* ADD / EDIT FORM */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAccount ? "Edit Bank Account" : "Add Bank Account"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid md:grid-cols-2 gap-4"
            >
              <input
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                placeholder="Account Holder Name"
                required
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />

              <input
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Account Number"
                required
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />

              <div className="relative">
                <input
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  placeholder="IFSC Code"
                  required
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {ifscLoading && (
                  <span className="absolute right-3 top-3 h-4 w-4 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin" />
                )}
              </div>

              <input
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Bank Name"
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />

              <input
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                placeholder="Branch Name"
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />

              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleInputChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>

              <div className="flex gap-3 mt-4 md:col-span-2">
                <button className="px-6 py-3 bg-emerald-600 rounded-lg">
                  Save
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

        {/* ACCOUNTS */}
        <div className="grid md:grid-cols-2 gap-6">
          {bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 ${
                acc.isPrimary ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              <div className="flex justify-between">
                <h3 className="font-bold">{acc.accountHolderName}</h3>
                {acc.isPrimary && (
                  <span className="text-xs bg-emerald-500 px-3 py-1 rounded-full">
                    PRIMARY
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm">{acc.bankName}</p>

              <div className="mt-3 space-y-1 text-sm">
                <p>Account: XXXX XXXX {acc.accountNumber.slice(-4)}</p>
                <p>IFSC: {acc.ifscCode}</p>

                <div className="mt-2">
                  {acc.isVerified ? (
                    <p className="text-emerald-400">✓ Verified</p>
                  ) : (
                    <p className="text-yellow-400">⏳ Verification Pending</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
