
"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";

type Variant = "admin" | "seller" | "buyer";

interface DashboardActionCardProps {
  title: string;
  description?: string;
  icon: ReactNode; 
  href: string;

  gradientFrom: string;
  gradientTo: string;

  borderColor: string;
  hoverBorderColor: string;
  hoverShadow: string;
  hoverTextColor: string;

  variant?: Variant;
}

export default function DashboardActionCard({
  title,
  description,
  icon,
  href,
  gradientFrom,
  gradientTo,
  borderColor,
  hoverBorderColor,
  hoverShadow,
  hoverTextColor,
  variant = "admin",
}: DashboardActionCardProps) {
  const router = useRouter();

  const isSellerOrBuyer = variant === "seller" || variant === "buyer";

  return (
    <button
      onClick={() => router.push(href)}
      className={`group relative overflow-hidden
        bg-linear-to-br ${gradientFrom} ${gradientTo}
        hover:${gradientFrom.replace("/20", "/35")}
        hover:${gradientTo.replace("/20", "/35")}
        border-2 ${borderColor} hover:${hoverBorderColor}
        rounded-xl p-4 md:p-5 text-left
        transition-all duration-300
        hover:scale-[1.02]
        shadow-lg hover:shadow-2xl ${hoverShadow}
      `}
    >
      {/* Glow */}
      <div
        className={`absolute inset-0 bg-linear-to-br
          ${gradientFrom.replace("/20", "/0")}
          via-white/10
          ${gradientTo.replace("/20", "/0")}
          opacity-0 group-hover:opacity-100 transition-opacity duration-500
        `}
      />

      <div
        className={`relative flex items-center ${
          isSellerOrBuyer ? "gap-2 md:gap-4" : "gap-3"
        }`}
      >
        <div
          className={`group-hover:scale-110 transition-transform duration-300 shrink-0
            ${isSellerOrBuyer ? "text-3xl md:text-4xl" : "text-3xl"}
          `}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`font-bold text-white transition-colors truncate
              ${isSellerOrBuyer ? "text-sm md:text-lg mb-0.5" : "text-sm"}
              group-hover:${hoverTextColor}
            `}
          >
            {title}
          </div>

          {description && (
            <div
              className={`text-xs transition-colors truncate hidden sm:block
                ${
                  isSellerOrBuyer
                    ? "text-white/70 group-hover:text-white/90"
                    : "text-white/70"
                }
              `}
            >
              {description}
            </div>
          )}
        </div>

        <svg
          className={`text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all shrink-0 hidden md:block
            ${isSellerOrBuyer ? "w-4 h-4 md:w-5 md:h-5" : "w-4 h-4"}
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}
