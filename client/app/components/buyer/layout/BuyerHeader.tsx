"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Heart, ShoppingCart, User, Library, Menu, X, Moon, Sun, ChevronDown, ChevronLeft, ArrowLeft, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/useAuth";
import { getStoredUser } from "@/lib/cookies";
import { notificationAPI } from "@/lib/api";
import AuthModal from "@/app/components/AuthModal";

interface BuyerHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
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
  onBackClick
}: BuyerHeaderProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const user = getStoredUser<{ role?: string }>();
  const {
    isAuthenticated,
    requireAuth,
    showAuthModal,
    pendingAction,
    closeAuthModal,
    goToLogin,
    goToRegister
  } = useAuth();

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationAPI.getUnreadCount()
        .then(data => setUnreadNotificationsCount(data.count || 0))
        .catch(err => console.error("Failed to fetch notification count", err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#05050a]/90 border-b border-gray-200/50 dark:border-white/5 shadow-sm backdrop-blur-xl transition-all duration-300">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 relative">
          
          {/* Desktop & Tablet Header */}
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Logo area */}
            <div className="flex items-center shrink-0 gap-2 sm:gap-4">
              {onBackClick && (
                <button 
                  onClick={onBackClick}
                  className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition mr-1 sm:mr-2"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.5} />
                </button>
              )}
              <button onClick={() => router.push('/marketplace')} className="flex items-center gap-2 group">
                <div className="w-26 h-26 -ml-8 sm:w-30 sm:h-30 relative flex-shrink-0">
                  <Image
                    src="/bitforge_logo1.png"
                    alt="Bitforge logo"
                    fill
                    className="object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                    priority
                  />
                </div>
                <span className="text-lg sm:text-xl -ml-8 font-black text-slate-900 dark:text-white hidden sm:block tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  BitForge
                </span>
              </button>
            </div>

            {/* Middle: Search Bar (Hidden on small mobile, visible on md+) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-auto items-center relative">
              <div className="flex w-full relative group shadow-sm rounded-2xl transition-shadow hover:shadow-md hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 bg-gray-50 dark:bg-[#0d1320] border border-gray-200 dark:border-white/10 focus-within:border-indigo-500/50 dark:focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <div className="hidden lg:flex items-center relative border-r border-gray-200 dark:border-white/10">
                  <select 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') router.push('/marketplace');
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-5 py-2.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none z-10 transition-colors rounded-2xl md:rounded-l-2xl lg:rounded-none font-medium"
                />
                <button
                  onClick={handleSearch}
                  className="px-7 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-r-2xl font-bold transition-all flex items-center justify-center shrink-0 border border-transparent shadow-sm"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              
              {/* Mobile Search Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)} // Will use a mobile search overlay instead
                className="md:hidden p-2.5 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                onClickCapture={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                  const searchOverlay = document.getElementById('mobile-search-overlay');
                  if (searchOverlay) searchOverlay.classList.remove('hidden');
                }}
              >
                <Search size={22} />
              </button>

              {/* Wishlist */}
              <button 
                onClick={() => requireAuth("view wishlist", () => router.push("/wishlist"))}
                className="relative p-2.5 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#05050a]">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button 
                onClick={() => requireAuth("view cart", () => router.push("/cart"))}
                className="relative p-2.5 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#05050a]">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Notifications */}
              {mounted && isAuthenticated && (
                <button 
                  onClick={() => router.push("/notifications")}
                  className="relative p-2.5 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex"
                >
                  <Bell size={22} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#05050a]">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Profile / Menu toggle */}
              <div className="relative">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2.5 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
                >
                  <Menu size={24} />
                </button>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                  <div className="lg:hidden absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-transparent dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-indigo-500/20 shadow-xl dark:shadow-2xl dark:shadow-indigo-500/20 flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-indigo-300 uppercase tracking-wider">Menu</p>
                    </div>

                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (isAuthenticated) {
                          router.push(`/dashboard/${user?.role || 'buyer'}`);
                        } else {
                          requireAuth("access profile", () => {});
                        }
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                    >
                      <User size={16} /> Profile & Settings
                    </button>

                    {isAuthenticated && (
                      <button 
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          router.push("/notifications");
                        }}
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
                    )}

                    <div className="h-px bg-slate-100 dark:bg-white/10 my-1 mx-2" />
                    
                    <button 
                      onClick={toggleTheme}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-white rounded-xl w-full text-left font-medium transition-all"
                    >
                      {mounted && theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} 
                      {mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  if (isAuthenticated) {
                    router.push(`/dashboard/${user?.role || 'buyer'}`);
                  } else {
                    requireAuth("access profile", () => {});
                  }
                }}
                className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:ring-2 hover:ring-indigo-500/50 transition-all overflow-hidden"
              >
                <User size={18} />
              </button>
            </div>
          </div>
          
          {/* Mobile Search Overlay */}
          <div id="mobile-search-overlay" className="hidden md:hidden absolute inset-0 z-50 bg-white dark:bg-[#05050a] flex items-center px-4 gap-3 animate-in fade-in duration-200 border-b border-gray-200 dark:border-white/5">
            <button 
              onClick={() => {
                const searchOverlay = document.getElementById('mobile-search-overlay');
                if (searchOverlay) searchOverlay.classList.add('hidden');
              }}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-full bg-gray-50 dark:bg-white/5"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex w-full relative shadow-sm rounded-xl bg-gray-50 dark:bg-[#0d1320] border border-gray-200 dark:border-white/10 focus-within:border-indigo-500/50 dark:focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                     handleSearch();
                     const searchOverlay = document.getElementById('mobile-search-overlay');
                     if (searchOverlay) searchOverlay.classList.add('hidden');
                  }
                }}
                className="w-full px-4 py-2.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none rounded-l-xl transition-colors text-sm font-medium"
                id="mobile-search-input"
              />
              <button
                onClick={() => {
                  handleSearch();
                  const searchOverlay = document.getElementById('mobile-search-overlay');
                  if (searchOverlay) searchOverlay.classList.add('hidden');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-r-xl font-bold transition-all flex items-center justify-center shrink-0 border border-transparent shadow-sm"
              >
                <Search size={16} />
              </button>
            </div>
          </div>

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
    </>
  );
}
