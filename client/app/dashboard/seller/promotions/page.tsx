"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Megaphone, Plus, ReceiptText, XCircle } from "lucide-react";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import { promotionAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import {
  formatPromotionCurrency,
  formatPromotionDate,
  getPromotionErrorMessage,
  getPromotionStatusClasses,
  PAYMENT_STATUS_LABELS,
  PLACEMENT_LABELS,
  PROMOTION_STATUS_LABELS,
  type PromotionRecord,
  type PromotionStatus,
} from "@/lib/promotions";

const TABS: Array<{ label: string; value: "ALL" | PromotionStatus }> = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING_REVIEW" },
  { label: "Awaiting Payment", value: "APPROVED_WAITING_PAYMENT" },
  { label: "Payment Review", value: "PAYMENT_PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Expired", value: "EXPIRED" },
];

const getProductDetails = (promotion: PromotionRecord) => {
  const product = typeof promotion.productId === "string" ? null : promotion.productId;
  return {
    title: product?.title || promotion.productTitle,
    thumbnailUrl: product?.thumbnailUrl || promotion.productThumbnailUrl || null,
  };
};

export default function SellerPromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | PromotionStatus>("ALL");

  const fetchPromotions = useCallback(async (status: "ALL" | PromotionStatus = activeTab) => {
    try {
      setLoading(true);
      const data = await promotionAPI.getSellerPromotions(
        status === "ALL" ? undefined : { status }
      );
      setPromotions(data.promotions || []);
    } catch {
      showError("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchPromotions(activeTab);
  }, [activeTab, fetchPromotions]);

  const stats = useMemo(() => {
    const waitingPayment = promotions.filter((item) =>
      ["APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(item.status)
    ).length;

    return {
      total: promotions.length,
      active: promotions.filter((item) => item.status === "ACTIVE").length,
      waitingPayment,
      totalImpressions: promotions.reduce((sum, item) => sum + (item.metrics?.impressions || 0), 0),
    };
  }, [promotions]);

  const handleCancel = async (promotionId: string) => {
    try {
      await promotionAPI.cancelSellerPromotion(promotionId);
      showSuccess("Promotion cancelled");
      await fetchPromotions(activeTab);
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to cancel promotion"));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Promotions"
        subtitle="Manage your paid marketplace hero requests"
        rightSlot={
          <button
            onClick={() => router.push("/dashboard/seller/promotions/create")}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </button>
        }
      />

      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Requests" value={stats.total} accent="from-cyan-500/20 to-blue-500/20" />
          <SummaryCard label="Active Ads" value={stats.active} accent="from-emerald-500/20 to-teal-500/20" />
          <SummaryCard label="Need Payment" value={stats.waitingPayment} accent="from-amber-500/20 to-orange-500/20" />
          <SummaryCard label="Impressions" value={stats.totalImpressions} accent="from-violet-500/20 to-fuchsia-500/20" />
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.value
                  ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
              />
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center dark:border-white/15 dark:bg-white/5">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <Megaphone className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold">No promotions yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-white/60">
              Start with a single approved product. Admin will review the request, set the final price, and activate it after payment verification.
            </p>
            <button
              onClick={() => router.push("/dashboard/seller/promotions/create")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Plus className="h-4 w-4" />
              Create Promotion Request
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 px-6 py-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:border-white/10 dark:text-white/45 lg:grid">
              <span>Product</span>
              <span>Placement</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Dates</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {promotions.map((promotion) => {
                const product = getProductDetails(promotion);
                const canCancel = !["ACTIVE", "EXPIRED", "CANCELLED"].includes(promotion.status);
                const needsPaymentHelp = ["APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(
                  promotion.status
                );

                return (
                  <div key={promotion._id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] lg:px-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-24 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/10">
                        {product.thumbnailUrl ? (
                          <img src={product.thumbnailUrl} alt={product.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <Megaphone className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{product.title}</p>
                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-white/55">{promotion.title}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                          Payment: {PAYMENT_STATUS_LABELS[promotion.paymentStatus]}
                        </p>
                      </div>
                    </div>

                    <InfoCell label="Placement" value={PLACEMENT_LABELS[promotion.placement]} />
                    <InfoCell
                      label="Amount"
                      value={formatPromotionCurrency(promotion.amount, promotion.currency)}
                    />
                    <div className="space-y-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPromotionStatusClasses(
                          promotion.status
                        )}`}
                      >
                        {PROMOTION_STATUS_LABELS[promotion.status]}
                      </span>
                    </div>
                    <InfoCell
                      label="Dates"
                      value={`${formatPromotionDate(promotion.startDate)} - ${formatPromotionDate(
                        promotion.endDate
                      )}`}
                    />

                    <div className="flex flex-wrap gap-2 lg:justify-start">
                      <ActionButton
                        label="View"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => router.push(`/dashboard/seller/promotions/${promotion._id}`)}
                      />
                      {needsPaymentHelp ? (
                        <ActionButton
                          label="Upload Proof"
                          icon={<ReceiptText className="h-4 w-4" />}
                          onClick={() => router.push(`/dashboard/seller/promotions/${promotion._id}`)}
                        />
                      ) : null}
                      {canCancel ? (
                        <ActionButton
                          label="Cancel"
                          icon={<XCircle className="h-4 w-4" />}
                          danger
                          onClick={() => void handleCancel(promotion._id)}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${accent} p-5 dark:border-white/10`}>
      <p className="text-sm text-slate-500 dark:text-white/55">{label}</p>
      <p className="mt-3 text-3xl font-black">{value.toLocaleString("en-IN")}</p>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-white/35 lg:hidden">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-white/75">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  danger,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
        danger
          ? "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/15"
          : "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
