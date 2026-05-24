"use client";

import { useState } from "react";

export interface GlassyOption {
  value: string;
  label: string;
}

export interface GlassySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassyOption[];
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
}

export default function GlassySelect({
  value,
  onChange,
  options,
  className,
  buttonClassName,
  placeholder = "Select",
}: GlassySelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${open ? "z-50" : "z-0"} ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2.5 sm:px-4 sm:py-2.5 text-sm text-slate-800 dark:text-white/90 hover:bg-slate-200 dark:hover:bg-white/10 backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${buttonClassName ?? ""}`}
      >
        <span className="truncate text-left">
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`ml-2 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {open && (
        <>
          <div 
            className="fixed inset-0 z-20" 
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a14]/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/10 ${
                  option.value === value
                    ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                    : "text-slate-700 dark:text-white/70"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
