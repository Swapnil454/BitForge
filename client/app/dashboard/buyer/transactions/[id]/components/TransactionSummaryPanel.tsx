"use client";

import { motion } from "framer-motion";
import { CalendarDays, ReceiptText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatAmount, formatLongDate, formatTime, getStatusConfig } from "../utils";
import { TransactionDetails } from "../types";

type TransactionSummaryPanelProps = {
  transaction: TransactionDetails;
};

export default function TransactionSummaryPanel({ transaction }: TransactionSummaryPanelProps) {
  const status = getStatusConfig(transaction.status);

  const StatusIcon =
    transaction.status === "paid"
      ? CheckCircle2
      : transaction.status === "failed"
      ? XCircle
      : Clock;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border ${status.panelClass}`}
    >

      <div className="relative p-5 sm:p-7 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        {/* Left: Status info */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-2xl ${status.iconBg}`}>
              <StatusIcon className={`w-5 h-5 ${status.iconColor}`} />
            </div>
            <h2 className={`text-xl sm:text-2xl font-bold ${status.titleColor}`}>{status.title}</h2>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider border ${status.badgeClass}`}>
              {status.shortLabel}
            </span>
          </div>

          <p className={`text-sm sm:text-base leading-relaxed ${status.messageColor}`}>
            {status.message}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium ${status.chipClass}`}>
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatLongDate(transaction.date)} &nbsp;&bull;&nbsp; {formatTime(transaction.date)}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono font-medium ${status.chipClass}`}>
              <ReceiptText className="h-3.5 w-3.5 shrink-0" />
              #{transaction.orderId.slice(-10).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right: Amount */}
        <div className="sm:text-right">
          <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${status.amountLabelColor}`}>
            Amount {transaction.status === "failed" ? "Charged" : "Paid"}
          </p>
          <p className={`text-4xl sm:text-5xl font-black tracking-tight ${status.amountColor}`}>
            {formatAmount(transaction.amount)}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
