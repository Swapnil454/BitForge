"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Settings2 } from "lucide-react";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import { promotionAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import {
  formatPromotionCurrency,
  getPromotionErrorMessage,
  type PromotionSettings,
} from "@/lib/promotions";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35";

export default function AdSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PromotionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [marketplaceHeroMaxAds, setMarketplaceHeroMaxAds] = useState(3);
  const [autoRotate, setAutoRotate] = useState(true);
  const [defaultDurationDays, setDefaultDurationDays] = useState(7);
  const [minimumPrice, setMinimumPrice] = useState(2);
  const [maximumActiveAdsPerSeller, setMaximumActiveAdsPerSeller] = useState(2);

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

  const handleSave = async () => {
    try {
      setSaving(true);
      await promotionAPI.updateAdSettings({
        marketplaceHeroMaxAds,
        autoRotate,
        defaultDurationDays,
        minimumPrice,
        maximumActiveAdsPerSeller,
      });
      showSuccess("Ad settings updated");
      await loadSettings();
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to update settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/admin/promotions"
        backLabel="Promotions"
        title="Ad Settings"
        subtitle="Control the live hero inventory and pricing floor"
      />

      <section className="mx-auto max-w-5xl px-4 py-8">
        {loading || !settings ? (
          <div className="h-[32rem] animate-pulse rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">Global Controls</p>
                  <h1 className="mt-2 text-3xl font-black">Marketplace Hero</h1>
                  <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                    These values shape how many paid banners show, what the price floor is, and how many live placements each seller can hold.
                  </p>
                </div>
                <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                  <Settings2 className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <Field label="Marketplace Hero Max Ads">
                  <input
                    type="number"
                    min={1}
                    value={marketplaceHeroMaxAds}
                    onChange={(e) => setMarketplaceHeroMaxAds(Number(e.target.value) || 1)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Default Duration (days)">
                  <input
                    type="number"
                    min={1}
                    value={defaultDurationDays}
                    onChange={(e) => setDefaultDurationDays(Number(e.target.value) || 1)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Minimum Price">
                  <input
                    type="number"
                    min={0}
                    value={minimumPrice}
                    onChange={(e) => setMinimumPrice(Number(e.target.value) || 0)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Maximum Active Ads Per Seller">
                  <input
                    type="number"
                    min={1}
                    value={maximumActiveAdsPerSeller}
                    onChange={(e) => setMaximumActiveAdsPerSeller(Number(e.target.value) || 1)}
                    className={inputClass}
                  />
                </Field>

                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <p className="font-semibold">Auto Rotate</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
                      When enabled, the hero cycles through multiple active banners automatically.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-400"
                  />
                </label>

                <button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <SnapshotCard label="Current Max Ads" value={String(settings.marketplaceHeroMaxAds)} />
              <SnapshotCard label="Default Duration" value={`${settings.defaultDurationDays} days`} />
              <SnapshotCard label="Minimum Price" value={formatPromotionCurrency(settings.minimumPrice)} />
              <SnapshotCard
                label="Max Active Ads / Seller"
                value={String(settings.maximumActiveAdsPerSeller)}
              />
              <SnapshotCard label="Auto Rotate" value={settings.autoRotate ? "Enabled" : "Disabled"} />

              <button
                onClick={() => router.push("/dashboard/admin/promotions")}
                className="w-full rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:text-white/75 dark:hover:border-white/20 dark:hover:bg-white/10"
              >
                Back to Promotion Queue
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">{label}</span>
      {children}
    </label>
  );
}

function SnapshotCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-sm text-slate-500 dark:text-white/55">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}
