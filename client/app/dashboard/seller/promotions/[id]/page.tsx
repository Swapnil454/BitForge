"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard,
  Megaphone,
  UploadCloud,
  Wallet,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Download,
  Lock,
  XCircle,
  AlertCircle,
  FileText,
  Eye
} from "lucide-react";
import PageHeader from "../../../buyer/transactions/components/PageHeader";
import { promotionAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import {
  formatPromotionCurrency,
  formatPromotionDate,
  getPromotionErrorMessage,
  PLACEMENT_LABELS,
  type PromotionRecord,
} from "@/lib/promotions";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35";
const monoInputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35";

// (Razorpay types omitted for brevity, keeping the necessary ones)
type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayCheckoutOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill?: { name?: string; email?: string; };
  theme?: { color?: string; };
  modal?: { ondismiss?: () => void; };
};
type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: () => void) => void;
};
declare global { interface Window { Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance; } }

export default function SellerPromotionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [promotion, setPromotion] = useState<PromotionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Payment states
  const [submittingProof, setSubmittingProof] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [razorpayFailed, setRazorpayFailed] = useState(false);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchPromotion = useCallback(async () => {
    try {
      setLoading(true);
      const data = await promotionAPI.getSellerPromotion(params.id);
      setPromotion(data.promotion || null);
      setTransactionId(data.promotion?.transactionId || "");
      // Reset states
      setRazorpayFailed(data.promotion?.paymentStatus === "FAILED");
      setShowManualPayment(data.promotion?.paymentStatus === "FAILED");
    } catch {
      showError("Failed to load promotion");
      router.push("/dashboard/seller/promotions");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => { if (params.id) void fetchPromotion(); }, [params.id, fetchPromotion]);

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
      if (paymentProof) formData.append("paymentProof", paymentProof);
      if (transactionId.trim()) formData.append("transactionId", transactionId.trim());
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
      setShowCancelModal(false);
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
      setRazorpayFailed(false);
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
          showSuccess(verification.message || "Payment successful. Promotion status updated.");
          await fetchPromotion();
        },
        prefill: {
          name: typeof promotion.sellerId === "string" ? promotion.sellerName : promotion.sellerId?.name || promotion.sellerName,
          email: typeof promotion.sellerId === "string" ? undefined : promotion.sellerId?.email,
        },
        theme: { color: "#06b6d4" },
        modal: {
          ondismiss: () => {
            showError("Payment window closed before completion.");
            setRazorpayFailed(true);
            setShowManualPayment(true);
            void fetchPromotion();
          },
        },
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.on("payment.failed", () => {
        showError("Payment failed. You can retry or upload proof manually.");
        setRazorpayFailed(true);
        setShowManualPayment(true);
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
        <PageHeader backHref="/dashboard/seller/promotions" backLabel="Promotions" title="Promotion Detail" />
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="h-[32rem] animate-pulse rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" />
        </section>
      </main>
    );
  }

  const product = typeof promotion.productId === "string" ? null : promotion.productId;

  // Calculate Journey Step
  let currentStep = 1;
  if (promotion.status === "PENDING_REVIEW") currentStep = 2;
  else if (promotion.status === "APPROVED_WAITING_PAYMENT" || promotion.status === "PAYMENT_PENDING") currentStep = 4;
  else if (promotion.status === "ACTIVE") currentStep = 5;
  else if (promotion.status === "EXPIRED") currentStep = 6;

  const isCancelled = promotion.status === "CANCELLED" || promotion.status === "REJECTED";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <PageHeader backHref="/dashboard/seller/promotions" backLabel="Promotions" title="Promotion Detail" />

      {/* 1. Journey Bar */}
      {!isCancelled ? (
        <div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 overflow-x-auto pb-2 text-sm md:pb-0">
            <JourneyStep label="Submitted" active={currentStep >= 1} done={currentStep > 1} />
            <JourneyConnector done={currentStep > 1} />
            <JourneyStep label="Under Review" active={currentStep >= 2} done={currentStep > 2} />
            <JourneyConnector done={currentStep > 2} />
            <JourneyStep label="Approved" active={currentStep >= 3} done={currentStep > 3} />
            <JourneyConnector done={currentStep > 3} />
            <JourneyStep label="Payment" active={currentStep >= 4} done={currentStep > 4} />
            <JourneyConnector done={currentStep > 4} />
            <JourneyStep label="Live" active={currentStep >= 5} done={currentStep > 5} />
            <JourneyConnector done={currentStep > 5} />
            <JourneyStep label="Completed" active={currentStep >= 6} done={currentStep > 6} />
          </div>
        </div>
      ) : (
        <div className="border-b border-red-500/20 bg-red-500/5 px-4 py-4 text-center text-red-500">
          <p className="font-semibold">{promotion.status === "REJECTED" ? "Promotion Request Rejected" : "Promotion Cancelled"}</p>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        
        {/* 2. Hero Section */}
        <section className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col justify-center p-6 lg:p-10">
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-white/50">
              <span>Promotions</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-900 dark:text-white">{promotion.productTitle}</span>
            </div>
            
            <div className="mb-4">
              <StatusPill status={promotion.status} />
            </div>
            
            <h1 className="text-3xl font-black md:text-4xl">{promotion.title}</h1>
            <p className="mt-2 max-w-lg text-slate-500 dark:text-white/65">{promotion.subtitle}</p>
            
            <div className="mt-6 inline-flex w-fit items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-white/70">
              <Megaphone className="mr-2 h-3.5 w-3.5" />
              {PLACEMENT_LABELS[promotion.placement]}
            </div>
            
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-white/60">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {promotion.approvedDurationDays || promotion.requestedDurationDays} days
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" />
              <span className="flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                {promotion.amount ? formatPromotionCurrency(promotion.amount, promotion.currency) : "Pending Review"}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" />
              <span>Submitted {formatPromotionDate(promotion.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center border-t border-slate-100 bg-slate-50 p-6 dark:border-white/5 dark:bg-[#0a0a0f] lg:border-l lg:border-t-0">
            <div className="w-full max-w-sm">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Mobile Banner Preview</p>
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-white/5">
                {promotion.bannerImage ? (
                  <img src={promotion.bannerImage} alt="Banner Preview" className="h-full w-full object-cover" />
                ) : product?.thumbnailUrl ? (
                  <img src={product.thumbnailUrl} alt="Product Thumbnail Fallback" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">No Image</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. State-Driven CTA Block */}
        <CTABlock 
          promotion={promotion} 
          startingPayment={startingPayment} 
          razorpayFailed={razorpayFailed}
          onPay={handlePayPromotion} 
          onToggleManual={() => setShowManualPayment(!showManualPayment)} 
          showManualPayment={showManualPayment}
          paymentProofPreview={paymentProofPreview}
          handleProofChange={handleProofChange}
          transactionId={transactionId}
          setTransactionId={setTransactionId}
          handleSubmitPaymentProof={handleSubmitPaymentProof}
          submittingProof={submittingProof}
          paymentProof={paymentProof}
        />

        {/* 4. Full-Width Timeline */}
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="mb-6 text-lg font-bold">Activity Timeline</h3>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between relative">
            <div className="hidden md:block absolute top-3 left-6 right-6 h-[2px] bg-slate-100 dark:bg-white/5 z-0" />
            <TimelineNode 
              label="Submitted" 
              date={formatPromotionDate(promotion.createdAt)} 
              state="filled" 
            />
            <TimelineNode 
              label="Under Review" 
              date={promotion.status === "PENDING_REVIEW" ? "Admin is reviewing your request" : isCancelled && promotion.status === "REJECTED" ? "Rejected" : "Processed"} 
              state={promotion.status === "PENDING_REVIEW" ? "active" : isCancelled && promotion.status === "REJECTED" ? "cancelled" : "filled"} 
            />
            <TimelineNode 
              label="Approved" 
              date={promotion.approvedAt ? `Amount: ${formatPromotionCurrency(promotion.amount, promotion.currency)}, Duration: ${promotion.approvedDurationDays}d` : ""} 
              state={promotion.approvedAt ? "filled" : isCancelled ? "cancelled" : currentStep >= 3 ? "active" : "future"} 
            />
            <TimelineNode 
              label="Payment Pending" 
              date={promotion.paymentStatus === "PAID" ? "Payment verified" : promotion.status === "PAYMENT_PENDING" ? "Verifying proof..." : "Awaiting your action"} 
              state={promotion.paymentStatus === "PAID" ? "filled" : isCancelled ? "cancelled" : currentStep === 4 ? "active" : "future"} 
            />
            <TimelineNode 
              label={promotion.paymentStatus === "PAID" && promotion.status !== ("ACTIVE" as string) ? "Activating" : "Activation"} 
              date={promotion.status === "ACTIVE" ? formatPromotionDate(promotion.activatedAt) : promotion.paymentStatus === "PAID" ? "Server processing..." : "Will begin after payment verified"} 
              state={promotion.status === "ACTIVE" ? "filled" : isCancelled ? "cancelled" : promotion.paymentStatus === "PAID" ? "active" : "future"} 
            />
            <TimelineNode 
              label="Live" 
              date={promotion.status === "ACTIVE" ? `Until ${formatPromotionDate(promotion.endDate)}` : ""} 
              state={promotion.status === "ACTIVE" ? "active" : promotion.status === "EXPIRED" ? "filled" : isCancelled ? "cancelled" : "future"} 
            />
          </div>
        </section>

        {/* Two-Column Split */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          
          {/* Left Column */}
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-6 text-lg font-bold">Campaign Details</h3>
              <dl className="divide-y divide-slate-100 dark:divide-white/5">
                <DetailRow label="Banner Title" value={promotion.title} />
                <DetailRow label="Placement" value={PLACEMENT_LABELS[promotion.placement]} />
                {promotion.targetLink && <DetailRow label="Target Link" value={promotion.targetLink} canCopy isLink />}
                {promotion.promotionGoal && <DetailRow label="Goal" value={promotion.promotionGoal} />}
                <DetailRow label="Duration" value={`${promotion.approvedDurationDays || promotion.requestedDurationDays} days ${promotion.approvedDurationDays ? "(approved)" : "(requested)"}`} />
                <DetailRow label="Payment Method" value={promotion.paymentMethod === "RAZORPAY" ? "Razorpay" : "Manual / Pending"} />
                {promotion.sellerNote && <DetailRow label="Notes Submitted" value={promotion.sellerNote} />}
                {promotion.adminNote && <DetailRow label="Admin Note" value={promotion.adminNote} />}
                {promotion.rejectedReason && <DetailRow label="Rejection Reason" value={promotion.rejectedReason} />}
              </dl>
            </section>
            
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">What Happens Next</h3>
              <ol className="space-y-4 text-sm">
                <li className="flex gap-3 items-start"><span className="font-mono text-xs font-bold text-cyan-500 mt-0.5 shrink-0">01</span><span className="text-slate-600 dark:text-white/60">Complete payment via Razorpay</span></li>
                <li className="flex gap-3 items-start"><span className="font-mono text-xs font-bold text-cyan-500 mt-0.5 shrink-0">02</span><span className="text-slate-600 dark:text-white/60">Admin verifies within 2–4 hours</span></li>
                <li className="flex gap-3 items-start"><span className="font-mono text-xs font-bold text-cyan-500 mt-0.5 shrink-0">03</span><span className="text-slate-600 dark:text-white/60">Promotion goes live automatically</span></li>
                <li className="flex gap-3 items-start"><span className="font-mono text-xs font-bold text-cyan-500 mt-0.5 shrink-0">04</span><span className="text-slate-600 dark:text-white/60">Track performance in real time</span></li>
              </ol>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-3 text-sm font-bold text-slate-400 uppercase tracking-wider">Target Product</h3>
              <div className="flex items-center gap-3">
                {product?.thumbnailUrl ? (
                  <img src={product.thumbnailUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5">
                    <Megaphone className="h-5 w-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="truncate font-bold text-sm leading-tight">{promotion.productTitle}</h4>
                  <p className="truncate text-xs text-slate-500 mt-0.5">By {promotion.sellerName}</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/marketplace/${product?._id || promotion.productId}`)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                Open Product Page <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Actions</h3>
              <div className="flex flex-col gap-3">
                {["ACTIVE", "COMPLETED"].includes(promotion.status) && (
                  <>
                    <button className="inline-flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-white/5">
                      <Download className="h-4 w-4" /> Download Summary
                    </button>
                    <button onClick={() => router.push(`/marketplace/${product?._id || promotion.productId}`)} className="inline-flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-white/5">
                      <Eye className="h-4 w-4" /> View on Marketplace
                    </button>
                  </>
                )}
                {["PENDING_REVIEW", "APPROVED_WAITING_PAYMENT"].includes(promotion.status) && (
                  <>
                    <button 
                      onClick={() => showSuccess("Promotion Guidelines will be available soon")}
                      className="inline-flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-white/80 dark:hover:bg-white/5"
                    >
                      <FileText className="h-4 w-4" /> View Promotion Guidelines
                    </button>
                    <button 
                      onClick={() => setShowCancelModal(true)} 
                      className="inline-flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <XCircle className="h-4 w-4" /> Cancel Request
                    </button>
                  </>
                )}
                {!["ACTIVE", "COMPLETED", "PENDING_REVIEW", "APPROVED_WAITING_PAYMENT"].includes(promotion.status) && (
                  <p className="text-sm text-slate-500 italic px-3">No actions available</p>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Performance</h3>
              {["ACTIVE", "COMPLETED"].includes(promotion.status) ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Impressions</p>
                    <p className="text-xl font-black">{promotion.metrics.impressions.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Clicks</p>
                    <p className="text-xl font-black">{promotion.metrics.clicks.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">CTR</p>
                    <p className="text-xl font-black text-cyan-500">{promotion.metrics.ctr}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Orders</p>
                    <p className="text-xl font-black">{promotion.metrics.ordersGenerated.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="col-span-2 mt-2 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                    <p className="text-xs text-slate-500">Revenue Generated</p>
                    <p className="text-2xl font-black text-emerald-500">{formatPromotionCurrency(promotion.metrics.revenueGenerated)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-8 text-center dark:bg-white/5 px-4">
                  <Lock className="mb-3 h-8 w-8 text-slate-300 dark:text-white/20" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-white/70">Metrics Locked</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-white/50">
                    Performance data will be available once your promotion goes live. Expected activation: after payment is verified.
                  </p>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-[#111115] border border-slate-100 dark:border-white/10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/10">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-center text-xl font-black text-slate-900 dark:text-white">Cancel Promotion Request?</h3>
            <p className="mt-3 text-center text-sm text-slate-500 dark:text-white/60">
              This action cannot be undone. Are you sure you want to cancel your request for <strong>{promotion.title}</strong>?
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              >
                Keep it
              </button>
              <button
                onClick={() => void handleCancel()}
                className="flex-1 rounded-xl bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600 shadow-lg shadow-red-500/20"
              >
                Yes, cancel it
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

// Sub-components

function CTABlock({ promotion, startingPayment, razorpayFailed, onPay, onToggleManual, showManualPayment, paymentProofPreview, handleProofChange, transactionId, setTransactionId, handleSubmitPaymentProof, submittingProof, paymentProof }: any) {
  if (promotion.status === "PENDING_REVIEW") {
    return (
      <div className="rounded-[2rem] border border-blue-400/20 bg-blue-500/5 p-6 md:p-8">
        <h2 className="text-xl font-bold text-blue-500 dark:text-blue-400 mb-2">Under review — typically 24-48 hrs</h2>
        <p className="text-slate-600 dark:text-white/60">Our admin team is reviewing your promotion request to ensure it meets marketplace guidelines. You'll be notified once approved to complete payment.</p>
      </div>
    );
  }
  
  if (promotion.status === "APPROVED_WAITING_PAYMENT" && !razorpayFailed) {
    return (
      <div className="space-y-4">
        <div className="rounded-[2rem] border border-l-[6px] border-amber-300 border-l-amber-500 bg-amber-50 p-6 md:p-8 dark:bg-amber-950/20 dark:border-amber-900/50 dark:border-l-amber-500">
          <div className="mb-6 flex items-start gap-4">
            <div className="rounded-full bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400"><Wallet className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Your promotion has been approved</h2>
              <p className="text-slate-600 dark:text-white/60">Admin has reviewed and approved your request. Complete payment to activate your promotion.</p>
            </div>
          </div>
          <div className="mb-6 flex gap-6 text-sm font-medium">
            <div className="flex flex-col"><span className="text-amber-600 dark:text-amber-400 uppercase text-xs tracking-wider">Approved Amount</span><span className="text-lg font-bold">{formatPromotionCurrency(promotion.amount, promotion.currency)}</span></div>
            <div className="flex flex-col"><span className="text-slate-500 dark:text-white/50 uppercase text-xs tracking-wider">Duration</span><span className="text-lg font-bold">{promotion.approvedDurationDays} days</span></div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button onClick={onPay} disabled={startingPayment} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 font-bold text-amber-950 transition hover:bg-amber-400 disabled:opacity-70 shadow-lg shadow-amber-500/20">
              <CreditCard className="h-5 w-5" /> {startingPayment ? "Starting..." : `Pay ${formatPromotionCurrency(promotion.amount, promotion.currency)} via Razorpay`}
            </button>
            <button onClick={onToggleManual} className="text-sm font-medium text-slate-600 hover:text-slate-800 underline underline-offset-4 dark:text-white/60 dark:hover:text-white">
              Having trouble? Upload payment proof manually ↓
            </button>
          </div>
        </div>
        {showManualPayment && <ManualPaymentBlock 
          promotion={promotion} paymentProofPreview={paymentProofPreview} handleProofChange={handleProofChange} 
          transactionId={transactionId} setTransactionId={setTransactionId} handleSubmitPaymentProof={handleSubmitPaymentProof} 
          submittingProof={submittingProof} paymentProof={paymentProof} />}
      </div>
    );
  }

  if (promotion.status === "APPROVED_WAITING_PAYMENT" && razorpayFailed) {
    return (
      <div className="space-y-4">
        <div className="rounded-[2rem] border border-l-[6px] border-red-300 border-l-red-500 bg-red-50 p-6 md:p-8 dark:bg-red-950/20 dark:border-red-900/50 dark:border-l-red-500">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Payment unsuccessful — please try again</h2>
          <p className="text-slate-600 dark:text-white/60 mb-6">Your Razorpay payment could not be completed. You can try again or use the manual fallback method below.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button onClick={onPay} disabled={startingPayment} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-8 py-3.5 font-bold text-white transition hover:bg-red-600 disabled:opacity-70 shadow-lg shadow-red-500/20">
              <CreditCard className="h-5 w-5" /> Try Payment Again
            </button>
            <button onClick={onToggleManual} className="text-sm font-medium text-slate-600 hover:text-slate-800 underline underline-offset-4 dark:text-white/60 dark:hover:text-white">
              Upload payment proof manually instead ↓
            </button>
          </div>
        </div>
        {showManualPayment && <ManualPaymentBlock 
          promotion={promotion} paymentProofPreview={paymentProofPreview} handleProofChange={handleProofChange} 
          transactionId={transactionId} setTransactionId={setTransactionId} handleSubmitPaymentProof={handleSubmitPaymentProof} 
          submittingProof={submittingProof} paymentProof={paymentProof} />}
      </div>
    );
  }

  if (promotion.status === "PAYMENT_PENDING") {
    return (
      <div className="rounded-[2rem] border border-indigo-400/20 bg-indigo-500/5 p-6 md:p-8 flex gap-5 items-start">
        {promotion.paymentProofImage ? (
          <img src={promotion.paymentProofImage} alt="Proof" className="h-16 w-16 rounded-lg object-cover border border-indigo-500/20 shadow-sm" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500"><FileText className="h-8 w-8"/></div>
        )}
        <div>
          <h2 className="text-xl font-bold text-indigo-500 dark:text-indigo-400 mb-1">Payment proof received — Admin is verifying</h2>
          <p className="text-slate-600 dark:text-white/60">Your manual payment proof has been successfully submitted. This typically takes 2–4 hours for our team to verify and activate your promotion.</p>
        </div>
      </div>
    );
  }

  if (promotion.status === "ACTIVE") {
    return (
      <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 md:p-8 text-center">
        <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Your promotion is live 🟢</h2>
        <p className="text-emerald-700/70 dark:text-emerald-300/70 mt-2">Active until {formatPromotionDate(promotion.endDate)}</p>
      </div>
    );
  }

  if (promotion.status === "COMPLETED") {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 md:p-8 text-center dark:border-white/10 dark:bg-white/5">
        <h2 className="text-2xl font-black text-slate-600 dark:text-white/80">Promotion Completed</h2>
        <p className="text-slate-500 dark:text-white/50 mt-2">This campaign ran from {formatPromotionDate(promotion.startDate)} to {formatPromotionDate(promotion.endDate)}</p>
      </div>
    );
  }

  return null;
}

function ManualPaymentBlock({ promotion, paymentProofPreview, handleProofChange, transactionId, setTransactionId, handleSubmitPaymentProof, submittingProof, paymentProof }: any) {
  return (
    <div className="max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 mt-4">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Upload Payment Proof</h3>
        <p className="text-sm text-slate-500 dark:text-white/60">
          If Razorpay failed or is unavailable, submit a screenshot and/or transaction ID for manual admin verification.
        </p>
      </div>
      
      {promotion.status === "PAYMENT_PENDING" ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center dark:bg-white/5">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-indigo-400" />
          <p className="font-semibold">Proof submitted on {formatPromotionDate(promotion.paymentSubmittedAt || promotion.updatedAt)}.</p>
          <p className="text-sm text-slate-500">Awaiting admin verification.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-cyan-400 hover:bg-cyan-400/5 dark:border-white/10 dark:bg-white/5 dark:hover:border-cyan-400/50">
            {paymentProofPreview ? (
              <div className="relative h-full w-full p-2">
                <img src={paymentProofPreview} alt="Preview" className="h-full w-full rounded-xl object-contain" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100 rounded-xl">
                  <p className="text-sm font-semibold text-white">Change Image</p>
                </div>
              </div>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-cyan-500" />
                <div className="text-center">
                  <p className="text-sm font-semibold">Upload receipt image</p>
                  <p className="mt-1 text-xs text-slate-400">JPG, PNG up to 10MB</p>
                </div>
              </>
            )}
            <input type="file" accept="image/jpeg,image/png" onChange={handleProofChange} className="hidden" />
          </label>

          <div className="flex flex-col justify-center space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Transaction / UTR ID</span>
              <input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Optional but recommended"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35"
                maxLength={50}
              />
            </label>

            <div>
              <button
                onClick={() => void handleSubmitPaymentProof()}
                disabled={submittingProof || (!paymentProof && !transactionId.trim())}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {submittingProof ? "Submitting..." : "Submit Payment Proof"}
              </button>
              {(!paymentProof && !transactionId.trim()) && (
                <p className="mt-2 text-center text-xs text-slate-500">Upload a receipt image or enter a Transaction ID to continue.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JourneyStep({ label, active, done }: { label: string, active: boolean, done: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 min-w-[80px] z-10 ${active ? "opacity-100" : "opacity-40 grayscale"}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${done ? "bg-cyan-500 border-cyan-500 text-white" : active ? "border-cyan-500 text-cyan-500 bg-white dark:bg-[#0a0a0f]" : "border-slate-300 text-slate-300 dark:border-white/20 dark:text-white/20"}`}>
        {done ? <CheckCircle2 className="h-5 w-5" /> : <div className={`h-2.5 w-2.5 rounded-full ${active ? "bg-cyan-500" : "bg-transparent"}`} />}
      </div>
      <span className={`text-[11px] font-bold uppercase tracking-wider ${active ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{label}</span>
    </div>
  );
}

function JourneyConnector({ done }: { done: boolean }) {
  return (
    <div className={`h-[2px] flex-1 min-w-[30px] -mt-6 transition-colors ${done ? "bg-cyan-500" : "bg-slate-200 dark:bg-white/10"}`} />
  );
}

function TimelineNode({ label, date, state }: { label: string, date: string, state: "filled" | "active" | "future" | "cancelled" }) {
  return (
    <div className="flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-3 flex-1 relative z-10">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white dark:bg-[#05050a] ${
        state === "filled" ? "border-cyan-500 text-cyan-500" : 
        state === "active" ? "border-cyan-500 animate-pulse" : 
        state === "cancelled" ? "border-red-400 text-red-400" : "border-slate-200 dark:border-white/20"
      }`}>
        {state === "filled" && <div className="h-2 w-2 rounded-full bg-cyan-500" />}
        {state === "active" && <div className="h-2 w-2 rounded-full bg-cyan-500" />}
        {state === "cancelled" && <XCircle className="h-4 w-4" />}
      </div>
      <div className="flex flex-col md:items-center md:text-center mt-0.5 md:mt-0">
        <p className={`text-sm font-bold ${state === "active" ? "text-slate-900 dark:text-white" : state === "cancelled" ? "text-red-400 line-through" : state === "future" ? "text-slate-400 dark:text-white/40" : "text-slate-700 dark:text-white/80"}`}>{label}</p>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">{date}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, canCopy, isLink }: { label: string, value: string, canCopy?: boolean, isLink?: boolean }) {
  const displayValue = isLink && value.length > 28
    ? `${value.substring(0, 16)}...${value.substring(value.length - 7)}`
    : value;

  return (
    <div className="flex flex-col py-3 sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500 dark:text-white/60">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
        <span className={`truncate max-w-[250px] sm:max-w-xs ${isLink ? 'font-mono text-xs text-slate-600 dark:text-white/70' : ''}`}>
          {displayValue}
        </span>
        {canCopy && (
          <button 
            onClick={() => { navigator.clipboard.writeText(value); showSuccess("Copied"); }}
            className="text-cyan-500 hover:text-cyan-600 text-xs uppercase tracking-wider font-bold shrink-0"
          >
            Copy
          </button>
        )}
      </dd>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const isPending = status === "PENDING_REVIEW";
  const isApproved = status === "APPROVED_WAITING_PAYMENT";
  const isPaymentPending = status === "PAYMENT_PENDING";
  const isActive = status === "ACTIVE";
  const isCompleted = status === "COMPLETED";
  const isRejected = status === "REJECTED" || status === "CANCELLED";

  let color = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-white/70 dark:border-white/20";
  let icon = <Clock className="h-3.5 w-3.5 mr-1.5" />;
  let text = "Unknown";

  if (isPending) { color = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"; text = "Under Review"; }
  if (isApproved) { color = "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"; text = "Awaiting Payment"; }
  if (isPaymentPending) { color = "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"; text = "Payment Verifying"; }
  if (isActive) { color = "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"; icon = <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />; text = "Live"; }
  if (isCompleted) { text = "Completed"; }
  if (isRejected) { color = "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"; icon = <XCircle className="h-3.5 w-3.5 mr-1.5" />; text = status === "REJECTED" ? "Rejected" : "Cancelled"; }

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${color}`}>{icon}{text}</span>;
}
