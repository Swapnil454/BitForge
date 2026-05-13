"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, PauseCircle, PlayCircle, ReceiptText, Settings2 } from "lucide-react";
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
  { label: "Paused", value: "PAUSED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Expired", value: "EXPIRED" },
];

export default function AdminPromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | PromotionStatus>("ALL");

  const fetchPromotions = useCallback(async (status: "ALL" | PromotionStatus = activeTab) => {
    try {
      setLoading(true);
      const data = await promotionAPI.getAdminPromotions(status === "ALL" ? undefined : { status });
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

  const stats = useMemo(
    () => ({
      total: promotions.length,
      pending: promotions.filter((item) => item.status === "PENDING_REVIEW").length,
      active: promotions.filter((item) => item.status === "ACTIVE").length,
      revenuePipeline: promotions.reduce((sum, item) => sum + (item.amount || 0), 0),
    }),
    [promotions]
  );

  const handlePause = async (promotionId: string) => {
    try {
      await promotionAPI.pausePromotion(promotionId);
      showSuccess("Promotion paused");
      await fetchPromotions(activeTab);
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to pause promotion"));
    }
  };

  const handleResume = async (promotionId: string) => {
    try {
      await promotionAPI.resumePromotion(promotionId);
      showSuccess("Promotion resumed");
      await fetchPromotions(activeTab);
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to resume promotion"));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        title="Promotions Management"
        subtitle="Review hero banner requests, pricing, payment proofs, and live ad status"
        rightSlot={
          <button
            onClick={() => router.push("/dashboard/admin/ad-settings")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Ad Settings</span>
          </button>
        }
      />

      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Requests" value={stats.total.toLocaleString("en-IN")} accent="from-cyan-500/20 to-blue-500/20" />
          <SummaryCard label="Pending Review" value={stats.pending.toLocaleString("en-IN")} accent="from-amber-500/20 to-orange-500/20" />
          <SummaryCard label="Active Ads" value={stats.active.toLocaleString("en-IN")} accent="from-emerald-500/20 to-teal-500/20" />
          <SummaryCard label="Revenue Pipeline" value={formatPromotionCurrency(stats.revenuePipeline)} accent="from-violet-500/20 to-fuchsia-500/20" />
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
            <h2 className="text-2xl font-bold">No promotion requests</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
              Seller submissions will appear here once they start requesting marketplace hero ads.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="hidden grid-cols-[1.2fr_1.1fr_0.9fr_0.8fr_0.9fr_0.8fr_1fr] gap-4 border-b border-slate-200 px-6 py-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:border-white/10 dark:text-white/45 xl:grid">
              <span>Seller</span>
              <span>Product</span>
              <span>Placement</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Action</span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {promotions.map((promotion) => {
                const seller = typeof promotion.sellerId === "string" ? null : promotion.sellerId;
                const product = typeof promotion.productId === "string" ? null : promotion.productId;

                return (
                  <div key={promotion._id} className="grid gap-4 px-5 py-5 xl:grid-cols-[1.2fr_1.1fr_0.9fr_0.8fr_0.9fr_0.8fr_1fr] xl:px-6">
                    <InfoBlock
                      label="Seller"
                      title={seller?.name || promotion.sellerName}
                      subtitle={seller?.email || "Seller account"}
                    />
                    <InfoBlock
                      label="Product"
                      title={product?.title || promotion.productTitle}
                      subtitle={`${formatPromotionDate(promotion.createdAt)} • ${PAYMENT_STATUS_LABELS[promotion.paymentStatus]}`}
                    />
                    <InfoText label="Placement" value={PLACEMENT_LABELS[promotion.placement]} />
                    <InfoText
                      label="Amount"
                      value={formatPromotionCurrency(promotion.amount, promotion.currency)}
                    />
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-white/35 xl:hidden">Status</p>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPromotionStatusClasses(
                          promotion.status
                        )}`}
                      >
                        {PROMOTION_STATUS_LABELS[promotion.status]}
                      </span>
                    </div>
                    <InfoText
                      label="Priority"
                      value={promotion.priority ? `#${promotion.priority}` : "Pending"}
                    />
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        label="View"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => router.push(`/dashboard/admin/promotions/${promotion._id}`)}
                      />
                      {promotion.status === "ACTIVE" ? (
                        <ActionButton
                          label="Pause"
                          icon={<PauseCircle className="h-4 w-4" />}
                          onClick={() => void handlePause(promotion._id)}
                        />
                      ) : null}
                      {promotion.status === "PAUSED" ? (
                        <ActionButton
                          label="Resume"
                          icon={<PlayCircle className="h-4 w-4" />}
                          onClick={() => void handleResume(promotion._id)}
                        />
                      ) : null}
                      {promotion.status === "PAYMENT_PENDING" ? (
                        <ActionButton
                          label="Verify"
                          icon={<ReceiptText className="h-4 w-4" />}
                          onClick={() => router.push(`/dashboard/admin/promotions/${promotion._id}`)}
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
  value: string;
  accent: string;
}) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${accent} p-5 dark:border-white/10`}>
      <p className="text-sm text-slate-500 dark:text-white/55">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}

function InfoBlock({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-white/35 xl:hidden">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-white/55">{subtitle}</p>
    </div>
  );
}

function InfoText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-white/35 xl:hidden">{label}</p>
      <p className="text-sm font-medium text-slate-700 dark:text-white/75">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10"
    >
      {icon}
      {label}
    </button>
  );
}
