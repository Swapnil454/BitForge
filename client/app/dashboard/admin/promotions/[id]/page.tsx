"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock3, PauseCircle, PlayCircle, Settings2, XCircle } from "lucide-react";
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
  type PromotionSettings,
} from "@/lib/promotions";
import { getAutoTextColor, isValidHexColor } from "@/lib/colorUtils";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35";

export default function AdminPromotionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [promotion, setPromotion] = useState<PromotionRecord | null>(null);
  const [settings, setSettings] = useState<PromotionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [amount, setAmount] = useState(2);
  const [approvedDurationDays, setApprovedDurationDays] = useState(7);
  const [priority, setPriority] = useState(1);
  const [maxImpressions, setMaxImpressions] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [verifyTransactionId, setVerifyTransactionId] = useState("");

  const [heroBgColor, setHeroBgColor] = useState("#2563EB");
  const [heroTextColor, setHeroTextColor] = useState<"light" | "dark" | "auto">("auto");
  const [heroTitleColor, setHeroTitleColor] = useState("");
  const [heroSubtitleColor, setHeroSubtitleColor] = useState("");
  const [heroButtonBgColor, setHeroButtonBgColor] = useState("");
  const [heroButtonTextColor, setHeroButtonTextColor] = useState("");
  const [heroFontFamily, setHeroFontFamily] = useState("inherit");
  const [heroLayout, setHeroLayout] = useState<"floating" | "single" | "minimal">("floating");

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      const [promotionData, settingsData] = await Promise.all([
        promotionAPI.getAdminPromotion(params.id),
        promotionAPI.getAdSettings(),
      ]);

      const nextPromotion = promotionData.promotion || null;
      const nextSettings = settingsData.settings || null;

      setPromotion(nextPromotion);
      setSettings(nextSettings);
      setAmount(nextPromotion?.amount || nextSettings?.minimumPrice || 2);
      setApprovedDurationDays(
        nextPromotion?.approvedDurationDays ||
          nextPromotion?.requestedDurationDays ||
          nextSettings?.defaultDurationDays ||
          7
      );
      setPriority(nextPromotion?.priority || 1);
      setMaxImpressions(nextPromotion?.maxImpressions ? String(nextPromotion.maxImpressions) : "");
      setAdminNote(nextPromotion?.adminNote || "");
      setRejectReason(nextPromotion?.rejectedReason || "");
      setVerifyTransactionId(nextPromotion?.transactionId || "");
      setHeroBgColor(nextPromotion?.heroBgColor || "#2563EB");
      setHeroTextColor(nextPromotion?.heroTextColor || "auto");
      setHeroTitleColor(nextPromotion?.heroTitleColor || "");
      setHeroSubtitleColor(nextPromotion?.heroSubtitleColor || "");
      setHeroButtonBgColor(nextPromotion?.heroButtonBgColor || "");
      setHeroButtonTextColor(nextPromotion?.heroButtonTextColor || "");
      setHeroFontFamily(nextPromotion?.heroFontFamily || "inherit");
      setHeroLayout(nextPromotion?.heroLayout || "floating");
    } catch {
      showError("Failed to load promotion");
      router.push("/dashboard/admin/promotions");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (params.id) {
      void loadPage();
    }
  }, [params.id, loadPage]);

  const seller = useMemo(
    () => (typeof promotion?.sellerId === "string" ? null : promotion?.sellerId || null),
    [promotion]
  );
  const product = useMemo(
    () => (typeof promotion?.productId === "string" ? null : promotion?.productId || null),
    [promotion]
  );

  const runAction = async (action: () => Promise<unknown>, message: string) => {
    try {
      setProcessing(true);
      await action();
      showSuccess(message);
      await loadPage();
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Action failed"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !promotion) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#05050a]">
        <PageHeader
          backHref="/dashboard/admin/promotions"
          backLabel="Promotions"
          title="Promotion Review"
        />
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="h-[34rem] animate-pulse rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" />
        </section>
      </main>
    );
  }

  const showApprovalForm = ["PENDING_REVIEW", "REJECTED"].includes(promotion.status);
  const showPaymentVerification =
    promotion.paymentMethod === "MANUAL" &&
    ["APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(promotion.status);
  const showRazorpayWaitingState =
    promotion.paymentMethod === "RAZORPAY" &&
    promotion.status === "APPROVED_WAITING_PAYMENT" &&
    promotion.paymentStatus !== "PAID";
  const showPriorityEditor = ["ACTIVE", "PAUSED", "APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(
    promotion.status
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/admin/promotions"
        backLabel="Promotions"
        title="Promotion Review"
        subtitle={promotion.productTitle}
        rightSlot={
          <button
            onClick={() => router.push("/dashboard/admin/ad-settings")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        }
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            {promotion.bannerImage && !promotion.adImages?.length ? (
              <img src={promotion.bannerImage} alt={promotion.title} className="h-72 w-full object-cover" />
            ) : promotion.adImages?.length ? (
              <div className="flex h-72 w-full gap-2 p-4 bg-slate-100 dark:bg-slate-900 overflow-x-auto items-center justify-center">
                {promotion.adImages.sort((a, b) => a.position - b.position).map((img) => (
                  <img key={img.key} src={img.url} alt="Ad content" className="h-full w-auto max-w-[30%] object-contain rounded-xl shadow-md bg-white/5" />
                ))}
              </div>
            ) : null}
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
                <p className="mt-2 text-sm text-slate-500 dark:text-white/65">{promotion.subtitle}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Requested" value={`${promotion.requestedDurationDays} days`} />
                <MetricCard label="Price" value={formatPromotionCurrency(promotion.amount, promotion.currency)} />
                <MetricCard label="Payment" value={PAYMENT_STATUS_LABELS[promotion.paymentStatus]} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow label="Seller" value={seller?.name || promotion.sellerName} />
                <InfoRow label="Seller Email" value={seller?.email || "N/A"} />
                <InfoRow label="Product" value={product?.title || promotion.productTitle} />
                <InfoRow label="Placement" value={PLACEMENT_LABELS[promotion.placement]} />
                <InfoRow label="Priority" value={promotion.priority ? `#${promotion.priority}` : "Pending"} />
                <InfoRow label="Submitted" value={formatPromotionDate(promotion.createdAt)} />
                <InfoRow label="Start Date" value={formatPromotionDate(promotion.startDate)} />
                <InfoRow label="End Date" value={formatPromotionDate(promotion.endDate)} />
                <InfoRow label="Target Link" value={promotion.targetLink || "Automatic product link"} />
                <InfoRow label="Transaction ID" value={promotion.transactionId || "Not provided"} />
                <InfoRow
                  label="Payment Method"
                  value={promotion.paymentMethod ? PAYMENT_METHOD_LABELS[promotion.paymentMethod] : "Pending"}
                />
                <InfoRow label="Razorpay Order" value={promotion.razorpayOrderId || "Not created"} />
                <InfoRow label="Razorpay Payment" value={promotion.razorpayPaymentId || "Not paid"} />
              </div>

              {promotion.sellerNote ? (
                <MessageCard label="Seller Note" tone="cyan" value={promotion.sellerNote} />
              ) : null}
              {promotion.adminNote ? <MessageCard label="Admin Note" tone="slate" value={promotion.adminNote} /> : null}
              {promotion.rejectedReason ? (
                <MessageCard label="Rejected Reason" tone="red" value={promotion.rejectedReason} />
              ) : null}
            </div>
          </section>

          {showApprovalForm ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Review Decision</p>
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <h2 className="text-xl font-black">Approve Request</h2>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Amount</span>
                    <input
                      type="number"
                      min={settings?.minimumPrice || 0}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      className={inputClass}
                    />
                    <p className="mt-2 text-xs text-slate-400 dark:text-white/40">
                      Minimum configured price: {formatPromotionCurrency(settings?.minimumPrice || 0)}
                    </p>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Duration (days)</span>
                    <input
                      type="number"
                      min={1}
                      value={approvedDurationDays}
                      onChange={(e) => setApprovedDurationDays(Number(e.target.value) || 1)}
                      className={inputClass}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Priority</span>
                      <input
                        type="number"
                        min={1}
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value) || 1)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Max Impressions</span>
                      <input
                        type="number"
                        min={1}
                        value={maxImpressions}
                        onChange={(e) => setMaxImpressions(e.target.value)}
                        placeholder="Optional"
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Admin Note</span>
                    <textarea
                      rows={4}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className={`${inputClass} resize-none`}
                    />
                  </label>

                  <button
                    onClick={() =>
                      void runAction(
                        () =>
                          promotionAPI.approvePromotion(promotion._id, {
                            amount,
                            approvedDurationDays,
                            priority,
                            maxImpressions: maxImpressions ? Number(maxImpressions) : undefined,
                            adminNote,
                            heroBgColor,
                            heroTextColor,
                            heroTitleColor,
                            heroSubtitleColor,
                            heroButtonBgColor,
                            heroButtonTextColor,
                            heroFontFamily,
                            heroLayout,
                          }),
                        "Promotion approved"
                      )
                    }
                    disabled={processing}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve & Request Payment
                  </button>
                </div>

                <div className="space-y-4 rounded-3xl border border-red-400/20 bg-red-500/5 p-5">
                  <h2 className="text-xl font-black text-red-300">Reject Request</h2>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-red-200/90">Reason</span>
                    <textarea
                      rows={6}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className={`${inputClass} resize-none border-red-400/20 bg-white/80 dark:bg-slate-950/40`}
                    />
                  </label>

                  <button
                    onClick={() =>
                      void runAction(
                        () =>
                          promotionAPI.rejectPromotion(promotion._id, {
                            rejectedReason: rejectReason,
                            adminNote,
                          }),
                        "Promotion rejected"
                      )
                    }
                    disabled={processing}
                    className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Request
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {showRazorpayWaitingState ? (
            <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">Automatic Razorpay Flow</p>
              <h2 className="mt-2 text-2xl font-black">Waiting for Seller Payment</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                This promotion is approved for automatic Razorpay checkout. No manual admin verification is needed once the payment is captured and verified.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <MetricCard label="Approved Amount" value={formatPromotionCurrency(promotion.amount, promotion.currency)} />
                <MetricCard label="Razorpay Order" value={promotion.razorpayOrderId || "Will be created when seller clicks Pay Now"} />
              </div>
            </section>
          ) : null}

          {showPaymentVerification ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Payment Verification</p>
              <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  {promotion.paymentProofImage ? (
                    <img
                      src={promotion.paymentProofImage}
                      alt="Payment proof"
                      className="h-72 w-full rounded-3xl object-cover"
                    />
                  ) : (
                    <div className="flex h-72 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-white/5">
                      <Clock3 className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <MetricCard label="Approved Amount" value={formatPromotionCurrency(promotion.amount, promotion.currency)} />
                  <MetricCard label="Submitted At" value={formatPromotionDate(promotion.paymentSubmittedAt || promotion.updatedAt)} />
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Transaction ID</span>
                    <input
                      value={verifyTransactionId}
                      onChange={(e) => setVerifyTransactionId(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Admin Note</span>
                    <textarea
                      rows={4}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className={`${inputClass} resize-none`}
                    />
                  </label>
                  <button
                    onClick={() =>
                      void runAction(
                        () =>
                          promotionAPI.verifyPromotionPayment(promotion._id, {
                            transactionId: verifyTransactionId,
                            paymentMethod: "MANUAL",
                            adminNote,
                          }),
                        "Payment verified and promotion activated"
                      )
                    }
                    disabled={processing}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verify Payment
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Seller & Product</p>
            <div className="mt-5 space-y-5">
              {product?.thumbnailUrl ? (
                <img src={product.thumbnailUrl} alt={promotion.productTitle} className="h-56 w-full rounded-3xl object-cover" />
              ) : (
                <div className="h-56 rounded-3xl bg-slate-100 dark:bg-white/5" />
              )}
              <InfoRow label="Seller Name" value={seller?.name || promotion.sellerName} />
              <InfoRow label="Seller Email" value={seller?.email || "N/A"} />
              <InfoRow label="Product" value={product?.title || promotion.productTitle} />
              <button
                onClick={() => router.push(`/marketplace/${product?._id || promotion.productId}`)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:text-white/75 dark:hover:border-white/20 dark:hover:bg-white/10"
              >
                Open Product Page
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Performance</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <MetricCard label="Impressions" value={promotion.metrics.impressions.toLocaleString("en-IN")} />
              <MetricCard label="Clicks" value={promotion.metrics.clicks.toLocaleString("en-IN")} />
              <MetricCard label="CTR" value={`${promotion.metrics.ctr}%`} />
              <MetricCard label="Revenue" value={formatPromotionCurrency(promotion.metrics.revenueGenerated)} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Style Configuration</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Background Color (Hex)</span>
                <input
                  type="text"
                  value={heroBgColor}
                  onChange={(e) => setHeroBgColor(e.target.value)}
                  className={inputClass}
                />
                {!isValidHexColor(heroBgColor) && (
                  <p className="mt-1 text-xs text-red-500">Invalid hex color format.</p>
                )}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Text Color</span>
                  <select
                    value={heroTextColor}
                    onChange={(e) => setHeroTextColor(e.target.value as "light" | "dark" | "auto")}
                    className={inputClass}
                  >
                    <option value="auto">Auto (Luminance Based)</option>
                    <option value="light">Always Light</option>
                    <option value="dark">Always Dark</option>
                  </select>
                  {heroTextColor !== "auto" && isValidHexColor(heroBgColor) && heroTextColor !== getAutoTextColor(heroBgColor) && (
                    <p className="mt-1 text-xs text-amber-500">Warning: Text may be hard to read on this background.</p>
                  )}
                </label>
                
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Layout Structure</span>
                  <select
                    value={heroLayout}
                    onChange={(e) => setHeroLayout(e.target.value as "floating" | "single" | "minimal")}
                    className={inputClass}
                  >
                    <option value="floating">Floating (1-3 Images)</option>
                    <option value="single">Single Featured Image</option>
                    <option value="minimal">Minimal (Text Focus)</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Title Color (Optional Hex)</span>
                  <input
                    type="text"
                    value={heroTitleColor}
                    onChange={(e) => setHeroTitleColor(e.target.value)}
                    placeholder="e.g. #FFFFFF"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Subtitle Color (Optional Hex)</span>
                  <input
                    type="text"
                    value={heroSubtitleColor}
                    onChange={(e) => setHeroSubtitleColor(e.target.value)}
                    placeholder="e.g. #E2E8F0"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Button BG Color (Optional Hex)</span>
                  <input
                    type="text"
                    value={heroButtonBgColor}
                    onChange={(e) => setHeroButtonBgColor(e.target.value)}
                    placeholder="e.g. #10B981"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Button Text Color (Optional Hex)</span>
                  <input
                    type="text"
                    value={heroButtonTextColor}
                    onChange={(e) => setHeroButtonTextColor(e.target.value)}
                    placeholder="e.g. #000000"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Custom Font Family</span>
                <select
                  value={heroFontFamily}
                  onChange={(e) => setHeroFontFamily(e.target.value)}
                  className={inputClass}
                >
                  <option value="inherit">Default UI Font</option>
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Playfair Display', serif">Playfair Display</option>
                  <option value="'Outfit', sans-serif">Outfit</option>
                  <option value="'Oswald', sans-serif">Oswald</option>
                </select>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setHeroBgColor("#2563EB");
                    setHeroTextColor("auto");
                    setHeroTitleColor("");
                    setHeroSubtitleColor("");
                    setHeroButtonBgColor("");
                    setHeroButtonTextColor("");
                    setHeroFontFamily("inherit");
                    setHeroLayout("floating");
                  }}
                  disabled={processing}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() =>
                    void runAction(
                      () => promotionAPI.updatePromotionStyle(promotion._id, {
                        heroBgColor,
                        heroTextColor,
                        heroTitleColor,
                        heroSubtitleColor,
                        heroButtonBgColor,
                        heroButtonTextColor,
                        heroFontFamily,
                        heroLayout
                      }),
                      "Style updated successfully"
                    )
                  }
                  disabled={processing || !isValidHexColor(heroBgColor)}
                  className="flex-1 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                >
                  Save Style
                </button>
              </div>
            </div>
            
            <div className="mt-6 border-t border-slate-200 pt-6 dark:border-white/10">
              <p className="mb-4 text-sm font-semibold text-slate-600 dark:text-white/75">Live Preview</p>
              <div 
                className="relative overflow-hidden rounded-3xl" 
                style={{ backgroundColor: isValidHexColor(heroBgColor) ? heroBgColor : "#2563EB" }}
              >
                <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-white/20 blur-3xl mix-blend-overlay"></div>
                <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-black/20 blur-3xl mix-blend-overlay"></div>
                
                <div 
                  className={`relative flex min-h-[300px] flex-col p-6 md:flex-row ${heroLayout === "minimal" ? "items-center justify-center text-center" : "items-center"}`}
                  style={{ fontFamily: heroFontFamily }}
                >
                  
                  {/* Left Images Area */}
                  {heroLayout !== "minimal" && promotion.adImages && promotion.adImages.length > 1 && (
                    <div className="hidden md:flex relative z-10 w-1/4 h-full items-end justify-start gap-2">
                      {promotion.adImages.sort((a, b) => a.position - b.position).slice(1, 3).map((img, i) => (
                        <div
                          key={img.key}
                          className="relative transition-all duration-500 ease-out flex-shrink-0 origin-bottom"
                          style={{ height: i === 0 ? "85%" : "70%", zIndex: 9 - i, marginLeft: i > 0 ? "-2rem" : "0" }}
                        >
                          <img src={img.url} alt="" className="h-full w-auto object-contain drop-shadow-2xl" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`relative z-10 w-full flex flex-col ${heroLayout === "minimal" ? "max-w-2xl items-center" : "md:flex-1 items-center px-4"}`}>
                    <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
                      Sponsored
                    </span>
                    <h3 
                      className={`mt-3 text-2xl font-black leading-tight drop-shadow-md ${heroLayout !== "minimal" ? "text-center" : ""}`}
                      style={{ color: isValidHexColor(heroTitleColor) ? heroTitleColor : (heroTextColor === "auto" ? (getAutoTextColor(heroBgColor) === "dark" ? "#000" : "#fff") : (heroTextColor === "dark" ? "#000" : "#fff")) }}
                    >
                      {promotion.title}
                    </h3>
                    <p 
                      className={`mt-2 text-sm drop-shadow-md ${heroLayout !== "minimal" ? "text-center" : ""}`}
                      style={{ color: isValidHexColor(heroSubtitleColor) ? heroSubtitleColor : (heroTextColor === "auto" ? (getAutoTextColor(heroBgColor) === "dark" ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)") : (heroTextColor === "dark" ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)")) }}
                    >
                      {promotion.subtitle}
                    </p>
                    <button 
                      className="mt-6 rounded-full px-6 py-2.5 text-xs font-bold transition hover:scale-105 shadow-xl"
                      style={{ 
                        backgroundColor: isValidHexColor(heroButtonBgColor) ? heroButtonBgColor : "#ffffff", 
                        color: isValidHexColor(heroButtonTextColor) ? heroButtonTextColor : "#000000" 
                      }}
                    >
                      {promotion.buttonText || "View Product"}
                    </button>
                  </div>
                  
                  {/* Right Image Area */}
                  {heroLayout !== "minimal" && (
                    <div className="relative mt-6 h-40 w-full md:mt-0 md:w-1/4 md:flex items-end justify-end">
                      {promotion.adImages?.length ? (
                        <div className="relative h-full w-full flex justify-end" style={{ zIndex: 10 }}>
                          <img src={promotion.adImages.sort((a, b) => a.position - b.position)[0].url} alt="" className="h-full w-auto object-contain drop-shadow-2xl" />
                        </div>
                      ) : promotion.bannerImage ? (
                        <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
                          <img src={promotion.bannerImage} className="max-h-[90%] w-auto object-contain drop-shadow-2xl rounded-2xl" alt="" />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {showPriorityEditor ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Live Controls</p>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">Priority</span>
                  <input
                    type="number"
                    min={1}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) || 1)}
                    className={inputClass}
                  />
                </label>
                <button
                  onClick={() =>
                    void runAction(
                      () => promotionAPI.updatePromotionPriority(promotion._id, priority),
                      "Priority updated"
                    )
                  }
                  disabled={processing}
                  className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save Priority
                </button>
                {promotion.status === "ACTIVE" ? (
                  <button
                    onClick={() =>
                      void runAction(
                        () => promotionAPI.pausePromotion(promotion._id, { adminNote }),
                        "Promotion paused"
                      )
                    }
                    disabled={processing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-3 font-semibold text-amber-300 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PauseCircle className="h-4 w-4" />
                    Pause Promotion
                  </button>
                ) : null}
                {promotion.status === "PAUSED" ? (
                  <button
                    onClick={() =>
                      void runAction(
                        () => promotionAPI.resumePromotion(promotion._id, { adminNote }),
                        "Promotion resumed"
                      )
                    }
                    disabled={processing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Resume Promotion
                  </button>
                ) : null}
              </div>
            </section>
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

function MessageCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "slate" | "red";
}) {
  const toneClasses =
    tone === "red"
      ? "border-red-400/20 bg-red-500/5 text-red-300"
      : tone === "cyan"
      ? "border-cyan-400/20 bg-cyan-500/5 text-cyan-400"
      : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55";

  return (
    <div className={`rounded-3xl border p-4 ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em]">{label}</p>
      <p className="mt-2 text-sm text-slate-700 dark:text-white/75">{value}</p>
    </div>
  );
}
