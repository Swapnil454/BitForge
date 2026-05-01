"use client";

import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { TransactionDetails } from "../types";

type TransactionInfoStripProps = {
  transaction: TransactionDetails;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
};

function InlineField({
  label,
  value,
  mono,
  copyValue,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyValue?: string;
  copied?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 border-b border-white/8 last:border-b-0">
      <span className="text-white/45 text-xs sm:text-sm">{label}</span>
      <div className="flex items-center gap-2 max-w-[70%]">
        <span className={`text-right text-sm sm:text-base text-white/90 ${mono ? "font-mono text-xs sm:text-sm break-all" : "truncate"}`}>
          {value}
        </span>
        {copyValue && onCopy && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="h-7 w-7 shrink-0 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition inline-flex items-center justify-center"
            title={`Copy ${label}`}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-white/65" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function TransactionInfoStrip({
  transaction,
  copiedField,
  onCopy,
}: TransactionInfoStripProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="grid gap-5 lg:grid-cols-2"
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <h3 className="text-white font-semibold mb-3">Product & Seller</h3>
        <InlineField label="Product" value={transaction.productName} />
        <InlineField label="Seller" value={transaction.sellerName} />
        <InlineField label="Email" value={transaction.sellerEmail} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <h3 className="text-white font-semibold mb-3">Transaction Reference</h3>
        <InlineField
          label="Order ID"
          value={transaction.orderId}
          mono
          copyValue={transaction.orderId}
          copied={copiedField === "orderId"}
          onCopy={() => onCopy(transaction.orderId, "orderId")}
        />
        {transaction.razorpayOrderId && (
          <InlineField
            label="Razorpay Order"
            value={transaction.razorpayOrderId}
            mono
            copyValue={transaction.razorpayOrderId}
            copied={copiedField === "razorpayOrderId"}
            onCopy={() => onCopy(transaction.razorpayOrderId!, "razorpayOrderId")}
          />
        )}
        {transaction.razorpayPaymentId && (
          <InlineField
            label="Payment ID"
            value={transaction.razorpayPaymentId}
            mono
            copyValue={transaction.razorpayPaymentId}
            copied={copiedField === "razorpayPaymentId"}
            onCopy={() => onCopy(transaction.razorpayPaymentId!, "razorpayPaymentId")}
          />
        )}
      </div>
    </motion.section>
  );
}
