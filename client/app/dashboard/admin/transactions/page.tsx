"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical } from "lucide-react";

import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import AdminInlineSearchFilters, { SortOption, StatusFilter, TypeFilter } from "./components/AdminInlineSearchFilters";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, searchTerm, sortBy]);

  const router = useRouter();

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, statusFilter, searchTerm, sortBy]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getAllTransactions({
        page,
        limit: PAGE_SIZE,
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        sortBy,
      });
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EXPORT EXCEL ================= */

  const exportExcel = async () => {
    setHeaderMenuOpen(false);
    const toastId = toast.loading("Preparing export...");
    try {
      // Fetch all matching data for export (limit 5000)
      const data = await adminAPI.getAllTransactions({
        limit: 5000,
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        sortBy,
      });

      if (!data.transactions?.length) {
        toast.error("No data to export", { id: toastId });
        return;
      }

      const rows = data.transactions.map((t: Transaction) => ({
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
      XLSX.writeFile(workbook, `admin_transactions_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Export successful", { id: toastId });
    } catch (error) {
      toast.error("Export failed", { id: toastId });
    }
  };

  const paginatedTransactions = transactions;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        title="Transaction History"
        subtitle="Manage all payments and payouts globally"
        rightSlot={
          <div className="relative" ref={headerMenuRef}>
            <button
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              className="h-10 w-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition"
            >
              <MoreVertical className="h-5 w-5 text-slate-600 dark:text-white/70" />
            </button>

            <AnimatePresence>
              {headerMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0a0a14]/95 p-1.5 shadow-2xl shadow-gray-200/50 dark:shadow-black/40 backdrop-blur-xl z-50"
                >
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      router.push("/dashboard/admin/transactions/analytics");
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    View Analytics
                  </button>
                  <button
                    onClick={exportExcel}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-400 transition"
                  >
                    Export to Excel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-2 sm:px-6 py-4 space-y-4">
        <AdminInlineSearchFilters
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClearAll={() => {
            setSearchTerm("");
            setTypeFilter("all");
            setStatusFilter("all");
            setSortBy("date_desc");
          }}
        />

        {/* Table Container */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed sm:table-auto">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                  <th className="w-[85px] sm:w-auto px-2 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Date</th>
                  <th className="w-[70px] sm:w-auto px-2 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Type</th>
                  <th className="px-2 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Product</th>
                  <th className="hidden xs:table-cell px-2 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">User</th>
                  <th className="w-[80px] sm:w-auto px-2 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 text-right">Amount</th>
                  <th className="w-[70px] sm:w-auto px-2 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-2 py-3 sm:px-6 sm:py-5"><div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-12" /></td>
                      <td className="px-2 py-3 sm:px-6 sm:py-5"><div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-10" /></td>
                      <td className="px-2 py-3 sm:px-6 sm:py-5"><div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-full" /></td>
                      <td className="hidden xs:table-cell px-2 py-3 sm:px-6 sm:py-5"><div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-16" /></td>
                      <td className="px-2 py-3 sm:px-6 sm:py-5 text-right"><div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-10 ml-auto" /></td>
                      <td className="px-2 py-3 sm:px-6 sm:py-5"><div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-8 mx-auto" /></td>
                    </tr>
                  ))
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 dark:text-white/40 italic">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => setSelectedTx(t)}
                      className="group cursor-pointer hover:bg-white/[0.04] transition-colors"
                    >
                      <td className="px-2 py-3 sm:px-6 sm:py-4">
                        <p className="text-[10px] sm:text-sm font-medium text-slate-700 dark:text-white/80">
                          {new Date(t.date).toLocaleDateString("en-GB")}
                        </p>
                        <p className="text-[9px] sm:text-[11px] text-slate-400 dark:text-white/40 mt-0.5 uppercase">
                          {new Date(t.date).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </td>
                      <td className="px-2 py-3 sm:px-6 sm:py-4">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold border ${
                            t.type === "buyer_to_admin"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {t.type === "buyer_to_admin" ? "BUYER" : "PAYOUT"}
                        </span>
                      </td>
                      <td className="px-2 py-3 sm:px-6 sm:py-4">
                        <p className="text-[10px] sm:text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[200px] group-hover:text-cyan-400 transition-colors">
                          {t.productName}
                        </p>
                        <p className="text-[9px] sm:text-[11px] font-mono text-slate-300 dark:text-white/30 mt-0.5">{t.orderId.slice(-8)}</p>
                      </td>
                      <td className="hidden xs:table-cell px-2 py-3 sm:px-6 sm:py-4">
                        <p className="text-[10px] sm:text-sm font-medium text-slate-600 dark:text-white/70 truncate max-w-[80px] sm:max-w-none">
                          {t.buyerName || t.sellerName}
                        </p>
                      </td>
                      <td className="px-2 py-3 sm:px-6 sm:py-4 text-right">
                        <p className="text-[11px] sm:text-base font-bold text-slate-900 dark:text-white">{t.amount.toString().includes("₹") ? t.amount : `₹${Number(t.amount).toLocaleString()}`}</p>
                      </td>
                      <td className="px-2 py-3 sm:px-6 sm:py-4 text-center">
                        <div className="flex items-center justify-center">
                          <span
                            className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${
                              t.status === "success"
                                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                                : t.status === "failed"
                                ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]"
                                : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                            }`}
                          />
                          <span className="ml-1.5 sm:ml-2 text-[9px] sm:text-xs font-semibold text-slate-700 dark:text-white/80 capitalize">{t.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-3 py-2.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-white/40">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-white/10 bg-[#0a0a14] p-6 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setSelectedTx(null)} className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Transaction Details</h3>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Order ID" value={selectedTx.orderId} isMono />
                  <DetailItem label="Status" value={selectedTx.status} />
                  <DetailItem label="Amount" value={`₹${selectedTx.amount.toLocaleString()}`} />
                  <DetailItem label="Date" value={new Date(selectedTx.date).toLocaleString()} />
                </div>
                
                <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                  <DetailItem label="Product" value={selectedTx.productName} />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-300 dark:text-white/30 font-bold mb-2">User Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Name" value={selectedTx.buyerName || selectedTx.sellerName || "N/A"} />
                    <DetailItem label="Email" value={selectedTx.buyerEmail || selectedTx.sellerEmail || "N/A"} />
                  </div>
                </div>

                {selectedTx.razorpayPaymentId && (
                  <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-300 dark:text-white/30 font-bold mb-2">Gateway Info</p>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem label="Payment ID" value={selectedTx.razorpayPaymentId} isMono />
                      <DetailItem label="Order ID" value={selectedTx.razorpayOrderId || "N/A"} isMono />
                    </div>
                  </div>
                )}
                
                {selectedTx.errorReason && (
                  <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                    <DetailItem label="Failure Reason" value={selectedTx.errorReason} />
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="mt-8 w-full py-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400 dark:text-white/40 font-medium">{label}</p>
      <p className={`text-sm text-slate-800 dark:text-white/90 mt-0.5 break-all ${isMono ? "font-mono" : "font-semibold"}`}>{value}</p>
    </div>
  );
}
