import React from 'react';
import PageHeader from "../../../../buyer/transactions/components/PageHeader";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      <PageHeader
        backHref="/dashboard/seller/promotions"
        backLabel="Promotions"
        title="Create Promotion"
        subtitle="One request promotes one approved product in the marketplace hero"
      />
      <main className="mx-auto max-w-7xl px-4 py-5">
        {children}
      </main>
    </div>
  );
}
