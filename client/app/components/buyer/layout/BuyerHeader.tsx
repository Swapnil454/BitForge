"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search, Heart, ShoppingCart, User, Menu, X,
  Moon, Sun, ChevronDown, ChevronLeft, Bell,
  Settings, CircleHelp, Flag, FileText, LogOut, Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/useAuth";
import { getStoredUser } from "@/lib/cookies";
import { persistThemePreference, type ThemePreference } from "@/lib/themePreference";
import { notificationAPI } from "@/lib/api";
import AuthModal from "@/app/components/AuthModal";
import LogoutModal from "@/app/dashboard/components/LogoutModal";
import SearchDropdown from "@/app/components/buyer/search/SearchDropdown";
import MobileSearchPage from "@/app/components/buyer/search/MobileSearchPage";

interface BuyerHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: (term?: string) => void;
  cartCount: number;
  wishlistCount: number;
  isCollectionPage?: boolean;
  onBackClick?: () => void;
}

export default function BuyerHeader({
  searchTerm,
  setSearchTerm,
  handleSearch,
  cartCount,
  wishlistCount,
  isCollectionPage = false,
  onBackClick,
}: BuyerHeaderProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ── Search dropdown state ──────────────────────────────────────────────────
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen]       = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const menuRef          = useRef<HTMLDivElement>(null);

  const user = getStoredUser<{ role?: string }>();
  const {
    isAuthenticated,
    requireAuth,
    showAuthModal,
    pendingAction,
    closeAuthModal,
    goToLogin,
    goToRegister,
  } = useAuth();

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // ── Hero banner color sync for seamless header blending ─────────
  const [heroBgColor, setHeroBgColor] = useState<string | undefined>();
  const [heroIsDarkText, setHeroIsDarkText] = useState<boolean>(true);

  useEffect(() => {
    const handleHeroBgChange = (e: any) => {
      setHeroBgColor(e.detail.bgColor);
      setHeroIsDarkText(e.detail.isDarkText);
    };
    window.addEventListener('hero-bg-change', handleHeroBgChange);
    return () => window.removeEventListener('hero-bg-change', handleHeroBgChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      notificationAPI
        .getUnreadCount()
        .then((data) => setUnreadNotificationsCount(data.count || 0))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => { setMounted(true); }, []);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(e.target as Node)
      ) {
        setDesktopDropdownOpen(false);
      }
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Listen for custom event from MobileBottomNav to open search ─────────
  useEffect(() => {
    const handleOpenSearch = () => setMobileSearchOpen(true);
    window.addEventListener('open-mobile-search', handleOpenSearch);
    return () => window.removeEventListener('open-mobile-search', handleOpenSearch);
  }, []);

  // ── Handle search from both desktop and mobile ─────────────────────────────
  const commitSearch = useCallback(
    (term?: string) => {
      const q = (term ?? searchTerm).trim();
      if (term) setSearchTerm(term);
      setDesktopDropdownOpen(false);
      handleSearch(q || undefined);
    },
    [searchTerm, setSearchTerm, handleSearch]
  );

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitSearch();
  };

  const applyTheme = (nextTheme: ThemePreference) => {
    setTheme(nextTheme);
    persistThemePreference(nextTheme);
  };

  const toggleTheme = () => applyTheme(theme === "dark" ? "light" : "dark");

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#05050a]/90 border-b border-gray-200/50 dark:border-white/5 shadow-sm backdrop-blur-xl transition-all duration-300">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 relative">

          {/* Desktop & Tablet Header */}
          <div className="flex items-center justify-between h-[52px] md:h-16 gap-4">

            {/* Logo area */}
            <div className="flex items-center shrink-0 gap-2 sm:gap-4">
              {onBackClick && (
                <button
                  onClick={onBackClick}
                  className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 -ml-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition mr-1 sm:mr-2"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.5} />
                </button>
              )}
              <button onClick={() => router.push("/marketplace")} className="flex items-center gap-2 group">
                <div className="w-26 h-26 -ml-8 sm:w-30 sm:h-30 relative flex-shrink-0">
                  <Image
                    src="/bitforge_logo1.png"
                    alt="Bitforge logo"
                    fill
                    className="object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                    priority
                  />
                </div>
                <span className="text-lg sm:text-xl -ml-8 font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  BitForge
                </span>
              </button>
            </div>

            {/* Middle: Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-auto items-center relative" ref={desktopSearchRef}>
              <div className="flex w-full relative group shadow-sm rounded-2xl transition-all duration-200 hover:shadow-md hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10 bg-gray-50 dark:bg-[#0d1320] border border-slate-300 dark:border-white/20 focus-within:border-violet-500 dark:focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/20">
                <div className="hidden lg:flex items-center relative border-r border-gray-200 dark:border-white/10">
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "all") router.push("/marketplace");
                      else router.push(`/marketplace?category=${encodeURIComponent(val)}`);
                    }}
                    className="h-full px-5 py-2.5 bg-transparent text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-pointer appearance-none outline-none focus:ring-0 pr-9 rounded-l-2xl"
                  >
                    <option value="all">All</option>
                    <option value="Course">Courses</option>
                    <option value="eBook">eBooks</option>
                    <option value="Template">Templates</option>
                    <option value="Software">Software</option>
                    <option value="Design Asset">Design Assets</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-slate-500">
                    <ChevronDown size={14} />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setDesktopDropdownOpen(true);
                  }}
                  onFocus={() => setDesktopDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitSearch();
                    if (e.key === "Escape") setDesktopDropdownOpen(false);
                  }}
                  className="w-full px-5 py-2.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none z-10 transition-colors rounded-2xl md:rounded-l-2xl lg:rounded-none font-medium"
                />
                <button
                  onClick={() => commitSearch()}
                  className="px-7 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-r-2xl font-bold transition-all flex items-center justify-center shrink-0 border border-transparent shadow-sm"
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Desktop dropdown */}
              {desktopDropdownOpen && (
                <SearchDropdown
                  query={searchTerm}
                  isAuthenticated={isAuthenticated}
                  onSelect={commitSearch}
                  onClose={() => setDesktopDropdownOpen(false)}
                />
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">



              {isAuthenticated ? (
                <>
                  {/* Wishlist */}
                  <button
                    onClick={() => router.push("/wishlist")}
                    className="relative p-2.5 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Heart size={22} />
                    {wishlistCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#05050a]">
                        {wishlistCount > 9 ? "9+" : wishlistCount}
                      </span>
                    )}
                  </button>

                  {/* Cart */}
                  <button
                    onClick={() => router.push("/cart")}
                    className="relative p-2.5 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ShoppingCart size={22} />
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#05050a]">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications */}
                  {mounted && (
                    <button
                      onClick={() => router.push("/notifications")}
                      className="relative p-2.5 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex"
                    >
                      <Bell size={22} />
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#05050a]">
                          {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                        </span>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2 mr-1">
                  <button
                    onClick={goToLogin}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={goToRegister}
                    className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition-colors"
                  >
                    Sign up
                  </button>
                </div>
              )}

              {/* Hamburger menu — all screen sizes */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2.5 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Menu size={22} />
                </button>

                {/* Dropdown — all screen sizes */}
                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-indigo-500/20 shadow-xl dark:shadow-2xl dark:shadow-indigo-500/20 flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right z-50">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-indigo-300 uppercase tracking-wider">Menu</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (isAuthenticated) {
                          router.push(`/dashboard/${user?.role || "buyer"}`);
                        } else {
                          requireAuth("access profile", () => {});
                        }
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                    >
                      <User size={16} /> {isAuthenticated ? "Dashboard" : "Profile & Settings"}
                    </button>

                    {isAuthenticated && (
                      <>
                        <button
                          onClick={() => { setIsMobileMenuOpen(false); router.push("/notifications"); }}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                        >
                          <div className="relative">
                            <Bell size={16} />
                            {unreadNotificationsCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                            )}
                          </div>
                          Notifications
                          {unreadNotificationsCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                              {unreadNotificationsCount}
                            </span>
                          )}
                        </button>

                        <div className="h-px bg-slate-100 dark:bg-white/10 my-1 mx-2" />

                        <button
                          onClick={() => { setIsMobileMenuOpen(false); router.push("/wishlist"); }}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                        >
                          <Heart size={16} /> Wishlist
                          {wishlistCount > 0 && (
                            <span className="ml-auto bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                              {wishlistCount}
                            </span>
                          )}
                        </button>
                        
                        <button
                          onClick={() => { setIsMobileMenuOpen(false); router.push("/dashboard/settings"); }}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                        >
                          <Settings size={16} /> Settings
                        </button>
                        
                        <button
                          onClick={() => { setIsMobileMenuOpen(false); router.push("/dashboard/support"); }}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                        >
                          <CircleHelp size={16} /> Help Center
                        </button>
                        
                        <button
                          onClick={() => { setIsMobileMenuOpen(false); router.push("/report"); }}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                        >
                          <Flag size={16} /> Submit Report
                        </button>
                        
                        <button
                          onClick={() => { setIsMobileMenuOpen(false); router.push("/dashboard/buyer/reports"); }}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                        >
                          <FileText size={16} /> My Reports
                        </button>
                      </>
                    )}

                    <div className="h-px bg-slate-100 dark:bg-white/10 my-1 mx-2" />

                    {mounted && (() => {
                      let nextTheme: ThemePreference;
                      let label: string;
                      let icon: React.ReactNode;

                      if (theme === "light") {
                        nextTheme = "dark";
                        label = "Dark Mode";
                        icon = <Moon size={16} />;
                      } else if (theme === "dark") {
                        nextTheme = "system";
                        label = "System Theme";
                        icon = <Monitor size={16} />;
                      } else {
                        nextTheme = resolvedTheme === "dark" ? "light" : "dark";
                        label = resolvedTheme === "dark" ? "Light Mode" : "Dark Mode";
                        icon = resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />;
                      }

                      return (
                        <button
                          onClick={() => {
                            applyTheme(nextTheme);
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                        >
                          {icon}
                          {label}
                        </button>
                      );
                    })()}
                    
                    {isAuthenticated && (
                      <>
                        <div className="h-px bg-slate-100 dark:bg-white/10 my-1 mx-2" />
                        <button
                          onClick={() => {
                            setIsLogoutModalOpen(true);
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl w-full text-left font-medium transition-all"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Full-Screen Search — portalled to body to escape sticky stacking context */}
          {mobileSearchOpen && mounted && createPortal(
            <MobileSearchPage
              isAuthenticated={isAuthenticated}
              onSearch={(term) => {
                setSearchTerm(term);
                handleSearch(term);
                setMobileSearchOpen(false);
              }}
              onClose={() => setMobileSearchOpen(false)}
            />,
            document.body
          )}

        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        onLogin={goToLogin}
        onRegister={goToRegister}
        action={pendingAction}
      />

      {/* Logout Modal */}
      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={() => {
          document.cookie = 'token=; Max-Age=0; path=/;';
          document.cookie = 'user=; Max-Age=0; path=/;';
          window.location.href = '/login';
        }}
      />
    </>
  );
}
