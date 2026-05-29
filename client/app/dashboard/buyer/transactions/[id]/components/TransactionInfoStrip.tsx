"use client";

import { motion } from "framer-motion";
import { Check, Copy, Package, User, Mail, Hash, CreditCard, FileKey } from "lucide-react";
import { TransactionDetails } from "../types";

type TransactionInfoStripProps = {
  transaction: TransactionDetails;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
};

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  copyValue,
  copied,
  onCopy,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  copyValue?: string;
  copied?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-white/[0.05] last:border-b-0">
      <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
          {label}
        </p>
        <p className={`text-sm text-slate-800 dark:text-slate-200 break-all ${mono ? "font-mono" : "font-medium"}`}>
          {value}
        </p>
      </div>
      {copyValue && onCopy && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="shrink-0 mt-0.5 h-7 w-7 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition inline-flex items-center justify-center"
          title={`Copy ${label}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          )}
        </button>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12141c] overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.025]">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h3>
      </div>
      <div className="px-4 sm:px-5 py-1">{children}</div>
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
      className="grid gap-4 lg:grid-cols-2"
    >
      <InfoCard title="Product & Seller">
        <InfoRow icon={Package} label="Product" value={transaction.productName} />
        <InfoRow icon={User} label="Seller" value={transaction.sellerName} />
        <InfoRow icon={Mail} label="Email" value={transaction.sellerEmail} />
      </InfoCard>

      <InfoCard title="Transaction Reference">
        <InfoRow
          icon={Hash}
          label="Order ID"
          value={transaction.orderId}
          mono
          copyValue={transaction.orderId}
          copied={copiedField === "orderId"}
          onCopy={() => onCopy(transaction.orderId, "orderId")}
        />
        {transaction.razorpayOrderId && (
          <InfoRow
            icon={FileKey}
            label="Razorpay Order"
            value={transaction.razorpayOrderId}
            mono
            copyValue={transaction.razorpayOrderId}
            copied={copiedField === "razorpayOrderId"}
            onCopy={() => onCopy(transaction.razorpayOrderId!, "razorpayOrderId")}
          />
        )}
        {transaction.razorpayPaymentId && (
          <InfoRow
            icon={CreditCard}
            label="Payment ID"
            value={transaction.razorpayPaymentId}
            mono
            copyValue={transaction.razorpayPaymentId}
            copied={copiedField === "razorpayPaymentId"}
            onCopy={() => onCopy(transaction.razorpayPaymentId!, "razorpayPaymentId")}
          />
        )}
      </InfoCard>
    </motion.section>
  );
}
