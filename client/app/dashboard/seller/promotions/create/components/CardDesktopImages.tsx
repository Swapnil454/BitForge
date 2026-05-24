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
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center transition h-32 ${
        slot.uploadState === 'error' ? 'border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10' :
        slot.url ? 'border-slate-200 bg-white hover:border-cyan-400 dark:border-white/10 dark:bg-[#0a0a0f]' :
        'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-cyan-400 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10'
      }`}
    >
      <div className="absolute top-2 left-2 cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-white">
        <GripVertical className="h-4 w-4" />
      </div>
      
      {slot.url ? (
        <>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5">
            <img src={slot.url} alt={`Slot ${index + 1}`} className="h-full w-full object-contain" />
          </div>
          <div className="w-full">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Image {index + 1}</p>
            {slot.file && <p className="text-[10px] text-slate-500 dark:text-white/50">{(slot.file.size / 1024 / 1024).toFixed(2)} MB</p>}
          </div>
          <button onClick={onRemove} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition bg-white/80 dark:bg-black/50 rounded-full p-1" title="Remove">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
            <ImagePlus className={`h-4 w-4 ${slot.uploadState === 'error' ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className={`text-xs font-bold ${slot.uploadState === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-white/80'}`}>
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
  const { floatingImages, updateFloatingImage, reorderFloatingImages } = usePromotionFormStore();

  const handleUpload = (index: number, file: File) => {
    // Validation
    if (!["image/png", "image/webp"].includes(file.type)) {
      updateFloatingImage(index, { uploadState: 'error', errorMessage: 'Only PNG or WEBP files are supported.' });
      return;
    }
    if (file.size > 9 * 1024 * 1024) {
      updateFloatingImage(index, { uploadState: 'error', errorMessage: 'File exceeds 9MB limit. Please compress and retry.' });
      return;
    }

    // Success
    const url = URL.createObjectURL(file);
    updateFloatingImage(index, { file, url, uploadState: 'success', errorMessage: undefined });
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
    <SectionCard stepNumber={5} title="Desktop Floating Images" locked={locked}>
      <div className="space-y-6">
        
        <details className="group rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold text-slate-700 dark:text-white/90">
            Seller Guidelines for Premium Ads
            <span className="transition group-open:rotate-180">
              <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <div className="p-4 pt-0 text-sm text-slate-600 dark:text-white/70">
            <ul className="list-disc pl-5 space-y-1">
              <li>Use transparent PNG or WEBP images for the best floating effect.</li>
              <li>Avoid text near the edges of your images.</li>
              <li>Square or portrait crops work best.</li>
              <li>Max 9MB per image. You can reorder images by dragging them.</li>
            </ul>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                Ensure your image has a transparent background. WEBP transparency cannot be auto-detected, so double-check your files. These floating images appear on large screens (desktop/tablet) only.
              </p>
            </div>
          </div>
        </details>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {floatingImages.map((slot, index) => (
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
