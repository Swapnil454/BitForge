"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, RotateCcw, AlertTriangle, CheckCircle2, ChevronRight, Zap, Info, Layers, RefreshCw, Clock, Tag } from "lucide-react";
import { promotionAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { formatPromotionCurrency, getPromotionErrorMessage, type PromotionSettings } from "@/lib/promotions";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 shadow-sm";

export default function AdSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PromotionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [marketplaceHeroMaxAds, setMarketplaceHeroMaxAds] = useState(5);
  const [autoRotate, setAutoRotate] = useState(true);
  const [defaultDurationDays, setDefaultDurationDays] = useState(7);
  const [minimumPrice, setMinimumPrice] = useState(2);
  const [maximumActiveAdsPerSeller, setMaximumActiveAdsPerSeller] = useState(5);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await promotionAPI.getAdSettings();
      const currentSettings = data.settings;
      setSettings(currentSettings);
      setMarketplaceHeroMaxAds(currentSettings.marketplaceHeroMaxAds);
      setAutoRotate(currentSettings.autoRotate);
      setDefaultDurationDays(currentSettings.defaultDurationDays);
      setMinimumPrice(currentSettings.minimumPrice);
      setMaximumActiveAdsPerSeller(currentSettings.maximumActiveAdsPerSeller);
    } catch {
      showError("Failed to load ad settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const isDirty = useMemo(() => {
    if (!settings) return false;
    return (
      marketplaceHeroMaxAds !== settings.marketplaceHeroMaxAds ||
      autoRotate !== settings.autoRotate ||
      defaultDurationDays !== settings.defaultDurationDays ||
      minimumPrice !== settings.minimumPrice ||
      maximumActiveAdsPerSeller !== settings.maximumActiveAdsPerSeller
    );
  }, [settings, marketplaceHeroMaxAds, autoRotate, defaultDurationDays, minimumPrice, maximumActiveAdsPerSeller]);

  const handleReset = () => {
    if (!settings) return;
    setMarketplaceHeroMaxAds(settings.marketplaceHeroMaxAds);
    setAutoRotate(settings.autoRotate);
    setDefaultDurationDays(settings.defaultDurationDays);
    setMinimumPrice(settings.minimumPrice);
    setMaximumActiveAdsPerSeller(settings.maximumActiveAdsPerSeller);
  };

  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (marketplaceHeroMaxAds < 1) errors.push("Max ads must be at least 1.");
    if (defaultDurationDays < 1) errors.push("Duration must be at least 1 day.");
    if (minimumPrice <= 0) errors.push("Minimum price must be greater than 0.");
    if (maximumActiveAdsPerSeller > marketplaceHeroMaxAds) errors.push("Seller limit cannot exceed max hero ads.");

    if (minimumPrice > 0 && minimumPrice < 1) {
      warnings.push("Minimum price is very low. Sellers may overuse promotion slots.");
    }
    if (marketplaceHeroMaxAds > 10) {
      warnings.push("High number of hero slots might clutter the marketplace.");
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }, [marketplaceHeroMaxAds, defaultDurationDays, minimumPrice, maximumActiveAdsPerSeller]);

  const handleSave = async () => {
    if (!validation.isValid) {
      showError("Please fix validation errors before saving.");
      return;
    }
    
    try {
      setSaving(true);
      await promotionAPI.updateAdSettings({
        marketplaceHeroMaxAds,
        autoRotate,
        defaultDurationDays,
        minimumPrice,
        maximumActiveAdsPerSeller,
      });
      showSuccess("Settings updated successfully");
      await loadSettings();
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to update settings"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center">
        <div className="animate-pulse rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#05050a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative h-12">
          <div className="z-10">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/70 transition shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <h1 className="text-lg sm:text-2xl font-black leading-tight pointer-events-auto">Hero Ad Control Center</h1>
            <p className="text-[10px] sm:text-sm text-slate-500 dark:text-white/60 pointer-events-auto mt-0.5">Manage slots, pricing, seller limits</p>
          </div>
          
          <div className="hidden sm:flex items-center gap-3">
            <div className="hidden lg:block text-right mr-4">
              {isDirty ? (
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest animate-pulse">Unsaved Changes</p>
              ) : (
                <p className="text-xs font-medium text-slate-400">Up to date</p>
              )}
            </div>
            
            <button
              onClick={handleReset}
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={!isDirty || !validation.isValid || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Ad Rules"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-4 sm:mt-8">
        
        {/* Configuration Summary Strip */}
        <div className="flex overflow-x-auto gap-2.5 sm:gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-6 sm:mb-8">
          <SummaryPill label="Max Ads" value={marketplaceHeroMaxAds} />
          <SummaryPill label="Duration" value={`${defaultDurationDays} days`} />
          <SummaryPill label="Min Price" value={formatPromotionCurrency(minimumPrice)} />
          <SummaryPill label="Seller Limit" value={maximumActiveAdsPerSeller} />
          <SummaryPill label="Rotation" value={autoRotate ? "Enabled" : "Disabled"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Settings Cards */}
          <div className="flex flex-col gap-4 sm:gap-6">
            
            {/* 1. Hero Inventory */}
            <Card title="Hero Inventory" description="Control how many ads are visible in the marketplace hero.">
              <div className="space-y-4">
                <Field label="Maximum live hero banners">
                  <input
                    type="number"
                    min={1}
                    value={marketplaceHeroMaxAds}
                    onChange={(e) => setMarketplaceHeroMaxAds(Number(e.target.value) || 1)}
                    className={inputClass}
                  />
                </Field>
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Hero Slots Preview</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: Math.min(marketplaceHeroMaxAds, 20) }).map((_, i) => (
                      <div key={i} className="w-12 h-10 rounded-lg bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all duration-300">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Pricing Rules */}
            <Card title="Pricing Rules" description="Define the price floor and duration for hero ad purchases.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Minimum Promotion Price (₹)">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={minimumPrice}
                    onChange={(e) => setMinimumPrice(Number(e.target.value) || 0)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Default Billing Duration (days)">
                  <input
                    type="number"
                    min={1}
                    value={defaultDurationDays}
                    onChange={(e) => setDefaultDurationDays(Number(e.target.value) || 1)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                <Info className="w-5 h-5 shrink-0" />
                <p><strong>Estimated Seller Cost:</strong> {formatPromotionCurrency(minimumPrice)} for {defaultDurationDays} days. Sellers cannot submit promotion requests below this price.</p>
              </div>
            </Card>

            {/* 3. Seller Limits */}
            <Card title="Seller Limits" description="Prevent a single seller from monopolizing the marketplace.">
              <div className="space-y-4">
                <Field label="Maximum active ads per seller">
                  <input
                    type="number"
                    min={1}
                    value={maximumActiveAdsPerSeller}
                    onChange={(e) => setMaximumActiveAdsPerSeller(Number(e.target.value) || 1)}
                    className={inputClass}
                  />
                </Field>
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 text-sm text-slate-600 dark:text-white/70">
                  <p><strong>Policy Preview:</strong> If max hero ads = {marketplaceHeroMaxAds} and seller limit = {maximumActiveAdsPerSeller}, one seller can occupy a maximum of {maximumActiveAdsPerSeller} hero placements simultaneously.</p>
                </div>
              </div>
            </Card>

            {/* 4. Rotation Behavior */}
            <Card title="Rotation Behavior" description="Configure automatic cycling of active hero banners.">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#13131a] shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Auto Rotate Hero Ads</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-white/55 pr-4">
                    When enabled, active banners rotate automatically. Recommended for fair visibility across sellers.
                  </p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${autoRotate ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 ${autoRotate ? 'left-7' : 'left-1'}`} />
                </div>
                {/* Hidden checkbox for accessibility */}
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                  className="hidden"
                />
              </label>
            </Card>

          </div>

          {/* Right Column: Preview & Validation */}
          <div className="sticky top-28 flex flex-col gap-4 sm:gap-6">
            
            {/* Marketplace Preview */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#13131a] overflow-hidden">
              <div className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-500" /> Marketplace Preview</h3>
              </div>
              <div className="p-6">
                
                {/* Mock Banner */}
                <div className="w-full aspect-[21/9] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden mb-6">
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                  <h4 className="text-white font-black text-xl md:text-2xl leading-tight mb-2 relative z-10">Promoted Digital Products</h4>
                  <p className="text-white/80 text-xs md:text-sm max-w-[80%] relative z-10">Banners will appear here following these rules</p>
                </div>

                {/* Rules Summary */}
                <div className="space-y-1 text-sm pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-slate-500 flex items-center gap-2"><Layers className="w-4 h-4" /> Visible slots</span>
                    <span className="font-bold">{marketplaceHeroMaxAds}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-slate-500 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Rotation</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{autoRotate ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Duration</span>
                    <span className="font-bold">{defaultDurationDays} days</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-slate-500 flex items-center gap-2"><Tag className="w-4 h-4" /> Minimum price</span>
                    <span className="font-bold">{formatPromotionCurrency(minimumPrice)}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Validation Box */}
            <div className={`rounded-2xl border p-5 ${
              !validation.isValid ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' 
              : validation.warnings.length > 0 ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
              : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
            }`}>
              
              {!validation.isValid ? (
                <>
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold mb-2">
                    <AlertTriangle className="w-5 h-5" /> Cannot save rules
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300 space-y-1">
                    {validation.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </>
              ) : validation.warnings.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-2">
                    <AlertTriangle className="w-5 h-5" /> Warnings
                  </div>
                  <ul className="list-disc list-inside text-sm text-amber-600 dark:text-amber-300 space-y-1">
                    {validation.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                  </ul>
                </>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" /> Configuration is valid and ready to publish
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      
      {/* Mobile Sticky Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#05050a]/90 backdrop-blur-md border-t border-slate-200 dark:border-white/10 p-4 pb-safe flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleReset}
          disabled={!isDirty || saving}
          className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
        <button
          onClick={() => void handleSave()}
          disabled={!isDirty || !validation.isValid || saving}
          className="flex-[2] inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Rules"}
        </button>
      </div>
    </main>
  );
}

function SummaryPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0 bg-white dark:bg-[#13131a] rounded-full border border-slate-200 dark:border-white/10 px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm">
      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">{label}</span>
      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-7 shadow-sm dark:border-white/10 dark:bg-[#13131a]">
      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 mb-4 sm:mb-6 text-xs sm:text-sm text-slate-500 dark:text-white/60">{description}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80">{label}</span>
      {children}
    </label>
  );
}
