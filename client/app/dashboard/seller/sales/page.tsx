// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { sellerAPI } from "@/lib/api";
// import toast from "react-hot-toast";

// interface Sale {
//   _id: string;
//   orderId: string;
//   productName: string;
//   productId: string;
//   buyerName: string;
//   buyerEmail: string;
//   amount: number;
//   platformFee: number;
//   sellerAmount: number;
//   status: "paid" | "created" | "failed";
//   date: string;
//   razorpayPaymentId?: string;
//   razorpayOrderId?: string;
// }

// export default function SellerSalesPage() {
//   const [sales, setSales] = useState<Sale[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "failed" | "created">("all");
//   const router = useRouter();

//   useEffect(() => {
//     fetchSales();
//   }, []);

//   const fetchSales = async () => {
//     try {
//       const data = await sellerAPI.getAllSales();
//       setSales(data.sales || []);
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to load sales");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredSales = sales.filter(sale => 
//     filterStatus === "all" || sale.status === filterStatus
//   );

//   const handleViewDetails = (sale: Sale) => {
//     setSelectedSale(sale);
//     setShowDetailsModal(true);
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "paid":
//         return "bg-green-100 text-green-700 border-green-300";
//       case "failed":
//         return "bg-red-100 text-red-700 border-red-300";
//       case "created":
//         return "bg-yellow-100 text-yellow-700 border-yellow-300";
//       default:
//         return "bg-gray-100 text-gray-700 border-gray-300";
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "paid":
//         return "✅";
//       case "failed":
//         return "❌";
//       case "created":
//         return "⏳";
//       default:
//         return "📦";
//     }
//   };

//   const stats = {
//     total: sales.length,
//     successful: sales.filter(s => s.status === "paid").length,
//     failed: sales.filter(s => s.status === "failed").length,
//     pending: sales.filter(s => s.status === "created").length,
//     totalRevenue: sales.filter(s => s.status === "paid").reduce((sum, s) => sum + s.amount, 0),
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <button
//             onClick={() => router.push("/dashboard/seller")}
//             className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2 font-semibold"
//           >
//             ← Back to Dashboard
//           </button>
//           <h1 className="text-4xl font-bold text-gray-900">Sales History</h1>
//           <p className="text-gray-600 mt-2">View all your sales (successful, failed, and pending)</p>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
//           <div className="bg-white rounded-lg shadow p-6">
//             <p className="text-sm text-gray-600 font-medium">Total Sales</p>
//             <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
//           </div>
//           <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
//             <p className="text-sm text-gray-600 font-medium">Successful</p>
//             <p className="text-3xl font-bold text-green-600 mt-2">{stats.successful}</p>
//           </div>
//           <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
//             <p className="text-sm text-gray-600 font-medium">Failed</p>
//             <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
//           </div>
//           <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
//             <p className="text-sm text-gray-600 font-medium">Pending</p>
//             <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
//           </div>
//           <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
//             <p className="text-sm text-gray-600 font-medium">Revenue</p>
//             <p className="text-2xl font-bold text-blue-600 mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
//           </div>
//         </div>

//         {/* Filter Buttons */}
//         <div className="mb-6 flex gap-2 flex-wrap">
//           {(["all", "paid", "failed", "created"] as const).map(status => (
//             <button
//               key={status}
//               onClick={() => setFilterStatus(status)}
//               className={`px-4 py-2 rounded-lg font-semibold transition ${
//                 filterStatus === status
//                   ? "bg-purple-600 text-white"
//                   : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
//               }`}
//             >
//               {status === "all" ? "All Sales" : 
//                status === "paid" ? `✅ Successful (${stats.successful})` :
//                status === "failed" ? `❌ Failed (${stats.failed})` :
//                `⏳ Pending (${stats.pending})`}
//             </button>
//           ))}
//         </div>

//         {/* Sales List */}
//         {filteredSales.length === 0 ? (
//           <div className="bg-white rounded-lg shadow p-12 text-center">
//             <p className="text-gray-500 text-lg">No sales found</p>
//           </div>
//         ) : (
//           <div className="grid gap-4">
//             {filteredSales.map((sale) => (
//               <div
//                 key={sale._id}
//                 onClick={() => handleViewDetails(sale)}
//                 className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer"
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-2">
//                       <span className="text-2xl">{getStatusIcon(sale.status)}</span>
//                       <h3 className="text-xl font-bold text-gray-900">{sale.productName}</h3>
//                       <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(sale.status)}`}>
//                         {sale.status === "paid" ? "Success" : sale.status === "failed" ? "Failed" : "Pending"}
//                       </span>
//                     </div>
//                     <p className="text-sm text-gray-600">
//                       Buyer: <span className="font-medium">{sale.buyerName}</span> ({sale.buyerEmail})
//                     </p>
//                     <p className="text-sm text-gray-500 mt-1">
//                       Order ID: {sale.orderId}
//                     </p>
//                     <p className="text-sm text-gray-500">
//                       Date: {new Date(sale.date).toLocaleString()}
//                     </p>
//                   </div>

//                   <div className="text-right ml-4">
//                     <p className="text-3xl font-bold text-gray-900">₹{sale.amount.toLocaleString()}</p>
//                     {sale.status === "paid" && (
//                       <p className="text-sm text-green-600 font-semibold mt-2">
//                         You earned: ₹{sale.sellerAmount.toLocaleString()}
//                       </p>
//                     )}
//                     <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition">
//                       View Details
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Details Modal */}
//       {showDetailsModal && selectedSale && (
//         <div
//           onClick={() => setShowDetailsModal(false)}
//           className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white rounded-lg max-w-2xl w-full p-8 shadow-xl max-h-[90vh] overflow-y-auto"
//           >
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">Sale Details</h2>

//             <div className="space-y-6">
//               {/* Status Badge */}
//               <div className="flex items-center justify-center">
//                 <span className={`px-6 py-3 rounded-full text-lg font-bold border-2 ${getStatusColor(selectedSale.status)}`}>
//                   {getStatusIcon(selectedSale.status)} {selectedSale.status === "paid" ? "Payment Successful" : selectedSale.status === "failed" ? "Payment Failed" : "Payment Pending"}
//                 </span>
//               </div>

//               {/* Order Information */}
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Order Information</h3>
//                 <div className="space-y-2">
//                   <p className="text-gray-900">
//                     <span className="font-semibold">Product:</span> {selectedSale.productName}
//                   </p>
//                   <p className="text-gray-900">
//                     <span className="font-semibold">Order ID:</span> {selectedSale.orderId}
//                   </p>
//                   {selectedSale.razorpayOrderId && (
//                     <p className="text-gray-900">
//                       <span className="font-semibold">Razorpay Order ID:</span> {selectedSale.razorpayOrderId}
//                     </p>
//                   )}
//                   {selectedSale.razorpayPaymentId && (
//                     <p className="text-gray-900">
//                       <span className="font-semibold">Payment ID:</span> {selectedSale.razorpayPaymentId}
//                     </p>
//                   )}
//                   <p className="text-gray-900">
//                     <span className="font-semibold">Date:</span> {new Date(selectedSale.date).toLocaleString()}
//                   </p>
//                 </div>
//               </div>

//               {/* Buyer Information */}
//               <div className="bg-blue-50 rounded-lg p-4">
//                 <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Buyer Information</h3>
//                 <div className="space-y-2">
//                   <p className="text-gray-900">
//                     <span className="font-semibold">Name:</span> {selectedSale.buyerName}
//                   </p>
//                   <p className="text-gray-900">
//                     <span className="font-semibold">Email:</span> {selectedSale.buyerEmail}
//                   </p>
//                 </div>
//               </div>

//               {/* Financial Breakdown (only for paid) */}
//               {selectedSale.status === "paid" && (
//                 <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
//                   <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Financial Breakdown</h3>
//                   <div className="space-y-3">
//                     <div className="flex justify-between items-center pb-3 border-b border-green-200">
//                       <div>
//                         <p className="text-gray-700 font-semibold">Sale Amount</p>
//                         <p className="text-xs text-gray-600">Total from buyer</p>
//                       </div>
//                       <p className="text-2xl font-bold text-blue-600">₹{selectedSale.amount.toLocaleString()}</p>
//                     </div>

//                     <div className="flex justify-between items-center pb-3 border-b border-green-200">
//                       <div>
//                         <p className="text-gray-700 font-semibold">Platform Fee (10%)</p>
//                         <p className="text-xs text-gray-600">Commission deducted</p>
//                       </div>
//                       <p className="text-lg font-bold text-red-600">-₹{selectedSale.platformFee.toLocaleString()}</p>
//                     </div>

//                     <div className="flex justify-between items-center pb-3 border-b border-green-200">
//                       <div>
//                         <p className="text-gray-700 font-semibold">GST (18%)</p>
//                         <p className="text-xs text-gray-600">Tax on commission</p>
//                       </div>
//                       <p className="text-lg font-bold text-orange-600">-₹{Math.round(selectedSale.platformFee * 0.18).toLocaleString()}</p>
//                     </div>

//                     <div className="flex justify-between items-center pt-3">
//                       <div>
//                         <p className="text-gray-900 font-bold text-lg">You Received</p>
//                         <p className="text-xs text-gray-600">Net amount</p>
//                       </div>
//                       <p className="text-3xl font-bold text-green-600">₹{selectedSale.sellerAmount.toLocaleString()}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Failed Payment Info */}
//               {selectedSale.status === "failed" && (
//                 <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
//                   <p className="text-red-900 font-semibold">❌ Payment Failed</p>
//                   <p className="text-sm text-red-700 mt-2">
//                     The buyer's payment was unsuccessful. No amount was transferred. The sale can be retried by the buyer.
//                   </p>
//                 </div>
//               )}

//               {/* Pending Payment Info */}
//               {selectedSale.status === "created" && (
//                 <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
//                   <p className="text-yellow-900 font-semibold">⏳ Payment Pending</p>
//                   <p className="text-sm text-yellow-700 mt-2">
//                     The order was created but payment has not been completed yet. Waiting for buyer to complete the payment.
//                   </p>
//                 </div>
//               )}
//             </div>

//             <button
//               onClick={() => setShowDetailsModal(false)}
//               className="mt-6 w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition"
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

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";

/* ================= TYPES ================= */

interface Sale {
  _id: string;
  orderId: string;
  productName: string;
  productId: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  platformFee: number;
  sellerAmount: number;
  status: "paid" | "created" | "failed";
  date: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
}

/* ================= PAGE ================= */

export default function SellerSalesPage() {
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] =
    useState<"all" | "paid" | "failed" | "created">("all");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const data = await sellerAPI.getAllSales();
      setSales(data.sales || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DEBOUNCE SEARCH ================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ================= FILTERED SALES ================= */

  const filteredSales = useMemo(() => {
    let data = [...sales];

    if (filterStatus !== "all") {
      data = data.filter((s) => s.status === filterStatus);
    }

    if (debouncedSearch) {
      data = data.filter(
        (s) =>
          s.productName.toLowerCase().includes(debouncedSearch) ||
          s.buyerName.toLowerCase().includes(debouncedSearch) ||
          s.orderId.toLowerCase().includes(debouncedSearch)
      );
    }

    return data;
  }, [sales, filterStatus, debouncedSearch]);

  /* ================= STATS ================= */

  const stats = {
    total: filteredSales.length,
    successful: filteredSales.filter((s) => s.status === "paid").length,
    failed: filteredSales.filter((s) => s.status === "failed").length,
    pending: filteredSales.filter((s) => s.status === "created").length,
    revenue: filteredSales
      .filter((s) => s.status === "paid")
      .reduce((sum, s) => sum + s.amount, 0),
  };

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!filteredSales.length) return;

    const headers = [
      "Order ID",
      "Product",
      "Buyer",
      "Email",
      "Amount",
      "Platform Fee",
      "Seller Amount",
      "Status",
      "Date",
    ];

    const rows = filteredSales.map((s) => [
      s.orderId,
      s.productName,
      s.buyerName,
      s.buyerEmail,
      s.amount,
      s.platformFee,
      s.sellerAmount,
      s.status,
      new Date(s.date).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sales.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= HELPERS ================= */

  const statusBadge = (status: Sale["status"]) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/20 text-emerald-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      case "created":
        return "bg-yellow-500/20 text-yellow-400";
    }
  };

  /* ================= SKELETON ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-6 w-48 bg-neutral-800 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-neutral-800 rounded-xl" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-neutral-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push("/dashboard/seller")}
              className="text-cyan-400 text-sm"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold mt-1">Sales History</h1>
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
            ["Total", stats.total],
            ["Successful", stats.successful],
            ["Failed", stats.failed],
            ["Pending", stats.pending],
            ["Revenue", `₹${stats.revenue.toLocaleString()}`],
          ].map(([label, value], i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-xl p-4"
            >
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex items-center gap-3 sm:gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, buyer, order ID"
            className="flex-1 bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-0"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-20 sm:w-30 bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="created">Pending</option>
          </select>
        </div>

        {/* LIST */}
        {filteredSales.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center text-gray-400">
            No sales found
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((s) => (
              <div
                key={s._id}
                onClick={() => {
                  setSelectedSale(s);
                  setShowDetailsModal(true);
                }}
                className="
                  bg-white/10 backdrop-blur-xl
                  border border-white/15
                  rounded-xl p-4
                  hover:border-cyan-400/40
                  hover:scale-[1.01]
                  transition cursor-pointer
                "
              >
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{s.productName}</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${statusBadge(
                          s.status
                        )}`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {s.buyerName} • {new Date(s.date).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Order ID: {s.orderId}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-cyan-400 font-bold">
                      ₹{s.amount.toLocaleString()}
                    </p>
                    {s.status === "paid" && (
                      <p className="text-emerald-400 text-sm">
                        ₹{s.sellerAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showDetailsModal && selectedSale && (
        <div
          onClick={() => setShowDetailsModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/20 rounded-xl max-w-xl w-full p-6"
          >
            <h2 className="text-lg font-bold mb-4">Sale Details</h2>

            <div className="text-sm text-gray-300 space-y-2">
              <p><b>Product:</b> {selectedSale.productName}</p>
              <p><b>Order ID:</b> {selectedSale.orderId}</p>
              <p><b>Buyer:</b> {selectedSale.buyerName}</p>
              <p><b>Status:</b> {selectedSale.status}</p>

              {selectedSale.status === "paid" && (
                <>
                  <p>Amount: ₹{selectedSale.amount}</p>
                  <p className="text-red-400">
                    Fee: -₹{selectedSale.platformFee}
                  </p>
                  <p className="text-emerald-400 font-bold">
                    You received: ₹{selectedSale.sellerAmount}
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
