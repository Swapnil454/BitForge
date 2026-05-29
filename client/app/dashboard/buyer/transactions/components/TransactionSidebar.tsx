import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, ExternalLink, Download } from "lucide-react";
import toast from "react-hot-toast";

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

interface TransactionSidebarProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionSidebar({ transaction, onClose }: TransactionSidebarProps) {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formattedAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AnimatePresence>
      {transaction && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[420px] max-w-full z-[101] bg-white dark:bg-[#0a0a14] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header section */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                    {formattedAmount(transaction.amount)}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      transaction.status === "success"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : transaction.status === "failed"
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        transaction.status === "success"
                          ? "bg-emerald-500"
                          : transaction.status === "failed"
                          ? "bg-rose-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {transaction.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/50">
                  <span>ID: <span className="font-mono">{transaction.orderId}</span></span>
                  <button
                    onClick={() => handleCopy(transaction.orderId, "Order ID")}
                    className="p-1 hover:text-slate-900 dark:hover:text-white transition"
                    title="Copy Order ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* Parties */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-3">Parties</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-12 text-xs font-medium text-slate-500 dark:text-white/50">From</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {transaction.type === "admin_to_seller" ? "BitForge Settlement Account" : (transaction.buyerName || "Unknown Buyer")}
                      </p>
                      {transaction.type !== "admin_to_seller" && transaction.buyerEmail && (
                        <p className="text-xs text-slate-500 dark:text-white/60">{transaction.buyerEmail}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 text-xs font-medium text-slate-500 dark:text-white/50">To</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {transaction.type === "buyer_to_admin" ? "BitForge Settlement Account" : (transaction.sellerName || "Unknown Seller")}
                      </p>
                      {transaction.type !== "buyer_to_admin" && transaction.sellerEmail && (
                        <p className="text-xs text-slate-500 dark:text-white/60">{transaction.sellerEmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Product */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-3">Product</h3>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{transaction.productName}</p>
                <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                  Date: {new Date(transaction.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </section>

              {/* Gateway Info */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-3">Payment</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-white/50">Method</span>
                    <span className="font-medium text-slate-900 dark:text-white capitalize">
                      {transaction.paymentMethod || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500 dark:text-white/50">Gateway ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-900 dark:text-white">
                        {transaction.razorpayPaymentId || "N/A"}
                      </span>
                      {transaction.razorpayPaymentId && (
                        <button
                          onClick={() => handleCopy(transaction.razorpayPaymentId!, "Gateway ID")}
                          className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Note: Fee and Net amount descoped for V1 */}
                </div>
              </section>

              {transaction.errorReason && (
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-3">Failure Reason</h3>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <p className="text-sm text-rose-600 dark:text-rose-400">{transaction.errorReason}</p>
                  </div>
                </section>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] grid grid-cols-1 gap-3">
              {/* No specific buyer actions here yet, but we could add a Download Invoice button later */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
