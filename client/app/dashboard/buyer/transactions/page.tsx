"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface Transaction {
  _id: string;
  orderId: string;
  productName: string;
  productId: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  status: "paid" | "created" | "failed";
  date: string;
}

type SortOption = "newest" | "oldest" | "highest" | "lowest";
type FilterOption = "all" | "paid" | "created" | "failed";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await buyerAPI.getAllTransactions();
      setTransactions(data.transactions || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOrderId = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedId(orderId);
      toast.success("Order ID copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          label: "Success",
          icon: "✓",
          bgColor: "bg-emerald-500/20",
          textColor: "text-emerald-400",
          borderColor: "border-emerald-500/40",
          dotColor: "bg-emerald-400",
        };
      case "failed":
        return {
          label: "Failed",
          icon: "✕",
          bgColor: "bg-red-500/20",
          textColor: "text-red-400",
          borderColor: "border-red-500/40",
          dotColor: "bg-red-400",
        };
      case "created":
        return {
          label: "Pending",
          icon: "◷",
          bgColor: "bg-amber-500/20",
          textColor: "text-amber-400",
          borderColor: "border-amber-500/40",
          dotColor: "bg-amber-400",
        };
      default:
        return {
          label: "Unknown",
          icon: "?",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/40",
          dotColor: "bg-gray-400",
        };
    }
  };

  const filteredAndSortedTransactions = () => {
    let result = [...transactions];

    // Filter by status
    if (filterBy !== "all") {
      result = result.filter((t) => t.status === filterBy);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.productName.toLowerCase().includes(query) ||
          t.sellerName.toLowerCase().includes(query) ||
          t.orderId.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "highest":
        result.sort((a, b) => b.amount - a.amount);
        break;
      case "lowest":
        result.sort((a, b) => a.amount - b.amount);
        break;
    }

    return result;
  };

  const totalSpent = transactions
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = {
    total: transactions.length,
    successful: transactions.filter((t) => t.status === "paid").length,
    pending: transactions.filter((t) => t.status === "created").length,
    failed: transactions.filter((t) => t.status === "failed").length,
  };

  const displayedTransactions = filteredAndSortedTransactions();

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-black via-slate-900 to-black backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard/buyer")}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
              >
                <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
              </button>
              <div className="h-6 w-px bg-white/20 hidden sm:block" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  Transaction History
                </h1>
                <p className="text-white/50 text-xs sm:text-sm mt-0.5">
                  View and manage all your transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-2xl p-4 sm:p-5"
          >
            <p className="text-white/60 text-xs sm:text-sm font-medium">Total Spent</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1">
              ₹{totalSpent.toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5"
          >
            <p className="text-white/60 text-xs sm:text-sm font-medium">Successful</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400 mt-1">
              {stats.successful}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5"
          >
            <p className="text-white/60 text-xs sm:text-sm font-medium">Pending</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-400 mt-1">
              {stats.pending}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-2xl p-4 sm:p-5"
          >
            <p className="text-white/60 text-xs sm:text-sm font-medium">Failed</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-400 mt-1">
              {stats.failed}
            </p>
          </motion.div>
        </div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-4"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
              <input
                type="text"
                placeholder="Search by product, seller, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm whitespace-nowrap">Filter:</span>
                <div className="flex gap-1 flex-wrap">
                  {(["all", "paid", "created", "failed"] as FilterOption[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterBy(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        filterBy === filter
                          ? "bg-purple-500 text-white"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {filter === "all"
                        ? "All"
                        : filter === "paid"
                        ? "Success"
                        : filter === "created"
                        ? "Pending"
                        : "Failed"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm whitespace-nowrap">Sort:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none px-4 py-2 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 cursor-pointer hover:bg-white/10 transition-all"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="newest" className="bg-slate-800 text-white">Newest First</option>
                    <option value="oldest" className="bg-slate-800 text-white">Oldest First</option>
                    <option value="highest" className="bg-slate-800 text-white">Highest Amount</option>
                    <option value="lowest" className="bg-slate-800 text-white">Lowest Amount</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none text-xs">▼</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          {loading ? (
            // Loading Skeleton
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-6 animate-pulse"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-48 bg-white/10 rounded-lg" />
                      <div className="h-4 w-32 bg-white/5 rounded-lg" />
                      <div className="h-4 w-24 bg-white/5 rounded-lg" />
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-7 w-20 bg-white/10 rounded-lg ml-auto" />
                      <div className="h-6 w-16 bg-white/5 rounded-full ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedTransactions.length === 0 ? (
            // Empty State
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl p-12 text-center"
            >
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-white mb-2">No Transactions Found</h3>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                {searchQuery || filterBy !== "all"
                  ? "No transactions match your search criteria. Try adjusting your filters."
                  : "You haven't made any transactions yet. Start exploring the marketplace!"}
              </p>
              {!searchQuery && filterBy === "all" && (
                <button
                  onClick={() => router.push("/marketplace")}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
                >
                  Browse Marketplace
                </button>
              )}
            </motion.div>
          ) : (
            // Transaction Cards
            <AnimatePresence mode="popLayout">
              {displayedTransactions.map((transaction, index) => {
                const statusConfig = getStatusConfig(transaction.status);

                return (
                  <motion.div
                    key={transaction._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/dashboard/buyer/transactions/${transaction._id}`)}
                    className="cursor-pointer bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 hover:border-purple-500/40 rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/10 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left Side - Product Info */}
                      <div className="flex-1 min-w-0">
                        {/* Product Name */}
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors mb-1 truncate">
                          {transaction.productName}
                        </h3>

                        {/* Seller */}
                        <p className="text-sm text-gray-400 mb-3">
                          Sold by{" "}
                          <span className="text-white/80 font-medium">{transaction.sellerName}</span>
                        </p>

                        {/* Date & Order ID */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            {new Date(transaction.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1.5 font-mono">
                            ID: {transaction.orderId.slice(-8)}
                            <button
                              onClick={(e) => handleCopyOrderId(e, transaction.orderId)}
                              className="p-1 hover:bg-white/10 rounded transition-all opacity-60 hover:opacity-100"
                              title="Copy Order ID"
                            >
                              {copiedId === transaction.orderId ? (
                                <span className="text-emerald-400 text-xs">✓</span>
                              ) : (
                                <span className="text-xs">📋</span>
                              )}
                            </button>
                          </span>
                        </div>
                      </div>

                      {/* Right Side - Amount & Status */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                        {/* Amount */}
                        <p className="text-xl font-bold text-white">
                          ₹{transaction.amount.toLocaleString()}
                        </p>

                        {/* Status Badge */}
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                          {statusConfig.label}
                        </span>

                        {/* View Details Link */}
                        <span className="text-purple-400 group-hover:translate-x-1 transition-transform text-sm hidden sm:inline">
                          View Details →
                        </span>
                      </div>
                    </div>

                    {/* Mobile View Details */}
                    <div className="sm:hidden mt-4 pt-4 border-t border-white/5">
                      <span className="text-purple-400 text-sm flex items-center justify-center gap-1">
                        View Details <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Results Count */}
        {!loading && displayedTransactions.length > 0 && (
          <p className="text-center text-white/40 text-sm">
            Showing {displayedTransactions.length} of {transactions.length} transactions
          </p>
        )}
      </main>

      {/* Dropdown dark theme styles */}
      <style jsx global>{`
        select option {
          background-color: #1e293b;
          color: white;
          padding: 8px;
        }
        select option:hover,
        select option:focus {
          background-color: #334155;
        }
      `}</style>
    </div>
  );
}
