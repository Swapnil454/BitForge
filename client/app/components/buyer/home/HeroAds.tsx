"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { promotionAPI } from "@/lib/api";
import type { ActivePromotionBanner } from "@/lib/promotions";
import HeroSkeleton from "./HeroSkeleton";
import { getAutoTextColor, isValidHexColor } from "@/lib/colorUtils";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  buttonText: string;
  link: string;
  gradientClass?: string;
  heroBgColor?: string;
  heroTextColor?: "light" | "dark" | "auto";
  heroLayout?: "floating" | "single" | "minimal" | "legacy";
  heroTitleColor?: string;
  heroSubtitleColor?: string;
  heroButtonBgColor?: string;
  heroButtonTextColor?: string;
  heroFontFamily?: string;
  productPrice?: number;
  bannerImage?: string;
  adImages?: {
    url: string;
    key: string;
    position: number;
    type: "product" | "transparent" | "logo";
  }[];
  promotionId?: string;
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
  const [liveBanners, setLiveBanners] = useState<Banner[]>(banners);
  const [loading, setLoading] = useState(!banners || banners === defaultBanners);
  const [autoRotate, setAutoRotate] = useState(true);
  const router = useRouter();
  const trackedPromotionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let ignore = false;

    if (banners !== defaultBanners || banners.length !== defaultBanners.length) {
      setLiveBanners(banners);
      setLoading(false);
      return;
    }

    const gradients = [
      "from-blue-600 via-indigo-700 to-slate-900",
      "from-cyan-600 via-blue-700 to-slate-900",
      "from-emerald-600 via-teal-700 to-slate-900",
    ];

    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const data = await promotionAPI.getActivePromotions("MARKETPLACE_HERO");
        const promotions: ActivePromotionBanner[] = data.promotions || [];

        if (ignore) return;

        if (promotions.length > 0) {
          setLiveBanners(
            promotions.map((promotion, index: number) => ({
              id: promotion.id,
              promotionId: promotion.id,
              title: promotion.title,
              subtitle: promotion.subtitle,
              badge: "Sponsored",
              buttonText: promotion.buttonText || "View Product",
              link: promotion.targetLink || `/marketplace/${promotion.productId}`,
              gradientClass: gradients[index % gradients.length],
              bannerImage: promotion.bannerImage || undefined,
              heroBgColor: promotion.heroBgColor,
              heroTextColor: promotion.heroTextColor,
              heroLayout: promotion.heroLayout,
              heroTitleColor: promotion.heroTitleColor,
              heroSubtitleColor: promotion.heroSubtitleColor,
              heroButtonBgColor: promotion.heroButtonBgColor,
              heroButtonTextColor: promotion.heroButtonTextColor,
              heroFontFamily: promotion.heroFontFamily,
              productPrice: promotion.productPrice,
              adImages: promotion.adImages,
            }))
          );
          setAutoRotate(data.settings?.autoRotate !== false);
        } else {
          setLiveBanners(defaultBanners);
          setAutoRotate(true);
        }
      } catch {
        if (!ignore) {
          setLiveBanners(defaultBanners);
          setAutoRotate(true);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchPromotions();

    return () => {
      ignore = true;
    };
  }, [banners]);

  const resolvedBanners = liveBanners.length > 0 ? liveBanners : defaultBanners;

  // Auto-slide effect
  useEffect(() => {
    if (!autoRotate || resolvedBanners.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % resolvedBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoRotate, resolvedBanners.length]);

  useEffect(() => {
    if (currentIndex >= resolvedBanners.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, resolvedBanners.length]);

  // Sync background color with global header
  useEffect(() => {
    const banner = resolvedBanners[currentIndex];
    const hasModernStyling = banner?.heroLayout && banner.heroLayout !== "legacy";
    const bgColor = hasModernStyling && banner?.heroBgColor ? banner.heroBgColor : undefined;
    const isDarkTextLocal = bgColor ? getAutoTextColor(bgColor) === "dark" : true;
    
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('hero-bg-change', { 
        detail: { bgColor, isDarkText: isDarkTextLocal } 
      }));
    }, 50);
    return () => clearTimeout(timer);
  }, [currentIndex, resolvedBanners]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('hero-bg-change', { 
        detail: { bgColor: undefined, isDarkText: true } 
      }));
    };
  }, []);

  useEffect(() => {
    const currentBanner = resolvedBanners[currentIndex];
    if (!currentBanner?.promotionId) {
      return;
    }

    if (trackedPromotionsRef.current.has(currentBanner.promotionId)) {
      return;
    }

    trackedPromotionsRef.current.add(currentBanner.promotionId);
    void promotionAPI.trackPromotionImpression(currentBanner.promotionId).catch(() => {});
  }, [currentIndex, resolvedBanners]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? resolvedBanners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % resolvedBanners.length);
  };

  const currentBanner = resolvedBanners[currentIndex];

  const handleBannerClick = async () => {
    if (currentBanner.promotionId) {
      void promotionAPI.trackPromotionClick(currentBanner.promotionId).catch(() => {});
    }

    router.push(currentBanner.link);
  };

  if (loading) {
    return <HeroSkeleton />;
  }

  // Determine styling based on legacy vs new schema
  const hasModernStyling = !!currentBanner.heroBgColor && isValidHexColor(currentBanner.heroBgColor);
  const bgColor = hasModernStyling ? currentBanner.heroBgColor : undefined;
  
  // Determine Text Color Mode (W3C Luminance Logic)
  let isDarkText = false;
  if (hasModernStyling && currentBanner.heroBgColor) {
    if (currentBanner.heroTextColor === "auto" || !currentBanner.heroTextColor) {
      isDarkText = getAutoTextColor(currentBanner.heroBgColor) === "dark";
    } else {
      isDarkText = currentBanner.heroTextColor === "dark";
    }
  }

  const textColorClass = isDarkText ? "text-slate-900" : "text-white";
  const subtextColorClass = isDarkText ? "text-slate-800" : "text-slate-100";
  const buttonClass = isDarkText 
    ? "bg-slate-900 text-white hover:bg-slate-800" 
    : "bg-white text-slate-900 hover:bg-slate-50";

  const layout = currentBanner.heroLayout || "floating";
  const adImages = currentBanner.adImages ? [...currentBanner.adImages].sort((a, b) => a.position - b.position) : [];

  return (
    <div className="relative z-0 w-full mb-8 sm:mb-12">
      {/* Subtle global page tint matching the hero banner */}
      {hasModernStyling && bgColor && (
        <div 
          className="fixed inset-0 w-full h-full pointer-events-none -z-50 transition-colors duration-700" 
          style={{ backgroundColor: bgColor, opacity: isDarkText ? 0.04 : 0.08 }}
        />
      )}
      {/* Background bleed layer */}
      {hasModernStyling && bgColor && (
        <div 
          className="absolute top-0 left-0 w-full h-[800px] sm:h-[1200px] lg:h-[1400px] pointer-events-none -z-10" 
          style={{ backgroundImage: `linear-gradient(to bottom, ${bgColor} 320px, ${bgColor}00 100%)` }}
        />
      )}
      <div 
        className={`relative w-full overflow-hidden h-[240px] sm:h-[300px] lg:h-[360px] transition-all duration-700 flex items-center group ${!hasModernStyling ? `bg-gradient-to-r ${currentBanner.gradientClass}` : ""}`}
        style={hasModernStyling ? { backgroundColor: 'transparent' } : {}}
      >
        {/* Legacy Banner Image Support */}
        {!hasModernStyling && currentBanner.bannerImage ? (
          <>
            <img
              src={currentBanner.bannerImage}
              alt={currentBanner.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/55" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/20" />
          </>
        ) : null}

        {/* Abstract Glow Background for Premium Themes */}
        {hasModernStyling && (
          <>
            <div className="absolute -left-1/4 -top-1/4 h-[120%] w-[120%] md:h-full md:w-1/2 rounded-full bg-white/20 blur-3xl mix-blend-overlay"></div>
            <div className="absolute -bottom-1/4 -right-1/4 h-[120%] w-[120%] md:h-full md:w-1/2 rounded-full bg-black/20 blur-3xl mix-blend-overlay"></div>
          </>
        )}

        <div className={`relative z-10 w-full max-w-[1440px] mx-auto h-full flex flex-col md:flex-row items-center px-4 md:px-6 lg:px-8`}>
          
          {/* Left Images Area (Images 2 and 3) */}
          {hasModernStyling && layout !== "minimal" && adImages.length > 1 && (
            <div className="hidden md:flex relative z-10 w-[25%] h-full items-end justify-start pb-6 pl-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-8 duration-700">
              {adImages.slice(1, 3).map((img, i) => {
                const cdnUrl = img.url.includes("cloudinary.com") 
                  ? img.url.replace("/upload/", "/upload/f_auto,q_auto,w_800/") 
                  : img.url;

                return (
                  <div
                    key={img.key}
                    className="relative transition-all duration-700 ease-out hover:-translate-y-4 cursor-pointer flex-shrink-0 origin-bottom"
                    style={{
                      height: i === 0 ? "80%" : "65%",
                      zIndex: 9 - i,
                      marginLeft: i > 0 ? "-4rem" : "0",
                    }}
                    onClick={handleBannerClick}
                  >
                    <img src={cdnUrl} alt="" className="h-full w-auto object-contain drop-shadow-2xl" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Content Area */}
          <div 
            className={`relative z-20 flex flex-col justify-center h-full ${layout === "minimal" || (hasModernStyling && adImages.length > 0) ? "w-full md:flex-1 items-center text-center max-w-3xl mx-auto px-4" : "w-full md:w-[55%] max-w-2xl items-start"} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 duration-700`}
            style={{ fontFamily: currentBanner.heroFontFamily || "inherit" }}
          >
            {currentBanner.badge && (
              <span className={`inline-block px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full mb-3 sm:mb-5 w-fit uppercase tracking-widest ${isDarkText ? "bg-black/10 text-slate-800 border-black/10" : "bg-white/20 text-white border-white/20"} backdrop-blur-sm border`}>
                {currentBanner.badge}
              </span>
            )}
            
            <h2 
              className={`text-3xl sm:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 tracking-tight drop-shadow-sm ${currentBanner.heroTitleColor ? "" : textColorClass} ${layout === "minimal" ? "leading-tight" : "leading-[1.1]"}`}
              style={currentBanner.heroTitleColor ? { color: currentBanner.heroTitleColor } : {}}
            >
              {currentBanner.title}
            </h2>

            {currentBanner.productPrice !== undefined && (
              <div className={`text-xl sm:text-2xl font-black mb-3 sm:mb-5 tracking-tight ${isDarkText ? "text-slate-800" : "text-white"}`}>
                ₹{currentBanner.productPrice.toLocaleString("en-IN")}
              </div>
            )}
            
            <p 
              className={`text-sm sm:text-lg mb-6 sm:mb-8 line-clamp-2 md:line-clamp-3 font-medium sm:leading-relaxed drop-shadow-sm min-h-[1.5rem] sm:min-h-[1.75rem] ${currentBanner.heroSubtitleColor ? "" : subtextColorClass}`}
              style={currentBanner.heroSubtitleColor ? { color: currentBanner.heroSubtitleColor } : {}}
            >
              {currentBanner.subtitle || "\u00A0"}
            </p>
            
            <button 
              onClick={handleBannerClick}
              className={`w-fit flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 font-bold rounded-full transition-all duration-300 shadow-xl ${!currentBanner.heroButtonBgColor ? buttonClass : ""} hover:-translate-y-0.5 hover:scale-105 active:scale-95 text-xs sm:text-base group/btn`}
              style={{
                ...(currentBanner.heroButtonBgColor ? { backgroundColor: currentBanner.heroButtonBgColor } : {}),
                ...(currentBanner.heroButtonTextColor ? { color: currentBanner.heroButtonTextColor } : {}),
              }}
            >
              {currentBanner.buttonText}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>

          {/* Right Image Area (Image 1 or Legacy) */}
          {hasModernStyling && layout !== "minimal" && (
            <div className="hidden md:flex relative z-10 w-[22%] h-full items-end justify-end pb-6 pr-0 lg:-mr-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-8 duration-700">
              {adImages.length > 0 ? (
                <div
                  className="relative transition-all duration-700 ease-out hover:-translate-y-4 cursor-pointer flex-shrink-0 origin-bottom h-[95%]"
                  style={{ zIndex: 10 }}
                  onClick={handleBannerClick}
                >
                  <img 
                    src={adImages[0].url.includes("cloudinary.com") ? adImages[0].url.replace("/upload/", "/upload/f_auto,q_auto,w_800/") : adImages[0].url} 
                    alt="" 
                    className="h-full w-auto object-contain drop-shadow-2xl" 
                  />
                </div>
              ) : currentBanner.bannerImage ? (
                // Fallback if they selected modern styling but only have a legacy bannerImage
                <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
                  <img src={currentBanner.bannerImage} className="max-h-[90%] w-auto object-contain drop-shadow-2xl rounded-2xl" alt="" />
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className={`hidden sm:flex absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 ${isDarkText ? "bg-black/5 text-slate-800 hover:bg-black/10" : "bg-white/10 text-white hover:bg-white/20"}`}
          aria-label="Previous banner"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className={`hidden sm:flex absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 ${isDarkText ? "bg-black/5 text-slate-800 hover:bg-black/10" : "bg-white/10 text-white hover:bg-white/20"}`}
          aria-label="Next banner"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dots safely below the banner */}
      <div className="absolute -bottom-5 sm:-bottom-7 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {resolvedBanners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${
              idx === currentIndex 
                ? `w-8 ${isDarkText ? "bg-slate-800" : "bg-cyan-500"}` 
                : `w-2.5 ${isDarkText ? "bg-slate-800/30 hover:bg-slate-800/50" : "bg-slate-300 hover:bg-slate-400 dark:bg-white/40 dark:hover:bg-white/60"}`
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
