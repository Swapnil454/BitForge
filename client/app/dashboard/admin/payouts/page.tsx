

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { adminAPI } from "@/lib/api";
// import toast from "react-hot-toast";
// import { getStoredUser } from "@/lib/cookies";

// interface Payout {
//   _id: string;
//   sellerId: {
//     name: string;
//     email: string;
//   };
//   amount: number;
//   status: string;
//   createdAt: string;
// }

// export default function AdminPayoutsPage() {
//   const [payouts, setPayouts] = useState<Payout[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState<string | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     const parsed = getStoredUser<{ role?: string }>();
//     if (!parsed) {
//       router.push("/login");
//       return;
//     }

//     if (parsed.role !== "admin") {
//       router.push("/dashboard");
//       return;
//     }

//     fetchPayouts();
//   }, [router]);

//   const fetchPayouts = async () => {
//     try {
//       const data = await adminAPI.getPendingPayouts();
//       setPayouts(data.payouts || []);
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to load payouts");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const approve = async (id: string) => {
//     setProcessing(id);
//     try {
//       await adminAPI.approvePayout(id);
//       toast.success("Payout approved successfully");
//       fetchPayouts();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to approve payout");
//     } finally {
//       setProcessing(null);
//     }
//   };

//   const reject = async (id: string) => {
//     const reason = prompt("Enter rejection reason:");
//     if (!reason) return;

//     setProcessing(id);
//     try {
//       await adminAPI.rejectPayout(id, reason);
//       toast.success("Payout rejected");
//       fetchPayouts();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to reject payout");
//     } finally {
//       setProcessing(null);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-6">
//           <button
//             onClick={() => router.push("/dashboard/admin")}
//             className="text-purple-600 hover:text-purple-700 mb-4"
//           >
//             ← Back to Dashboard
//           </button>
//           <h1 className="text-3xl font-bold text-gray-900">Pending Payouts</h1>
//           <p className="text-gray-600 mt-2">Review and process withdrawal requests</p>
//         </div>

//         {payouts.length === 0 ? (
//           <div className="bg-white rounded-lg shadow p-8 text-center">
//             <p className="text-gray-500">No pending payouts</p>
//           </div>
//         ) : (
//           <div className="grid gap-4">
//             {payouts.map((payout) => (
//               <div key={payout._id} className="bg-white rounded-lg shadow p-6">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                       {payout.sellerId.name}
//                     </h3>
//                     <p className="text-gray-600">{payout.sellerId.email}</p>
//                     <div className="mt-3">
//                       <span className="text-3xl font-bold text-green-600">
//                         ₹{payout.amount.toLocaleString()}
//                       </span>
//                     </div>
//                     <p className="text-sm text-gray-500 mt-2">
//                       Requested: {new Date(payout.createdAt).toLocaleDateString()}
//                     </p>
//                     <span className="inline-block px-3 py-1 mt-2 text-sm rounded-full bg-yellow-100 text-yellow-800">
//                       {payout.status}
//                     </span>
//                   </div>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => approve(payout._id)}
//                       disabled={processing === payout._id}
//                       className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
//                     >
//                       {processing === payout._id ? "Processing..." : "Approve"}
//                     </button>
//                     <button
//                       onClick={() => reject(payout._id)}
//                       disabled={processing === payout._id}
//                       className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
//                     >
//                       Reject
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }




"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";

interface Payout {
  _id: string;
  sellerId?: { id: string; name: string; email: string };
  amount: number;
  status: string;
  createdAt: string;
  primaryBankAccount?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
  };
  financialBreakdown?: {
    requestedAmount: number;
    gstOnCommission: number;
    totalDeductions: number;
    netPayableAmount: number;
  };
}

type Tab = "pending" | "history";
type Preset = "today" | "7days" | "month" | null;

const PAGE_SIZE = 6;

export default function AdminPayoutsPage() {
  const router = useRouter();
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [tab, setTab] = useState<Tab>("pending");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [activePreset, setActivePreset] = useState<Preset>(null);
  const [searching, setSearching] = useState(false);

  /* Infinite scroll */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  /* Payment modal */
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  /* ---------- AUTH ---------- */
  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) return router.push("/login");
    if (parsed.role !== "admin") return router.push("/dashboard");
    fetchData();
  }, [tab]);

  /* ---------- FETCH ---------- */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res =
        tab === "pending"
          ? await adminAPI.getPendingPayouts()
          : await adminAPI.getAllTransactions();

      setPayouts(res.payouts || []);
      resetFilter();
    } catch {
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- RESET ---------- */
  const resetFilter = () => {
    setFromDate("");
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
    setActivePreset(null);
    setVisibleCount(PAGE_SIZE);
  };

  /* ---------- PRESETS ---------- */
  const togglePreset = (preset: Preset) => {
    if (activePreset === preset) {
      resetFilter();
      return;
    }

    const now = new Date();
    let from = new Date();

    if (preset === "today") {
      from = new Date(now.setHours(0, 0, 0, 0));
    } else if (preset === "7days") {
      from.setDate(from.getDate() - 6);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const fromStr = from.toISOString().slice(0, 10);
    const toStr = new Date().toISOString().slice(0, 10);

    setActivePreset(preset);
    setFromDate(fromStr);
    setToDate(toStr);
    setAppliedFrom(fromStr);
    setAppliedTo(toStr);
    setVisibleCount(PAGE_SIZE);
  };

  /* ---------- SEARCH ---------- */
  const isValidRange =
    fromDate &&
    toDate &&
    new Date(fromDate).getTime() <= new Date(toDate).getTime();

  const applySearch = () => {
    if (!isValidRange) return;

    setSearching(true);
    setActivePreset(null);

    setTimeout(() => {
      setAppliedFrom(fromDate);
      setAppliedTo(toDate);
      setVisibleCount(PAGE_SIZE);
      setSearching(false);
    }, 300);
  };

  /* ---------- PAYOUT ACTIONS ---------- */
  const handleApprovePayout = async () => {
    if (!selectedPayout || !paymentReference.trim()) {
      toast.error("Payment reference is required");
      return;
    }

    setProcessing(true);
    try {
      await adminAPI.approvePayout(selectedPayout._id, {
        paymentReference,
        paymentNotes,
        paymentMethod: "manual"
      });
      toast.success("Payout approved successfully");
      setSelectedPayout(null);
      setPaymentReference("");
      setPaymentNotes("");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve payout");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayout = async (payoutId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason?.trim()) return;

    setProcessing(true);
    try {
      await adminAPI.rejectPayout(payoutId, reason);
      toast.success("Payout rejected");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject payout");
    } finally {
      setProcessing(false);
    }
  };

  /* ---------- FILTER ---------- */
  const filteredPayouts = useMemo(() => {
    if (!appliedFrom || !appliedTo) return payouts;

    const from = new Date(appliedFrom).getTime();
    const to = new Date(appliedTo).getTime();

    return payouts.filter((p) => {
      const date = new Date(p.createdAt).getTime();
      return date >= from && date <= to;
    });
  }, [payouts, appliedFrom, appliedTo]);

  const visiblePayouts = filteredPayouts.slice(0, visibleCount);

  /* ---------- INFINITE SCROLL ---------- */
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisibleCount((v) =>
            Math.min(v + PAGE_SIZE, filteredPayouts.length)
          );
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [filteredPayouts.length]);

  if (loading) return <Skeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] text-white">
      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-6">

        {/* PAGE TITLE */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">💸 Payouts</h1>
          <p className="text-white/60 mt-1">
            Review and manage seller payout requests
          </p>
        </div>

        {/* TABS */}
        <div className="flex gap-2">
          {(["pending", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                tab === t
                  ? "bg-cyan-600 text-white shadow-lg"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
            >
              {t === "pending" ? "Pending" : "History"}
            </button>
          ))}
        </div>

        {/* PRESETS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
          <Preset label="Today" active={activePreset === "today"} onClick={() => togglePreset("today")} />
          <Preset label="Last 7 Days" active={activePreset === "7days"} onClick={() => togglePreset("7days")} />
          <Preset label="This Month" active={activePreset === "month"} onClick={() => togglePreset("month")} />
        </div>
      </div>

      {/* STICKY DATE FILTER */}
      <div className="sticky top-0 z-20 mt-4 bg-[#0a0a14]/85 backdrop-blur-xl border-y border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-hidden">

            {/* FROM */}
            <div className="relative flex-1 min-w-[120px] sm:min-w-[160px]">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                📅
              </span>
            </div>

            {/* TO */}
            <div className="relative flex-1 min-w-[120px] sm:min-w-[160px]">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                📅
              </span>
            </div>

            {/* SEARCH */}
            <button
              onClick={applySearch}
              disabled={!isValidRange || searching}
              className={`h-10 px-6 sm:px-8 rounded-lg text-sm font-semibold shrink-0 transition ${
                !isValidRange || searching
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 shadow-lg"
              }`}
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {visiblePayouts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center text-white/60">
            No payouts found
          </div>
        ) : (
          <div className="grid gap-4">
            {visiblePayouts.map((p) => (
              <div
                key={p._id}
                className="bg-white/5 border border-white/10 rounded-xl p-5"
              >
                <div className="flex justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-lg">{p.sellerId?.name || "Deleted Seller"}</p>
                    <p className="text-sm text-white/60">{p.sellerId?.email || "N/A"}</p>
                    <p className="text-xs text-white/40">
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">
                      ₹{p.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/50 uppercase">{p.status}</p>
                  </div>
                </div>

                {/* Bank Details */}
                {p.primaryBankAccount && (
                  <div className="bg-white/5 rounded-lg p-4 mb-4 text-sm">
                    <p className="text-white/60 text-xs mb-2">Bank Account Details</p>
                    <p className="font-mono">{p.primaryBankAccount.accountHolderName}</p>
                    <p className="font-mono text-white/80">{p.primaryBankAccount.accountNumber}</p>
                    <p className="font-mono text-white/80">{p.primaryBankAccount.ifscCode} - {p.primaryBankAccount.bankName}</p>
                  </div>
                )}

                {/* Financial Breakdown */}
                {p.financialBreakdown && (
                  <div className="bg-white/5 rounded-lg p-4 mb-4 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white/60">Requested Amount:</span>
                      <span className="font-semibold">₹{p.financialBreakdown.requestedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">GST (18%):</span>
                      <span className="text-red-400">-₹{p.financialBreakdown.gstOnCommission.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-semibold">
                      <span>Net Payable:</span>
                      <span className="text-green-400">₹{p.financialBreakdown.netPayableAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {tab === "pending" && p.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedPayout(p)}
                      disabled={processing}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50"
                    >
                      ✓ Mark as Paid
                    </button>
                    <button
                      onClick={() => handleRejectPayout(p._id)}
                      disabled={processing}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={loaderRef} />
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/20 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Confirm Payment</h2>
            
            {/* Payout Details */}
            <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">Seller:</span>
                <span className="font-semibold">{selectedPayout.sellerId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Email:</span>
                <span>{selectedPayout.sellerId?.email}</span>
              </div>
              {selectedPayout.primaryBankAccount && (
                <>
                  <div className="border-t border-white/10 pt-2 mt-2"></div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Account Holder:</span>
                    <span className="font-mono">{selectedPayout.primaryBankAccount.accountHolderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Account Number:</span>
                    <span className="font-mono">{selectedPayout.primaryBankAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">IFSC:</span>
                    <span className="font-mono">{selectedPayout.primaryBankAccount.ifscCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Bank:</span>
                    <span>{selectedPayout.primaryBankAccount.bankName}</span>
                  </div>
                </>
              )}
              <div className="border-t border-white/10 pt-2 mt-2"></div>
              <div className="flex justify-between text-lg">
                <span className="text-white/60">Amount to Transfer:</span>
                <span className="font-bold text-green-400">
                  ₹{(selectedPayout.financialBreakdown?.netPayableAmount || selectedPayout.amount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Payment Reference / UTR Number *
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter UTR or transaction reference"
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:border-cyan-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Payment Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any notes about this payment..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleApprovePayout}
                disabled={processing || !paymentReference.trim()}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Confirm Payment"}
              </button>
              <button
                onClick={() => {
                  setSelectedPayout(null);
                  setPaymentReference("");
                  setPaymentNotes("");
                }}
                disabled={processing}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI ---------- */

function Preset({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition shrink-0 ${
        active
          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] animate-pulse" />
  );
}
