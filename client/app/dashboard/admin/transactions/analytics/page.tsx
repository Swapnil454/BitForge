"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";

import PageHeader from "../../../buyer/transactions/components/PageHeader";
import AdminAnalyticsStatsGrid from "../components/AdminAnalyticsStatsGrid";

interface AdminSummary {
  total: number;
  buyerPayments: number;
  sellerPayouts: number;
  totalAmount: number;
}

export default function AdminTransactionAnalyticsPage() {
  const [summary, setSummary] = useState<AdminSummary>({
    total: 0,
    buyerPayments: 0,
    sellerPayouts: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminAPI.getAllTransactions();
        const txs = data.transactions || [];
        
        const buyerPayments = txs.filter((t: any) => t.type === "buyer_to_admin").length;
        const sellerPayouts = txs.filter((t: any) => t.type === "admin_to_seller").length;
        const totalAmount = txs.filter((t: any) => t.status === "success").reduce((s: number, t: any) => s + t.amount, 0);

        setSummary({
          total: txs.length,
          buyerPayments,
          sellerPayouts,
          totalAmount,
        });
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/admin/transactions"
        backLabel="Transactions"
        title="Transaction Analytics"
        subtitle="Global payment and payout insights"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-white/80">
          <BarChart3 className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
          <span className="text-sm font-medium">Performance summary</span>
        </div>

        <AdminAnalyticsStatsGrid summary={summary} loading={loading} />
      </main>
    </div>
  );
}
