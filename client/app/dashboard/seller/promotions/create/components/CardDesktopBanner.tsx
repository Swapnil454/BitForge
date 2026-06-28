import React from 'react';
import { usePromotionFormStore } from '../store';
import { SectionCard } from './SectionCard';
import { ImagePlus, Trash2, AlertTriangle } from 'lucide-react';

export function CardDesktopBanner({ locked }: { locked: boolean }) {
  const { desktopBanner, updateDesktopBanner, bannerTitle, ctaText } = usePromotionFormStore();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      updateDesktopBanner({ uploadState: 'error', errorMessage: 'Only image files are supported.' });
      return;
    }
    if (file.size > 9 * 1024 * 1024) {
      updateDesktopBanner({ uploadState: 'error', errorMessage: 'File exceeds 9MB limit. Please compress and retry.' });
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let warning;
      if (img.width < 1200) {
        warning = 'Image width is small. Recommended: At least 1200px wide.';
      }
      // Exact aspect ratio for 3000x1200 is 2.5
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio < 2.0 || ratio > 3.0) {
        warning = 'Image ratio looks off. Recommended: 3000x1200 (2.5:1). It may appear cropped.';
      }
      updateDesktopBanner({ file, url, uploadState: 'success', errorMessage: undefined, aspectRatioWarning: warning });
    };
    img.onerror = () => {
      updateDesktopBanner({ uploadState: 'error', errorMessage: 'Failed to read image file.' });
    };
    img.src = url;
  };

  const handleRemove = () => {
    if (desktopBanner.url) URL.revokeObjectURL(desktopBanner.url);
    updateDesktopBanner({ file: undefined, url: undefined, uploadState: 'empty', errorMessage: undefined, aspectRatioWarning: undefined });
  };

  return (
    <SectionCard stepNumber={4} title="Desktop Banner Card" subtitle="Shown exclusively on large screens (Laptops/PCs)" locked={locked}>
      <div className="space-y-3 md:space-y-6">
        
        {desktopBanner.aspectRatioWarning && (
          <div className="flex items-start gap-1.5 md:gap-2 rounded-lg md:rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 md:px-4 md:py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-[10px] md:text-sm text-amber-800 dark:text-amber-300 font-medium">
              {desktopBanner.aspectRatioWarning}
            </p>
          </div>
        )}

        {desktopBanner.uploadState === 'error' && (
          <div className="flex items-start gap-1.5 md:gap-2 rounded-lg md:rounded-xl border border-red-200 bg-red-50 px-2.5 py-2 md:px-4 md:py-3 dark:border-red-500/20 dark:bg-red-500/10">
            <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-[10px] md:text-sm text-red-800 dark:text-red-300 font-medium">
              {desktopBanner.errorMessage}
            </p>
          </div>
        )}

        {desktopBanner.url ? (
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group">
            <div className="relative w-full" style={{ aspectRatio: "2.5/1" }}>
              <img src={desktopBanner.url} alt="Desktop banner preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
              <div className="absolute top-2 left-2 md:top-3 md:left-3">
                <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/20 backdrop-blur-md">
                  <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white animate-pulse" />
                  Desktop Full Width Preview
                </span>
              </div>
            </div>
            
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 rounded-full bg-slate-900/50 text-white backdrop-blur-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition hover:bg-red-500"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 md:gap-2 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 w-full h-24 md:h-32 text-center transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-white/15 dark:bg-[#0a0a0f] dark:hover:border-cyan-500/50 dark:hover:bg-cyan-500/5">
            <ImagePlus className="h-5 w-5 md:h-6 md:w-6 text-cyan-500" />
            <div>
              <p className="font-bold text-slate-700 dark:text-white text-xs md:text-sm">Upload landscape banner image</p>
              <p className="mt-0.5 text-[9px] md:text-[11px] text-slate-500 dark:text-white/55">
                Recommended: 3000×1200 px (2.5:1) · Max 9MB
              </p>
            </div>
            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleUpload} className="hidden" />
          </label>
        )}

      </div>
    </SectionCard>
  );
}
