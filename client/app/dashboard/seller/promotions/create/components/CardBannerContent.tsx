import { usePromotionFormStore } from '../store';
import { SectionCard } from './SectionCard';
import { AlertTriangle } from 'lucide-react';

const inputClass = "w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 md:px-4 md:py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35";

function CharCounter({ value, softLimit, hardLimit }: { value: string, softLimit: number, hardLimit: number }) {
  const count = value.length;
  const isSoft = count >= softLimit && count < hardLimit;
  const isHard = count >= hardLimit;
  
  let color = "text-slate-400 dark:text-white/40";
  if (isSoft) color = "text-amber-500 font-bold";
  if (isHard) color = "text-red-500 font-bold";

  return (
    <div className="flex justify-between items-center mt-0.5 md:mt-1">
      <div className={`text-[10px] md:text-xs ${isHard ? 'text-red-500' : 'text-transparent'}`}>
        {isHard && "Shorter text performs better in hero banners"}
      </div>
      <div className={`text-[10px] md:text-[11px] text-right font-medium ${color}`}>
        {count} / {hardLimit}
      </div>
    </div>
  );
}

export function CardBannerContent({ locked }: { locked: boolean }) {
  const { bannerTitle, bannerSubtitle, ctaText, targetLink, setBannerContent } = usePromotionFormStore();

  return (
    <SectionCard stepNumber={2} title="Banner Content" locked={locked}>
      <div className="space-y-2 md:space-y-6">
        
        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-1 md:mb-1.5">
            Banner Title
          </label>
          <input 
            type="text"
            value={bannerTitle}
            onChange={(e) => setBannerContent({ bannerTitle: e.target.value })}
            placeholder="e.g. The Ultimate Developer Toolkit"
            className={inputClass}
          />
          <CharCounter value={bannerTitle} softLimit={50} hardLimit={70} />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-1 md:mb-1.5">
            Subtitle
          </label>
          <textarea 
            value={bannerSubtitle}
            onChange={(e) => setBannerContent({ bannerSubtitle: e.target.value })}
            placeholder="e.g. Boost your productivity by 10x with these curated tools."
            rows={2}
            className={`${inputClass} resize-none md:min-h-[80px]`}
          />
          <CharCounter value={bannerSubtitle} softLimit={100} hardLimit={140} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
          <div>
            <label className="block text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-1 md:mb-1.5">
              CTA Button Text
            </label>
            <input 
              type="text"
              value={ctaText}
              onChange={(e) => setBannerContent({ ctaText: e.target.value })}
              className={inputClass}
            />
            <CharCounter value={ctaText} softLimit={15} hardLimit={20} />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-1 md:mb-1.5">
              Target Link
            </label>
            <input 
              type="text"
              value={targetLink}
              onChange={(e) => setBannerContent({ targetLink: e.target.value })}
              placeholder="/marketplace/your-product"
              className={inputClass}
            />
            {targetLink.length > 0 && !targetLink.startsWith('/marketplace/') && (
              <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> 
                External links are not recommended. Use /marketplace/...
              </p>
            )}
          </div>
        </div>

      </div>
    </SectionCard>
  );
}
