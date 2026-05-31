import React from 'react';
import PageHeader from "../../../../buyer/transactions/components/PageHeader";
import { usePromotionFormStore } from "../store";

export function PageShell({ children }: { children: React.ReactNode }) {
  const { layoutType, setLayoutType } = usePromotionFormStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      <PageHeader
        backHref="/dashboard/seller/promotions"
        backLabel="Promotions"
        title="Create Promotion"
        subtitle=""
      />

      <div className="mx-auto max-w-7xl px-2 pt-3 md:px-4 md:pt-6 pb-2 flex justify-center">
        <div className="bg-white dark:bg-slate-800 p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1">
          <button
            onClick={() => setLayoutType('modern')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              layoutType === 'modern'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Modern Layout
          </button>
          <button
            onClick={() => setLayoutType('fullImage')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              layoutType === 'fullImage'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Full Image Layout
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-5">
        {children}
      </main>
    </div>
  );
}
