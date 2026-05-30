"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  Eye, Plus, AlertTriangle, ArrowRight, TrendingUp, Clock, Megaphone, ArrowLeft, X, ArrowUpRight, Sun, Moon, ChevronDown, Check, Activity, AlertCircle, Wallet, Target
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { promotionAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import {
  formatPromotionCurrency,
  formatPromotionDate,
  PAYMENT_STATUS_LABELS,
  PLACEMENT_LABELS,
  type PromotionRecord,
  type PromotionStatus,
} from "@/lib/promotions";

type TabValue = "ALL" | "ACTION_REQUIRED" | "IN_PROGRESS" | "ACTIVE" | "PAST";

const TAB_MAPPINGS: Record<TabValue, PromotionStatus[]> = {
  ALL: [],
  ACTION_REQUIRED: ["APPROVED_WAITING_PAYMENT"], 
  IN_PROGRESS: ["PENDING_REVIEW", "PAYMENT_PENDING"],
  ACTIVE: ["ACTIVE"],
  PAST: ["EXPIRED", "CANCELLED", "REJECTED"],
};

const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "All", value: "ALL" },
  { label: "Action Required", value: "ACTION_REQUIRED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Active", value: "ACTIVE" },
  { label: "Past", value: "PAST" },
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await promotionAPI.getSellerPromotions();
      setPromotions(data.promotions || []);
    } catch {
      showError("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPromotions();
  }, [fetchPromotions]);

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
      return promotions.slice(0, 2);
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
  
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#111111] text-slate-900 dark:text-[#ededed] pb-24 font-sans selection:bg-amber-500/30">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#111111] py-4 px-4 sm:px-8 xl:px-12 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex justify-start">
            <button 
              onClick={() => router.push("/dashboard/seller")}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 dark:text-[#888] transition hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-[#ededed]">Promotions</h1>
          </div>
          
          <div className="flex justify-end items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/seller/promotions/create")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-transparent px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-[#ededed] shadow-sm transition hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New campaign</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-8 xl:px-12 mt-8 space-y-8">
        
        {/* Persistent Alert */}
        {showPaymentAlert && (
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-[#1a1306] p-3 sm:p-4 shadow-sm pr-10 sm:pr-4">
            <div className="flex gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
              <p className="text-[12px] sm:text-[13px] leading-relaxed text-amber-950 dark:text-amber-200/90">
                <span className="font-semibold">{actionRequiredCampaigns[0].productTitle}</span> is awaiting payment — complete to go live.
                {actionRequiredCampaigns.length > 1 && ` (+${actionRequiredCampaigns.length - 1} more)`}
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="ACTIVE NOW" 
            value={stats.active.toString()} 
            subtitle={stats.active > 0 ? "Currently running" : "No live campaigns"}
          />
          <StatCard 
            title="ACTION REQUIRED" 
            value={stats.actionRequired.toString()} 
            valueColor={stats.actionRequired > 0 ? "text-amber-600 dark:text-amber-500" : undefined}
            pill={stats.actionRequired > 0 ? { text: "Pay to activate", color: "amber" } : undefined}
            subtitle={stats.actionRequired === 0 ? "All caught up" : undefined}
          />
          <StatCard 
            title="TOTAL INVESTED" 
            value={formatPromotionCurrency(stats.totalInvested)} 
            subtitle={`${stats.paidCampaignsCount} paid campaign${stats.paidCampaignsCount !== 1 ? 's' : ''}`}
            pill={stats.paidCampaignsCount > 0 ? { text: "Paid", color: "emerald" } : undefined}
          />
          <StatCard 
            title="TOTAL IMPRESSIONS" 
            value={stats.totalImpressions.toLocaleString("en-IN")} 
            pill={stats.totalImpressions > 0 ? { text: "All time", color: "emerald" } : undefined}
            subtitle={stats.totalImpressions === 0 ? "Awaiting traffic" : undefined}
          />
        </div>

        {/* Main Impressions Chart */}
        <div className="rounded-xl border border-slate-300 dark:border-white/5 bg-white dark:bg-[#1a1a1c] p-5 shadow-sm">
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
              {/* Custom Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                  className="inline-flex items-center justify-between w-[160px] text-[12px] rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] px-3 py-1.5 text-slate-700 dark:text-[#ededed] focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm transition hover:bg-slate-50 dark:hover:bg-white/5"
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
                    <div className="absolute right-0 top-full mt-1 w-[200px] sm:w-[240px] z-40 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-lg py-1 max-h-[300px] overflow-y-auto">
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

        {/* Tab Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-[#ededed]">Campaigns</h2>
          
          <div className="flex flex-nowrap overflow-x-auto hide-scrollbar gap-2">
            {TABS.filter(t => ['ALL', 'IN_PROGRESS', 'PAST'].includes(t.value)).map((tab) => {
              const labelMap: Record<string, string> = { ALL: 'All', IN_PROGRESS: 'Pending', PAST: 'Past' };
              const count = tab.value === "ALL" 
                ? promotions.length 
                : promotions.filter(p => TAB_MAPPINGS[tab.value].includes(p.status)).length;
                
              const isActive = activeTab === tab.value;
              
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-[#ededed]"
                      : "border-transparent text-slate-600 dark:text-[#888] hover:text-slate-900 dark:hover:text-[#ededed] hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {labelMap[tab.value] || tab.label}
                  <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive 
                      ? 'bg-slate-200 dark:bg-[#000] text-slate-800 dark:text-[#888]' 
                      : 'bg-slate-100 dark:bg-[#1a1a1c] text-slate-500 dark:text-[#666]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pipeline Cards */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-[#161616] animate-pulse border border-slate-200 dark:border-[#2a2a2a]" />
              ))}
            </div>
          ) : promotions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#111111] px-8 py-20 text-center flex flex-col items-center">
              <Megaphone className="h-10 w-10 text-slate-400 dark:text-[#666] mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-[#ededed]">No campaigns found</h3>
              <p className="mt-2 text-[15px] text-slate-500 dark:text-[#888] max-w-md">
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
            <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#161616] py-16 text-center">
              <p className="text-[15px] text-slate-500 dark:text-[#888]">No campaigns match this filter.</p>
            </div>
          ) : (
            filteredPromotions.map(promotion => (
              <PipelineCard 
                key={promotion._id} 
                promotion={promotion} 
                onAction={() => handlePayment(promotion._id)}
              />
            ))
          )}
        </div>

        {/* Educational Footer */}
        {promotions.length > 0 && (
          <div className="mt-12 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#161616] p-8 text-center flex flex-col items-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 border border-slate-200 dark:border-white/10">
              <TrendingUp className="h-5 w-5 text-slate-500 dark:text-[#888]" />
            </div>
            <p className="text-slate-700 dark:text-[#ededed] text-sm max-w-lg mb-6 leading-relaxed">
              Hero banners average 1.2% CTR. Your best campaign hit 0.84% — a stronger banner image can close that gap.
            </p>
            <button className="rounded-lg border border-slate-300 dark:border-[#333] bg-transparent px-4 py-2 text-sm font-medium text-slate-700 dark:text-[#ededed] hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center gap-2">
              Get tips to improve CTR <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  pill, 
  valueColor 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  pill?: { text: string, color: 'amber' | 'emerald' | 'blue' };
  valueColor?: string;
}) {
  const getIcon = () => {
    if (title === "ACTIVE NOW") return <Activity className="h-4 w-4 text-emerald-500" />;
    if (title === "ACTION REQUIRED") return <AlertCircle className="h-4 w-4 text-amber-500" />;
    if (title === "TOTAL INVESTED") return <Wallet className="h-4 w-4 text-blue-500" />;
    if (title === "TOTAL IMPRESSIONS") return <Target className="h-4 w-4 text-pink-500" />;
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-300 dark:border-white/5 bg-white dark:bg-[#1a1a1c] p-3 sm:p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group transition-all hover:shadow-md hover:border-amber-500/30 dark:hover:border-amber-500/20">
      {/* Subtle background gradient blob on hover */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
        <div className="flex items-center gap-2">
          {getIcon()}
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-600 dark:text-[#888] uppercase truncate">{title}</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-1 relative z-10">
        <span className={`text-2xl sm:text-3xl font-medium tracking-tight ${valueColor || 'text-slate-900 dark:text-[#ededed]'}`}>
          {value}
        </span>
        
        <div className="flex items-center gap-2 mt-1">
          {pill ? (
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
              pill.color === 'amber' 
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-500' 
                : pill.color === 'blue'
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-500'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500'
            }`}>
              <span className={`h-1 w-1 rounded-full mr-1.5 ${
                pill.color === 'amber' ? 'bg-amber-500' : pill.color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
              }`} />
              {pill.text}
            </span>
          ) : subtitle ? (
            <p className="text-[13px] text-slate-500 dark:text-[#888]">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PipelineCard({ 
  promotion,
  onAction
}: { 
  promotion: PromotionRecord;
  onAction: () => void;
}) {
  const { theme } = useTheme();
  const product = getProductDetails(promotion);
  
  const isAwaitingPayment = promotion.status === "APPROVED_WAITING_PAYMENT";
  const isActive = promotion.status === "ACTIVE";
  const isPast = ["EXPIRED", "CANCELLED", "REJECTED"].includes(promotion.status);
  
  const getBorderColor = () => {
    if (isAwaitingPayment) return "before:bg-amber-500";
    if (isActive) return "before:bg-emerald-500";
    if (isPast) return "before:bg-slate-300 dark:before:bg-[#333]";
    return "before:bg-blue-500"; 
  };

  const getStatusBadge = () => {
    if (isAwaitingPayment) return { bg: "bg-amber-50 dark:bg-[#2a1c00]", text: "text-amber-700 dark:text-amber-500", label: "Awaiting payment", icon: true, border: "border-amber-200 dark:border-amber-500/30" };
    if (isActive) return { bg: "bg-emerald-50 dark:bg-[#002a1c]", text: "text-emerald-700 dark:text-emerald-500", label: "Live", icon: false, border: "border-emerald-200 dark:border-emerald-500/30" };
    if (isPast) return { bg: "bg-slate-50 dark:bg-transparent", text: "text-slate-600 dark:text-[#888]", label: promotion.status === 'EXPIRED' ? 'Expired' : 'Ended', icon: false, border: "border-slate-200 dark:border-white/10" };
    return { bg: "bg-blue-50 dark:bg-[#001c2a]", text: "text-blue-700 dark:text-blue-400", label: "Under review", icon: false, border: "border-blue-200 dark:border-blue-500/30" };
  };
  const badge = getStatusBadge();
  
  const gradientList = [
    "from-indigo-500 to-purple-500",
    "from-rose-400 to-orange-400",
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-cyan-500"
  ];
  const charSum = (product.title || "T").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgGradient = gradientList[charSum % gradientList.length];

  const trendData = useMemo(() => {
    if (!promotion.metrics?.history || promotion.metrics.history.length === 0) return [];
    // Grab up to the last 7 days of history for the sparkline
    return promotion.metrics.history.slice(-7).map(h => ({ val: h.impressions }));
  }, [promotion.metrics?.history]);

  const isBelowAverage = promotion.metrics?.ctr < 1.2;

  return (
    <div className={`relative flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-hidden rounded-xl border border-slate-300 dark:border-[#2a2a2a] bg-white dark:bg-[#161616] p-4 lg:p-5 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-[2px] ${getBorderColor()}`}>
      
      {/* Left Area: Campaign Identity */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0 pl-1">
        
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-white/5 ${product.thumbnailUrl ? 'bg-slate-100' : `bg-gradient-to-br ${bgGradient}`}`}>
          {product.thumbnailUrl ? (
            <img src={product.thumbnailUrl} alt={product.title} className="h-full w-full object-cover object-center" />
          ) : (
            <span className="text-[15px] font-bold text-white shadow-sm">
              {(product.title || "T").substring(0, 3).toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="flex flex-col gap-1.5 min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-[#ededed]">
            {product.title}
          </h3>
          <p className="truncate text-[13px] text-slate-500 dark:text-[#888]">
            Banner: {promotion.title}
          </p>
          
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-slate-200 dark:border-white/10 bg-transparent px-2.5 py-0.5 text-[11px] text-slate-600 dark:text-[#888]">
              {PLACEMENT_LABELS[promotion.placement]}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.icon && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              {badge.label}
            </span>
          </div>
          
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-[#666]">
            <div className="h-[1px] w-2 bg-slate-300 dark:bg-[#333]" />
            {isActive || isPast ? (
              `${formatPromotionDate(promotion.startDate)} – ${formatPromotionDate(promotion.endDate)}`
            ) : (
              "Pending schedule"
            )}
          </div>
        </div>
      </div>
      
      {/* Right Area: Analytics or Action CTA */}
      <div className="flex flex-col items-start md:items-end gap-3 shrink-0 pt-4 md:pt-0 w-full md:w-[280px]">
        
        {isAwaitingPayment ? (
          <div className="flex flex-col items-end w-full">
            <div className="flex items-center gap-4 mb-2">
              <button 
                onClick={onAction}
                className="w-full md:w-auto inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-[#333] bg-transparent px-5 py-2 text-[14px] font-medium text-slate-900 dark:text-[#ededed] shadow-sm transition hover:bg-slate-50 dark:hover:bg-[#222]"
              >
                Pay {formatPromotionCurrency(promotion.amount, promotion.currency)}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#888]">Activates immediately</p>
          </div>
        ) : (isActive || isPast) ? (
          <div className="flex flex-col md:items-end w-full">
            <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-4 mb-2">
              <div className="w-16 h-8 hidden md:block">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <Line type="monotone" dataKey="val" stroke={theme === 'dark' ? '#888' : '#cbd5e1'} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-right">
                <p className="text-[17px] font-semibold text-slate-900 dark:text-[#ededed]">
                  {promotion.metrics.impressions.toLocaleString("en-IN")} <span className="text-xs font-normal text-slate-500 dark:text-[#888]">impr</span>
                </p>
                <p className={`text-[13px] font-medium ${isBelowAverage ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                  {promotion.metrics.ctr}% CTR
                </p>
              </div>
            </div>
            
            {/* Inline CTR Benchmarking */}
            <div className="w-full md:w-48 mb-4 relative pt-1">
              <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden flex">
                <div 
                  className={`h-full rounded-full ${isBelowAverage ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (promotion.metrics.ctr / 2.5) * 100)}%` }} 
                />
              </div>
              <div className="absolute right-0 -top-3 text-[10px] text-slate-400 dark:text-[#666]">|</div>
              <p className="text-[10px] text-slate-400 dark:text-[#666] mt-1 text-right">Avg CTR: 1.2%</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={onAction}
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#333] bg-transparent px-3 py-1.5 text-[12px] font-medium text-slate-600 dark:text-[#aaa] transition hover:text-slate-900 dark:hover:text-[#ededed] hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <Eye className="h-3.5 w-3.5" />
                Report
              </button>
              
              {isPast && (
                <button 
                  onClick={onAction}
                  className={`w-full md:w-auto inline-flex items-center justify-center gap-1 rounded-lg border bg-transparent px-3 py-1.5 text-[12px] font-medium transition ${
                    isBelowAverage 
                      ? 'border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' 
                      : 'border-slate-300 dark:border-white/10 text-slate-700 dark:text-[#ededed] hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {isBelowAverage ? 'Improve CTR' : 'Renew'} <ArrowUpRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button 
            onClick={onAction}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-4 py-2 text-[13px] font-medium text-slate-700 dark:text-[#ededed] transition hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
          </button>
        )}
      </div>
    </div>
  );
}
