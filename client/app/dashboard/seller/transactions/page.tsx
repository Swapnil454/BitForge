
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

