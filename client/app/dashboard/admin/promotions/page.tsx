"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InfiniteScroll from "react-infinite-scroll-component";
import { Eye, PauseCircle, PlayCircle, ReceiptText, Settings2, ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
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
  const [serverStats, setServerStats] = useState({
    total: 0,
    activeNow: 0,
    needsReview: 0,
    expiringSoon: 0,
    revenuePipeline: 0
  });
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);
  const [visibleLiveCount, setVisibleLiveCount] = useState(10);
  const [visibleArchivedCount, setVisibleArchivedCount] = useState(10);

  const fetchPromotions = useCallback(async (status: "ALL" | PromotionStatus = activeTab) => {
    const cacheKey = `admin_promotions_${status}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setPromotions(parsed.promotions || []);
        if (parsed.stats) {
          setServerStats(parsed.stats);
        }
      } else {
        setLoading(true);
      }
    } catch (e) {
      setLoading(true);
    }

    try {
      const data = await promotionAPI.getAdminPromotions(status === "ALL" ? undefined : { status });
      setPromotions(data.promotions || []);
      if (data.stats) {
        setServerStats(data.stats);
      }
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch(e) {}
    } catch {
      showError("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchPromotions(activeTab);
  }, [activeTab, fetchPromotions]);

  const swimlanes = useMemo(() => {
    return {
      needsAction: promotions.filter(p => ["PENDING_REVIEW", "APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(p.status)),
      live: promotions.filter(p => ["ACTIVE", "PAUSED"].includes(p.status)),
      archived: promotions.filter(p => ["EXPIRED", "REJECTED", "CANCELLED"].includes(p.status))
    };
  }, [promotions]);

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
        subtitle="Review ads, pricing, payments, status"
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

      <section className="mx-auto flex max-w-7xl flex-col gap-3 sm:gap-6 px-4 py-3 sm:py-8">
        {/* Metrics Strip */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 w-full">
          <div className="flex-1 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-5 flex items-center justify-between border-l-4 border-l-violet-500 shadow-sm gap-2">
            <span className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-white/60 whitespace-nowrap truncate">Revenue Pipeline</span>
            <span className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">{formatPromotionCurrency(serverStats.revenuePipeline || 0, "INR")}</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-4 flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-white/60 whitespace-nowrap truncate">Active Now</span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{serverStats.activeNow || 0}</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-4 flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-white/60 whitespace-nowrap truncate">Needs Review</span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{serverStats.needsReview || 0}</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-4 flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-white/60 whitespace-nowrap truncate">Expiring Soon</span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{serverStats.expiringSoon || 0}</span>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === tab.value
                  ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-[#13131a] dark:text-white/60 dark:border-white/10 dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content: Swimlanes */}
        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
             <div className="h-32 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10" />
             <div className="h-32 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10" />
          </div>
        ) : promotions.length === 0 && activeTab === "ALL" ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center dark:border-white/15 dark:bg-[#16161e]">
            <h2 className="text-2xl font-bold">No promotion requests</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
              Seller submissions will appear here once they start requesting marketplace hero ads.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-8">
            
            {/* Needs Action */}
            <div className="flex flex-col gap-3 bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Needs Action
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px]">{serverStats.needsReview || 0}</span>
              </h3>
              <div className="flex flex-col gap-3">
                {swimlanes.needsAction.map(p => <PromotionRow key={p._id} promotion={p} router={router} handlePause={handlePause} handleResume={handleResume} />)}
                {swimlanes.needsAction.length === 0 && <div className="text-sm text-slate-500 p-4 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center">No promotions require action in this view.</div>}
              </div>
            </div>

            {/* Live & Paused */}
            <div className="flex flex-col gap-3 bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Live & Paused
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px]">{swimlanes.live.length}</span>
              </h3>
              <div className="flex flex-col gap-3">
                <InfiniteScroll
                  dataLength={Math.min(swimlanes.live.length, visibleLiveCount)}
                  next={() => setVisibleLiveCount(prev => prev + 10)}
                  hasMore={visibleLiveCount < swimlanes.live.length}
                  loader={<div className="text-center text-xs text-slate-500 py-2">Loading more...</div>}
                  className="flex flex-col gap-3"
                  style={{ overflow: "visible" }}
                >
                  {swimlanes.live.slice(0, visibleLiveCount).map(p => <PromotionRow key={p._id} promotion={p} router={router} handlePause={handlePause} handleResume={handleResume} />)}
                </InfiniteScroll>
                {swimlanes.live.length === 0 && <div className="text-sm text-slate-500 p-4 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center">No active or paused promotions in this view.</div>}
              </div>
            </div>

            {/* Archived */}
            <div className="flex flex-col gap-3 bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
              <button onClick={() => setIsArchivedExpanded(!isArchivedExpanded)} className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 hover:text-slate-700 dark:hover:text-white/80 transition">
                {isArchivedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                Archived ({swimlanes.archived.length})
              </button>
              {isArchivedExpanded && (
                <div className="flex flex-col gap-3">
                  <InfiniteScroll
                    dataLength={Math.min(swimlanes.archived.length, visibleArchivedCount)}
                    next={() => setVisibleArchivedCount(prev => prev + 10)}
                    hasMore={visibleArchivedCount < swimlanes.archived.length}
                    loader={<div className="text-center text-xs text-slate-500 py-2">Loading more...</div>}
                    className="flex flex-col gap-3"
                    style={{ overflow: "visible" }}
                  >
                    {swimlanes.archived.slice(0, visibleArchivedCount).map(p => <PromotionRow key={p._id} promotion={p} router={router} handlePause={handlePause} handleResume={handleResume} />)}
                  </InfiniteScroll>
                  {swimlanes.archived.length === 0 && <div className="text-sm text-slate-500 p-4 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center">No archived promotions in this view.</div>}
                </div>
              )}
            </div>

          </div>
        )}
      </section>
    </main>
  );
}

function PromotionRow({ promotion, router, handlePause, handleResume }: any) {
  const seller = typeof promotion.sellerId === "string" ? null : promotion.sellerId;
  const product = typeof promotion.productId === "string" ? null : promotion.productId;

  let progress = 0;
  let daysRemaining = 0;
  const isActiveOrPaused = ["ACTIVE", "PAUSED"].includes(promotion.status);
  const durationDays = promotion.approvedDurationDays || promotion.requestedDurationDays;
  
  if (isActiveOrPaused && durationDays) {
    const startDate = promotion.activatedAt ? new Date(promotion.activatedAt) : new Date(promotion.createdAt);
    const endDate = promotion.endDate ? new Date(promotion.endDate) : new Date(startDate.getTime() + durationDays * 86400000);
    const now = Date.now();
    
    progress = Math.min(Math.max(((now - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100, 0), 100);
    daysRemaining = Math.max(Math.ceil((endDate.getTime() - now) / 86400000), 0);
  } else if (promotion.status === "EXPIRED") {
    progress = 100;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 transition hover:shadow-sm">
      <div className="flex flex-1 min-w-0 items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
          {product?.thumbnailUrl || promotion.productThumbnailUrl ? (
            <img src={product?.thumbnailUrl || promotion.productThumbnailUrl} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{product?.title || promotion.productTitle}</p>
          <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{seller?.name || promotion.sellerName} • {seller?.email || "Seller account"}</p>
          <p className="text-[10px] mt-2 text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 uppercase font-bold tracking-wider text-slate-600 dark:text-white/70">{PLACEMENT_LABELS[promotion.placement as keyof typeof PLACEMENT_LABELS]}</span>
            • {formatPromotionDate(promotion.createdAt)} 
            • <span className={promotion.paymentStatus === "PAID" ? "text-emerald-500 font-bold" : "text-slate-500"}>{PAYMENT_STATUS_LABELS[promotion.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS]}</span>
          </p>
        </div>
      </div>

      {(isActiveOrPaused || promotion.status === "EXPIRED") && (
        <div className="w-full sm:w-48 flex flex-col gap-1.5 shrink-0">
          <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${promotion.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>{Math.round(progress)}% done</span>
            <span>{daysRemaining} days left</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:ml-4 border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-4 sm:pt-0 mt-2 sm:mt-0">
        <div className="text-left sm:text-right">
          <p className="text-sm font-black text-slate-900 dark:text-white">{formatPromotionCurrency(promotion.amount || 0, promotion.currency || "INR")}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${getPromotionStatusClasses(promotion.status)}`}>
            {PROMOTION_STATUS_LABELS[promotion.status as keyof typeof PROMOTION_STATUS_LABELS]}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => router.push(`/dashboard/admin/promotions/${promotion._id}`)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 transition" title="View promotion details">
            <Eye className="w-4 h-4" />
          </button>
          
          {promotion.status === "ACTIVE" && (
            <button onClick={() => handlePause(promotion._id)} className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 transition" title="Pause this promotion">
              <PauseCircle className="w-4 h-4" />
            </button>
          )}
          
          {promotion.status === "PAUSED" && (
            <button onClick={() => handleResume(promotion._id)} className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 transition" title="Resume this promotion">
              <PlayCircle className="w-4 h-4" />
            </button>
          )}
          
          {["PENDING_REVIEW", "APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(promotion.status) && (
            <button onClick={() => router.push(`/dashboard/admin/promotions/${promotion._id}`)} className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-500 transition" title="Review this promotion">
              <ReceiptText className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
