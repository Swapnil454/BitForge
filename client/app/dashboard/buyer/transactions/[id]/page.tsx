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
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <div className="h-44 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-56 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        </main>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Transaction Not Found</h1>
          <p className="text-slate-500 dark:text-white/60 mb-6">This transaction does not exist or you do not have access to it.</p>
          <button
            onClick={() => router.push("/dashboard/buyer/transactions")}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-500 to-indigo-500 text-slate-900 dark:text-white font-semibold hover:from-violet-600 hover:to-indigo-600 transition"
          >
            View All Transactions
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
        <PageHeader
          backHref="/dashboard/buyer/transactions"
          backLabel="Transactions"
          title="Transaction Details"
          subtitle="Detailed payment and order reference"
        />

        <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
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
