"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";

import PageHeader from "../../../buyer/transactions/components/PageHeader";
import TransactionSummaryPanel from "../components/TransactionSummaryPanel";

interface BuyerSummary {
  total: number;
  totalAmount: number;
}

export default function BuyerTransactionAnalyticsPage() {
  const [summary, setSummary] = useState<BuyerSummary>({
    total: 0,
    totalAmount: 0,
  });
  const [panelSummary, setPanelSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await buyerAPI.getAllTransactions();
        const txs = data.transactions || [];
        
        const totalAmount = txs.filter((t: any) => t.status === "success").reduce((s: number, t: any) => s + t.amount, 0);

        setSummary({
          total: txs.length,
          totalAmount,
        });
        setPanelSummary(data.summary);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <PageHeader
        backHref="/dashboard/buyer/transactions"
        backLabel="Transactions"
        title="Purchase Analytics"
        subtitle="Monitor your purchase history and trends"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-white/80">
          <BarChart3 className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
          <span className="text-sm font-medium">Performance summary</span>
        </div>

        {/* Payment Breakdown */}
        {!loading && panelSummary && (
          <div className="mt-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 pl-1">Payment Breakdown</h3>
            <TransactionSummaryPanel
              totalVolume={panelSummary.total.amount}
              totalCount={panelSummary.total.count}
              successful={panelSummary.success}
              pending={panelSummary.pending}
              failed={panelSummary.failed}
              dateLabel="All time"
            />
          </div>
        )}
      </main>
    </div>
  );
}
