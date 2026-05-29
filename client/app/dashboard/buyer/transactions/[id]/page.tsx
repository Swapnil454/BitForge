"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { buyerAPI } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import PageHeader from "../components/PageHeader";
import TransactionActionBar from "./components/TransactionActionBar";
import TransactionInfoStrip from "./components/TransactionInfoStrip";
import TransactionSummaryPanel from "./components/TransactionSummaryPanel";
import { TransactionDetails } from "./types";

export default function TransactionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchTransactionDetails = async () => {
      try {
        const data = await buyerAPI.getTransactionDetails(orderId);
        setTransaction(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load transaction details");
        router.push("/dashboard/buyer/transactions");
      } finally {
        setLoading(false);
      }
    };

    void fetchTransactionDetails();
  }, [orderId, router]);

  const handleDownload = async () => {
    if (!transaction?.downloadUrl) return;

    setDownloading(true);
    try {
      const link = document.createElement("a");
      link.href = transaction.downloadUrl;
      link.download = transaction.productName
        ? `${transaction.productName.replace(/[^a-z0-9]/gi, "_")}.pdf`
        : "download.pdf";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch {
      toast.error("Failed to start download");
    } finally {
      setDownloading(false);
    }
  };

  const handleContactSeller = () => {
    if (!transaction?.sellerEmail) return;
    window.location.href = `mailto:${transaction.sellerEmail}?subject=Regarding Order ${transaction.orderId}&body=Hello, I have a query regarding my purchase of "${transaction.productName}".`;
  };

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      const copied = await copyText(text);
      if (!copied) {
        toast.error("Failed to copy");
        return;
      }
      setCopiedField(fieldName);
      toast.success("Copied");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownloadInvoice = () => {
    if (!transaction) return;

    if (transaction.status === "created") {
      toast("Invoice will be generated once payment is confirmed.", {
        icon: "⏳",
      });
      return;
    }

    if (transaction.status === "failed") {
      toast.error("Invoice is not available for failed transactions.");
      return;
    }

    router.push(`/dashboard/buyer/invoice/${transaction._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
        <PageHeader
          backHref="/dashboard/buyer/transactions"
          backLabel="Transactions"
          title="Transaction Details"
        />
        <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
          {/* Hero skeleton */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12141c] p-6 sm:p-7 overflow-hidden animate-pulse">
            <div className="grid sm:grid-cols-[1fr_auto] gap-6 sm:items-center">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-white/10" />
                  <div className="h-6 w-44 bg-slate-200 dark:bg-white/10 rounded-xl" />
                  <div className="h-6 w-16 bg-slate-100 dark:bg-white/5 rounded-full" />
                </div>
                <div className="h-4 w-72 bg-slate-100 dark:bg-white/5 rounded-lg" />
                <div className="flex gap-2.5 mt-2">
                  <div className="h-8 w-44 bg-slate-100 dark:bg-white/5 rounded-xl" />
                  <div className="h-8 w-32 bg-slate-100 dark:bg-white/5 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5 sm:text-right">
                <div className="h-3 w-20 bg-slate-100 dark:bg-white/5 rounded sm:ml-auto" />
                <div className="h-12 w-36 bg-slate-200 dark:bg-white/10 rounded-2xl sm:ml-auto" />
              </div>
            </div>
          </div>
          {/* Info cards skeleton */}
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12141c] overflow-hidden animate-pulse">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.025]">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" />
                </div>
                <div className="px-5 py-2 space-y-3">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="flex items-start gap-3 py-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-16 bg-slate-100 dark:bg-white/5 rounded" />
                        <div className="h-4 w-40 bg-slate-200 dark:bg-white/10 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Actions skeleton */}
          <div className="flex gap-3">
            <div className="h-12 w-40 bg-slate-200 dark:bg-white/10 rounded-2xl animate-pulse" />
            <div className="h-12 w-36 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-12 w-40 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="mx-auto mb-4 w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <span className="text-2xl">🔍</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Transaction Not Found</h1>
          <p className="text-slate-500 dark:text-white/50 mb-6 text-sm">
            This transaction does not exist or you don&apos;t have access to it.
          </p>
          <button
            onClick={() => router.push("/dashboard/buyer/transactions")}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold text-sm transition shadow-md shadow-violet-500/25"
          >
            View All Transactions
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <PageHeader
        backHref="/dashboard/buyer/transactions"
        backLabel="Transactions"
        title="Transaction Details"
        subtitle="Detailed payment and order reference"
      />

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        <TransactionSummaryPanel transaction={transaction} />

        <TransactionInfoStrip
          transaction={transaction}
          copiedField={copiedField}
          onCopy={handleCopyToClipboard}
        />

        <TransactionActionBar
          transaction={transaction}
          downloading={downloading}
          onDownload={handleDownload}
          onContactSeller={handleContactSeller}
          onRetryPayment={() => router.push(`/product/${transaction.productId}`)}
          onDownloadInvoice={handleDownloadInvoice}
        />
      </main>
    </div>
  );
}
