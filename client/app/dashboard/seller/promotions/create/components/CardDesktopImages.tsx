import React from 'react';
import { usePromotionFormStore, AssetSlot } from '../store';
import { SectionCard } from './SectionCard';
import { ImagePlus, GripVertical, Trash2, AlertCircle } from 'lucide-react';

function UploadSlot({ 
  index, 
  slot, 
  onUpload, 
  onRemove,
  onDragStart,
  onDrop
}: { 
  index: number; 
  slot: AssetSlot; 
  onUpload: (file: File) => void; 
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`relative flex flex-col items-center justify-center gap-1.5 md:gap-3 rounded-xl md:rounded-2xl border p-2 md:p-4 text-center transition h-20 md:h-32 ${
        slot.uploadState === 'error' ? 'border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10' :
        slot.url ? 'border-slate-200 bg-white hover:border-cyan-400 dark:border-white/10 dark:bg-[#0a0a0f]' :
        'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-cyan-400 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10'
      }`}
    >
      <div className="absolute top-1 md:top-2 left-1 md:left-2 cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-white">
        <GripVertical className="h-3 w-3 md:h-4 md:w-4" />
      </div>
      
      {slot.url ? (
        <>
          <div className="flex h-8 w-8 md:h-16 md:w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5">
            <img src={slot.url} alt={`Slot ${index + 1}`} className="h-full w-full object-contain" />
          </div>
          <div className="w-full hidden md:block">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Image {index + 1}</p>
            {slot.file && <p className="text-[10px] text-slate-500 dark:text-white/50">{(slot.file.size / 1024 / 1024).toFixed(2)} MB</p>}
          </div>
          <button onClick={onRemove} className="absolute top-1 md:top-2 right-1 md:right-2 text-slate-400 hover:text-red-500 transition bg-white/80 dark:bg-black/50 rounded-full p-1 md:p-1.5" title="Remove">
            <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
          </button>
        </>
      ) : (
        <label className="flex flex-col items-center gap-1 md:gap-2 cursor-pointer w-full h-full justify-center">
          <div className="flex h-6 w-6 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
            <ImagePlus className={`h-3 w-3 md:h-4 md:w-4 ${slot.uploadState === 'error' ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
          <div className="hidden md:block">
            <p className={`text-[10px] md:text-xs font-bold ${slot.uploadState === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-white/80'}`}>
              {slot.uploadState === 'error' ? 'Failed' : `Upload ${index + 1}`}
            </p>
          </div>
          <input type="file" accept="image/png, image/webp" onChange={handleFile} className="hidden" />
        </label>
      )}
    </div>
  );
}

export function CardDesktopImages({ locked }: { locked: boolean }) {
  const { floatingImages, updateFloatingImage, reorderFloatingImages, layoutType } = usePromotionFormStore();

  const handleUpload = (index: number, file: File) => {
    // Basic validation
    if (!["image/png", "image/webp", "image/jpeg", "image/jpg"].includes(file.type)) {
      updateFloatingImage(index, { uploadState: 'error', errorMessage: 'Invalid format' });
      return;
    }
    
    if (file.size > 9 * 1024 * 1024) {
      updateFloatingImage(index, { uploadState: 'error', errorMessage: 'Max 9MB' });
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      if (layoutType === 'fullImage') {
        if (img.width !== 3000 || img.height !== 1200) {
          updateFloatingImage(index, { uploadState: 'error', errorMessage: `Got ${img.width}x${img.height}` });
          URL.revokeObjectURL(url);
          return;
        }
      }
      
      updateFloatingImage(index, { file, url, uploadState: 'success', errorMessage: undefined });
    };
    
    img.onerror = () => {
      updateFloatingImage(index, { uploadState: 'error', errorMessage: 'Failed read' });
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const handleRemove = (index: number) => {
    const img = floatingImages[index];
    if (img.url) URL.revokeObjectURL(img.url);
    updateFloatingImage(index, { file: undefined, url: undefined, uploadState: 'empty', errorMessage: undefined });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDrop = (e: React.DragEvent, destIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (sourceIndex === destIndex || isNaN(sourceIndex)) return;
    reorderFloatingImages(sourceIndex, destIndex);
  };

  return (
    <SectionCard stepNumber={layoutType === 'fullImage' ? 4 : 5} title={layoutType === 'fullImage' ? "Desktop Banner Image" : "Desktop Floating Images"} locked={locked}>
      <div className="space-y-3 md:space-y-6">
        
        <details className="group rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between p-2 md:p-4 text-xs md:text-sm font-semibold text-slate-700 dark:text-white/90">
            Seller Guidelines for {layoutType === 'fullImage' ? 'Full Banners' : 'Premium Ads'}
            <span className="transition group-open:rotate-180">
              <svg fill="none" height="16" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" className="md:w-6 md:h-6"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <div className="p-2 pt-0 md:p-4 md:pt-0 text-[10px] md:text-sm text-slate-600 dark:text-white/70">
            <ul className="list-disc pl-4 md:pl-5 space-y-0.5 md:space-y-1">
              {layoutType === 'fullImage' ? (
                <>
                  <li><strong className="text-red-500">Must be exactly 3000 x 1200 pixels.</strong></li>
                  <li>Use high quality JPEGs or PNGs without transparent backgrounds.</li>
                  <li>Displayed edge-to-edge on large devices.</li>
                </>
              ) : (
                <>
                  <li>Transparent PNG or WEBP images for floating effect.</li>
                  <li>Max 9MB per image. Drag to reorder.</li>
                </>
              )}
            </ul>
            {layoutType !== 'fullImage' && (
              <div className="mt-2 md:mt-4 flex items-start gap-1.5 md:gap-2 rounded-lg md:rounded-xl bg-amber-50 p-1.5 md:p-3 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                <AlertCircle className="w-3 h-3 md:w-4 md:h-4 shrink-0 md:mt-0.5" />
                <p className="text-[9px] md:text-xs font-medium leading-snug md:leading-relaxed">
                  WEBP transparency cannot be auto-detected, double-check your files.
                </p>
              </div>
            )}
          </div>
        </details>

        <div className={`grid grid-cols-3 ${layoutType === 'fullImage' ? 'sm:grid-cols-1 max-w-md mx-auto' : 'sm:grid-cols-3'} gap-2 md:gap-3`}>
          {floatingImages.slice(0, layoutType === 'fullImage' ? 1 : 3).map((slot, index) => (
            <UploadSlot 
              key={`slot-${index}`}
              index={index}
              slot={slot}
              onUpload={(file) => handleUpload(index, file)}
              onRemove={() => handleRemove(index)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            />
          ))}
        </div>

      </div>
    </SectionCard>
  );
}
