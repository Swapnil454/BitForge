"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
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
  AlertCircle,
  FileText,
  Eye,
  Building2,
  Smartphone,
  QrCode,
  XCircle
} from "lucide-react";
import PageHeader from "../../../buyer/transactions/components/PageHeader";
import api, { promotionAPI } from "@/lib/api";
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
  const [platformBankAccount, setPlatformBankAccount] = useState<any>(null);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isEditingLive, setIsEditingLive] = useState(false);
  const [savingLiveEdit, setSavingLiveEdit] = useState(false);
  
  // Live edit fields
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editButtonText, setEditButtonText] = useState("");
  const [editTargetLink, setEditTargetLink] = useState("");
  const [editHeroBgColor, setEditHeroBgColor] = useState("");
  const [editHeroTextColor, setEditHeroTextColor] = useState<"light" | "dark" | "auto">("auto");
  const [editHeroTitleColor, setEditHeroTitleColor] = useState("");
  const [editHeroSubtitleColor, setEditHeroSubtitleColor] = useState("");
  const [editHeroButtonBgColor, setEditHeroButtonBgColor] = useState("");
  const [editHeroButtonTextColor, setEditHeroButtonTextColor] = useState("");
  const [editHeroLayout, setEditHeroLayout] = useState<string>("floating");
  const [editBannerCardImage, setEditBannerCardImage] = useState<File | null>(null);
  const [editBannerCardImagePreview, setEditBannerCardImagePreview] = useState<string | null>(null);

  const [editDesktopBannerImage, setEditDesktopBannerImage] = useState<File | null>(null);
  const [editDesktopBannerImagePreview, setEditDesktopBannerImagePreview] = useState<string | null>(null);

  const [editMobileBannerImage, setEditMobileBannerImage] = useState<File | null>(null);
  const [editMobileBannerImagePreview, setEditMobileBannerImagePreview] = useState<string | null>(null);

  const fetchPromotion = useCallback(async () => {
    if (!params.id || params.id === "undefined") {
      showError("Invalid promotion link");
      router.replace("/dashboard/seller/promotions");
      return;
    }
    
    try {
      setLoading(true);
      const data = await promotionAPI.getSellerPromotion(params.id);
      setPromotion(data.promotion || null);
      setTransactionId(data.promotion?.transactionId || "");
      // Reset states
      setRazorpayFailed(data.promotion?.paymentStatus === "FAILED");
      setShowManualPayment(data.promotion?.paymentStatus === "FAILED");
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showError("This promotion has been deleted or no longer exists");
      } else if (error?.response?.status === 400) {
        showError("Invalid promotion link");
      } else {
        showError("Failed to load promotion");
      }
      router.replace("/dashboard/seller/promotions");
    } finally {
      setLoading(false);
    }
    
    // Fetch platform bank account for manual payment fallback
    try {
      const bankRes = await api.get("/seller/platform-bank-account");
      setPlatformBankAccount(bankRes.data);
    } catch (e) {
      console.log("Could not fetch platform bank account", e);
    }
  }, [params.id, router]);

  useEffect(() => { if (params.id) void fetchPromotion(); }, [params.id, fetchPromotion]);

  const startLiveEdit = () => {
    if (!promotion) return;
    setEditTitle(promotion.title);
    setEditSubtitle(promotion.subtitle || "");
    setEditButtonText(promotion.buttonText || "");
    setEditTargetLink(promotion.targetLink || "");
    setEditHeroBgColor(promotion.heroBgColor || "#2563EB");
    setEditHeroTextColor(promotion.heroTextColor || "auto");
    setEditHeroTitleColor(promotion.heroTitleColor || "");
    setEditHeroSubtitleColor(promotion.heroSubtitleColor || "");
    setEditHeroButtonBgColor(promotion.heroButtonBgColor || "");
    setEditHeroButtonTextColor(promotion.heroButtonTextColor || "");
    setEditHeroLayout(promotion.heroLayout || "floating");
    setIsEditingLive(true);
  };

  const handleEditBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Image must be an image file");
      return;
    }
    setEditBannerCardImage(file);
    setEditBannerCardImagePreview(URL.createObjectURL(file));
  };

  const handleEditDesktopBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Image must be an image file");
      return;
    }
    setEditDesktopBannerImage(file);
    setEditDesktopBannerImagePreview(URL.createObjectURL(file));
  };

  const handleEditMobileBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Image must be an image file");
      return;
    }
    setEditMobileBannerImage(file);
    setEditMobileBannerImagePreview(URL.createObjectURL(file));
  };

  const handleSaveLiveEdit = async () => {
    if (!promotion) return;
    try {
      setSavingLiveEdit(true);
      const formData = new FormData();
      if (editHeroLayout !== 'fullImage') {
        if (editBannerCardImage) {
          formData.append("bannerCardImage", editBannerCardImage);
        } else {
          formData.append("existingBannerImage", promotion.bannerImage || "");
        }
      }

      if (editHeroLayout === 'fullImage') {
        if (editDesktopBannerImage) {
          formData.append("desktopBannerImage", editDesktopBannerImage);
        } else {
          formData.append("existingDesktopBanner", promotion.desktopBannerImage || "");
        }
        
        if (editMobileBannerImage) {
          formData.append("mobileBannerImage", editMobileBannerImage);
        } else {
          formData.append("existingMobileBanner", promotion.mobileBannerImage || "");
        }
      }
      
      formData.append("title", editTitle);
      formData.append("subtitle", editSubtitle);
      formData.append("buttonText", editButtonText);
      formData.append("targetLink", editTargetLink);
      formData.append("heroBgColor", editHeroBgColor);
      formData.append("heroTextColor", editHeroTextColor);
      formData.append("heroTitleColor", editHeroTitleColor);
      formData.append("heroSubtitleColor", editHeroSubtitleColor);
      formData.append("heroButtonBgColor", editHeroButtonBgColor);
      formData.append("heroButtonTextColor", editHeroButtonTextColor);
      formData.append("heroLayout", editHeroLayout);

      await promotionAPI.updateLiveSellerPromotion(promotion._id, formData);
      showSuccess("Promotion updated successfully");
      setIsEditingLive(false);
      setEditBannerCardImage(null);
      setEditBannerCardImagePreview(null);
      setEditDesktopBannerImage(null);
      setEditDesktopBannerImagePreview(null);
      setEditMobileBannerImage(null);
      setEditMobileBannerImagePreview(null);
      await fetchPromotion();
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to save live edit"));
    } finally {
      setSavingLiveEdit(false);
    }
  };

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
  else if (promotion.status === "ACTIVE") currentStep = 6;
  else if (promotion.status === "EXPIRED") currentStep = 7;

  const isCancelled = promotion.status === "CANCELLED" || promotion.status === "REJECTED";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <PageHeader 
        backHref="/dashboard/seller/promotions" 
        backLabel="Promotions" 
        title="Promotion Detail" 
        rightSlot={
          promotion.status === "EXPIRED" ? (
            <button
              onClick={() => router.push(`/dashboard/seller/promotions/create?renewId=${promotion._id}`)}
              className="inline-flex items-center justify-center gap-1 md:gap-2 rounded-lg md:rounded-xl bg-slate-900 px-2.5 py-1 md:px-4 md:py-2 text-[10px] md:text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Renew
            </button>
          ) : undefined
        }
      />


      <div className="mx-auto max-w-7xl px-4 py-2 md:py-8 space-y-4 md:space-y-6">
        
        {/* 2. Hero Section */}
        <section className="grid overflow-hidden rounded-none md:rounded-[2rem] border-0 md:border md:border-slate-200 bg-transparent md:bg-white md:shadow-sm md:dark:border-white/10 md:dark:bg-white/5 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col justify-center p-0 py-4 md:p-6 lg:p-10">
            <div className="mb-4 flex items-center gap-2 text-[10px] md:text-sm text-slate-500 dark:text-white/50">
              <span>Promotions</span>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-slate-900 dark:text-white">{promotion.productTitle}</span>
            </div>
            
            <div className="mb-4">
              <StatusPill status={promotion.status} />
            </div>
            
            <h1 className="text-2xl font-black md:text-4xl">{promotion.title}</h1>
            <p className="mt-2 text-sm md:text-base max-w-lg text-slate-500 dark:text-white/65">{promotion.subtitle}</p>
            
            <div className="mt-4 md:mt-6 inline-flex w-fit items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-white/70">
              <Megaphone className="mr-2 h-3.5 w-3.5" />
              {PLACEMENT_LABELS[promotion.placement]}
            </div>
            
            <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm font-medium text-slate-600 dark:text-white/60">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {promotion.approvedDurationDays || promotion.requestedDurationDays} days
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" />
              <span className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {promotion.amount ? formatPromotionCurrency(promotion.amount, promotion.currency) : "Pending Review"}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" />
              <span>Submitted {formatPromotionDate(promotion.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center border-t border-slate-100 md:bg-slate-50 py-6 md:p-6 dark:border-white/5 md:dark:bg-[#0a0a0f] lg:border-l lg:border-t-0">
            <div className="w-full max-w-sm">
              <p className="mb-3 text-center text-[10px] md:text-xs font-semibold uppercase tracking-widest text-slate-400">Mobile Banner Preview</p>
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
          platformBankAccount={platformBankAccount}
        />

        {/* 4. Full-Width Timeline */}
        <section className="mt-4 md:mt-8 rounded-none md:rounded-[2rem] border-t md:border-t-0 border-slate-100 md:border md:border-slate-200 bg-transparent md:bg-white p-0 py-6 md:p-6 md:shadow-sm dark:border-white/5 md:dark:border-white/10 md:dark:bg-white/5">
          <h3 className="mb-4 md:mb-6 text-lg font-bold">Activity Timeline</h3>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between relative">
            {/* Horizontal lines for md+ */}
            <div className="hidden md:block absolute top-3 left-6 right-6 h-[2px] bg-slate-100 dark:bg-white/5 z-0" />
            <div 
              className="hidden md:block absolute top-3 left-6 h-[2px] bg-cyan-500 z-0 transition-all duration-500" 
              style={{ width: `calc(${Math.min(100, Math.max(0, (currentStep - 1) * 16.66))}% - 24px)` }} 
            />
            {/* Vertical lines for mobile */}
            <div className="block md:hidden absolute left-3 top-3 bottom-3 w-[2px] bg-slate-100 dark:bg-white/5 z-0" />
            <div 
              className="block md:hidden absolute left-3 top-3 w-[2px] bg-cyan-500 z-0 transition-all duration-500" 
              style={{ height: `calc(${Math.min(100, Math.max(0, (currentStep - 1) * 16.66))}% - 12px)` }} 
            />
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
              date={promotion.status === "ACTIVE" ? `Until ${formatPromotionDate(promotion.endDate)}` : promotion.status === "EXPIRED" ? `Ended ${formatPromotionDate(promotion.endDate)}` : ""} 
              state={promotion.status === "ACTIVE" ? "active" : promotion.status === "EXPIRED" ? "filled" : isCancelled ? "cancelled" : "future"} 
            />
            <TimelineNode 
              label="Expired" 
              date={promotion.status === "EXPIRED" ? "Campaign has concluded" : ""} 
              state={promotion.status === "EXPIRED" ? "filled" : isCancelled ? "cancelled" : "future"} 
            />
          </div>
        </section>

        {/* Two-Column Split */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          
          {/* Left Column */}
          <div className="space-y-4 md:space-y-6">
            <section className="rounded-none md:rounded-[2rem] border-t md:border-t-0 border-slate-100 md:border md:border-slate-200 bg-transparent md:bg-white p-0 py-5 md:p-6 md:shadow-sm dark:border-white/5 md:dark:border-white/10 md:dark:bg-white/5">
              <h3 className="mb-4 md:mb-6 text-lg font-bold">Campaign Details</h3>
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
            
            <section className="rounded-none md:rounded-[2rem] border-t md:border-t-0 border-slate-100 md:border md:border-slate-200 bg-transparent md:bg-white p-0 py-5 md:p-6 md:shadow-sm dark:border-white/5 md:dark:border-white/10 md:dark:bg-white/5">
              <h3 className="mb-3 md:mb-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">What Happens Next</h3>
              <ol className="space-y-4 text-sm">
                <li className="flex gap-3 items-start"><span className="font-mono text-xs font-bold text-cyan-500 mt-0.5 shrink-0">01</span><span className="text-slate-600 dark:text-white/60">Complete payment via Razorpay</span></li>
                <li className="flex gap-3 items-start"><span className="font-mono text-xs font-bold text-cyan-500 mt-0.5 shrink-0">02</span><span className="text-slate-600 dark:text-white/60">Admin verifies within 2–4 hours</span></li>
                <li className="flex gap-3 items-start"><span className="font-mono text-xs font-bold text-cyan-500 mt-0.5 shrink-0">03</span><span className="text-slate-600 dark:text-white/60">Promotion goes live automatically</span></li>
                <li className="flex gap-3 items-start"><span className="font-mono text-xs font-bold text-cyan-500 mt-0.5 shrink-0">04</span><span className="text-slate-600 dark:text-white/60">Track performance in real time</span></li>
              </ol>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-4 md:space-y-6">
            
            <section className="rounded-none md:rounded-[2rem] border-t md:border-t-0 border-slate-100 md:border md:border-slate-200 bg-transparent md:bg-white p-0 py-5 md:p-5 md:shadow-sm dark:border-white/5 md:dark:border-white/10 md:dark:bg-white/5">
              <h3 className="mb-2 md:mb-3 text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">Target Product</h3>
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
                onClick={() => router.push(`/product/${product?._id || promotion.productId}`)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                Open Product Page <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </section>

            <section className="rounded-none md:rounded-[2rem] border-t md:border-t-0 border-slate-100 md:border md:border-slate-200 bg-transparent md:bg-white p-0 py-5 md:p-6 md:shadow-sm dark:border-white/5 md:dark:border-white/10 md:dark:bg-white/5">
              <h3 className="mb-3 md:mb-4 text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">Actions</h3>
              <div className="flex flex-col gap-3">
                {["ACTIVE", "COMPLETED"].includes(promotion.status) && (
                  <>
                    <button className="inline-flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-white/5">
                      <Download className="h-4 w-4" /> Download Summary
                    </button>
                    <button onClick={() => router.push(`/marketplace/${product?._id || promotion.productId}`)} className="inline-flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-white/5">
                      <Eye className="h-4 w-4" /> View on Marketplace
                    </button>
                    {promotion.status === "ACTIVE" && (
                      <button onClick={startLiveEdit} className="inline-flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
                        <Megaphone className="h-4 w-4" /> Edit Live Promotion
                      </button>
                    )}
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

      {/* Live Edit Modal */}
      {isEditingLive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#13131a] border border-slate-200 dark:border-white/10 my-8">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Edit Live Promotion</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              
              {editHeroLayout !== "fullImage" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Update Image</span>
                  <div className="mt-1 flex justify-center rounded-2xl border border-dashed border-slate-300 dark:border-white/20 px-6 py-6 transition hover:border-cyan-500 hover:bg-slate-50 dark:hover:bg-white/5">
                    <div className="text-center">
                      {editBannerCardImagePreview ? (
                        <div className="mb-4">
                          <img src={editBannerCardImagePreview} alt="Preview" className="mx-auto h-32 w-auto rounded-lg object-contain" />
                          <button onClick={(e) => { e.preventDefault(); setEditBannerCardImage(null); setEditBannerCardImagePreview(null); }} className="mt-2 text-xs font-semibold text-red-500">Remove Image</button>
                        </div>
                      ) : promotion?.bannerImage ? (
                        <div className="mb-4">
                          <img src={promotion.bannerImage} alt="Current" className="mx-auto h-32 w-auto rounded-lg object-contain" />
                          <p className="mt-2 text-xs font-medium text-slate-500">Current Image</p>
                        </div>
                      ) : (
                        <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                      )}
                      <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-white/70 justify-center">
                        <label className="relative cursor-pointer rounded-md font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500 dark:text-indigo-400">
                          <span>Upload a new image</span>
                          <input type="file" className="sr-only" accept="image/*" onChange={handleEditBannerChange} />
                        </label>
                      </div>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Desktop Banner</span>
                    <div className="mt-1 flex justify-center rounded-2xl border border-dashed border-slate-300 dark:border-white/20 px-6 py-6 transition hover:border-cyan-500 hover:bg-slate-50 dark:hover:bg-white/5">
                      <div className="text-center w-full">
                        {editDesktopBannerImagePreview ? (
                          <div className="mb-4">
                            <img src={editDesktopBannerImagePreview} alt="Preview" className="mx-auto h-32 w-full object-contain" />
                            <button onClick={(e) => { e.preventDefault(); setEditDesktopBannerImage(null); setEditDesktopBannerImagePreview(null); }} className="mt-2 text-xs font-semibold text-red-500">Remove</button>
                          </div>
                        ) : promotion?.desktopBannerImage ? (
                          <div className="mb-4">
                            <img src={promotion.desktopBannerImage} alt="Current Desktop" className="mx-auto h-32 w-full object-contain" />
                            <p className="mt-2 text-xs font-medium text-slate-500">Current Desktop</p>
                          </div>
                        ) : (
                          <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                        )}
                        <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-white/70 justify-center">
                          <label className="relative cursor-pointer rounded-md font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500 dark:text-indigo-400">
                            <span>Upload desktop image</span>
                            <input type="file" className="sr-only" accept="image/*" onChange={handleEditDesktopBannerChange} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Mobile Banner</span>
                    <div className="mt-1 flex justify-center rounded-2xl border border-dashed border-slate-300 dark:border-white/20 px-6 py-6 transition hover:border-cyan-500 hover:bg-slate-50 dark:hover:bg-white/5">
                      <div className="text-center w-full">
                        {editMobileBannerImagePreview ? (
                          <div className="mb-4">
                            <img src={editMobileBannerImagePreview} alt="Preview" className="mx-auto h-32 w-full object-contain" />
                            <button onClick={(e) => { e.preventDefault(); setEditMobileBannerImage(null); setEditMobileBannerImagePreview(null); }} className="mt-2 text-xs font-semibold text-red-500">Remove</button>
                          </div>
                        ) : promotion?.mobileBannerImage ? (
                          <div className="mb-4">
                            <img src={promotion.mobileBannerImage} alt="Current Mobile" className="mx-auto h-32 w-full object-contain" />
                            <p className="mt-2 text-xs font-medium text-slate-500">Current Mobile</p>
                          </div>
                        ) : (
                          <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                        )}
                        <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-white/70 justify-center">
                          <label className="relative cursor-pointer rounded-md font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500 dark:text-indigo-400">
                            <span>Upload mobile image</span>
                            <input type="file" className="sr-only" accept="image/*" onChange={handleEditMobileBannerChange} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              )}

              <label className="block opacity-75 cursor-not-allowed">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Layout Type</span>
                <select value={editHeroLayout} disabled className={`${inputClass} bg-slate-100 dark:bg-white/5`}>
                  <option value="floating">Floating Modern (Text Left, Image Right)</option>
                  <option value="fullImage">Full Image (Image Only)</option>
                  <option value="single">Single Block (Text Overlay)</option>
                  <option value="minimal">Minimal (Small Image)</option>
                  <option value="legacy">Legacy (Basic Split)</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Layout cannot be changed after creation.</p>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Target Link (Optional)</span>
                <input type="text" value={editTargetLink} onChange={(e) => setEditTargetLink(e.target.value)} placeholder="Leave blank for product page" className={inputClass} />
              </label>

              {editHeroLayout !== "fullImage" && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Title</span>
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Subtitle</span>
                    <input type="text" value={editSubtitle} onChange={(e) => setEditSubtitle(e.target.value)} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Button Text</span>
                    <input type="text" value={editButtonText} onChange={(e) => setEditButtonText(e.target.value)} className={inputClass} />
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-white/80">Bg Color</span>
                      <input type="text" value={editHeroBgColor} onChange={(e) => setEditHeroBgColor(e.target.value)} className={inputClass} placeholder="#FFFFFF" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-white/80">Text Theme</span>
                      <select value={editHeroTextColor} onChange={(e) => setEditHeroTextColor(e.target.value as any)} className={inputClass}>
                        <option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-white/80">Btn Bg</span>
                      <input type="text" value={editHeroButtonBgColor} onChange={(e) => setEditHeroButtonBgColor(e.target.value)} className={inputClass} placeholder="#000000" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-white/80">Btn Text</span>
                      <input type="text" value={editHeroButtonTextColor} onChange={(e) => setEditHeroButtonTextColor(e.target.value)} className={inputClass} placeholder="#FFFFFF" />
                    </label>
                  </div>
                </>
              )}

            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4">
              <button onClick={() => setIsEditingLive(false)} disabled={savingLiveEdit} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10">Cancel</button>
              <button onClick={handleSaveLiveEdit} disabled={savingLiveEdit} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-600 flex items-center gap-2">
                {savingLiveEdit && <Clock className="w-4 h-4 animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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

function CTABlock({ promotion, startingPayment, razorpayFailed, onPay, onToggleManual, showManualPayment, paymentProofPreview, handleProofChange, transactionId, setTransactionId, handleSubmitPaymentProof, submittingProof, paymentProof, platformBankAccount }: any) {
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
          submittingProof={submittingProof} paymentProof={paymentProof} platformBankAccount={platformBankAccount} />}
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
          submittingProof={submittingProof} paymentProof={paymentProof} platformBankAccount={platformBankAccount} />}
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

function ManualPaymentBlock({ promotion, paymentProofPreview, handleProofChange, transactionId, setTransactionId, handleSubmitPaymentProof, submittingProof, paymentProof, platformBankAccount }: any) {
  return (
    <div className="max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 mt-4">
      <div className="mb-6 border-b border-slate-100 pb-4 dark:border-white/5">
        <h3 className="text-lg font-bold">Manual Payment Submission</h3>
        <p className="text-sm text-slate-500 dark:text-white/60">
          Transfer {formatPromotionCurrency(promotion.amount, promotion.currency)} to the platform account below, then upload your payment proof.
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
          
          {/* Admin Payment Details Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/5 dark:bg-[#0a0a0f]">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-500" /> Platform Bank Details
            </h4>
            
            {platformBankAccount ? (
              <div className="space-y-4">
                {platformBankAccount.accountNumber && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-200/50 pb-2 dark:border-white/5">
                      <span className="text-slate-500">Bank Name</span>
                      <span className="font-semibold">{platformBankAccount.bankName || "Platform Bank"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-2 dark:border-white/5">
                      <span className="text-slate-500">Account Holder</span>
                      <span className="font-semibold">{platformBankAccount.accountHolderName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-2 dark:border-white/5">
                      <span className="text-slate-500">Account No.</span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 select-all">{platformBankAccount.accountNumber}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-slate-500">IFSC Code</span>
                      <span className="font-mono font-bold select-all">{platformBankAccount.ifscCode}</span>
                    </div>
                  </div>
                )}

                {(platformBankAccount.upiId || platformBankAccount.qrCodeImageUrl) && (
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/5">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-cyan-500" /> UPI Payment
                    </h4>
                    
                    <div className="flex flex-col gap-5 items-center justify-center mt-2">
                      {platformBankAccount.qrCodeImageUrl && (
                        <div className="w-full max-w-[240px] aspect-square rounded-2xl bg-white p-3 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto">
                          <img src={platformBankAccount.qrCodeImageUrl} alt="Admin QR Code" className="w-full h-full object-contain rounded-xl" />
                        </div>
                      )}
                      {platformBankAccount.upiId && (
                        <div className="w-full text-center">
                          <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-widest font-bold">UPI ID</p>
                          <p className="font-mono font-bold text-base md:text-lg bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 px-4 py-3 rounded-xl select-all text-cyan-600 dark:text-cyan-400 inline-block w-full">
                            {platformBankAccount.upiId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="mb-2 h-6 w-6 text-slate-400" />
                <p className="text-sm text-slate-500">Platform bank details are currently unavailable.</p>
              </div>
            )}
          </div>
          
          {/* Upload Proof Box */}
          <div className="flex flex-col gap-4">
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
  const isExpired = status === "EXPIRED";
  const isRejected = status === "REJECTED" || status === "CANCELLED";

  let color = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-white/70 dark:border-white/20";
  let icon = <Clock className="h-3.5 w-3.5 mr-1.5" />;
  let text = "Unknown";

  if (isPending) { color = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"; text = "Under Review"; }
  if (isApproved) { color = "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"; text = "Awaiting Payment"; }
  if (isPaymentPending) { color = "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"; text = "Payment Verifying"; }
  if (isActive) { color = "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"; icon = <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />; text = "Live"; }
  if (isCompleted) { text = "Completed"; }
  if (isExpired) { color = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-white/40 dark:border-white/20"; text = "Expired"; icon = <Clock className="h-3.5 w-3.5 mr-1.5" />; }
  if (isRejected) { color = "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"; icon = <XCircle className="h-3.5 w-3.5 mr-1.5" />; text = status === "REJECTED" ? "Rejected" : "Cancelled"; }

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${color}`}>{icon}{text}</span>;
}
