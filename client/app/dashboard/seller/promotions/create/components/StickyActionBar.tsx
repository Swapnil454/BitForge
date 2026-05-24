import { usePromotionFormStore } from '../store';
import { Sparkles, Save, Eye, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function StickyActionBar({ onSubmit, onPreviewMobile }: { onSubmit: () => void, onPreviewMobile: () => void }) {
  const { draftSaveState, lastSavedAt, formCompletion } = usePromotionFormStore();

  const isReady = formCompletion === 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Draft Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
          {draftSaveState === 'saving' && (
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-white/60">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          )}
          {draftSaveState === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              {lastSavedAt && <span className="text-slate-400 dark:text-white/40 ml-0.5 text-[11px] sm:text-xs font-normal">• {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </span>
          )}
          {draftSaveState === 'idle' && (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" /> Unsaved
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="hidden sm:inline-flex px-5 py-3 rounded-xl font-bold text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 transition border border-transparent hover:border-slate-200 dark:hover:border-white/10">
            Save Draft
          </button>
          
          <button 
            onClick={onPreviewMobile}
            className="flex-1 sm:hidden inline-flex items-center justify-center px-4 py-2.5 sm:px-4 sm:py-2.5 rounded-[10px] sm:rounded-xl text-sm font-bold bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition"
          >
            Preview
          </button>

          <div className="group relative flex-1 sm:flex-none">
            <button
              onClick={onSubmit}
              disabled={!isReady}
              className="w-full inline-flex items-center justify-center rounded-[10px] sm:rounded-xl bg-cyan-500 px-4 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-white/10 dark:disabled:text-white/40"
            >
              Submit
            </button>
            
            {!isReady && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-3 py-2 rounded-lg shadow-xl">
                Complete all required fields to submit
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-white rotate-45"></div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
