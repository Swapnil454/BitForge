import React from 'react';

interface SectionCardProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  locked?: boolean;
}

export function SectionCard({ stepNumber, title, subtitle, children, locked = false }: SectionCardProps) {
  return (
    <div className={`rounded-[2rem] border border-slate-200 bg-white p-4 md:p-6 shadow-sm transition-opacity duration-300 dark:border-white/10 dark:bg-white/5 ${locked ? 'opacity-50 pointer-events-none grayscale-[30%]' : 'opacity-100'}`}>
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[13px] font-bold mt-0.5">
          {stepNumber}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm font-medium text-slate-500 dark:text-white/60 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}
