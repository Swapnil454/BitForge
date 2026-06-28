"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { promotionAPI } from "@/lib/api";
import type { ActivePromotionBanner } from "@/lib/promotions";
import HeroSkeleton from "./HeroSkeleton";
import { getAutoTextColor, isValidHexColor } from "@/lib/colorUtils";
import SearchDropdown from "@/app/components/buyer/search/SearchDropdown";

export interface Banner {
  id: string;
  title: string;
  productId?: any;
  subtitle: string;
  badge?: string;
  buttonText: string;
  link: string;
  gradientClass?: string;
  heroBgColor?: string;
  heroTextColor?: "light" | "dark" | "auto";
  heroLayout?: "floating" | "single" | "minimal" | "legacy" | "fullImage";
  heroTitleColor?: string;
  heroSubtitleColor?: string;
  heroButtonBgColor?: string;
  heroButtonTextColor?: string;
  heroFontFamily?: string;
  productPrice?: number;
  productDiscount?: number;
  promotionGoal?: string;
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
    title: "",
    subtitle: "",
    buttonText: "",
    link: "/marketplace",
    heroLayout: "fullImage",
    bannerImage: "/buyer.png"
  },
  {
    id: "2",
    title: "",
    subtitle: "",
    buttonText: "",
    link: "/marketplace?category=Template",
    heroLayout: "fullImage",
    bannerImage: "/overall.png"
  },
  {
    id: "3",
    title: "",
    subtitle: "",
    buttonText: "",
    link: "/marketplace?category=Course",
    heroLayout: "fullImage",
    bannerImage: "/seller.png"
  }
];

interface HeroAdsProps {
  banners?: Banner[];
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  handleSearch?: (term?: string) => void;
  isAuthenticated?: boolean;
}

export default function HeroAds({ 
  banners = defaultBanners,
  searchTerm,
  setSearchTerm,
  handleSearch,
  isAuthenticated
}: HeroAdsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liveBanners, setLiveBanners] = useState<Banner[]>(banners);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [mobileTranslateIndex, setMobileTranslateIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const prevIndexRef = useRef(0);
  const [loading, setLoading] = useState(!banners || banners === defaultBanners);
  const [autoRotate, setAutoRotate] = useState(true);
  const router = useRouter();
  const trackedPromotionsRef = useRef<Set<string>>(new Set());

  // Search dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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

    const CACHE_KEY = "hero_promotions_cache";
    const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

    const fetchPromotions = async () => {
      // 1. Try cache first — render instantly
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL && data?.promotions?.length > 0) {
            // Render from cache immediately, no loading spinner
            applyPromotions(data);
            setLoading(false);
            // Still refetch in background to keep fresh
          }
        }
      } catch (_) {}

      try {
        setLoading((prev) => prev); // keep existing state, don't re-show spinner if cache hit
        const data = await promotionAPI.getActivePromotions("MARKETPLACE_HERO");
        if (ignore) return;
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch (_) {}
        applyPromotions(data);
      } catch (err) {
        console.error("Failed to fetch promotions", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    const applyPromotions = (data: any) => {
      if (ignore) return;
      const promotions: ActivePromotionBanner[] = data.promotions || [];
      if (promotions.length > 0) {
        setLiveBanners(
          promotions.map((promotion, index: number) => ({
            id: promotion.id,
            promotionId: promotion.id,
            productId: promotion.productId,
            title: promotion.title,
            subtitle: promotion.subtitle,
            badge: "Sponsored",
            buttonText: promotion.buttonText || "View Product",
            link: promotion.targetLink || `/product/${promotion.product?.slug || promotion.productId}`,
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
            productDiscount: promotion.productDiscount,
            promotionGoal: promotion.promotionGoal,
            adImages: promotion.adImages,
          }))
        );
        setAutoRotate(data.settings?.autoRotate !== false);
      } else {
        setLiveBanners(defaultBanners);
        setAutoRotate(true);
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

  // Sync mobileTranslateIndex with currentIndex for infinite scroll
  useEffect(() => {
    const prev = prevIndexRef.current;
    const n = resolvedBanners.length;
    
    if (prev !== currentIndex) {
      setIsTransitioning(true);
      
      if (prev === n - 1 && currentIndex === 0) {
        setMobileTranslateIndex(n + 1);
      } else if (prev === 0 && currentIndex === n - 1) {
        setMobileTranslateIndex(0);
      } else {
        setMobileTranslateIndex(currentIndex + 1);
      }
      
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex, resolvedBanners.length]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  const currentBanner = resolvedBanners[currentIndex];

  const handleTransitionEnd = () => {
    const n = resolvedBanners.length;
    if (mobileTranslateIndex === n + 1) {
      setIsTransitioning(false);
      setMobileTranslateIndex(1);
    } else if (mobileTranslateIndex === 0) {
      setIsTransitioning(false);
      setMobileTranslateIndex(n);
    }
  };

  const renderMobileBanner = (banner: Banner, keySuffix: string | number) => {
    if (!banner) return <div key={`empty-${keySuffix}`} className="w-full flex-shrink-0 px-4" />;
    
    const mobileImgUrl = banner.bannerImage
      ? banner.bannerImage
      : banner.adImages?.[0]?.url
        ? (banner.adImages[0].url.includes("cloudinary.com")
            ? banner.adImages[0].url.replace("/upload/", "/upload/f_auto,q_auto,w_800/")
            : banner.adImages[0].url)
        : null;

    if (!mobileImgUrl) return (
      <div key={`noimg-${keySuffix}`} className="w-full flex-shrink-0 px-4" />
    );

    return (
      <div key={`banner-${keySuffix}`} className="w-full flex-shrink-0 px-4">
        <button
          onClick={async () => {
            if (banner.promotionId) {
              void promotionAPI.trackPromotionClick(banner.promotionId).catch(() => {});
            }
            router.push(banner.link);
          }}
          className="w-full flex flex-col rounded-[16px] shadow-sm active:scale-[0.98] transition-transform duration-200 relative bg-transparent overflow-hidden"
        >
          <img
            src={mobileImgUrl}
            alt={banner.title}
            className="w-full h-[140px] sm:h-[160px] object-cover"
          />
        </button>
      </div>
    );
  };

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
  const isFullImage = currentBanner.heroLayout === "fullImage";
  const hasModernStyling = (!!currentBanner.heroBgColor && isValidHexColor(currentBanner.heroBgColor)) || isFullImage;
  const bgColor = hasModernStyling && !isFullImage ? currentBanner.heroBgColor : undefined;
  
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
    <div className="relative z-40 md:z-0 w-full mb-0 sm:mb-2 pt-2 md:pt-4">
      {/* Mobile Search Bar inside Hero (blends with hero background) */}
      <div className="md:hidden px-4 pb-3 w-full relative z-[100]" ref={searchContainerRef}>
        <div className="flex items-center gap-3 w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
          <Search size={18} className="text-gray-500 dark:text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm || ""}
            onChange={(e) => {
              if (setSearchTerm) setSearchTerm(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && handleSearch) {
                handleSearch(searchTerm);
                setDropdownOpen(false);
              }
            }}
            className="w-full bg-transparent text-[15px] font-medium text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
          />
        </div>
        
        {dropdownOpen && (
          <SearchDropdown
            query={searchTerm || ""}
            isAuthenticated={!!isAuthenticated}
            onSelect={(term) => {
              if (setSearchTerm) setSearchTerm(term);
              if (handleSearch) handleSearch(term);
              setDropdownOpen(false);
            }}
            onClose={() => setDropdownOpen(false)}
          />
        )}
      </div>

      {/* Background bleed layer (fades across the entire initial screen view) */}
      {hasModernStyling && (
        <div 
          className="absolute top-0 left-0 w-full h-[280px] sm:h-[320px] md:h-[850px] pointer-events-none -z-10 transition-colors duration-700" 
          style={{ 
            backgroundColor: bgColor || 'transparent',
            WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)'
          }}
        />
      )}
      <div 
        className={`hidden md:flex relative w-[96%] mx-auto rounded-[24px] overflow-hidden transition-all duration-700 items-center group ${
          !hasModernStyling 
            ? `bg-gradient-to-r ${currentBanner.gradientClass} h-[180px] sm:h-[220px] md:h-[260px]` 
            : layout === "fullImage"
            ? "h-[180px] sm:h-[220px] md:h-[260px]"
            : "h-auto md:h-[260px]"
        }`}
        style={bgColor ? { backgroundColor: bgColor } : {}}
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
        {hasModernStyling && layout !== "fullImage" && (
          <>
            <div className="absolute -left-1/4 -top-1/4 h-[120%] w-[120%] md:h-full md:w-1/2 rounded-full bg-white/20 blur-3xl mix-blend-overlay"></div>
            <div className="absolute -bottom-1/4 -right-1/4 h-[120%] w-[120%] md:h-full md:w-1/2 rounded-full bg-black/20 blur-3xl mix-blend-overlay"></div>
          </>
        )}

        {/* Desktop Content Area: hidden on mobile, shown from md+ */}
        {layout === "fullImage" ? (
          <div 
            className="hidden md:flex absolute top-0 left-0 w-full h-full cursor-pointer items-start justify-center motion-safe:animate-in motion-safe:fade-in duration-700 pointer-events-auto"
            onClick={handleBannerClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleBannerClick()}
            aria-label={`View ${currentBanner.title}`}
            style={{ zIndex: 0 }}
          >
            {(adImages.length > 0 || currentBanner.bannerImage) && (
              <img 
                src={adImages.length > 0 ? (adImages[0].url.includes("cloudinary.com") ? adImages[0].url.replace("/upload/", "/upload/f_auto,q_100/") : adImages[0].url) : currentBanner.bannerImage} 
                alt={currentBanner.title || "Promotion Banner"} 
                className="w-full h-full object-fill pointer-events-none"
              />
            )}
          </div>
        ) : (
          <div className={`hidden md:flex relative z-10 w-full max-w-[1800px] mx-auto h-full flex-row items-center justify-center gap-6 lg:gap-10 px-3 md:px-5 lg:px-6`}>
            
            {/* Left Images Area (Images 2 and 3) — side by side, centered */}
            {hasModernStyling && layout !== "minimal" && adImages.length > 1 && (
              <div className="hidden md:flex relative z-10 flex-1 h-full items-center justify-end gap-4 px-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-8 duration-700">
                {adImages.slice(1, 3).map((img) => {
                  const cdnUrl = img.url.includes("cloudinary.com") 
                    ? img.url.replace("/upload/", "/upload/f_auto,q_auto,w_400/") 
                    : img.url;
                  return (
                    <div
                      key={img.key}
                      className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] md:w-[200px] md:h-[200px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300 shrink-0 rounded-2xl overflow-hidden shadow-xl drop-shadow-xl"
                      onClick={handleBannerClick}
                    >
                      <img
                        src={cdnUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Content Area */}
            <div 
              className={`relative z-20 flex flex-col justify-center h-full shrink-0 max-w-[45%] lg:max-w-[50%] ${layout === "minimal" || (hasModernStyling && adImages.length > 0) ? "items-center text-center" : "items-start"} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 duration-700`}
              style={{ fontFamily: currentBanner.heroFontFamily || "inherit" }}
            >
              <div className={`flex flex-col gap-1 mb-1 sm:mb-2 ${layout === "minimal" || (hasModernStyling && adImages.length > 0) ? "items-center" : "items-start"}`}>
                {/* Row 1: Sponsored Badge */}
                {currentBanner.badge && (
                  <span className={`inline-block  px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full uppercase tracking-widest ${isDarkText ? "bg-black/10 text-slate-800 border-black/10" : "bg-white/20 text-white border-white/20"} backdrop-blur-sm border`}>
                    {currentBanner.badge}
                  </span>
                )}
                {/* Row 2: Promotion Goal Badge (Refined 3D + Word Glow) */}
                {currentBanner.promotionGoal && (
                  <div className="relative group inline-block">
                    <div className="absolute inset-0 bg-red-500/20 blur-md rounded-lg group-hover:bg-red-500/40 transition-all duration-500"></div>
                    <span className="relative inline-flex items-center px-4 py-1 text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.08em] rounded-lg bg-gradient-to-b from-[#ff4747] to-[#cc0000] text-[#ffe600] border-t border-t-white/30 border-b-[3px] border-b-[#800000] shadow-[0_3px_0_#4d0000,0_4px_8px_rgba(0,0,0,0.3)] active:border-b-[1px] active:translate-y-[2px] active:shadow-[0_1px_0_#4d0000,0_2px_4px_rgba(0,0,0,0.3)] group-hover:-translate-y-0.5 transition-all duration-300 cursor-default isolate overflow-hidden">
                      <span className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-full transition-transform duration-[1200ms] ease-in-out pointer-events-none"></span>
                      {currentBanner.promotionGoal.split(' ').map((word, idx) => (
                        <span 
                          key={idx} 
                          className="inline-block animate-pulse drop-shadow-[0_0_5px_rgba(255,230,0,0.8)]"
                          style={{ animationDelay: `${idx * 300}ms`, animationDuration: '2s' }}
                        >
                          {word}&nbsp;
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
              
              <h2 
                className={`text-xl sm:text-2xl lg:text-3xl font-black mb-0.5 tracking-tight drop-shadow-sm ${currentBanner.heroTitleColor ? "" : textColorClass} ${layout === "minimal" ? "leading-tight" : "leading-[1.1]"}`}
                style={currentBanner.heroTitleColor ? { color: currentBanner.heroTitleColor } : {}}
              >
                {currentBanner.title}
              </h2>

              {currentBanner.productPrice !== undefined && (
                <div className={`flex items-center gap-2 mb-1 ${layout === "minimal" || (hasModernStyling && adImages.length > 0) ? "justify-center" : "justify-start"}`}>
                  <span className={`text-lg sm:text-xl font-black tracking-tight drop-shadow-sm ${isDarkText ? "text-slate-900" : "text-white"}`}>
                    <span className="text-xl sm:text-2xl font-bold mr-0.5 opacity-90">₹</span>
                    {
                      currentBanner.productDiscount 
                        ? Math.max(currentBanner.productPrice - (currentBanner.productPrice * currentBanner.productDiscount) / 100, 0).toLocaleString("en-IN")
                        : currentBanner.productPrice.toLocaleString("en-IN")
                    }
                  </span>
                  {currentBanner.productDiscount !== undefined && currentBanner.productDiscount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm line-through font-medium drop-shadow-sm ${isDarkText ? "text-slate-500" : "text-white/70"}`}>
                        ₹{currentBanner.productPrice.toLocaleString("en-IN")}
                      </span>
                      <div className="relative inline-block ml-1 group/tag">
                        <div className="absolute inset-0 bg-red-600/20 blur-md rounded-md group-hover/tag:bg-red-500/40 transition-all duration-500 transform -skew-x-6"></div>
                        <span className="relative flex items-center justify-center bg-gradient-to-b from-[#ff4747] to-[#cc0000] text-white px-2.5 py-0.5 rounded-md text-[12px] font-bold uppercase italic tracking-wider border-t border-t-white/30 border-b-[3px] border-b-[#800000] shadow-[0_3px_0_#4d0000,2px_4px_6px_rgba(0,0,0,0.3)] active:border-b-[1px] active:translate-y-[2px] active:shadow-[0_1px_0_#4d0000,1px_2px_3px_rgba(0,0,0,0.3)] group-hover/tag:-translate-y-0.5 transition-all duration-300 transform -skew-x-6 cursor-default isolate overflow-hidden">
                          <span className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover/tag:translate-x-[50%] transition-transform duration-[1000ms] ease-in-out pointer-events-none"></span>
                          {`${currentBanner.productDiscount}% OFF`.split(' ').map((word, idx) => (
                            <span 
                              key={idx} 
                              className="inline-block animate-pulse drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                              style={{ animationDelay: `${idx * 400}ms`, animationDuration: '2s' }}
                            >
                              {word}&nbsp;
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <p 
                className={`text-[10px] sm:text-xs mb-1.5 sm:mb-2 line-clamp-2 font-medium sm:leading-relaxed drop-shadow-sm ${currentBanner.heroSubtitleColor ? "" : subtextColorClass}`}
                style={currentBanner.heroSubtitleColor ? { color: currentBanner.heroSubtitleColor } : {}}
              >
                {currentBanner.subtitle || "\u00A0"}
              </p>
              
              <button 
                onClick={handleBannerClick}
                className={`w-fit flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 font-bold rounded-full transition-all duration-300 shadow-xl ${!currentBanner.heroButtonBgColor ? buttonClass : ""} hover:-translate-y-0.5 hover:scale-105 active:scale-95 text-[10px] sm:text-xs group/btn`}
                style={{
                  ...(currentBanner.heroButtonBgColor ? { backgroundColor: currentBanner.heroButtonBgColor } : {}),
                  ...(currentBanner.heroButtonTextColor ? { color: currentBanner.heroButtonTextColor } : {}),
                }}
              >
                {currentBanner.buttonText}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>

            {/* Right Image Area (Image 1) — centered */}
            {hasModernStyling && layout !== "minimal" && (
              <div className="hidden md:flex relative z-10 flex-1 h-full items-center justify-start px-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-8 duration-700">
                {adImages.length > 0 ? (
                  <div
                    className="w-auto flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300 shrink-0"
                    onClick={handleBannerClick}
                  >
                    <img 
                      src={adImages[0].url.includes("cloudinary.com") ? adImages[0].url.replace("/upload/", "/upload/f_auto,q_auto,w_400/") : adImages[0].url} 
                      alt="" 
                      className="w-full h-auto object-contain drop-shadow-xl rounded-lg"
                      style={{ maxHeight: "200px" }}
                    />
                  </div>
                ) : currentBanner.bannerImage ? (
                  <div className="w-auto flex items-center justify-center pointer-events-none shrink-0">
                    <img src={currentBanner.bannerImage} className="w-full h-auto object-contain drop-shadow-2xl rounded-2xl" style={{ maxHeight: "200px" }} alt="" />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Navigation Arrows */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          className={`hidden sm:flex absolute left-2 md:left-2 lg:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-md transition-all duration-300 opacity-60 group-hover:opacity-100 hover:scale-110 z-30 shadow-md border ${
            isDarkText 
              ? "bg-slate-950/70 text-white hover:bg-slate-950/90 border-slate-800/40 shadow-black/10" 
              : "bg-white/70 text-slate-900 hover:bg-white border-slate-200/40 shadow-black/10"
          }`}
          aria-label="Previous banner"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          className={`hidden sm:flex absolute right-2 md:right-2 lg:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-md transition-all duration-300 opacity-60 group-hover:opacity-100 hover:scale-110 z-30 shadow-md border ${
            isDarkText 
              ? "bg-slate-950/70 text-white hover:bg-slate-950/90 border-slate-800/40 shadow-black/10" 
              : "bg-white/70 text-slate-900 hover:bg-white border-slate-200/40 shadow-black/10"
          }`}
          aria-label="Next banner"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots: hidden on mobile for modern banners, always visible for legacy */}
      <div className={`absolute -bottom-5 sm:-bottom-7 left-1/2 -translate-x-1/2 flex gap-3 z-30 ${hasModernStyling ? "hidden md:flex" : "flex"}`}>
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

      {/* ── Mobile-Only Sponsored Card ── */}
      {hasModernStyling && (
        <div 
          className="md:hidden w-full relative overflow-hidden pt-0 pb-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className={`flex ${isTransitioning ? "transition-transform duration-700 ease-in-out" : ""}`}
            style={{ transform: `translateX(-${mobileTranslateIndex * 100}%)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {resolvedBanners.length > 0 && renderMobileBanner(resolvedBanners[resolvedBanners.length - 1], "clone-last")}
            
            {resolvedBanners.map((banner, idx) => renderMobileBanner(banner, banner.id || idx))}
            
            {resolvedBanners.length > 0 && renderMobileBanner(resolvedBanners[0], "clone-first")}
          </div>

          {/* Mobile Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {resolvedBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                  idx === currentIndex 
                    ? `w-4 ${isDarkText ? "bg-slate-800" : "bg-cyan-500"}` 
                    : `w-1.5 ${isDarkText ? "bg-slate-800/30 hover:bg-slate-800/50" : "bg-white/40 hover:bg-white/60"}`
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}