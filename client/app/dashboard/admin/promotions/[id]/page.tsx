"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, Clock3, PauseCircle, PlayCircle, Settings2, XCircle, 
  ChevronLeft, ArrowRight, ShieldAlert, Check, AlertTriangle, 
  MessageSquare, ChevronDown, ChevronUp, Clock, CalendarDays, ExternalLink
} from "lucide-react";
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
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 shadow-sm";

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

  // UI State
  const [modalState, setModalState] = useState<"approve" | "reject" | "pause" | "resume" | "verify" | null>(null);
  const [styleExpanded, setStyleExpanded] = useState(false);

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
      setModalState(null);
      await loadPage();
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Action failed"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !promotion) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center">
        <div className="animate-pulse rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  const isPending = promotion.status === "PENDING_REVIEW";
  const isActive = promotion.status === "ACTIVE";
  const isPaused = promotion.status === "PAUSED";
  const isRejected = promotion.status === "REJECTED";
  const showPaymentVerification = promotion.paymentMethod === "MANUAL" && ["APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(promotion.status);
  
  // Payment Verification Banner State
  const paymentVerified = promotion.paymentStatus === "PAID";
  const paymentMismatch = promotion.paymentMethod === "MANUAL" && promotion.paymentStatus === "PENDING" && promotion.transactionId;

  // Build Audit Trail Steps
  type AuditStep = {
    label: string;
    date: string | null;
    completed: boolean;
    isReject: boolean;
    description?: string;
  };

  const auditSteps: AuditStep[] = [
    {
      label: "Submitted",
      date: formatPromotionDate(promotion.createdAt),
      completed: true,
      isReject: false
    }
  ];

  if (promotion.paymentMethod || promotion.paymentSubmittedAt || promotion.paymentStatus === "PAID") {
    auditSteps.push({
      label: promotion.paymentStatus === "PAID" ? "Payment Verified" : (promotion.paymentSubmittedAt ? "Payment Submitted" : "Pending Payment"),
      date: promotion.paymentSubmittedAt ? formatPromotionDate(promotion.paymentSubmittedAt) : null,
      completed: !!promotion.paymentSubmittedAt || promotion.paymentStatus === "PAID",
      isReject: false
    });
  }

  if (isRejected) {
    auditSteps.push({
      label: "Rejected",
      date: formatPromotionDate(promotion.updatedAt),
      completed: true,
      isReject: true,
      description: promotion.rejectedReason
    });
  } else {
    const hasBeenActivated = ["ACTIVE", "PAUSED", "COMPLETED", "EXPIRED"].includes(promotion.status);
    auditSteps.push({
      label: "Activated",
      date: hasBeenActivated ? formatPromotionDate(promotion.updatedAt) : null,
      completed: hasBeenActivated,
      isReject: false
    });

    const isExpired = ["COMPLETED", "EXPIRED"].includes(promotion.status);
    auditSteps.push({
      label: "Expired",
      date: promotion.endDate ? formatPromotionDate(promotion.endDate) : null,
      completed: isExpired,
      isReject: false
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      
      {/* Sticky Header */}
      <header className={`sticky top-0 z-40 bg-white/80 dark:bg-[#05050a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 py-3 sm:py-4 transition-colors ${isActive ? 'border-l-4 border-l-emerald-500' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between relative h-12">
          
          <div className="z-10 flex items-center gap-2">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/70 transition shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="hidden lg:block text-xs font-bold uppercase tracking-widest text-slate-400">Promotions</div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <h1 className="text-base sm:text-lg font-black leading-tight pointer-events-auto max-w-[200px] sm:max-w-md truncate">{promotion.title}</h1>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-white/60 pointer-events-auto mt-0.5 flex items-center gap-1.5">
              <span className={`rounded-full ${isPending ? 'bg-amber-400 w-1.5 h-1.5' : isActive ? 'bg-emerald-500 w-2 h-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : isRejected ? 'bg-red-400 w-1.5 h-1.5' : 'bg-slate-400 w-1.5 h-1.5'}`}></span>
              <span className={isActive ? 'font-bold text-slate-800 dark:text-white/90' : ''}>{PROMOTION_STATUS_LABELS[promotion.status]}</span> <span className="hidden sm:inline">&middot; {PLACEMENT_LABELS[promotion.placement]}</span> &middot; <span className="hidden sm:inline">Submitted </span>{formatPromotionDate(promotion.createdAt)}
            </p>
          </div>
          
          <div className="flex items-center gap-2 z-10">
            {isActive && (
              <>
                <button
                  onClick={() => setModalState("reject")}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                >
                  <XCircle className="w-4 h-4" /> Revoke
                </button>
                <button
                  onClick={() => setModalState("pause")}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                >
                  <PauseCircle className="w-4 h-4" /> Pause
                </button>
              </>
            )}
            {isPaused && (
              <button
                onClick={() => setModalState("resume")}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                <PlayCircle className="w-4 h-4" /> Resume
              </button>
            )}
            {isPending && (
              <>
                <button
                  onClick={() => setModalState("reject")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
                >
                  Reject
                </button>
                <button
                  onClick={() => setModalState("approve")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600"
                >
                  Approve <ArrowRight className="w-4 h-4 hidden sm:block" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          
          {/* LEFT COLUMN (Details) */}
          <div className="flex-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
            
            {/* Card 1: Creative Identity */}
            <div className="rounded-[2rem] border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-white/10 dark:bg-[#13131a]">
              {promotion.bannerImage && !promotion.adImages?.length ? (
                <div className="bg-slate-100 dark:bg-black/20 p-4 border-b border-slate-100 dark:border-white/5">
                  <img src={promotion.bannerImage} alt={promotion.title} className="h-64 w-full object-contain drop-shadow-md" />
                </div>
              ) : promotion.adImages?.length ? (
                <div className="flex h-64 w-full gap-4 p-6 bg-slate-100 dark:bg-black/20 border-b border-slate-100 dark:border-white/5 overflow-x-auto items-center justify-center">
                  {promotion.adImages.sort((a, b) => a.position - b.position).map((img) => (
                    <img key={img.key} src={img.url} alt="Ad content" className="h-full w-auto max-w-[30%] object-contain drop-shadow-md rounded-xl" />
                  ))}
                </div>
              ) : null}
              
              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${getPromotionStatusClasses(promotion.status)}`}>
                    {PROMOTION_STATUS_LABELS[promotion.status]}
                  </span>
                  <span className="rounded-full bg-slate-100 dark:bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                    {PLACEMENT_LABELS[promotion.placement]}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">{promotion.title}</h2>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-white/60">{promotion.subtitle}</p>
              </div>
            </div>

            {/* Card 2: Payment Verification */}
            <div className="rounded-[2rem] border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-white/10 dark:bg-[#13131a]">
              {/* Dynamic Banner */}
              {paymentVerified ? (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20 px-6 py-3 flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" /> Payment Verified
                </div>
              ) : paymentMismatch ? (
                <div className="bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20 px-6 py-3 flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
                  <ShieldAlert className="w-5 h-5" /> Payment Mismatch - Action Required
                </div>
              ) : showPaymentVerification ? (
                <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/20 px-6 py-3 flex items-center justify-between text-sm font-bold text-amber-700 dark:text-amber-400">
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-5 h-5" /> Manual Payment Pending
                  </div>
                  <button onClick={() => setModalState("verify")} className="px-3 py-1 bg-amber-200 dark:bg-amber-500/20 rounded-full text-xs hover:bg-amber-300 transition">Verify Now</button>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 px-6 py-3 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/60">
                  Financial Details
                </div>
              )}
              
              <div className="p-4 sm:p-6">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-y-6 sm:grid-cols-3">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price</dt>
                    <dd className="mt-1 text-base font-black">{formatPromotionCurrency(promotion.amount, promotion.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Method</dt>
                    <dd className="mt-1 text-sm font-semibold">{promotion.paymentMethod ? PAYMENT_METHOD_LABELS[promotion.paymentMethod] : "Pending"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transaction ID</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-600 dark:text-white/70 truncate" title={promotion.transactionId || "Not provided"}>
                      {promotion.transactionId || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Razorpay Order</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-600 dark:text-white/70 truncate" title={promotion.razorpayOrderId || "Not created"}>
                      {promotion.razorpayOrderId || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Razorpay Payment</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-600 dark:text-white/70 truncate" title={promotion.razorpayPaymentId || "Not paid"}>
                      {promotion.razorpayPaymentId || "—"}
                    </dd>
                  </div>
                  {promotion.paymentProofImage && (
                    <div className="col-span-2 sm:col-span-3 mt-2">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Attached Proof</dt>
                      <dd>
                        <a href={promotion.paymentProofImage} target="_blank" rel="noreferrer" className="inline-block relative group">
                          <img src={promotion.paymentProofImage} alt="Payment Proof" className="h-32 w-auto max-w-full rounded-lg border border-slate-200 dark:border-white/10 object-cover group-hover:opacity-80 transition shadow-sm" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="bg-slate-900/70 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1"><ExternalLink className="w-3 h-3"/> View Full Size</span>
                          </div>
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Card 3: Promotion Schedule & Routing */}
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#13131a] p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-4 sm:mb-5">Schedule & Routing</h3>
              
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Start Date</div>
                  <div className="font-semibold text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-400" /> {formatPromotionDate(promotion.startDate)}</div>
                </div>
                <div className="flex flex-col items-center justify-center px-2">
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{promotion.approvedDurationDays || promotion.requestedDurationDays} days</span>
                </div>
                <div className="flex-1 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">End Date</div>
                  <div className="font-semibold text-sm flex items-center justify-end gap-2">{formatPromotionDate(promotion.endDate)} <CalendarDays className="w-4 h-4 text-slate-400" /></div>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Link</dt>
                  <dd className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400 truncate pr-4">
                    <a href={promotion.targetLink || `/marketplace/${promotion.productId}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1.5">
                      {promotion.targetLink || "Automatic Product Link"} <ExternalLink className="w-3 h-3" />
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Placement</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-700 dark:text-white/80">{PLACEMENT_LABELS[promotion.placement]}</dd>
                </div>
              </dl>
            </div>

            {/* Card 4: Seller Note */}
            {promotion.sellerNote && (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/5 p-4 sm:p-6 relative">
                <MessageSquare className="absolute top-4 sm:top-6 right-4 sm:right-6 w-4 h-4 sm:w-5 sm:h-5 text-amber-300 dark:text-amber-500/40" />
                <h3 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-2">Message from Seller</h3>
                <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 whitespace-pre-wrap">{promotion.sellerNote}</p>
              </div>
            )}

            {/* Card 5: Audit Timeline */}
            <div className="pt-4 pl-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Audit Trail</h3>
              <div className="ml-2 mt-2 space-y-0 pb-4">
                {auditSteps.map((step, index) => {
                  const isLast = index === auditSteps.length - 1;
                  const isLineGreen = step.completed && auditSteps[index + 1]?.completed;
                  
                  const dotColor = step.isReject 
                    ? "bg-red-500 ring-[4px] ring-slate-50 dark:ring-[#05050a]" 
                    : step.completed 
                      ? "bg-emerald-500 ring-[4px] ring-slate-50 dark:ring-[#05050a]" 
                      : "bg-slate-300 dark:bg-slate-600 ring-[4px] ring-slate-50 dark:ring-[#05050a]";
                  
                  const textColor = step.isReject
                    ? "text-red-600 dark:text-red-400"
                    : step.completed
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500";

                  const lineColor = isLineGreen ? "bg-emerald-400" : "bg-slate-200 dark:bg-white/10";

                  return (
                    <div key={index} className="relative pl-6 pb-6">
                      {!isLast && (
                        <div className={`absolute left-[5px] top-4 bottom-[-6px] w-[2px] ${lineColor}`}></div>
                      )}
                      
                      <div className={`absolute left-[1px] top-1.5 w-2.5 h-2.5 rounded-full z-10 shadow-sm ${dotColor}`}></div>
                      
                      <p className={`text-sm font-bold ${textColor}`}>{step.label}</p>
                      {step.date && <p className="text-xs text-slate-500">{step.date}</p>}
                      {step.description && <p className="text-xs text-red-500 mt-1">{step.description}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (Controls & Performance) */}
          <div className="w-full lg:w-[400px] flex-shrink-0 space-y-4 sm:space-y-6 order-1 lg:order-2">
            
            {/* Panel 1: Admin Controls (Sticky top on desktop) */}
            <div className="sticky top-24 space-y-4 sm:space-y-6">
              
              {/* Priority Control */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-md dark:border-white/10 dark:bg-[#13131a]">
                <h3 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2"><Settings2 className="w-3.5 h-3.5" /> Admin Controls</h3>
                
                <label className="block mb-3">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80">Priority Weight</span>
                    {priority === 999 && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">Default (Lowest)</span>}
                  </div>
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-white/5 dark:border-white/10 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/80 transition hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50"
                >
                  Save Priority
                </button>
              </div>

              {/* Panel 2: Seller & Product */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-md dark:border-white/10 dark:bg-[#13131a]">
                <h3 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 sm:mb-4">Entity Details</h3>
                
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 p-2 sm:p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm">
                    {(seller?.name || promotion.sellerName || "S")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{seller?.name || promotion.sellerName}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">{seller?.email || "No email"}</p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 items-center mt-2">
                  {product?.thumbnailUrl && (
                    <img src={product.thumbnailUrl} alt={promotion.productTitle} className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border border-slate-100 dark:border-white/5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Product</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white/90 line-clamp-2 leading-tight mt-0.5">{product?.title || promotion.productTitle}</p>
                    <button
                      onClick={() => router.push(`/marketplace/${product?._id || promotion.productId}`)}
                      className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 sm:gap-1.5 rounded-xl border border-slate-200 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-white/75 dark:hover:bg-white/5"
                    >
                      Open Product <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel 3: Performance */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-md dark:border-white/10 dark:bg-[#13131a]">
                <h3 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 sm:mb-4">Performance</h3>
                
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Impressions</p>
                    <p className="mt-1 text-base sm:text-lg font-black">{promotion.metrics.impressions.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clicks</p>
                    <p className="mt-1 text-lg font-black">{promotion.metrics.clicks.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CTR</p>
                    <p className={`mt-1 text-lg font-black ${promotion.metrics.ctr > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{promotion.metrics.ctr}%</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revenue</p>
                    <p className="mt-1 text-lg font-black">{formatPromotionCurrency(promotion.metrics.revenueGenerated)}</p>
                  </div>
                </div>

                {promotion.metrics.revenueGenerated === 0 && promotion.paymentMethod === "MANUAL" && promotion.status === "ACTIVE" && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                    <strong>Manual payment</strong> — revenue not tracked via Razorpay. Verify Transaction ID.
                  </div>
                )}
              </div>

              {/* Panel 4: Style Configuration (Collapsible) */}
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-md dark:border-white/10 dark:bg-[#13131a]">
                <button 
                  onClick={() => setStyleExpanded(!styleExpanded)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Style Configuration</span>
                  {styleExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                
                {styleExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-white/5 mt-2 space-y-4">
                    {/* Live Preview Miniature */}
                    <div 
                      className="relative overflow-hidden rounded-xl h-24 mb-4 border border-slate-200 dark:border-white/10" 
                      style={{ backgroundColor: isValidHexColor(heroBgColor) ? heroBgColor : "#2563EB" }}
                    >
                       <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                          <h4 style={{ color: isValidHexColor(heroTitleColor) ? heroTitleColor : (heroTextColor === "auto" ? (getAutoTextColor(heroBgColor) === "dark" ? "#000" : "#fff") : (heroTextColor === "dark" ? "#000" : "#fff")) }} className="text-sm font-black truncate w-full">{promotion.title}</h4>
                       </div>
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-white/75">Background Color (Hex)</span>
                      <input type="text" value={heroBgColor} onChange={(e) => setHeroBgColor(e.target.value)} className={`${inputClass} py-2`} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-white/75">Text Color</span>
                      <select value={heroTextColor} onChange={(e) => setHeroTextColor(e.target.value as "light" | "dark" | "auto")} className={`${inputClass} py-2`}>
                        <option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-white/75">Layout Structure</span>
                      <select value={heroLayout} onChange={(e) => setHeroLayout(e.target.value as "floating" | "single" | "minimal")} className={`${inputClass} py-2`}>
                        <option value="floating">Floating</option><option value="single">Single</option><option value="minimal">Minimal</option>
                      </select>
                    </label>
                    
                    <button
                      onClick={() =>
                        void runAction(
                          () => promotionAPI.updatePromotionStyle(promotion._id, { heroBgColor, heroTextColor, heroTitleColor, heroSubtitleColor, heroButtonBgColor, heroButtonTextColor, heroFontFamily, heroLayout }),
                          "Style updated successfully"
                        )
                      }
                      disabled={processing || !isValidHexColor(heroBgColor)}
                      className="w-full rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                    >
                      Save Style
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Actions (Active/Paused) */}
      {(isActive || isPaused) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#05050a]/90 backdrop-blur-md border-t border-slate-200 dark:border-white/10 p-4 sm:hidden pb-safe">
          {isActive && (
            <div className="flex gap-3">
              <button
                onClick={() => setModalState("reject")}
                className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
              >
                <XCircle className="w-5 h-5" /> Revoke
              </button>
              <button
                onClick={() => setModalState("pause")}
                className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
              >
                <PauseCircle className="w-5 h-5" /> Pause
              </button>
            </div>
          )}
          {isPaused && (
            <button
              onClick={() => setModalState("resume")}
              className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
            >
              <PlayCircle className="w-5 h-5" /> Resume
            </button>
          )}
        </div>
      )}

      {/* MODALS */}
      {modalState === "approve" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#13131a] border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Approve Request</h2>
            <p className="text-sm text-slate-500 dark:text-white/60 mb-6">Review the final terms before activating this promotion.</p>
            
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Amount (₹)</span>
                <input type="number" min={settings?.minimumPrice || 0} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Duration (days)</span>
                <input type="number" min={1} value={approvedDurationDays} onChange={(e) => setApprovedDurationDays(Number(e.target.value) || 1)} className={inputClass} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Priority</span>
                  <input type="number" min={1} value={priority} onChange={(e) => setPriority(Number(e.target.value) || 1)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Max Impressions</span>
                  <input type="number" min={1} value={maxImpressions} onChange={(e) => setMaxImpressions(e.target.value)} placeholder="Optional" className={inputClass} />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Admin Note (Optional)</span>
                <textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className={`${inputClass} resize-none`} placeholder="Internal note..." />
              </label>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setModalState(null)} disabled={processing} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 transition">Cancel</button>
              <button
                onClick={() => void runAction(() => promotionAPI.approvePromotion(promotion._id, { amount, approvedDurationDays, priority, maxImpressions: maxImpressions ? Number(maxImpressions) : undefined, adminNote, heroBgColor, heroTextColor, heroTitleColor, heroSubtitleColor, heroButtonBgColor, heroButtonTextColor, heroFontFamily, heroLayout }), "Promotion approved")}
                disabled={processing}
                className="flex-[2] rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-sm flex items-center justify-center gap-2"
              >
                {processing ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve & Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#13131a] border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-red-600 dark:text-red-400 mb-1 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Reject Request</h2>
            <p className="text-sm text-slate-500 dark:text-white/60 mb-6">This action will reject the promotion request. A reason is required.</p>
            
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Rejection Reason (Required)</span>
                <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={`${inputClass} resize-none`} placeholder="Explain why this is being rejected..." />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Admin Note (Optional)</span>
                <textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className={`${inputClass} resize-none`} placeholder="Internal note..." />
              </label>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setModalState(null)} disabled={processing} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 transition">Cancel</button>
              <button
                onClick={() => void runAction(() => promotionAPI.rejectPromotion(promotion._id, { rejectedReason: rejectReason, adminNote }), "Promotion rejected")}
                disabled={processing || rejectReason.trim().length === 0}
                className="flex-[2] rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Promotion
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === "pause" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#13131a] border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-amber-600 dark:text-amber-400 mb-1">Pause Promotion</h2>
            <p className="text-sm text-slate-500 dark:text-white/60 mb-6">This will immediately pull the ad from the marketplace. It can be resumed later.</p>
            
            <label className="block mb-6">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Admin Note (Optional)</span>
              <textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className={`${inputClass} resize-none`} placeholder="Reason for pausing..." />
            </label>

            <div className="flex gap-3">
              <button onClick={() => setModalState(null)} disabled={processing} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 transition">Cancel</button>
              <button
                onClick={() => void runAction(() => promotionAPI.pausePromotion(promotion._id, { adminNote }), "Promotion paused")}
                disabled={processing}
                className="flex-[1.5] rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-amber-950 hover:bg-amber-400 transition shadow-sm"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === "resume" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#13131a] border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-1">Resume Promotion</h2>
            <p className="text-sm text-slate-500 dark:text-white/60 mb-6">This will reactivate the ad in the marketplace.</p>
            
            <label className="block mb-6">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Admin Note (Optional)</span>
              <textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className={`${inputClass} resize-none`} placeholder="Internal note..." />
            </label>

            <div className="flex gap-3">
              <button onClick={() => setModalState(null)} disabled={processing} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 transition">Cancel</button>
              <button
                onClick={() => void runAction(() => promotionAPI.resumePromotion(promotion._id, { adminNote }), "Promotion resumed")}
                disabled={processing}
                className="flex-[1.5] rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-sm"
              >
                Confirm Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === "verify" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#13131a] border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-cyan-600 dark:text-cyan-400 mb-1">Verify Payment</h2>
            <p className="text-sm text-slate-500 dark:text-white/60 mb-6">Manually verify the transaction ID to activate this promotion.</p>
            
            <label className="block mb-4">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Transaction ID</span>
              <input type="text" value={verifyTransactionId} onChange={(e) => setVerifyTransactionId(e.target.value)} className={inputClass} placeholder="e.g. UTR number" />
            </label>
            <label className="block mb-6">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-white/80">Admin Note (Optional)</span>
              <textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className={`${inputClass} resize-none`} placeholder="Internal note..." />
            </label>

            <div className="flex gap-3">
              <button onClick={() => setModalState(null)} disabled={processing} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 transition">Cancel</button>
              <button
                onClick={() => void runAction(() => promotionAPI.verifyPromotionPayment(promotion._id, { transactionId: verifyTransactionId, paymentMethod: "MANUAL", adminNote }), "Payment verified")}
                disabled={processing || !verifyTransactionId}
                className="flex-[1.5] rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-cyan-950 hover:bg-cyan-400 transition shadow-sm disabled:opacity-50"
              >
                Verify & Activate
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
