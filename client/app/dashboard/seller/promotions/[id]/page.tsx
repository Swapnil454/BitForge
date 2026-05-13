"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreditCard, Megaphone, UploadCloud, Wallet } from "lucide-react";
import PageHeader from "../../../buyer/transactions/components/PageHeader";
import { promotionAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import {
  formatPromotionCurrency,
  formatPromotionDate,
  getPromotionErrorMessage,
  getPromotionStatusClasses,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PLACEMENT_LABELS,
  PROMOTION_STATUS_LABELS,
  type PromotionRecord,
} from "@/lib/promotions";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: () => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

export default function SellerPromotionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [promotion, setPromotion] = useState<PromotionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");

  const fetchPromotion = useCallback(async () => {
    try {
      setLoading(true);
      const data = await promotionAPI.getSellerPromotion(params.id);
      setPromotion(data.promotion || null);
      setTransactionId(data.promotion?.transactionId || "");
    } catch {
      showError("Failed to load promotion");
      router.push("/dashboard/seller/promotions");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (params.id) {
      void fetchPromotion();
    }
  }, [params.id, fetchPromotion]);

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Payment proof must be an image");
      return;
    }

    setPaymentProof(file);
    setPaymentProofPreview(URL.createObjectURL(file));
  };

  const handleSubmitPaymentProof = async () => {
    if (!promotion) return;
    if (!paymentProof && !transactionId.trim()) {
      showError("Upload a payment proof or add a transaction id");
      return;
    }

    try {
      setSubmittingProof(true);
      const formData = new FormData();
      if (paymentProof) {
        formData.append("paymentProof", paymentProof);
      }
      if (transactionId.trim()) {
        formData.append("transactionId", transactionId.trim());
      }
      formData.append("paymentMethod", "MANUAL");

      await promotionAPI.uploadSellerPaymentProof(promotion._id, formData);
      showSuccess("Payment proof submitted");
      setPaymentProof(null);
      setPaymentProofPreview(null);
      await fetchPromotion();
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to submit payment proof"));
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleCancel = async () => {
    if (!promotion) return;

    try {
      await promotionAPI.cancelSellerPromotion(promotion._id);
      showSuccess("Promotion cancelled");
      await fetchPromotion();
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to cancel promotion"));
    }
  };

  const handlePayPromotion = async () => {
    if (!promotion) return;

    if (!window.Razorpay) {
      showError("Razorpay Checkout is not available right now. Please refresh and try again.");
      return;
    }

    try {
      setStartingPayment(true);
      const orderData = await promotionAPI.createPromotionPaymentOrder(promotion._id);

      const options: RazorpayCheckoutOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "BittForge",
        description: `Promotion for ${promotion.productTitle}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          const verification = await promotionAPI.verifySellerPromotionPayment(promotion._id, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          showSuccess(
            verification.message || "Payment successful. Promotion status updated."
          );
          await fetchPromotion();
        },
        prefill: {
          name:
            typeof promotion.sellerId === "string"
              ? promotion.sellerName
              : promotion.sellerId?.name || promotion.sellerName,
          email:
            typeof promotion.sellerId === "string"
              ? undefined
              : promotion.sellerId?.email,
        },
        theme: {
          color: "#06b6d4",
        },
        modal: {
          ondismiss: () => {
            showError("Payment window closed before completion.");
            void fetchPromotion();
          },
        },
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.on("payment.failed", () => {
        showError("Payment failed. You can retry the Razorpay payment.");
        void fetchPromotion();
      });
      razorpayCheckout.open();
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to start payment"));
      await fetchPromotion();
    } finally {
      setStartingPayment(false);
    }
  };

  if (loading || !promotion) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#05050a]">
        <PageHeader
          backHref="/dashboard/seller/promotions"
          backLabel="Promotions"
          title="Promotion Detail"
        />
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="h-[32rem] animate-pulse rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" />
        </section>
      </main>
    );
  }

  const canPayNow =
    promotion.status === "APPROVED_WAITING_PAYMENT" &&
    promotion.paymentStatus !== "PAID" &&
    typeof promotion.amount === "number" &&
    promotion.amount > 0;
  const canUploadProof = ["APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(promotion.status);
  const canCancel = !["ACTIVE", "EXPIRED", "CANCELLED"].includes(promotion.status);
  const product = typeof promotion.productId === "string" ? null : promotion.productId;
  const seller = typeof promotion.sellerId === "string" ? null : promotion.sellerId;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/seller/promotions"
        backLabel="Promotions"
        title="Promotion Detail"
        subtitle={promotion.productTitle}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <img src={promotion.bannerImage} alt={promotion.title} className="h-72 w-full object-cover" />
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPromotionStatusClasses(
                    promotion.status
                  )}`}
                >
                  {PROMOTION_STATUS_LABELS[promotion.status]}
                </span>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-white/55">
                  {PLACEMENT_LABELS[promotion.placement]}
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-black">{promotion.title}</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-white/65">{promotion.subtitle}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Amount" value={formatPromotionCurrency(promotion.amount, promotion.currency)} />
                <MetricCard label="Payment" value={PAYMENT_STATUS_LABELS[promotion.paymentStatus]} />
                <MetricCard label="CTR" value={`${promotion.metrics.ctr}%`} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow label="Requested Duration" value={`${promotion.requestedDurationDays} days`} />
                <InfoRow
                  label="Approved Duration"
                  value={promotion.approvedDurationDays ? `${promotion.approvedDurationDays} days` : "Pending admin review"}
                />
                <InfoRow label="Start Date" value={formatPromotionDate(promotion.startDate)} />
                <InfoRow label="End Date" value={formatPromotionDate(promotion.endDate)} />
                <InfoRow label="Target Link" value={promotion.targetLink || "Automatic product link"} />
                <InfoRow label="Priority" value={promotion.priority ? `#${promotion.priority}` : "Pending"} />
                <InfoRow
                  label="Payment Method"
                  value={promotion.paymentMethod ? PAYMENT_METHOD_LABELS[promotion.paymentMethod] : "Pending"}
                />
                <InfoRow label="Razorpay Order" value={promotion.razorpayOrderId || "Not created yet"} />
              </div>

              {promotion.sellerNote ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-white/35">Note for Admin</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-white/75">{promotion.sellerNote}</p>
                </div>
              ) : null}

              {promotion.adminNote ? (
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">Admin Note</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-white/75">{promotion.adminNote}</p>
                </div>
              ) : null}

              {promotion.rejectedReason ? (
                <div className="rounded-3xl border border-red-400/20 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-400">Rejected Reason</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-white/75">{promotion.rejectedReason}</p>
                </div>
              ) : null}
            </div>
          </section>

          {canPayNow ? (
            <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">Primary Payment</p>
                  <h2 className="mt-2 text-2xl font-black">Pay with Razorpay</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                    Complete the approved payment online and your promotion will activate automatically after server verification.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Approved Amount</p>
                  <p className="mt-2 text-3xl font-black text-emerald-200">
                    {formatPromotionCurrency(promotion.amount, promotion.currency)}
                  </p>
                </div>
                <button
                  onClick={() => void handlePayPromotion()}
                  disabled={startingPayment}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard className="h-4 w-4" />
                  {startingPayment
                    ? "Starting Payment..."
                    : `Pay ${formatPromotionCurrency(promotion.amount, promotion.currency)} & Start Promotion`}
                </button>
              </div>
            </section>
          ) : null}

          {canUploadProof ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Fallback Manual Payment</p>
                  <h2 className="mt-2 text-2xl font-black">Upload Payment Proof</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                    Razorpay is the main payment method. If you need offline fallback, submit a screenshot or transaction id and the admin can still verify it manually.
                  </p>
                </div>
                <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  {paymentProofPreview || promotion.paymentProofImage ? (
                    <img
                      src={paymentProofPreview || promotion.paymentProofImage || ""}
                      alt="Payment proof"
                      className="h-60 w-full rounded-3xl object-cover"
                    />
                  ) : (
                    <label className="flex h-60 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-cyan-400/60 hover:bg-cyan-500/5 dark:border-white/15 dark:bg-white/5">
                      <UploadCloud className="h-10 w-10 text-cyan-400" />
                      <div>
                        <p className="font-semibold">Upload proof image</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-white/55">Screenshot, slip, or confirmation receipt</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleProofChange} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Transaction ID</span>
                    <input
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Optional but recommended"
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Replace / Add Proof Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofChange}
                      className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-200 file:px-4 file:py-2.5 file:font-semibold file:text-slate-800 hover:file:bg-slate-300 dark:text-white/60 dark:file:bg-white/10 dark:file:text-white"
                    />
                  </label>

                  <button
                    onClick={() => void handleSubmitPaymentProof()}
                    disabled={submittingProof}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {submittingProof ? "Submitting..." : "Submit Payment Proof"}
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Product</p>
            <div className="mt-4 overflow-hidden rounded-3xl bg-slate-100 dark:bg-white/5">
              {product?.thumbnailUrl ? (
                <img src={product.thumbnailUrl} alt={promotion.productTitle} className="h-56 w-full object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center text-slate-400">
                  <Megaphone className="h-10 w-10" />
                </div>
              )}
            </div>
            <h2 className="mt-4 text-2xl font-black">{promotion.productTitle}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
              Seller: {seller?.name || promotion.sellerName}
            </p>
            <button
              onClick={() => router.push(`/marketplace/${product?._id || promotion.productId}`)}
              className="mt-4 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:text-white/75 dark:hover:border-white/20 dark:hover:bg-white/10"
            >
              Open Product Page
            </button>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Performance</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <MetricCard label="Impressions" value={promotion.metrics.impressions.toLocaleString("en-IN")} />
              <MetricCard label="Clicks" value={promotion.metrics.clicks.toLocaleString("en-IN")} />
              <MetricCard label="Orders" value={promotion.metrics.ordersGenerated.toLocaleString("en-IN")} />
              <MetricCard label="Revenue" value={formatPromotionCurrency(promotion.metrics.revenueGenerated)} />
            </div>
          </section>

          {canCancel ? (
            <button
              onClick={() => void handleCancel()}
              className="w-full rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-500/15"
            >
              Cancel Request
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-white/35">{label}</p>
      <p className="mt-3 text-xl font-black">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-white/35">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-700 dark:text-white/75">{value}</p>
    </div>
  );
}
