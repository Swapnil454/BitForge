"use client";

import { Download, FileText, LifeBuoy, RotateCcw } from "lucide-react";
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
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {transaction.status === "paid" && transaction.downloadUrl && (
        <button
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold px-4 py-3 transition disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Downloading..." : "Download Product"}
        </button>
      )}

      <button
        onClick={onContactSeller}
        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-cyan-600 dark:border-cyan-400/35 bg-cyan-100 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 font-semibold px-4 py-3 hover:bg-cyan-200 dark:hover:bg-cyan-500/15 transition"
      >
        <LifeBuoy className="h-4 w-4" />
        Contact Seller
      </button>

      {transaction.status === "failed" && (
        <button
          onClick={onRetryPayment}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-semibold px-4 py-3 transition"
        >
          <RotateCcw className="h-4 w-4" />
          Retry Payment
        </button>
      )}

      <button
        onClick={onDownloadInvoice}
        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-violet-600 dark:border-violet-400/35 bg-violet-100 dark:bg-violet-500/10 text-violet-800 dark:text-violet-300 font-semibold px-4 py-3 hover:bg-violet-200 dark:hover:bg-violet-500/15 transition"
      >
        <FileText className="h-4 w-4" />
        Download Invoice
      </button>
    </section>
  );
}
