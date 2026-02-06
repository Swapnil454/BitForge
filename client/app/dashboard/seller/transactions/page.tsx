// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { sellerAPI } from "@/lib/api";
// import toast from "react-hot-toast";

// /* ================= TYPES ================= */

// interface SellerTransaction {
//   _id: string;
//   orderId: string;
//   productName: string;
//   buyerName: string;
//   buyerEmail: string;
//   saleAmount: number;
//   platformFee: number;
//   gstOnFee: number;
//   netAmount: number;
//   date: string;
//   status: "completed" | "pending" | "cancelled";
// }

// /* ================= PAGE ================= */

// export default function SellerTransactionsPage() {
//   const searchParams = useSearchParams();
//   const period = searchParams.get("period");

//   const [allTransactions, setAllTransactions] = useState<SellerTransaction[]>([]);
//   const [transactions, setTransactions] = useState<SellerTransaction[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedTransaction, setSelectedTransaction] =
//     useState<SellerTransaction | null>(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);

//   const router = useRouter();

//   useEffect(() => {
//     fetchTransactions();
//   }, []);

//   useEffect(() => {
//     if (period === "month") {
//       const now = new Date();
//       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//       setTransactions(
//         allTransactions.filter(
//           (t) => new Date(t.date) >= startOfMonth
//         )
//       );
//     } else {
//       setTransactions(allTransactions);
//     }
//   }, [allTransactions, period]);

//   const fetchTransactions = async () => {
//     try {
//       const data = await sellerAPI.getTransactions();
//       setAllTransactions(data.transactions || []);
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to load transactions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "completed":
//         return "bg-emerald-500/20 text-emerald-400";
//       case "pending":
//         return "bg-yellow-500/20 text-yellow-400";
//       case "cancelled":
//         return "bg-red-500/20 text-red-400";
//       default:
//         return "bg-gray-500/20 text-gray-400";
//     }
//   };

//   const stats = {
//     total: transactions.length,
//     totalRevenue: transactions
//       .filter((t) => t.status === "completed")
//       .reduce((s, t) => s + t.saleAmount, 0),
//     totalFee: transactions
//       .filter((t) => t.status === "completed")
//       .reduce((s, t) => s + t.platformFee, 0),
//     totalGST: transactions
//       .filter((t) => t.status === "completed")
//       .reduce((s, t) => s + t.gstOnFee, 0),
//     totalEarned: transactions
//       .filter((t) => t.status === "completed")
//       .reduce((s, t) => s + t.netAmount, 0),
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-900 to-black">
//         <div className="h-12 w-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white p-6">
//       <div className="max-w-7xl mx-auto space-y-8">

//         {/* HEADER */}
//         <div className="space-y-3">
//           <button
//             onClick={() => router.push("/dashboard/seller")}
//             className="text-cyan-400 hover:text-cyan-300 font-semibold"
//           >
//             ← Back to Dashboard
//           </button>

//           <h1 className="text-2xl sm:text-4xl font-bold">
//             {period === "month"
//               ? "This Month’s Transactions"
//               : "Your Transactions"}
//           </h1>

//           <p className="text-gray-400 text-sm sm:text-base">
//             {period === "month"
//               ? `Viewing ${new Date().toLocaleString("default", {
//                   month: "long",
//                   year: "numeric",
//                 })}`
//               : "View all your sales and earnings breakdown"}
//           </p>
//         </div>

//         {/* STATS */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
//           {[
//             ["Transactions", stats.total, "text-white"],
//             ["Revenue", `₹${stats.totalRevenue}`, "text-cyan-400"],
//             ["Platform Fee", `-₹${stats.totalFee}`, "text-red-400"],
//             ["GST", `-₹${stats.totalGST}`, "text-orange-400"],
//             ["Net Earned", `₹${stats.totalEarned}`, "text-emerald-400"],
//           ].map(([label, value, color], i) => (
//             <div
//               key={i}
//               className="
//                 bg-white/10 backdrop-blur-xl border border-white/20
//                 rounded-xl sm:rounded-2xl
//                 px-4 py-3 sm:p-4
//                 flex items-center justify-between
//                 md:block
//               "
//             >
//               <p className="text-xs text-gray-400 md:text-sm">
//                 {label}
//               </p>

//               <p className={`text-lg sm:text-xl md:text-2xl font-bold ${color}`}>
//                 {value}
//               </p>
//             </div>
//           ))}
//         </div>


//         {/* TRANSACTIONS */}
//         {transactions.length === 0 ? (
//           <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center text-gray-400">
//             No transactions yet
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {transactions.map((t) => (
//               <div
//                 key={t._id}
//                 className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5"
//               >
//                 <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
//                   <div>
//                     <div className="flex items-center gap-3">
//                       <h3 className="text-lg font-bold">{t.productName}</h3>
//                       <span
//                         className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
//                           t.status
//                         )}`}
//                       >
//                         {t.status}
//                       </span>
//                     </div>

//                     <p className="text-sm text-gray-400 mt-1">
//                       Buyer: {t.buyerName} ({t.buyerEmail})
//                     </p>

//                     <p className="text-xs text-gray-500 mt-1">
//                       {new Date(t.date).toLocaleString()}
//                     </p>
//                   </div>

//                   <div className="sm:text-right">
//                     <p className="text-2xl font-bold text-cyan-400">
//                       ₹{t.saleAmount.toLocaleString()}
//                     </p>
//                     <p className="text-sm text-emerald-400 font-semibold">
//                       You get ₹{t.netAmount.toLocaleString()}
//                     </p>

//                     <button
//                       onClick={() => {
//                         setSelectedTransaction(t);
//                         setShowDetailsModal(true);
//                       }}
//                       className="mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-semibold"
//                     >
//                       View Details
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* DETAILS MODAL */}
//       {showDetailsModal && selectedTransaction && (
//         <div
//           onClick={() => setShowDetailsModal(false)}
//           className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-slate-900 border border-white/20 rounded-2xl max-w-2xl w-full p-6"
//           >
//             <h2 className="text-2xl font-bold mb-4">
//               Transaction Details
//             </h2>

//             <div className="space-y-3 text-sm text-gray-300">
//               <p><b>Product:</b> {selectedTransaction.productName}</p>
//               <p><b>Order ID:</b> {selectedTransaction.orderId}</p>
//               <p><b>Buyer:</b> {selectedTransaction.buyerName}</p>
//               <p><b>Status:</b> {selectedTransaction.status}</p>

//               <div className="border-t border-white/20 pt-3 space-y-2">
//                 <p>Sale Amount: ₹{selectedTransaction.saleAmount}</p>
//                 <p className="text-red-400">
//                   Platform Fee: -₹{selectedTransaction.platformFee}
//                 </p>
//                 <p className="text-orange-400">
//                   GST: -₹{selectedTransaction.gstOnFee}
//                 </p>
//                 <p className="text-emerald-400 font-bold text-lg">
//                   You Receive: ₹{selectedTransaction.netAmount}
//                 </p>
//               </div>
//             </div>

//             <button
//               onClick={() => setShowDetailsModal(false)}
//               className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";

/* ================= TYPES ================= */

interface SellerTransaction {
  _id: string;
  orderId: string;
  productName: string;
  buyerName: string;
  buyerEmail: string;
  saleAmount: number;
  platformFee: number;
  gstOnFee: number;
  netAmount: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
}

const PAGE_SIZE = 6;

/* ================= PAGE ================= */

function SellerTransactionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get("period");

  const [allTransactions, setAllTransactions] = useState<SellerTransaction[]>([]);
  const [visibleTransactions, setVisibleTransactions] = useState<SellerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | SellerTransaction["status"]>("all");
  const [page, setPage] = useState(1);

  const observerRef = useRef<HTMLDivElement | null>(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await sellerAPI.getTransactions();
      setAllTransactions(res.transactions || []);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER ================= */

  const filteredTransactions = useMemo(() => {
    let data = [...allTransactions];

    if (period === "month") {
      const start = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
      data = data.filter((t) => new Date(t.date) >= start);
    }

    if (status !== "all") {
      data = data.filter((t) => t.status === status);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.productName.toLowerCase().includes(q) ||
          t.buyerName.toLowerCase().includes(q) ||
          t.orderId.toLowerCase().includes(q)
      );
    }

    return data;
  }, [allTransactions, search, status, period]);

  /* ================= STATS ================= */

  const stats = {
    total: filteredTransactions.length,
    revenue: filteredTransactions
      .filter((t) => t.status === "completed")
      .reduce((s, t) => s + t.saleAmount, 0),
    fee: filteredTransactions
      .filter((t) => t.status === "completed")
      .reduce((s, t) => s + t.platformFee, 0),
    gst: filteredTransactions
      .filter((t) => t.status === "completed")
      .reduce((s, t) => s + t.gstOnFee, 0),
    earned: filteredTransactions
      .filter((t) => t.status === "completed")
      .reduce((s, t) => s + t.netAmount, 0),
  };

  /* ================= PAGINATION ================= */

  useEffect(() => {
    setPage(1);
    setVisibleTransactions(filteredTransactions.slice(0, PAGE_SIZE));
  }, [filteredTransactions]);

  const loadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);

    setTimeout(() => {
      const nextPage = page + 1;
      setVisibleTransactions(
        filteredTransactions.slice(0, nextPage * PAGE_SIZE)
      );
      setPage(nextPage);
      setLoadingMore(false);
    }, 300);
  };

  /* ================= INFINITE SCROLL ================= */

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (
        entries[0].isIntersecting &&
        visibleTransactions.length < filteredTransactions.length
      ) {
        loadMore();
      }
    });

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [visibleTransactions, filteredTransactions]);

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!filteredTransactions.length) return;

    const headers = [
      "Order ID",
      "Product",
      "Buyer",
      "Email",
      "Sale Amount",
      "Platform Fee",
      "GST",
      "Net Amount",
      "Status",
      "Date",
    ];

    const rows = filteredTransactions.map((t) => [
      t.orderId,
      t.productName,
      t.buyerName,
      t.buyerEmail,
      t.saleAmount,
      t.platformFee,
      t.gstOnFee,
      t.netAmount,
      t.status,
      new Date(t.date).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= SIMPLE DARK SKELETON ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 space-y-6">
        <div className="h-6 w-48 bg-neutral-800 rounded skeleton" />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-neutral-800 rounded-xl skeleton" />
          ))}
        </div>

        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-neutral-800 rounded-xl skeleton" />
        ))}
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-slate-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push("/dashboard/seller")}
              className="text-cyan-400 text-sm"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">
              {period === "month" ? "This Month’s Transactions" : "Your Transactions"}
            </h1>
          </div>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-semibold"
          >
            Export CSV
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["Transactions", stats.total],
            ["Revenue", `₹${stats.revenue}`],
            ["Platform Fee", `₹${stats.fee}`],
            ["GST", `₹${stats.gst}`],
            ["Net Earned", `₹${stats.earned}`],
          ].map(([label, value], i) => (
            <div
              key={i}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
            >
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="glass-input flex-1"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="glass-input w-40"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* LIST / EMPTY STATE */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-gray-400">
            No transactions found
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visibleTransactions.map((t) => (
                <div
                  key={t._id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{t.productName}</p>
                      <p className="text-xs text-gray-400">
                        {t.buyerName} • {new Date(t.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-bold">₹{t.saleAmount}</p>
                      <p className="text-emerald-400 text-sm">
                        ₹{t.netAmount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {visibleTransactions.length < filteredTransactions.length && (
              <div ref={observerRef} className="flex justify-center py-4">
                <div className="h-6 w-6 border-2 border-neutral-700 border-t-cyan-400 rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .glass-input {
          background: #0b0b0b;
          border: 1px solid #1f1f1f;
          border-radius: 0.75rem;
          padding: 0.6rem 0.9rem;
          color: white;
        }

        @keyframes softPulse {
          0% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.75;
          }
          100% {
            opacity: 0.55;
          }
        }

        .skeleton {
          animation: softPulse 1.6s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}

function SellerTransactionsFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-900 to-black">
      <div className="h-12 w-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

export default function SellerTransactionsPage() {
  return (
    <Suspense fallback={<SellerTransactionsFallback />}>
      <SellerTransactionsPageContent />
    </Suspense>
  );
}

