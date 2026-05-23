import React from 'react';
import { usePromotionFormStore } from '../store';
import { SectionCard } from './SectionCard';
import { ImagePlus, Trash2, AlertTriangle } from 'lucide-react';

export function CardMobileBanner({ locked }: { locked: boolean }) {
  const { mobileBanner, updateMobileBanner, bannerTitle, ctaText } = usePromotionFormStore();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      updateMobileBanner({ uploadState: 'error', errorMessage: 'Only image files are supported.' });
      return;
    }
    if (file.size > 9 * 1024 * 1024) {
      updateMobileBanner({ uploadState: 'error', errorMessage: 'File exceeds 9MB limit. Please compress and retry.' });
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      let warning;
      if (ratio < 1.7 || ratio > 2.1) {
        warning = 'Image ratio looks off. Recommended: 16:9 or 2:1. It may appear cropped.';
      }
      updateMobileBanner({ file, url, uploadState: 'success', errorMessage: undefined, aspectRatioWarning: warning });
    };
    img.src = url;
  };

  const handleRemove = () => {
    if (mobileBanner.url) URL.revokeObjectURL(mobileBanner.url);
    updateMobileBanner({ file: undefined, url: undefined, uploadState: 'empty', errorMessage: undefined, aspectRatioWarning: undefined });
  };

  return (
    <SectionCard stepNumber={6} title="Mobile Banner Card" subtitle="Shown exclusively on phones" locked={locked}>
      <div className="space-y-6">
        
        {mobileBanner.aspectRatioWarning && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              {mobileBanner.aspectRatioWarning}
            </p>
          </div>
        )}

        {mobileBanner.uploadState === 'error' && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
              {mobileBanner.errorMessage}
            </p>
          </div>
        )}

        {mobileBanner.url ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group">
            <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
              <img src={mobileBanner.url} alt="Mobile banner preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/20 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Mobile Card Crop Preview
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white">
              <p className="text-sm font-bold truncate flex-1 pr-4">{bannerTitle || "Your title here"}</p>
              <span className="flex-shrink-0 text-xs font-bold bg-white text-slate-900 px-4 py-2 rounded-xl">
                {ctaText || "View Product"}
              </span>
            </div>
            
            <button
              onClick={handleRemove}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition hover:bg-red-500"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 w-full h-32 text-center transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-white/15 dark:bg-[#0a0a0f] dark:hover:border-cyan-500/50 dark:hover:bg-cyan-500/5">
            <ImagePlus className="h-6 w-6 text-cyan-500" />
            <div>
              <p className="font-bold text-slate-700 dark:text-white text-sm">Upload rectangular banner card</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-white/55">
                Recommended: 1200×600 px (2:1) · Max 9MB
              </p>
            </div>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        )}

      </div>
    </SectionCard>
  );
}
