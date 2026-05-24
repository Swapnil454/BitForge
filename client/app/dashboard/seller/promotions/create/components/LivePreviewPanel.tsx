import React, { useState } from 'react';
import { usePromotionFormStore } from '../store';
import { CheckCircle2, Clock } from 'lucide-react';

export function LivePreviewPanel() {
  const state = usePromotionFormStore();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const {
    bannerTitle,
    bannerSubtitle,
    ctaText,
    colorToken,
    floatingImages,
    mobileBanner,
    selectedProductMeta
  } = state;

  return (
    <div className="sticky top-6 flex flex-col gap-4" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      
      {/* 1. Live Preview Pane */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Preview</h3>
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'desktop' ? 'bg-white dark:bg-slate-800 shadow-sm text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white'}`}
            >
              Desktop
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'mobile' ? 'bg-white dark:bg-slate-800 shadow-sm text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white'}`}
            >
              Mobile
            </button>
          </div>
        </div>

        <div className="w-full flex justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10" style={{ height: viewMode === 'desktop' ? '150px' : '400px' }}>
          
          {viewMode === 'desktop' && (
            <div 
              className="absolute transform scale-[0.32] origin-top w-[1200px] h-[400px] rounded-[3rem] p-16 flex items-center justify-between top-4"
              style={{ backgroundColor: colorToken.bg }}
            >
              <div className="max-w-[600px] relative z-10">
                <h1 className="text-6xl font-black mb-6 leading-tight" style={{ color: colorToken.textColor }}>
                  {bannerTitle || "Your Banner Title"}
                </h1>
                <p className="text-2xl mb-10 opacity-90" style={{ color: colorToken.textColor }}>
                  {bannerSubtitle || "Your subtitle text will appear here."}
                </p>
                <button className="px-10 py-5 rounded-full text-xl font-bold transition-transform hover:scale-105" style={{ backgroundColor: colorToken.ctaBg, color: colorToken.bg }}>
                  {ctaText || "View Product"}
                </button>
              </div>

              {/* Desktop Floating Images */}
              <div className="relative w-[400px] h-[300px]">
                {floatingImages[0]?.url && (
                  <img src={floatingImages[0].url} alt="" className="absolute top-0 right-0 w-64 h-64 object-contain animate-bounce" style={{ animationDuration: '4s' }} />
                )}
                {floatingImages[1]?.url && (
                  <img src={floatingImages[1].url} alt="" className="absolute bottom-0 left-0 w-48 h-48 object-contain animate-bounce" style={{ animationDuration: '5s' }} />
                )}
                {floatingImages[2]?.url && (
                  <img src={floatingImages[2].url} alt="" className="absolute top-1/2 -left-10 w-32 h-32 object-contain animate-bounce" style={{ animationDuration: '6s' }} />
                )}
              </div>
            </div>
          )}

          {viewMode === 'mobile' && (
            <div className="absolute transform scale-[0.45] origin-top w-[400px] h-[800px] bg-slate-100 dark:bg-[#0a0a0f] rounded-[3rem] border-[12px] border-slate-800 overflow-hidden shadow-2xl flex flex-col top-4">
              {mobileBanner.url ? (
                <div className="p-4 pt-12 flex flex-col gap-4">
                  <div className="w-full aspect-[2/1] rounded-2xl overflow-hidden relative shadow-lg">
                    <img src={mobileBanner.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-black text-xl truncate">{bannerTitle || "Banner Title"}</h3>
                      <button className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold bg-white text-slate-900">
                        {ctaText || "View"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500 dark:text-white/40 font-bold text-xl">
                  <p>Upload a mobile banner to preview.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 2. Product Snapshot Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Product Snapshot</h3>
        {selectedProductMeta ? (
          <div className="flex items-center gap-3">
            {selectedProductMeta.image ? (
              <img src={selectedProductMeta.image} alt={selectedProductMeta.title} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/10" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{selectedProductMeta.title}</p>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-slate-500 dark:text-white/60 uppercase font-semibold">{selectedProductMeta.category || 'Software'}</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedProductMeta.price === 0 ? 'Free' : `₹${selectedProductMeta.price || 0}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-slate-500 dark:text-white/50 italic">Select a product first</p>
        )}
      </div>

      {/* 3. Request Summary (Checklist) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Pre-Submit Checklist</h3>
        <ul className="space-y-2.5 text-[13px]">
          <li className={`flex items-center gap-2.5 ${state.selectedProductId ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-white/50'}`}>
            <span className="w-2.5 h-2.5 rounded-full border-2 flex items-center justify-center shrink-0 border-current bg-current" />
            Product selected
          </li>
          <li className={`flex items-center gap-2.5 ${state.bannerTitle && state.bannerSubtitle ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-white/50'}`}>
            <span className="w-2.5 h-2.5 rounded-full border-2 flex items-center justify-center shrink-0 border-current bg-current" />
            Content details
          </li>
          <li className={`flex items-center gap-2.5 ${state.requestedDuration > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-white/50'}`}>
            <span className="w-2.5 h-2.5 rounded-full border-2 flex items-center justify-center shrink-0 border-current bg-current" />
            Duration chosen
          </li>
          <li className={`flex items-center gap-2.5 ${state.mobileBanner.url ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-500 font-semibold'}`}>
            <span className="w-2.5 h-2.5 rounded-full border-2 flex items-center justify-center shrink-0 border-current bg-current" />
            Mobile banner uploaded {(!state.mobileBanner.url) && "(Required)"}
          </li>
        </ul>
      </div>

      {/* 4. Guidelines Mini-card */}
      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/5">
        <h3 className="text-xs font-bold text-cyan-800 dark:text-cyan-400 mb-2 uppercase tracking-wider">Review Timeline</h3>
        <ul className="space-y-1.5 text-[12px] text-cyan-900/80 dark:text-cyan-200/70">
          <li className="flex items-start gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
            <span>Admin review typically takes 24–48 hours after submission.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="opacity-70 mt-0.5">•</span>
            <span>Placement: Marketplace Hero Banner (Desktop + Mobile).</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="opacity-70 mt-0.5">•</span>
            <span>Pricing and exact schedule will be confirmed after review.</span>
          </li>
        </ul>
      </div>

    </div>
  );
}
