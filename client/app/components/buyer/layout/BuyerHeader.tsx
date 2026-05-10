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
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-slate-100/90 via-[#f8f9fa]/95 to-slate-100/90 dark:from-[#05050a] dark:via-[#0d1222] dark:to-[#0a0514] border-b border-gray-200/50 dark:border-white/10 shadow-sm backdrop-blur-2xl transition-all duration-300">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Desktop & Tablet Header */}
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            
            {/* Logo area */}
            <div className="flex items-center shrink-0 gap-3 md:gap-4">
              {onBackClick && (
                <button 
                  onClick={onBackClick}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white transition mr-2"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-8 w-8" strokeWidth={3} />
                </button>
              )}
              <button onClick={() => router.push('/marketplace')} className="flex items-center gap-2 group">
                <div className="w-28 h-28 -ml-5 relative flex-shrink-0">
                  <Image
                    src="/bitforge_logo1.png"
                    alt="Bitforge logo"
                    fill
                    className="object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                    priority
                  />
                </div>
                <span className="text-xl -ml-8 font-bold text-gray-900 dark:text-white hidden sm:block tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Bitforge
                </span>
              </button>
            </div>

            {/* Middle: Search Bar (Hidden on small mobile, visible on md+) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-auto items-center relative">
              <div className="flex w-full relative group shadow-sm rounded-full transition-shadow hover:shadow-md hover:shadow-cyan-500/5 dark:hover:shadow-cyan-500/10">
                <div className="hidden lg:flex items-center relative">
                  <select 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') router.push('/marketplace');
                      else router.push(`/marketplace?category=${encodeURIComponent(val)}`);
                    }}
                    className="h-full px-5 py-2.5 bg-gray-50 dark:bg-[#12192b] border border-gray-200 dark:border-white/10 border-r-0 rounded-l-full text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#172036] transition-colors cursor-pointer appearance-none outline-none focus:ring-0 pr-9"
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
                  placeholder="Search courses, ebooks, templates, software..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-5 py-2.5 bg-white dark:bg-[#0d1320] border-y border-r lg:border-l-0 border-l border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-[#0a0f19] lg:rounded-none md:rounded-l-full z-10 transition-colors"
                />
                <button
                  onClick={handleSearch}
                  className="px-7 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-900 dark:text-white rounded-r-full font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center justify-center shrink-0 border border-transparent"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {/* Theme Toggle Removed from Desktop Navbar per request */}

              {/* Wishlist */}
              <button 
                onClick={() => requireAuth("view wishlist", () => router.push("/wishlist"))}
                className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-pink-500 text-slate-900 dark:text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#0F172A]">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button 
                onClick={() => requireAuth("view cart", () => router.push("/cart"))}
                className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-cyan-500 text-slate-900 dark:text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#0F172A]">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <button 
                  onClick={() => router.push("/notifications")}
                  className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors hidden sm:flex"
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-slate-900 dark:text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#0F172A]">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Profile / Menu toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors lg:hidden"
              >
                <Menu size={24} />
              </button>

              <button 
                onClick={() => {
                  if (isAuthenticated) {
                    router.push(`/dashboard/${user?.role || 'buyer'}`);
                  } else {
                    requireAuth("access profile", () => {});
                  }
                }}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:ring-2 hover:ring-cyan-500 transition-all overflow-hidden"
              >
                <User size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (Bottom row on small screens) */}
          <div className="md:hidden pb-3">
             <div className="flex w-full relative shadow-sm rounded-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-5 py-2.5 bg-white dark:bg-[#0d1320] border border-gray-200 dark:border-white/10 border-r-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-[#0a0f19] rounded-l-full transition-colors text-sm"
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-900 dark:text-white rounded-r-full font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center justify-center shrink-0 border border-transparent"
                >
                  <Search size={16} />
                </button>
              </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-[#0F172A] border-b border-gray-200 dark:border-white/5 shadow-lg py-4 px-4 flex flex-col gap-2">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (isAuthenticated) {
                  router.push(`/dashboard/${user?.role || 'buyer'}`);
                } else {
                  requireAuth("access profile", () => {});
                }
              }}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl w-full text-left font-medium"
            >
              <User size={20} /> Profile & Settings
            </button>

            {isAuthenticated && (
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/notifications");
                }}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl w-full text-left font-medium"
              >
                <div className="relative">
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-slate-900 dark:text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </div>
                Notifications
              </button>
            )}

            <div className="h-px bg-gray-200 dark:bg-white/10 my-1" />
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl w-full text-left font-medium"
            >
              {mounted && theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />} 
              {mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        )}
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
