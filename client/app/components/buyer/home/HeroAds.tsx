"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  buttonText: string;
  link: string;
  gradientClass: string;
}

const defaultBanners: Banner[] = [
  {
    id: "1",
    title: "Upgrade Your Digital Toolkit",
    subtitle: "Get premium courses, eBooks, templates, software and design assets in one place.",
    badge: "Premium Assets",
    buttonText: "Explore Deals",
    link: "/marketplace",
    gradientClass: "from-blue-600 via-indigo-700 to-slate-900"
  },
  {
    id: "2",
    title: "50% Off React Templates",
    subtitle: "Launch your next SaaS or portfolio faster with our top-rated UI kits.",
    badge: "Limited Deal",
    buttonText: "Shop Templates",
    link: "/marketplace?category=Template",
    gradientClass: "from-cyan-600 via-blue-700 to-slate-900"
  },
  {
    id: "3",
    title: "Master Web Development",
    subtitle: "Learn from industry experts and level up your coding skills today.",
    badge: "New Courses",
    buttonText: "Browse Courses",
    link: "/marketplace?category=Course",
    gradientClass: "from-purple-600 via-indigo-700 to-slate-900"
  }
];

interface HeroAdsProps {
  banners?: Banner[];
}

export default function HeroAds({ banners = defaultBanners }: HeroAdsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mt-4 sm:mt-6">
      <div 
        className={`relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl h-[170px] sm:h-[200px] lg:h-[240px] bg-gradient-to-r ${currentBanner.gradientClass} shadow-lg transition-all duration-700 flex items-center group`}
      >
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-slate-200 dark:bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-10 -mb-20 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 px-5 sm:px-10 md:px-16 lg:px-24 flex flex-col justify-center h-full max-w-3xl">
          {currentBanner.badge && (
            <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold rounded-full mb-2.5 sm:mb-4 w-fit border border-white/20">
              {currentBanner.badge}
            </span>
          )}
          <h2 className="text-[22px] leading-tight sm:text-4xl lg:text-5xl font-extrabold text-white mb-1.5 sm:mb-4 tracking-tight">
            {currentBanner.title}
          </h2>
          <p className="text-[13px] sm:text-lg text-slate-100 mb-4 sm:mb-8 line-clamp-2 md:line-clamp-none max-w-2xl font-medium sm:leading-relaxed">
            {currentBanner.subtitle}
          </p>
          <button 
            onClick={() => router.push(currentBanner.link)}
            className="w-fit px-5 py-2 sm:px-8 sm:py-3.5 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-50 hover:scale-105 transition-all duration-200 shadow-md text-xs sm:text-base"
          >
            {currentBanner.buttonText}
          </button>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="hidden sm:flex absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-white/30 backdrop-blur-md text-slate-900 dark:text-white border border-slate-300 dark:border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Previous banner"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="hidden sm:flex absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-white/30 backdrop-blur-md text-slate-900 dark:text-white border border-slate-300 dark:border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Next banner"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-white w-6" : "bg-slate-100 dark:bg-white/50"}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
