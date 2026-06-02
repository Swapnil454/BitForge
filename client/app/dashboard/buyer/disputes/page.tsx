"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import { Search, Loader2, Filter, MoreVertical, BarChart3, RefreshCw } from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

import BuyerDisputeCard, { Dispute } from "./components/BuyerDisputeCard";

const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'rejected', label: 'Rejected' }
];

export default function BuyerDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState({ open: 0, pending: 0, resolvedToday: 0, totalValue: 0 });
  
  const [activeTab, setActiveTab] = useState<'open' | 'under_review' | 'resolved' | 'rejected'>('open');
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'priority'>('newest');
  
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const router = useRouter();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Touch states for swipe gesture
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  
  const headerDropdownRef = useRef<HTMLDivElement>(null);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target as Node)) {
        setShowHeaderDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle filter changes (reset pagination and clear list)
  const handleFilterChange = (updater: () => void) => {
    updater();
    setPage(1);
    setDisputes([]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = TABS.findIndex(t => t.id === activeTab);
      
      if (isLeftSwipe && currentIndex < TABS.length - 1) {
        handleFilterChange(() => setActiveTab(TABS[currentIndex + 1].id as any));
      } else if (isRightSwipe && currentIndex > 0) {
        handleFilterChange(() => setActiveTab(TABS[currentIndex - 1].id as any));
      }
    }
    
    setTouchStartX(0);
    setTouchEndX(0);
  };

  const observer = useRef<IntersectionObserver | null>(null);
  const lastDisputeRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, { rootMargin: '200px' });
    if (node) observer.current.observe(node);
  }, [isLoading, loadingMore, hasMore]);

  const fetchDisputes = useCallback(async () => {
    const cacheKey = `buyer_disputes_page1_${activeTab}_${sort}_${debouncedSearch}`;
    if (page === 1) {
      if (!sessionStorage.getItem(cacheKey)) {
        setIsLoading(true);
      }
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await buyerAPI.getMyDisputes({
        page,
        limit: 10,
        search: debouncedSearch,
        status: activeTab,
        sort,
      });

      if (page === 1) {
        setDisputes(data.disputes || []);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            disputes: data.disputes || [],
            hasMore: page < (data.pagination?.totalPages || 1),
            stats: data.stats
          }));
        } catch (e) {}
      } else {
        setDisputes(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = (data.disputes || []).filter((p: Dispute) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
      }
      
      setHasMore(page < (data.pagination?.totalPages || 1)); // Fixed from data.pagination?.pages to totalPages since that's what the controller outputs
      
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load disputes");
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [page, debouncedSearch, activeTab, sort]);

  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) {
      router.push("/login");
      return;
    }
    if (parsed.role !== "buyer") {
      router.push("/dashboard");
      return;
    }

    if (page === 1) {
      const cacheKey = `buyer_disputes_page1_${activeTab}_${sort}_${debouncedSearch}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setDisputes(parsedCache.disputes);
          setHasMore(parsedCache.hasMore);
          if (parsedCache.stats) setStats(parsedCache.stats);
          setIsLoading(false);
        }
      } catch (e) {}
    }

    fetchDisputes();
  }, [fetchDisputes, router, page, activeTab, sort, debouncedSearch]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <div className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#05050a]/80 backdrop-blur-md">
        <PageHeader
          backHref="/dashboard/buyer"
          backLabel="Back"
          title="My Disputes"
          subtitle="Track and manage product disputes"
          rightSlot={
            <div className="relative" ref={headerDropdownRef}>
              <button
                onClick={() => setShowHeaderDropdown(!showHeaderDropdown)}
                className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <MoreVertical size={20} />
              </button>
              {showHeaderDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      setShowHeaderDropdown(false);
                      router.push('/dashboard/buyer/disputes/analytics');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <BarChart3 size={16} />
                    Analytics
                  </button>
                </div>
              )}
            </div>
          }
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-6 space-y-3">
        
        {/* TOOLBAR */}
        <div className="flex gap-2 w-full relative mb-2" ref={dropdownRef}>
          {/* Search Input */}
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by product, seller, or reason..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              suppressHydrationWarning
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Filter Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-2.5 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm transition-colors flex items-center justify-center shrink-0 ${
              showFilters ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'text-slate-600 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Custom Filter Popover */}
          {showFilters && (
            <div className="absolute right-0 top-[110%] w-56 bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 p-3 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              
              {/* SORT */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1.5">Sort by</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'amount_high', label: 'Amount: High to Low' },
                    { value: 'amount_low', label: 'Amount: Low to High' }
                  ].map(srt => (
                    <button
                      key={srt.value}
                      onClick={() => {
                        handleFilterChange(() => setSort(srt.value as any));
                        setShowFilters(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                        sort === srt.value
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'
                      }`}
                    >
                      {srt.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex gap-6 overflow-x-auto border-b border-slate-200 dark:border-white/10 scrollbar-hide mb-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(() => setActiveTab(tab.id as any))}
              className={`pb-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 -mb-[1px] ${
                activeTab === tab.id 
                  ? "border-emerald-500 text-emerald-500" 
                  : "border-transparent text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DISPUTE CARDS */}
        <div 
          className="touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isLoading && page === 1 ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/5 rounded-2xl p-20 text-center shadow-sm">
              <p className="text-slate-500 dark:text-white/50 text-lg">No disputes found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <BuyerDisputeCard
                  key={dispute.id}
                  dispute={dispute}
                />
              ))}
              
              {hasMore && (
                <div ref={lastDisputeRef} className="pt-4 pb-8 flex justify-center">
                  <div className="flex items-center gap-3 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Loading more disputes...</span>
                  </div>
                </div>
              )}
              {!hasMore && disputes.length > 0 && (
                <div className="pt-4 pb-8 text-center text-slate-500 text-sm">
                  End of list
                </div>
              )}
            </div>
          )}
      </div>
      </div>
    </div>
  );
}
