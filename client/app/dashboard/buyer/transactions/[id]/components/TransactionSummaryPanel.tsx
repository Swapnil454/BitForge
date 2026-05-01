"use client";

import { motion } from "framer-motion";
import { CalendarDays, ReceiptText } from "lucide-react";
import { formatAmount, formatLongDate, formatTime, getStatusConfig } from "../utils";
import { TransactionDetails } from "../types";

type TransactionSummaryPanelProps = {
  transaction: TransactionDetails;
};

export default function TransactionSummaryPanel({ transaction }: TransactionSummaryPanelProps) {
  const status = getStatusConfig(transaction.status);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border bg-linear-to-br p-5 sm:p-6 ${status.panelClass}`}
    >
      <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white">{status.title}</h2>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.badgeClass}`}>
              {status.shortLabel}
            </span>
          </div>
          <p className="text-white/75 text-sm sm:text-base">{status.message}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatLongDate(transaction.date)} • {formatTime(transaction.date)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5">
              <ReceiptText className="h-3.5 w-3.5" />
              #{transaction.orderId.slice(-10)}
            </span>
          </div>
        </div>

        <div className="lg:text-right">
          <p className="text-white/60 text-xs uppercase tracking-wider">Amount Paid</p>
          <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {formatAmount(transaction.amount)}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
