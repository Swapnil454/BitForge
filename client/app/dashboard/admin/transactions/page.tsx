"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface Transaction {
  _id: string;
  type: "buyer_to_admin" | "admin_to_seller";
  orderId: string;
  buyerName?: string;
  buyerEmail?: string;
  sellerName?: string;
  sellerEmail?: string;
  productName: string;
  amount: number;
  status: "success" | "failed" | "pending";
  date: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  errorReason?: string;
}

type SortKey = "date" | "amount" | "status" | "type";
type SortDir = "asc" | "desc";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<"all" | "buyer_to_admin" | "admin_to_seller">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const router = useRouter();
  

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await adminAPI.getAllTransactions();
      setTransactions(data.transactions || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER + SORT ================= */

  const filteredTransactions = useMemo(() => {
    let data = [...transactions];

    data = data.filter(t => {
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      const matchesSearch =
        !searchTerm ||
        t.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sellerName?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesType && matchesStatus && matchesSearch;
    });

    data.sort((a, b) => {
      let A: any = a[sortKey];
      let B: any = b[sortKey];

      if (sortKey === "date") {
        A = new Date(a.date).getTime();
        B = new Date(b.date).getTime();
      }

      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [transactions, filterType, filterStatus, searchTerm, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [filterType, filterStatus, searchTerm, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);

  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );


  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ================= EXPORT EXCEL ================= */

  const exportExcel = () => {
    if (!filteredTransactions.length) {
      toast.error("No data to export");
      return;
    }

    const rows = filteredTransactions.map(t => ({
      Date: new Date(t.date).toLocaleString(),
      Type: t.type === "buyer_to_admin" ? "Buyer → Admin" : "Admin → Seller",
      OrderID: t.orderId,
      Product: t.productName,
      Amount: t.amount,
      Status: t.status,
      Buyer: t.buyerName || "",
      Seller: t.sellerName || "",
      PaymentID: t.razorpayPaymentId || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "transactions.xlsx");
  };

  /* ================= STATS ================= */

  const stats = {
    total: transactions.length,
    buyerToAdmin: transactions.filter(t => t.type === "buyer_to_admin").length,
    adminToSeller: transactions.filter(t => t.type === "admin_to_seller").length,
    totalAmount: transactions.filter(t => t.status === "success").reduce((s, t) => s + t.amount, 0),
  };

  /* ================= UI HELPERS ================= */

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 hover:text-cyan-300"
    >
      {label}
      {sortKey === field && (sortDir === "asc" ? "↑" : "↓")}
    </button>
  );

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="text-cyan-400 hover:text-cyan-300 text-sm mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">Transaction History</h1>
          <p className="text-white/60">All payments and payouts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Total", stats.total],
            ["Buyer Payments", stats.buyerToAdmin],
            ["Seller Payouts", stats.adminToSeller],
            ["Total Amount", `₹${stats.totalAmount.toLocaleString()}`],
          ].map(([l, v]) => (
            <div key={l as string} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-white/60">{l}</p>
              <p className="text-2xl font-bold text-white">{v}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        {/* <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-wrap gap-3">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search…"
            className="flex-1 min-w-[220px] px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-white outline-none"
          />

          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-white">
            <option value="all">All Types</option>
            <option value="buyer_to_admin">Buyer → Admin</option>
            <option value="admin_to_seller">Admin → Seller</option>
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-white">
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          <button
            onClick={exportExcel}
            className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl hover:bg-emerald-500/30"
          >
            Export Excel
          </button>
        </div> */}

        <div className="flex flex-col md:flex-row md:items-center gap-3">

  {/* FILTER GLASS (unchanged) */}
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-wrap gap-3 flex-1">
    <input
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      placeholder="Search…"
      className="flex-1 min-w-[220px] px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-white outline-none"
    />

    <div className="relative">
      <select
        value={filterType}
        onChange={e => setFilterType(e.target.value as any)}
        className="
          appearance-none
          px-4 py-2 pr-10
          bg-white/10
          border border-white/15
          rounded-xl
          text-white
          backdrop-blur-xl
          outline-none
          focus:border-cyan-400/60
          focus:ring-2 focus:ring-cyan-400/30
          transition
          cursor-pointer
        "
      >
        <option value="all" className="bg-[#0b1220] text-white">
          All Types
        </option>
        <option value="buyer_to_admin" className="bg-[#0b1220] text-white">
          Buyer → Admin
        </option>
        <option value="admin_to_seller" className="bg-[#0b1220] text-white">
          Admin → Seller
        </option>
      </select>

      {/* Custom arrow */}
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <div className="relative">
      <select
        value={filterStatus}
        onChange={e => setFilterStatus(e.target.value as any)}
        className="
          appearance-none
          px-4 py-2 pr-10
          bg-white/10
          border border-white/15
          rounded-xl
          text-white
          backdrop-blur-xl
          outline-none
          focus:border-purple-400/60
          focus:ring-2 focus:ring-purple-400/30
          transition
          cursor-pointer
        "
      >
        <option value="all" className="bg-[#0b1220] text-white">
          All Status
        </option>
        <option value="success" className="bg-[#0b1220] text-white">
          Success
        </option>
        <option value="failed" className="bg-[#0b1220] text-white">
          Failed
        </option>
        <option value="pending" className="bg-[#0b1220] text-white">
          Pending
        </option>
      </select>

      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>

  </div>

  {/* EXPORT BUTTON (RIGHT SIDE) */}
  <div className="flex justify-end">
    <button
      onClick={exportExcel}
      className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl hover:bg-emerald-500/30 whitespace-nowrap"
    >
      Export Excel
    </button>
  </div>

</div>


        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 text-white/60">
                <tr>
                  <th className="px-6 py-4"><SortHeader label="Date" field="date" /></th>
                  <th className="px-6 py-4"><SortHeader label="Type" field="type" /></th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4"><SortHeader label="Amount" field="amount" /></th>
                  <th className="px-6 py-4"><SortHeader label="Status" field="status" /></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-white/10 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-white/60">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map(t => (
                    <tr
                      key={t._id}
                      onClick={() => setSelectedTx(t)}
                      className="hover:bg-white/5 cursor-pointer"
                    >
                      <td className="px-6 py-4 text-white/70">{new Date(t.date).toLocaleString()}</td>
                      <td className="px-6 py-4 text-white">{t.type === "buyer_to_admin" ? "Buyer → Admin" : "Admin → Seller"}</td>
                      <td className="px-6 py-4 text-white">{t.orderId}</td>
                      <td className="px-6 py-4 text-white/80 truncate max-w-xs">{t.productName}</td>
                      <td className="px-6 py-4 text-white/80">{t.buyerName || t.sellerName}</td>
                      <td className="px-6 py-4 text-emerald-400 font-bold">₹{t.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-white">{t.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {selectedTx && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedTx(null)}>
            <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-xl w-full">
              <h3 className="text-xl font-bold text-white mb-4">Transaction Details</h3>
              <pre className="text-white/80 text-sm whitespace-pre-wrap">
                {JSON.stringify(selectedTx, null, 2)}
              </pre>
              <button onClick={() => setSelectedTx(null)} className="mt-4 w-full py-2 bg-white/10 rounded-lg text-white">
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
