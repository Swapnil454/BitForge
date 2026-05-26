"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import {
  Search, RefreshCw, CheckCircle2, XCircle, ChevronDown, Filter,
  ArrowUpRight, UploadCloud, Image as ImageIcon, Check, X, CreditCard, ChevronLeft, Calendar,
  MoreVertical, BarChart3
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/* ─── Types ─── */
interface Payout {
  id: string;
  payoutNumber: string;
  status: 'pending' | 'paid' | 'rejected';
  amount: number;
  requestedAt: string;
  processedAt?: string;
  seller: {
    id: string;
    name: string;
    email: string;
    totalProducts: number;
    joinedAt: string;
  };
  bankDetails: {
    holderName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  utrNumber?: string;
  paymentMode?: 'NEFT' | 'RTGS' | 'IMPS' | 'UPI';
  paymentDate?: string;
  proofImageUrl?: string;
  adminNote?: string;
  rejectionReasons?: string[];
  rejectionMessage?: string;
}

interface Stats {
  pendingPayouts: number;
  pendingValue: number;
  paidThisMonth: number;
  rejectedThisMonth: number;
}

type Tab = "pending" | "history";

const REJECTION_REASONS = [
  "Incorrect bank details",
  "Account not verified",
  "Suspicious activity",
  "Insufficient platform balance",
  "Duplicate request",
  "Other"
];

/* ─── Main Page ─── */
export default function AdminPayoutsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("pending");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  /* Filters & Sort */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  /* Modals */
  const [payModal, setPayModal] = useState<Payout | null>(null);
  const [rejectModal, setRejectModal] = useState<Payout | null>(null);

  const headerDropdownRef = useRef<HTMLDivElement>(null);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target as Node)) {
        setShowHeaderDropdown(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const u = getStoredUser<{ role?: string }>();
    if (!u) return router.push("/login");
    if (u.role !== "admin") return router.push("/dashboard");
    setIsReady(true);
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const statusParam = tab === "pending"
        ? "pending"
        : statusFilter === "all"
          ? "history"
          : statusFilter;
      const searchParam = search.trim();

      // Use getAllPayouts to get filtered data from backend
      const res = await adminAPI.getAllPayouts({
        limit: 500,
        status: statusParam,
        sort: sortOrder,
        search: searchParam || undefined,
      });
      setPayouts(res.payouts || []);
      setStats(res.stats || null);
    } catch {
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    const timeout = setTimeout(() => {
      fetchData();
    }, search.trim() ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [isReady, tab, search, statusFilter, sortOrder]);

  const filtered = payouts;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      {/* HEADER (Sticky) */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard/admin" className="flex items-center gap-2 text-sm font-black text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-black">Payouts</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/30">Manage seller requests</p>
          </div>
          <div className="flex items-center gap-2" ref={headerDropdownRef}>
            
            <div className="relative">
              <button 
                onClick={() => setShowHeaderDropdown(!showHeaderDropdown)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showHeaderDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      setShowHeaderDropdown(false);
                      router.push('/dashboard/admin/payouts/analytics');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <BarChart3 size={16} />
                    Analytics
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
        
        {/* STATS ROW MOVED TO ANALYTICS PAGE */}

        {/* TABS */}
        <div className="flex bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] p-1 rounded-xl">
          <button onClick={() => setTab("pending")} className={`flex-1 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${tab === "pending" ? "border-b-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10" : "text-slate-500 dark:text-white/40 border-b-2 border-transparent hover:bg-slate-50 dark:hover:bg-white/5"}`}>
            Pending ({stats?.pendingPayouts || 0})
          </button>
          <button onClick={() => setTab("history")} className={`flex-1 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${tab === "history" ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" : "text-slate-500 dark:text-white/40 border-b-2 border-transparent hover:bg-slate-50 dark:hover:bg-white/5"}`}>
            History
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="flex gap-2 w-full relative mb-2" ref={dropdownRef}>
          {/* Search Input */}
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by ID, name, email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Filter Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-2.5 bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm transition-colors flex items-center justify-center shrink-0 ${
              showFilters ? 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30' : 'text-slate-600 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Custom Filter Popover */}
          {showFilters && (
            <div className="absolute right-0 top-[110%] w-64 bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 p-5 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              
              {/* SORT */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-white/40 uppercase mb-3">Sort Order</p>
                <div className="space-y-2">
                  {[
                    { id: 'newest', label: 'Newest First' },
                    { id: 'oldest', label: 'Oldest First' },
                  ].map(option => (
                    <label
                      key={option.id}
                      onClick={() => {
                        setSortOrder(option.id as "newest" | "oldest");
                        setShowFilters(false);
                      }}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${sortOrder === option.id ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/20' : 'border-slate-300 dark:border-white/20 group-hover:border-cyan-400'}`}>
                        {sortOrder === option.id && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${sortOrder === option.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/60 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* STATUS (Only in History Tab) */}
              {tab === "history" && (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10">
                  <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-white/40 uppercase mb-3">Status Filter</p>
                  <div className="space-y-2">
                    {[
                      { id: 'all', label: 'All Statuses' },
                      { id: 'paid', label: 'Paid' },
                      { id: 'rejected', label: 'Rejected' }
                    ].map(option => (
                      <label
                        key={option.id}
                        onClick={() => {
                          setStatusFilter(option.id);
                          setShowFilters(false);
                        }}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${statusFilter === option.id ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 dark:border-white/20 group-hover:border-cyan-400'}`}>
                          {statusFilter === option.id && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-medium transition-colors ${statusFilter === option.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/60 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* CARDS LIST */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white dark:bg-[#16161e] rounded-2xl border border-slate-200 dark:border-white/[0.05]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-300 dark:border-white/[0.08] rounded-3xl bg-white dark:bg-[#16161e]/50">
            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-white/20" />
            </div>
            <h3 className="text-lg font-black text-slate-700 dark:text-white/60 mb-1">No Payouts Found</h3>
            <p className="text-sm text-slate-500 dark:text-white/40">You're all caught up! There are no records matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(p => (
              <PayoutCard 
                key={p.id} 
                payout={p} 
                tab={tab} 
                onMarkPaid={() => setPayModal(p)}
                onReject={() => setRejectModal(p)}
              />
            ))}
          </div>
        )}

      </div>

      {/* MODALS */}
      {payModal && <MarkAsPaidModal payout={payModal} onClose={() => setPayModal(null)} onRefresh={() => fetchData()} />}
      {rejectModal && <RejectPayoutModal payout={rejectModal} onClose={() => setRejectModal(null)} onRefresh={() => fetchData()} />}
    </main>
  );
}

/* ─── Components ─── */

function StatCard({ label, value, valueClass = "" }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="bg-white dark:bg-[#16161e] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.05] flex flex-col justify-between">
      <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-white/40">{label}</p>
      <p className={`text-2xl font-black mt-2 ${valueClass || "text-slate-900 dark:text-white"}`}>{value}</p>
    </div>
  );
}

function PayoutCard({ payout, tab, onMarkPaid, onReject }: { payout: Payout; tab: Tab; onMarkPaid: () => void; onReject: () => void }) {
  // Extract initials
  const initials = payout.seller?.name?.substring(0, 2).toUpperCase() || "?";
  
  return (
    <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      
      {/* Card Header Info */}
      <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 dark:border-white/[0.03]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-inner">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{payout.payoutNumber}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                payout.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                payout.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>{payout.status}</span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">{payout.seller?.name || "Unknown Seller"}</h3>
            <p className="text-xs text-slate-500 dark:text-white/50">{payout.seller?.email}</p>
            <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">
              Member since {new Date(payout.seller?.joinedAt).toLocaleDateString()} · {payout.seller?.totalProducts || 0} products
            </p>
          </div>
        </div>
        
        <div className="md:text-right shrink-0">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/30 mb-1">Amount</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">₹{payout.amount.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">
            Req: {new Date(payout.requestedAt).toLocaleDateString()}
          </p>
          {payout.processedAt && (
            <p className="text-[10px] text-slate-400 dark:text-white/30">
              Proc: {new Date(payout.processedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Always Visible Bank Details & Action Area */}
      <div className="p-5 bg-slate-50/50 dark:bg-[#1c1c24]/30 flex flex-col md:flex-row gap-6">
        {/* Bank Details section */}
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-3 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Bank Account Details
          </p>
          {payout.bankDetails ? (
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-white/30">Holder</span>
                <span className="font-semibold text-slate-700 dark:text-white/80">{payout.bankDetails.holderName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-white/30">Bank</span>
                <span className="font-semibold text-slate-700 dark:text-white/80">{payout.bankDetails.bankName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-white/30">Account</span>
                <span className="font-mono text-slate-700 dark:text-white/80">{payout.bankDetails.accountNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-white/30">IFSC</span>
                <span className="font-mono text-slate-700 dark:text-white/80">{payout.bankDetails.ifsc}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No bank details provided.</p>
          )}
        </div>

        {/* Dynamic Area: Actions or History Details */}
        <div className="w-full md:w-64 shrink-0 flex flex-col justify-end">
          {tab === "pending" ? (
            <div className="flex gap-2 w-full">
              <button onClick={onReject} className="flex-1 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                Reject
              </button>
              <button onClick={onMarkPaid} className="flex-1 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all">
                Mark Paid
              </button>
            </div>
          ) : (
            <div className="text-xs space-y-1.5 p-3 rounded-xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05]">
              {payout.status === 'paid' ? (
                <>
                  <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className="font-semibold">{payout.paymentMode}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">UTR</span><span className="font-mono">{payout.utrNumber}</span></div>
                  {payout.proofImageUrl && (
                    <a href={payout.proofImageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline mt-1">
                      <ImageIcon className="w-3 h-3" /> View Proof
                    </a>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold text-red-500">Rejected</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{payout.rejectionReasons?.join(", ")}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Mark As Paid Modal ─── */
function MarkAsPaidModal({ payout, onClose, onRefresh }: { payout: Payout; onClose: () => void; onRefresh: () => void }) {
  const [utr, setUtr] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<string>("NEFT");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!utr.trim() || !date) return toast.error("UTR and Date are required");
    setSubmitting(true);
    
    try {
      let proofUrl = "";
      if (file) {
        setUploading(true);
        const res = await adminAPI.uploadPayoutProof(payout.id, file);
        proofUrl = res.url;
        setUploading(false);
      }

      await adminAPI.approvePayout(payout.id, {
        utrNumber: utr,
        paymentDate: date,
        paymentMode: mode,
        proofImageUrl: proofUrl,
        adminNote: note
      });
      
      toast.success("Payout marked as paid");
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to process payment");
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Mark Payout as Paid">
      <p className="text-xs text-slate-500 dark:text-white/50 mb-5">
        This confirms you have manually transferred the amount outside the platform.
      </p>

      {/* Summary Box */}
      <div className="bg-slate-50 dark:bg-[#1c1c24] border border-slate-200 dark:border-white/[0.05] rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
        <div className="col-span-2 flex justify-between items-center border-b border-slate-200 dark:border-white/[0.05] pb-3 mb-1">
          <span className="font-black text-slate-500">Amount to Transfer:</span>
          <span className="text-xl font-black text-emerald-500">₹{payout.amount.toFixed(2)}</span>
        </div>
        <div><span className="block text-slate-500">Seller</span><span className="font-semibold">{payout.seller.name}</span></div>
        <div><span className="block text-slate-500">Bank</span><span className="font-semibold">{payout.bankDetails?.bankName}</span></div>
        <div className="col-span-2"><span className="block text-slate-500">Account</span><span className="font-mono">{payout.bankDetails?.accountNumber} ({payout.bankDetails?.ifsc})</span></div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">UTR / Ref No. *</label>
            <input value={utr} onChange={e => setUtr(e.target.value)} placeholder="e.g. N012345678" className="w-full bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.1] rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Payment Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.1] rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none dark:color-scheme-dark" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Mode *</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className="w-full bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.1] rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none">
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="IMPS">IMPS</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Proof Image (Optional)</label>
            <label className="flex items-center justify-center w-full bg-white dark:bg-[#16161e] border border-dashed border-slate-300 dark:border-white/[0.2] hover:border-cyan-500 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors text-slate-500">
              <UploadCloud className="w-4 h-4 mr-2" />
              <span className="truncate">{file ? file.name : "Upload screenshot"}</span>
              <input type="file" className="hidden" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Admin Note (Internal)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.1] rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none resize-none" />
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.05]">
        <button onClick={onClose} disabled={submitting} className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting || !utr.trim() || !date} className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg disabled:opacity-50 transition-all">
          {uploading ? "Uploading Proof..." : submitting ? "Processing..." : "Confirm Payment"}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Reject Payout Modal ─── */
function RejectPayoutModal({ payout, onClose, onRefresh }: { payout: Payout; onClose: () => void; onRefresh: () => void }) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleReason = (r: string) => {
    setSelectedReasons(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) return toast.error("Select at least one reason");
    setSubmitting(true);
    try {
      await adminAPI.rejectPayout(payout.id, selectedReasons, message);
      toast.success("Payout rejected");
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to reject payout");
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Reject Payout Request">
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase text-slate-500 mb-3">Select Reasons *</p>
        <div className="space-y-2">
          {REJECTION_REASONS.map(r => (
            <label key={r} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/[0.05]">
              <div className={`w-4 h-4 rounded flex items-center justify-center border ${selectedReasons.includes(r) ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>
                {selectedReasons.includes(r) && <Check className="w-3 h-3" />}
              </div>
              <span className="text-sm text-slate-700 dark:text-white/80">{r}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Message to seller (Optional)</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Add specific details for the seller to fix..." className="w-full bg-slate-50 dark:bg-[#1c1c24] border border-slate-200 dark:border-white/[0.1] rounded-xl p-3 text-sm focus:border-red-500 outline-none resize-none" />
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.05]">
        <button onClick={onClose} disabled={submitting} className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting || selectedReasons.length === 0} className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white shadow-lg disabled:opacity-50 transition-all">
          {submitting ? "Rejecting..." : "Reject Payout"}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Modal Wrapper ─── */
function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/[0.08] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.02]">
          <h2 className="text-base font-black text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
