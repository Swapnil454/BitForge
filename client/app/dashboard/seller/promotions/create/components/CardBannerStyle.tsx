import { usePromotionFormStore, ColorToken } from '../store';
import { SectionCard } from './SectionCard';
import { Palette, CheckCircle2, AlertTriangle } from 'lucide-react';

const PRESET_SWATCHES: { label: string; token: ColorToken }[] = [
  { label: 'Navy Pro', token: { bg: '#0F172A', textColor: '#FFFFFF', ctaBg: '#38BDF8' } },
  { label: 'Indigo Premium', token: { bg: '#312E81', textColor: '#FFFFFF', ctaBg: '#818CF8' } },
  { label: 'Emerald Growth', token: { bg: '#064E3B', textColor: '#ECFCCB', ctaBg: '#34D399' } },
  { label: 'Slate Dark', token: { bg: '#1E293B', textColor: '#F8FAFC', ctaBg: '#CBD5E1' } },
  { label: 'Amber Warm', token: { bg: '#78350F', textColor: '#FEF3C7', ctaBg: '#FBBF24' } },
];

function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function calculateContrastRatio(hex1: string, hex2: string) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function CardBannerStyle({ locked }: { locked: boolean }) {
  const { colorToken, customHex, setStyle } = usePromotionFormStore();

  const isCustomActive = !PRESET_SWATCHES.some(s => s.token.bg.toLowerCase() === colorToken.bg.toLowerCase());

  const handleSwatchSelect = (token: ColorToken) => {
    setStyle(token, token.bg);
  };

  const handleCustomHexChange = (hex: string) => {
    // Determine a fallback text color based on the new bg luminance
    const rgb = hexToRgb(hex);
    let newTextColor = '#FFFFFF';
    if (rgb) {
      const lum = luminance(rgb.r, rgb.g, rgb.b);
      newTextColor = lum > 0.5 ? '#0F172A' : '#FFFFFF';
    }
    setStyle({ bg: hex, textColor: newTextColor, ctaBg: newTextColor === '#FFFFFF' ? '#38BDF8' : '#0F172A' }, hex);
  };

  const contrastRatio = calculateContrastRatio(colorToken.bg, colorToken.textColor);
  const passNormal = contrastRatio >= 4.5;
  const passLarge = contrastRatio >= 3.0;

  return (
    <SectionCard stepNumber={4} title="Banner Style" locked={locked}>
      <div className="space-y-8">
        
        {/* Preset Swatches */}
        <div>
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
            Color Theme
          </label>
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {PRESET_SWATCHES.map(swatch => {
              const isSelected = colorToken.bg.toLowerCase() === swatch.token.bg.toLowerCase();
              // Extract the short name (e.g. "Navy" from "Navy Pro")
              const shortLabel = swatch.label.split(' ')[0];
              return (
                <div key={swatch.label} className="flex flex-col items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSwatchSelect(swatch.token)}
                    className={`relative flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-[14px] md:rounded-2xl transition-all ${
                      isSelected ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-[#05050a] scale-110 shadow-lg' : 'hover:scale-105 shadow hover:shadow-md'
                    }`}
                    style={{ backgroundColor: swatch.token.bg }}
                    title={swatch.label}
                  >
                    {isSelected && <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" style={{ color: swatch.token.textColor }} />}
                  </button>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-white/50'}`}>
                    {shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Hex */}
        <div className="pt-6 border-t border-slate-100 dark:border-white/5">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Custom Background (Hex)
          </label>
          <div className="flex items-center gap-4">
            <div className={`p-1 rounded-xl transition ${isCustomActive ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-[#05050a]' : 'border border-slate-200 dark:border-white/10'}`}>
              <input
                type="color"
                value={customHex}
                onChange={(e) => handleCustomHexChange(e.target.value)}
                className="h-10 w-10 cursor-pointer appearance-none rounded-lg border-0 p-0 block bg-transparent"
              />
            </div>
            <input
              type="text"
              value={customHex}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              placeholder="#2563EB"
              className="w-full max-w-[200px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        {/* Contrast Checker */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-500" /> Contrast Ratio
              </p>
              <p className="text-xs text-slate-500 dark:text-white/60 mt-1">WCAG AA Standard (Text on Background)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-black tabular-nums" style={{ color: passNormal ? '#10B981' : passLarge ? '#F59E0B' : '#EF4444' }}>
                  {contrastRatio.toFixed(2)}:1
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-white/10"></div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {passNormal ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  <span className={passNormal ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>Normal Text (4.5:1)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {passLarge ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  <span className={passLarge ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>Large Text (3.0:1)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </SectionCard>
  );
}
