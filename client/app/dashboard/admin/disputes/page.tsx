"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import { Search, Loader2, FileWarning, Clock, CheckCircle2, Banknote, Filter, MoreVertical, BarChart3 } from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

import DisputeCard, { Dispute } from "./components/DisputeCard";
import ApproveRefundModal from "./components/ApproveRefundModal";
import RejectDisputeModal from "./components/RejectDisputeModal";
import DisputeDetailModal from "./components/DisputeDetailModal";

const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'rejected', label: 'Rejected' }
];

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState({ open: 0, pending: 0, resolvedToday: 0, totalValue: 0 });
  
  const [activeTab, setActiveTab] = useState<'open' | 'under_review' | 'resolved' | 'rejected'>('open');
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'priority'>('newest');
  
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  
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
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle filter changes (reset pagination and clear list)
  const handleFilterChange = (updater: () => void) => {
    updater();
    setPage(1);
    setDisputes([]);
  };

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getAllDisputes({
        page,
        limit: 20,
        search: debouncedSearch,
        status: activeTab,
        sort,
      });

      if (page === 1) {
        setDisputes(data.disputes || []);
      } else {
        setDisputes(prev => [...prev, ...(data.disputes || [])]);
      }
      
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load disputes");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, activeTab, sort]);

  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) {
      router.push("/login");
      return;
    }
    if (parsed.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchDisputes();
  }, [fetchDisputes, router]);

  const handleApproveRefund = async () => {
    if (!selectedDispute) return;
    setActionLoading(true);
    try {
      const { dispute: updated } = await adminAPI.approveRefund(selectedDispute.id);
      
      toast.success("Refund approved successfully");
      
      // Update inline
      setDisputes(prev => prev.map(d => d.id === updated._id ? { ...d, status: updated.status } : d));
      
      // Update stats optimistically
      setStats(prev => ({
        ...prev,
        open: prev.open - 1,
        pending: prev.pending - 1,
        resolvedToday: prev.resolvedToday + 1,
        totalValue: prev.totalValue + (updated.amount || 0)
      }));
      
      setApproveModalOpen(false);
      setDetailModalOpen(false);
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("This dispute was already resolved by another admin.");
        fetchDisputes();
      } else {
        toast.error(error.response?.data?.message || "Refund failed — payment gateway error. Dispute remains open.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDispute = async (reasons: string[], message: string) => {
    if (!selectedDispute) return;
    setActionLoading(true);
    
    // Combine reasons and message
    const combinedReason = `Reasons: ${reasons.join(", ")} | Note: ${message}`;
    
    try {
      const { dispute: updated } = await adminAPI.rejectDispute(selectedDispute.id, combinedReason);
      
      toast.success("Dispute rejected");
      
      // Update inline
      setDisputes(prev => prev.map(d => d.id === updated._id ? { ...d, status: updated.status } : d));
      
      // Update stats optimistically
      setStats(prev => ({
        ...prev,
        open: prev.open - 1,
        pending: prev.pending - 1
      }));
      
      setRejectModalOpen(false);
      setDetailModalOpen(false);
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("This dispute was already actioned by another admin.");
        fetchDisputes();
      } else {
        toast.error(error.response?.data?.message || "Failed to reject dispute");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openApproveModal = (id: string) => {
    const d = disputes.find(x => x.id === id);
    if (d) {
      setSelectedDispute(d);
      setApproveModalOpen(true);
    }
  };

  const openRejectModal = (id: string) => {
    const d = disputes.find(x => x.id === id);
    if (d) {
      setSelectedDispute(d);
      setRejectModalOpen(true);
    }
  };

  const openDetailModal = (id: string) => {
    const d = disputes.find(x => x.id === id);
    if (d) {
      setSelectedDispute(d);
      setDetailModalOpen(true);
    }
  };

  const fmt = (n: number) => `₹${Number(n).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <div className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#05050a]/80 backdrop-blur-md">
        <PageHeader
          backHref="/dashboard/admin"
          backLabel="Back"
          title="Open Disputes"
          subtitle="Resolve customer disputes"
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
                      router.push('/dashboard/admin/disputes/analytics');
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* TOOLBAR */}
        <div className="flex gap-2 w-full relative mb-2" ref={dropdownRef}>
          {/* Search Input */}
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by product, buyer, seller..." 
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
            <div className="absolute right-0 top-[110%] w-64 bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 p-5 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              
              {/* SORT */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-3">Sort by</p>
                <div className="flex flex-col gap-2">
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
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all text-left ${
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
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                onApprove={openApproveModal}
                onReject={openRejectModal}
                onViewDetails={openDetailModal}
              />
            ))}
          </div>
        )}
      </div>

      <ApproveRefundModal
        dispute={selectedDispute}
        isOpen={approveModalOpen}
        isLoading={actionLoading}
        onConfirm={handleApproveRefund}
        onClose={() => setApproveModalOpen(false)}
      />

      <RejectDisputeModal
        dispute={selectedDispute}
        isOpen={rejectModalOpen}
        isLoading={actionLoading}
        onConfirm={handleRejectDispute}
        onClose={() => setRejectModalOpen(false)}
      />

      <DisputeDetailModal
        dispute={selectedDispute}
        isOpen={detailModalOpen}
        onApprove={() => { setDetailModalOpen(false); openApproveModal(selectedDispute?.id!); }}
        onReject={() => { setDetailModalOpen(false); openRejectModal(selectedDispute?.id!); }}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  );
}
