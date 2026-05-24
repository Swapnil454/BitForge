import React, { useEffect } from 'react';
import { usePromotionFormStore } from '../store';
import { X, Monitor, Smartphone } from 'lucide-react';

export function PreviewBottomSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const state = usePromotionFormStore();
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const {
    bannerTitle,
    bannerSubtitle,
    ctaText,
    colorToken,
    floatingImages,
    mobileBanner
  } = state;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative w-full h-[85vh] bg-white dark:bg-[#05050a] rounded-t-[2rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300">
        
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Live Preview</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Control */}
        <div className="p-4 flex justify-center border-b border-slate-100 dark:border-white/5">
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-full max-w-sm">
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'desktop' ? 'bg-white dark:bg-slate-800 shadow text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-white/60'}`}
            >
              <Monitor className="w-4 h-4" /> Desktop
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'mobile' ? 'bg-white dark:bg-slate-800 shadow text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-white/60'}`}
            >
              <Smartphone className="w-4 h-4" /> Mobile
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
          
          {viewMode === 'desktop' && (
            <div 
              className="absolute transform scale-[0.3] origin-center w-[1200px] h-[400px] rounded-[3rem] p-16 flex items-center justify-between"
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
                  <img src={floatingImages[0].url} alt="" className="absolute top-0 right-0 w-64 h-64 object-contain" />
                )}
                {floatingImages[1]?.url && (
                  <img src={floatingImages[1].url} alt="" className="absolute bottom-0 left-0 w-48 h-48 object-contain" />
                )}
              </div>
            </div>
          )}

          {viewMode === 'mobile' && (
            <div className="absolute transform scale-[0.7] sm:scale-100 origin-center w-[360px] h-[700px] bg-white dark:bg-[#0a0a0f] rounded-[2rem] border-8 border-slate-800 shadow-xl overflow-hidden flex flex-col">
              {mobileBanner.url ? (
                <div className="p-4 pt-10 flex flex-col gap-4">
                  <div className="w-full aspect-[2/1] rounded-2xl overflow-hidden relative shadow-lg">
                    <img src={mobileBanner.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-black text-lg truncate">{bannerTitle || "Banner Title"}</h3>
                      <button className="mt-2 w-full py-2 rounded-xl text-sm font-bold bg-white text-slate-900">
                        {ctaText || "View"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500 dark:text-white/40">
                  <p>Upload a mobile banner to preview.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
