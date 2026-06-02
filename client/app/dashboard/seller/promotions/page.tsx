"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  Eye, Plus, AlertTriangle, ArrowRight, TrendingUp, Clock, Megaphone, ArrowLeft, X, ArrowUpRight, Sun, Moon, ChevronDown, Check, Activity, AlertCircle, Wallet, Target, Trash2, Loader2, ChevronRight, Image as ImageIcon, ReceiptText
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import InfiniteScroll from "react-infinite-scroll-component";
import PageHeader from "../../buyer/transactions/components/PageHeader";

import { promotionAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import {
  formatPromotionCurrency,
  formatPromotionDate,
  PAYMENT_STATUS_LABELS,
  PLACEMENT_LABELS,
  PROMOTION_STATUS_LABELS,
  getPromotionStatusClasses,
  type PromotionRecord,
  type PromotionStatus,
} from "@/lib/promotions";

type TabValue = "ALL" | "ACTION_REQUIRED" | "IN_PROGRESS" | "ACTIVE" | "PAST" | "EXPIRED";

const TAB_MAPPINGS: Record<TabValue, PromotionStatus[]> = {
  ALL: [],
  ACTION_REQUIRED: ["APPROVED_WAITING_PAYMENT"], 
  IN_PROGRESS: ["PENDING_REVIEW", "PAYMENT_PENDING"],
  ACTIVE: ["ACTIVE"],
  PAST: ["CANCELLED", "REJECTED"],
  EXPIRED: ["EXPIRED"],
};

const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "All", value: "ALL" },
  { label: "Action Required", value: "ACTION_REQUIRED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Active", value: "ACTIVE" },
  { label: "Past", value: "PAST" },
  { label: "Expired", value: "EXPIRED" },
];

const getProductDetails = (promotion: PromotionRecord) => {
  const product = typeof promotion.productId === "string" ? null : promotion.productId;
  return {
    _id: product?._id || promotion.productId,
    title: product?.title || promotion.productTitle,
    thumbnailUrl: product?.thumbnailUrl || promotion.productThumbnailUrl || null,
  };
};

// Dynamic chart data is generated in the component now.

export default function SellerPromotionsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("ALL");
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [selectedChartPromo, setSelectedChartPromo] = useState<string>("LATEST_2");
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);
  const [deletingPromoId, setDeletingPromoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPromotions = useCallback(async () => {
    const cacheKey = "seller_promotions_data";
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setPromotions(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }
    } catch (e) {
      setLoading(true);
    }

    try {
      const data = await promotionAPI.getSellerPromotions();
      setPromotions(data.promotions || []);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data.promotions || []));
      } catch (e) {}
    } catch {
      showError("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPromotions();
  }, [fetchPromotions]);

  const handleDeletePromotion = (id: string) => {
    setDeletingPromoId(id);
  };

  const confirmDeletePromotion = async () => {
    if (!deletingPromoId || isDeleting) return;
    setIsDeleting(true);
    try {
      await promotionAPI.deleteSellerPromotion(deletingPromoId);
      showSuccess("Promotion deleted successfully");
      setPromotions(prev => prev.filter(p => p._id !== deletingPromoId));
      setDeletingPromoId(null);
    } catch (error: any) {
      showError(error.response?.data?.message || "Failed to delete promotion");
      setDeletingPromoId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const actionRequired = promotions.filter(p => TAB_MAPPINGS.ACTION_REQUIRED.includes(p.status)).length;
    const active = promotions.filter(p => TAB_MAPPINGS.ACTIVE.includes(p.status)).length;
    
    const totalInvested = promotions
      .filter(p => ["ACTIVE", "EXPIRED"].includes(p.status) || p.paymentStatus === "PAID")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
      
    const paidCampaignsCount = promotions.filter(p => ["ACTIVE", "EXPIRED"].includes(p.status) || p.paymentStatus === "PAID").length;
      
    const totalImpressions = promotions.reduce((sum, item) => sum + (item.metrics?.impressions || 0), 0);

    return {
      actionRequired,
      active,
      totalInvested,
      paidCampaignsCount,
      totalImpressions,
    };
  }, [promotions]);

  const activeChartPromotions = useMemo(() => {
    if (selectedChartPromo === "LATEST_2") {
      return promotions.filter(p => p.status === "ACTIVE").slice(0, 2);
    }
    return promotions.filter(p => p._id === selectedChartPromo);
  }, [promotions, selectedChartPromo]);

  const chartData = useMemo(() => {
    if (!activeChartPromotions || activeChartPromotions.length === 0) return [];
    
    // Gather all unique dates across the selected promotions
    const dateSet = new Set<string>();
    activeChartPromotions.forEach(promo => {
      if (promo.metrics?.history) {
        promo.metrics.history.forEach(h => {
          if (h.date) dateSet.add(h.date);
        });
      }
    });
    
    const dates = Array.from(dateSet).sort();
    if (dates.length === 0) {
      // Fallback: Generate last 7 days with 0 impressions if no history exists
      const placeholderDates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        placeholderDates.push(d.toISOString().split('T')[0]);
      }
      
      return placeholderDates.map(dateStr => {
        const dateObj = new Date(dateStr);
        const shortDate = !isNaN(dateObj.getTime()) 
          ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : dateStr;
        
        const row: any = { day: shortDate };
        activeChartPromotions.forEach(promo => {
          row[promo._id] = 0;
        });
        return row;
      });
    }
    
    // Map dates to row objects
    return dates.map(dateStr => {
      // Create a nice short format for the X-axis (e.g., "Oct 15")
      const dateObj = new Date(dateStr);
      const shortDate = !isNaN(dateObj.getTime()) 
        ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : dateStr;

      const row: any = { day: shortDate };
      activeChartPromotions.forEach(promo => {
        const historyItem = promo.metrics?.history?.find(h => h.date === dateStr);
        row[promo._id] = historyItem ? historyItem.impressions : 0;
      });
      return row;
    });
  }, [activeChartPromotions]);

  const handlePayment = (promotionId: string) => {
    router.push(`/dashboard/seller/promotions/${promotionId}`);
  };

  const filteredPromotions = useMemo(() => {
    if (activeTab === "ALL") return promotions;
    return promotions.filter(p => TAB_MAPPINGS[activeTab].includes(p.status));
  }, [promotions, activeTab]);

  const actionRequiredCampaigns = promotions.filter(p => TAB_MAPPINGS.ACTION_REQUIRED.includes(p.status));
  const showPaymentAlert = actionRequiredCampaigns.length > 0 && !isAlertDismissed;

  const swimlanes = useMemo(() => {
    return {
      needsAction: filteredPromotions.filter(p => ["PENDING_REVIEW", "APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(p.status)),
      live: filteredPromotions.filter(p => ["ACTIVE", "PAUSED"].includes(p.status)),
      archived: filteredPromotions.filter(p => ["EXPIRED", "REJECTED", "CANCELLED"].includes(p.status))
    };
  }, [filteredPromotions]);

  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);
  const [visibleLiveCount, setVisibleLiveCount] = useState(10);
  const [visibleArchivedCount, setVisibleArchivedCount] = useState(10);

  
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Promotions"
        subtitle="Manage your marketplace hero ads"
        rightSlot={
          <button
            onClick={() => router.push("/dashboard/seller/promotions/create")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New campaign</span>
          </button>
        }
      />

      <section className="mx-auto flex max-w-7xl flex-col gap-3 sm:gap-6 px-4 py-3 sm:py-8">
        {/* Persistent Alert */}
        {showPaymentAlert && (
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-[#1a1306] p-3 sm:p-4 shadow-sm pr-10 sm:pr-4">
            <div className="flex gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
              <p className="text-[12px] sm:text-[13px] leading-relaxed text-amber-950 dark:text-amber-200/90">
                <span className="font-semibold">{actionRequiredCampaigns[0].productTitle}</span> is awaiting payment — complete to go live.
                {actionRequiredCampaigns.length > 1 && ` (+$${actionRequiredCampaigns.length - 1} more)`}
              </p>
            </div>
            <div className="flex items-center shrink-0">
              <button 
                onClick={() => handlePayment(actionRequiredCampaigns[0]._id)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent dark:border-amber-500/30 bg-amber-600 dark:bg-transparent px-4 py-1.5 text-[12px] sm:text-sm font-medium text-white dark:text-amber-400 transition hover:bg-amber-700 dark:hover:bg-amber-500/10 gap-1.5"
              >
                Pay {formatPromotionCurrency(actionRequiredCampaigns[0].amount, actionRequiredCampaigns[0].currency)} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <button 
              onClick={() => setIsAlertDismissed(true)}
              className="absolute top-2 right-2 rounded-lg p-1.5 text-amber-600/50 hover:text-amber-600 dark:text-amber-500/50 dark:hover:text-amber-500 dark:hover:bg-amber-500/10 border border-transparent dark:border-amber-500/20 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 w-full">
          <div className="flex-1 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-5 flex items-center justify-between border-l-4 border-l-violet-500 shadow-sm gap-2">
            <span className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-white/60 whitespace-nowrap truncate">Total Invested</span>
            <span className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">{formatPromotionCurrency(stats.totalInvested || 0, "INR")}</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-4 flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-white/60 whitespace-nowrap truncate">Active Now</span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{stats.active || 0}</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-4 flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-white/60 whitespace-nowrap truncate">Action Required</span>
            <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-500">{stats.actionRequired || 0}</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-4 flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-white/60 whitespace-nowrap truncate">Total Impressions</span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{stats.totalImpressions || 0}</span>
          </div>
        </div>



        {/* Main Impressions Chart */}
        <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#13131a] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-[13px] font-semibold text-slate-700 dark:text-[#ededed] shrink-0">Impressions over campaign periods</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 min-w-0">
              <div className="flex items-center flex-wrap gap-3">
                {activeChartPromotions.map((promo, idx) => (
                  <div key={promo._id} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-sm ${idx === 0 ? 'bg-pink-500' : 'bg-emerald-500'}`} />
                    <span className="text-[11px] text-slate-500 dark:text-[#888] truncate max-w-[120px]">{promo.title || promo.productTitle || "Campaign"}</span>
                  </div>
                ))}
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                  className="inline-flex items-center justify-between w-[160px] text-[12px] rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] px-3 py-1.5 text-slate-700 dark:text-[#ededed] focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <span className="truncate pr-2">
                    {selectedChartPromo === "LATEST_2" 
                      ? "Compare latest 2" 
                      : promotions.find(p => p._id === selectedChartPromo)?.title || promotions.find(p => p._id === selectedChartPromo)?.productTitle || "Select campaign"}
                  </span>
                  <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isChartDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isChartDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsChartDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-[200px] sm:w-[240px] z-40 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] shadow-lg py-1 max-h-[300px] overflow-y-auto">
                      {promotions.length > 1 && (
                        <button
                          onClick={() => { setSelectedChartPromo("LATEST_2"); setIsChartDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-[12px] flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition ${selectedChartPromo === "LATEST_2" ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50/50 dark:bg-amber-500/5' : 'text-slate-700 dark:text-[#ededed]'}`}
                        >
                          <span className="truncate">Compare latest 2</span>
                          {selectedChartPromo === "LATEST_2" && <Check className="h-3 w-3 shrink-0" />}
                        </button>
                      )}
                      {promotions.map(p => (
                        <button
                          key={p._id}
                          onClick={() => { setSelectedChartPromo(p._id); setIsChartDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-[12px] flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition ${selectedChartPromo === p._id ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50/50 dark:bg-amber-500/5' : 'text-slate-700 dark:text-[#ededed]'}`}
                        >
                          <span className="truncate">{p.title || p.productTitle}</span>
                          {selectedChartPromo === p._id && <Check className="h-3 w-3 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#333' : '#cbd5e1'} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#666' : '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#666' : '#64748b' }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#111' : '#fff', 
                    borderColor: theme === 'dark' ? '#333' : '#e2e8f0', 
                    borderRadius: '8px', 
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '10px 14px',
                    color: theme === 'dark' ? '#e2e8f0' : '#475569'
                  }}
                  itemStyle={{ 
                    color: theme === 'dark' ? '#e2e8f0' : '#334155',
                    fontWeight: 500,
                    paddingTop: '4px'
                  }}
                  labelStyle={{
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                  }}
                />
                {activeChartPromotions.map((promo, idx) => (
                  <Line 
                    key={promo._id}
                    type="monotone" 
                    dataKey={promo._id} 
                    name={promo.title || promo.productTitle || "Campaign"}
                    stroke={idx === 0 ? "#ec4899" : "#10b981"} 
                    strokeWidth={2} 
                    strokeDasharray={idx === 1 ? "4 4" : undefined} 
                    dot={{ r: 3, fill: idx === 0 ? "#ec4899" : "#10b981" }} 
                    activeDot={{ r: 5 }} 
                    connectNulls 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
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
        ) : filteredPromotions.length === 0 && activeTab === "ALL" ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center dark:border-white/15 dark:bg-[#16161e]">
            <Megaphone className="h-10 w-10 text-slate-400 dark:text-[#666] mx-auto mb-4" />
            <h2 className="text-2xl font-bold">No campaigns found</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
              Launch a Hero Banner campaign to reach thousands of marketplace buyers and increase your sales by up to 2x.
            </p>
            <button
                onClick={() => router.push("/dashboard/seller/promotions/create")}
                className="mt-6 rounded-lg bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-black transition hover:bg-slate-800 dark:hover:bg-slate-200"
            >
                Create campaign
            </button>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13131a] py-16 text-center">
            <p className="text-[15px] text-slate-500 dark:text-[#888]">No campaigns match this filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-8">
            
            {/* Needs Action */}
            {swimlanes.needsAction.length > 0 && (
              <div className="flex flex-col gap-3 bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Needs Action
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px]">{swimlanes.needsAction.length}</span>
                </h3>
                <div className="flex flex-col gap-3">
                  {swimlanes.needsAction.map(p => <PipelineCard key={p._id} promotion={p} onAction={() => handlePayment(p._id)} onDelete={() => handleDeletePromotion(p._id)} router={router} />)}
                </div>
              </div>
            )}

            {/* Live & Paused */}
            {swimlanes.live.length > 0 && (
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
                    {swimlanes.live.slice(0, visibleLiveCount).map(p => <PipelineCard key={p._id} promotion={p} onAction={() => handlePayment(p._id)} onDelete={() => handleDeletePromotion(p._id)} router={router} />)}
                  </InfiniteScroll>
                </div>
              </div>
            )}

            {/* Archived */}
            {swimlanes.archived.length > 0 && (
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
                      {swimlanes.archived.slice(0, visibleArchivedCount).map(p => <PipelineCard key={p._id} promotion={p} onAction={() => handlePayment(p._id)} onDelete={() => handleDeletePromotion(p._id)} router={router} />)}
                    </InfiniteScroll>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </section>
{/* ================= DELETE MODAL ================= */}
      <AnimatePresence>
        {deletingPromoId && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0b0b14] border border-red-200 dark:border-red-500/20 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
            >
              <h2 className="text-lg font-black text-red-500 dark:text-red-400">Delete Promotion?</h2>
              <p className="text-sm text-slate-600 dark:text-white/60">Are you sure you want to delete this promotion request? This action cannot be undone.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDeletingPromoId(null)} 
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-slate-200 dark:bg-white/10 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeletePromotion} 
                  disabled={isDeleting}
                  className="flex-1 py-2 inline-flex items-center justify-center gap-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}


function PipelineCard({ 
  promotion,
  onAction,
  onDelete,
  router
}: { 
  promotion: PromotionRecord;
  onAction: () => void;
  onDelete?: () => void;
  router: any;
}) {
  const product = getProductDetails(promotion);
  
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
            <img src={product?.thumbnailUrl || promotion.productThumbnailUrl || undefined} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{product?.title || promotion.productTitle || promotion.title}</p>
          <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">Banner: {promotion.title}</p>
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
        
        <div className="flex flex-wrap items-center gap-2">
          
          {promotion.status === "APPROVED_WAITING_PAYMENT" && (
            <button 
              onClick={onAction}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#333] bg-transparent px-3 py-1.5 text-[12px] font-medium text-slate-900 dark:text-[#ededed] shadow-sm transition hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <Wallet className="h-3.5 w-3.5" />
              Pay
            </button>
          )}

          {(isActiveOrPaused || promotion.status === "EXPIRED") && (
            <button 
              onClick={() => router.push(`/dashboard/seller/promotions/${promotion._id}`)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-1.5 text-[12px] font-medium text-slate-700 dark:text-[#ededed] transition hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <Eye className="mr-1 h-3.5 w-3.5" /> Report
            </button>
          )}

          {promotion.status === "EXPIRED" && (
            <button 
              onClick={() => router.push(`/dashboard/seller/promotions/${promotion._id}`)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/10 text-slate-700 dark:text-[#ededed] bg-transparent px-3 py-1.5 text-[12px] font-medium transition hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Renew
            </button>
          )}

          {["PENDING_REVIEW", "PAYMENT_PENDING"].includes(promotion.status) && (
            <button 
              onClick={() => router.push(`/dashboard/seller/promotions/${promotion._id}`)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-1.5 text-[12px] font-medium text-slate-700 dark:text-[#ededed] transition hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <ReceiptText className="mr-1 h-3.5 w-3.5" /> View
            </button>
          )}

          {["PENDING_REVIEW", "APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING", "REJECTED", "EXPIRED"].includes(promotion.status) && onDelete && (
            <button 
              onClick={onDelete}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-[12px] font-medium transition hover:bg-red-100 dark:hover:bg-red-500/20"
              title="Delete Promotion"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
