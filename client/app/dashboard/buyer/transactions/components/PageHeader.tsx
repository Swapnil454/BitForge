"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  rightSlot?: ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  backLabel = "Back",
  rightSlot,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-linear-to-r from-black via-slate-950 to-black/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="relative flex min-h-[58px] items-center justify-center">
          <button
            onClick={() => {
              if (onBack) onBack();
              else if (backHref) router.push(backHref);
              else router.back();
            }}
            className="absolute left-0 inline-flex items-center gap-1 text-white/80 hover:text-white transition"
            aria-label={backLabel}
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={3} />
            <span className="hidden sm:inline text-sm font-medium">{backLabel}</span>
          </button>

          <div className="px-16 text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-linear-to-r from-fuchsia-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && <p className="text-white/55 text-xs sm:text-sm mt-0.5">{subtitle}</p>}
          </div>

          {rightSlot && <div className="absolute right-0">{rightSlot}</div>}
        </div>
      </div>
    </header>
  );
}
