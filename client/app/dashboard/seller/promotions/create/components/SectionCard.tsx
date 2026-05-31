import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SectionCardProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  locked?: boolean;
  collapsibleOnMobile?: boolean;
}

export function SectionCard({ stepNumber, title, subtitle, children, locked = false, collapsibleOnMobile = false }: SectionCardProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldRenderChildren = !collapsibleOnMobile || !isMobile || isOpenMobile;

  return (
    <div className={`rounded-3xl md:rounded-[2rem] border border-slate-200 bg-white p-3 md:p-6 shadow-sm transition-opacity duration-300 dark:border-white/10 dark:bg-white/5 ${locked ? 'opacity-50 pointer-events-none grayscale-[30%]' : 'opacity-100'}`}>
      <div 
        className={`flex items-start gap-2 md:gap-3 mb-3 md:mb-5 ${collapsibleOnMobile && isMobile ? 'cursor-pointer' : ''}`}
        onClick={() => { if (collapsibleOnMobile && isMobile) setIsOpenMobile(!isOpenMobile); }}
      >
        <div className="flex h-6 w-6 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] md:text-[13px] font-bold mt-0.5">
          {stepNumber}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">{title}</h2>
            {collapsibleOnMobile && isMobile && (
              <button className="p-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60">
                {isOpenMobile ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
          {subtitle && <p className="mt-0.5 md:mt-1 text-xs md:text-sm font-medium text-slate-500 dark:text-white/60 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      
      {shouldRenderChildren && (
        <div className="space-y-3 md:space-y-5">
          {children}
        </div>
      )}
    </div>
  );
}
