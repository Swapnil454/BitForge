"use client";

import { Download, FileText, LifeBuoy, RotateCcw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { TransactionDetails } from "../types";

type TransactionActionBarProps = {
  transaction: TransactionDetails;
  downloading: boolean;
  onDownload: () => void;
  onContactSeller: () => void;
  onRetryPayment: () => void;
  onDownloadInvoice: () => void;
};

export default function TransactionActionBar({
  transaction,
  downloading,
  onDownload,
  onContactSeller,
  onRetryPayment,
  onDownloadInvoice,
}: TransactionActionBarProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex flex-row gap-3"
    >
      {/* Download Product — only for paid orders with a download URL */}
      {transaction.status === "paid" && transaction.downloadUrl && (
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold px-4 py-3 text-sm transition-all shadow-md shadow-emerald-600/25 dark:shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          ) : (
            <Download className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">{downloading ? "Downloading..." : "Download"}</span>
        </button>
      )}

      {/* Contact Seller */}
      <button
        onClick={onContactSeller}
        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm"
      >
        <LifeBuoy className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <span className="truncate">Contact Seller</span>
      </button>

      {/* Retry Payment — only for failed orders */}
      {transaction.status === "failed" && (
        <button
          onClick={onRetryPayment}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold px-4 py-3 text-sm transition-all shadow-md shadow-amber-500/25"
        >
          <RotateCcw className="h-4 w-4 shrink-0" />
          <span className="truncate">Retry Payment</span>
        </button>
      )}

      {/* Download Invoice */}
      <button
        onClick={onDownloadInvoice}
        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold px-4 py-3 text-sm hover:bg-violet-100 dark:hover:bg-violet-500/20 hover:border-violet-300 dark:hover:border-violet-500/50 transition-all shadow-sm"
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">Download Invoice</span>
      </button>
    </motion.section>
  );
}
