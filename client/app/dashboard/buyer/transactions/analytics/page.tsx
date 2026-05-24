"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";

import PageHeader from "../components/PageHeader";
import AnalyticsStatsGrid from "../components/AnalyticsStatsGrid";

interface TransactionSummary {
  total: number;
  successful: number;
  pending: number;
  failed: number;
  totalSpent: number;
}

export default function TransactionAnalyticsPage() {
  const [summary, setSummary] = useState<TransactionSummary>({
    total: 0,
    successful: 0,
    pending: 0,
    failed: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await buyerAPI.getAllTransactions({ page: 1, limit: 1 });
        setSummary(data.summary || {
          total: 0,
          successful: 0,
          pending: 0,
          failed: 0,
          totalSpent: 0,
        });
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/buyer/transactions"
        backLabel="Transactions"
        title="Analytics"
        subtitle="Your transaction insights overview"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-white/80">
          <BarChart3 className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
          <span className="text-sm">Performance summary</span>
        </div>

        <AnalyticsStatsGrid summary={summary} loading={loading} />
      </main>
    </div>
  );
}
