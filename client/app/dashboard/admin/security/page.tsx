"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import {
  ShieldAlert, FileSearch, UserCheck, RefreshCw,
  ExternalLink, AlertTriangle, CheckCircle2, XCircle,
  Bug, Star, Phone, Calendar, BarChart3, User
} from "lucide-react";
import React from "react";
import { useSwipeable } from "react-swipeable";
import MalwareStatsCards from "./components/MalwareStatsCards";
import ScanHistoryTable from "./components/ScanHistoryTable";
import { KPICardsSkeleton, ScanListSkeleton } from "./components/Skeletons";

/* ─── Types ─── */
interface MalwareStats {
  totalScans: number;
  productsWithDetections: number;
  cleanProducts: number;
  basicCheckOnly: number;
  recentScans: number;
  scanRate: number;
  highThreatProducts: Array<{
    _id: string;
    title: string;
    virusTotalLink: string;
    malwareScanDetails: { detections: { malicious: number; suspicious: number; harmless: number; undetected: number } };
    sellerId: { name: string; email: string };
    createdAt: string;
  }>;
}

interface ContentReviewQueue {
  products: Array<{
    _id: string;
    slug?: string;
    title: string;
    description: string;
    price: number;
    reviewFlags: string[];
    reviewSeverity: "high" | "medium" | "low";
    contentQualityScore: number;
    reviewScore?: number | null;
    requiresManualReview: boolean;
    sellerId: { name: string; email: string; identityVerified: boolean };
    createdAt: string;
  }>;
  summary: { total: number; high: number; medium: number; low: number };
  nextCursor?: string | null;
}

interface PendingIdentity {
  sellers: Array<{
    _id: string;
    name: string;
    email: string;
    phone?: string;
    totalSales: number;
    averageRating: number;
    createdAt: string;
    identityDocuments?: any[];
  }>;
  total?: number;
  nextCursor?: string | null;
}

type ActiveTab = "malware" | "content" | "identity";

const TABS: { key: ActiveTab; label: string; icon: typeof ShieldAlert }[] = [
  { key: "malware",  label: "Malware Scans",          icon: Bug        },
  { key: "content",  label: "Content Review",          icon: FileSearch },
  { key: "identity", label: "Identity Verification",   icon: UserCheck  },
];

const SEVERITY_STYLES = {
  high:   { card: "border-red-500/20 bg-red-500/[0.05]",    badge: "bg-red-500/15 text-red-400 border-red-500/25"    },
  medium: { card: "border-amber-500/20 bg-amber-500/[0.05]", badge: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  low:    { card: "border-emerald-500/20 bg-emerald-500/[0.05]", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
};

/* ─── Reject / Notes modals state ─── */
interface ModalState {
  type: "content-reject" | "identity-verify" | "identity-reject" | null;
  id: string;
  name?: string;
}

export default function SecurityDashboard() {
  const [loading, setLoading]             = useState(true);
  const [tabLoading, setTabLoading]       = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [contentReview, setContentReview] = useState<ContentReviewQueue | null>(null);
  const [pendingIdentity, setPendingIdentity] = useState<PendingIdentity | null>(null);
  const [activeTab, setActiveTab]         = useState<ActiveTab>("malware");
  const [modal, setModal]                 = useState<ModalState>({ type: null, id: "" });
  const [modalInput, setModalInput]       = useState("");
  const [previewDoc, setPreviewDoc]       = useState<{ url: string; type: string } | null>(null);
  const [contentFilter, setContentFilter] = useState<'all'|'high'|'medium'|'low'>('all');
  const [contentLoadingMore, setContentLoadingMore] = useState(false);
  const [identityLoadingMore, setIdentityLoadingMore] = useState(false);
  const contentObserverTarget = useRef<HTMLDivElement>(null);
  const identityObserverTarget = useRef<HTMLDivElement>(null);
  const firstLoadRef                      = useRef(true);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === "malware") setActiveTab("content");
      else if (activeTab === "content") setActiveTab("identity");
    },
    onSwipedRight: () => {
      if (activeTab === "identity") setActiveTab("content");
      else if (activeTab === "content") setActiveTab("malware");
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  const fetchTabData = useCallback(async (
    tab: ActiveTab,
    options: { isRefresh?: boolean; isInitial?: boolean; filter?: 'all'|'high'|'medium'|'low' } = {}
  ) => {
    const { isRefresh = false, isInitial = false, filter = 'all' } = options;

    if (isRefresh) {
      setRefreshing(true);
    } else if (isInitial) {
      setLoading(true);
    } else {
      setTabLoading(true);
      if (tab === "content") setContentReview(null);
      if (tab === "identity") setPendingIdentity(null);
    }

    try {
      if (tab === "content") {
        const currentFilter = filter !== 'all' ? filter : contentFilter;
        const content = await adminAPI.getContentReviewQueue(currentFilter, undefined, 75);
        setContentReview(content);
      } else {
        const identity = await adminAPI.getPendingIdentityVerifications(undefined, 75);
        setPendingIdentity(identity);
      }
    } catch {
      toast.error("Failed to load tab data");
    } finally {
      if (isRefresh) setRefreshing(false);
      if (isInitial) setLoading(false);
      if (!isRefresh && !isInitial) setTabLoading(false);
    }
  }, [contentFilter]);

  const fetchMoreContent = useCallback(async () => {
    if (!contentReview || !contentReview.nextCursor || contentLoadingMore) return;
    setContentLoadingMore(true);
    try {
      const moreContent = await adminAPI.getContentReviewQueue(contentFilter, contentReview.nextCursor, 75);
      setContentReview(prev => {
        if (!prev) return moreContent;
        return {
          ...moreContent,
          products: [...prev.products, ...moreContent.products],
          summary: prev.summary
        };
      });
    } catch {
      toast.error("Failed to load more products");
    } finally {
      setContentLoadingMore(false);
    }
  }, [contentReview, contentFilter, contentLoadingMore]);

  const fetchMoreIdentity = useCallback(async () => {
    if (!pendingIdentity || !pendingIdentity.nextCursor || identityLoadingMore) return;
    setIdentityLoadingMore(true);
    try {
      const moreIdentity = await adminAPI.getPendingIdentityVerifications(pendingIdentity.nextCursor, 75);
      setPendingIdentity(prev => {
        if (!prev) return moreIdentity;
        return {
          ...moreIdentity,
          sellers: [...prev.sellers, ...moreIdentity.sellers]
        };
      });
    } catch {
      toast.error("Failed to load more verifications");
    } finally {
      setIdentityLoadingMore(false);
    }
  }, [pendingIdentity, identityLoadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === 'content') fetchMoreContent();
          if (activeTab === 'identity') fetchMoreIdentity();
        }
      },
      { threshold: 0.1 }
    );
    const cTarget = contentObserverTarget.current;
    const iTarget = identityObserverTarget.current;
    if (cTarget) observer.observe(cTarget);
    if (iTarget) observer.observe(iTarget);
    return () => { 
      if (cTarget) observer.unobserve(cTarget); 
      if (iTarget) observer.unobserve(iTarget);
    };
  }, [fetchMoreContent, fetchMoreIdentity, activeTab]);

  useEffect(() => {
    const isInitial = firstLoadRef.current;
    fetchTabData(activeTab, { isInitial });
    if (firstLoadRef.current) firstLoadRef.current = false;
  }, [activeTab, fetchTabData]);

  const handleContentFilterChange = (newFilter: 'all'|'high'|'medium'|'low') => {
    setContentFilter(newFilter);
    fetchTabData("content", { filter: newFilter });
  };

  const closeModal = () => { setModal({ type: null, id: "" }); setModalInput(""); };

  const handleModalSubmit = async () => {
    if (!modal.type) return;
    try {
      if (modal.type === "content-reject") {
        if (!modalInput.trim()) { toast.error("Reason required"); return; }
        await adminAPI.resolveContentReview(modal.id, "reject", modalInput);
        toast.success("Product rejected");
      } else if (modal.type === "identity-verify") {
        await adminAPI.verifySellerIdentity(modal.id, true, modalInput || undefined);
        toast.success("Seller identity verified");
      } else if (modal.type === "identity-reject") {
        if (!modalInput.trim()) { toast.error("Reason required"); return; }
        await adminAPI.verifySellerIdentity(modal.id, false, modalInput);
        toast.success("Verification rejected");
      }
      closeModal();
      fetchTabData(activeTab);
    } catch { toast.error("Action failed"); }
  };

  const handleViewDocument = async (publicId: string) => {
    try {
      toast.loading("Loading document...", { id: "doc-load" });
      const blob = await adminAPI.viewIdentityDocument(publicId);
      const objectUrl = URL.createObjectURL(blob);
      setPreviewDoc({ url: objectUrl, type: blob.type });
      toast.success("Document loaded", { id: "doc-load" });
    } catch {
      toast.error("Failed to load document", { id: "doc-load" });
    }
  };

  /* ── Skeleton ── */
  if (loading) return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <div className="h-16 border-b border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-[#0a0a0f]" />
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="flex gap-2">
          {[1,2,3].map(i => <div key={i} className="h-11 flex-1 bg-white dark:bg-[#16161e] rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white dark:bg-[#16161e] rounded-2xl" />)}
        </div>
        {[1,2,3].map(i => <div key={i} className="h-28 bg-white dark:bg-[#16161e] rounded-2xl" />)}
      </section>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">

      <PageHeader
        title="Trust & Security"
        subtitle="Review content, sellers, and safety"
        backHref="/dashboard/admin"
        backLabel="Back"
      />

      <section {...handlers} className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8 pb-8">

        {/* ── Tabs ── */}
        <div className="flex bg-white dark:bg-[#16161e] rounded-2xl p-1 gap-1 border border-slate-200 dark:border-white/[0.05]">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wide transition-all duration-200 ${
                  activeTab === t.key
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 bg-slate-50 dark:bg-white/[0.02]"
                }`}>
                <Icon className="hidden sm:block w-4 h-4 shrink-0" />
                <span className="line-clamp-1">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ════ MALWARE TAB ════ */}
        {activeTab === "malware" && (
          <div className="space-y-5">
            <React.Suspense fallback={<KPICardsSkeleton />}>
              <MalwareStatsCards />
            </React.Suspense>
            
            <React.Suspense fallback={<ScanListSkeleton />}>
              <ScanHistoryTable />
            </React.Suspense>
          </div>
        )}

        {/* ════ CONTENT REVIEW TAB ════ */}
        {activeTab === "content" && (
          tabLoading || !contentReview ? (
            <TabLoading />
          ) : (
          <div className="space-y-5">
            <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 bg-white dark:bg-[#13131a] sm:bg-transparent sm:dark:bg-transparent border border-slate-200 dark:border-white/10 sm:border-0 rounded-xl px-4 sm:px-0">
              {[
                { label: "Total Flagged",    value: contentReview.summary.total,  color: "gray"    },
                { label: "High Severity",    value: contentReview.summary.high,   color: "red"     },
                { label: "Medium Severity",  value: contentReview.summary.medium, color: "amber"   },
                { label: "Low Severity",     value: contentReview.summary.low,    color: "emerald" },
              ].map(s => <MiniStat key={s.label} {...s} color={s.color as any} />)}
            </div>

            <SectionBox 
              title="Flagged for Manual Review" 
              accent="amber" 
              icon={<FileSearch className="w-4 h-4 text-amber-400" />}
              count={contentReview.summary?.total || 0}
              noPadding={true}
              action={
                <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] p-1 rounded-lg border border-slate-200 dark:border-white/[0.06]">
                  {(['all', 'high', 'medium', 'low'] as const).map(f => (
                    <button key={f} onClick={() => handleContentFilterChange(f)}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                        contentFilter === f 
                          ? 'bg-white dark:bg-[#202028] text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.08]' 
                          : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 border border-transparent'
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              }
            >
              {(!contentReview.products || contentReview.products.length === 0) ? (
                <div className="p-8">
                  <EmptyState icon={<FileSearch className="w-8 h-8 text-slate-300 dark:text-white/10" />} text="No products flagged for review" />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {contentReview.products.map(p => {
                    const s = SEVERITY_STYLES[p.reviewSeverity];
                    return (
                      <div key={p._id} className={`p-4 sm:p-6 border-b border-slate-200 dark:border-white/[0.05] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all`}>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center justify-between">
                          <div className="min-w-0 flex-1 flex gap-3 sm:gap-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-500 dark:text-white/50 shrink-0 mt-0.5 sm:mt-0">
                              <FileSearch className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-1.5">
                                <p className="font-bold text-[13px] sm:text-base text-slate-900 dark:text-white truncate">{p.title}</p>
                                <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shrink-0 ${s.badge}`}>
                                  {p.reviewSeverity}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-white/50 mb-1.5 sm:mb-2 font-medium">
                                <span className="text-slate-700 dark:text-white/80">{p.sellerId.name}</span>
                                <span className="opacity-50">•</span>
                                <span className="text-slate-900 dark:text-white font-bold">₹{p.price}</span>
                                <span className="opacity-50">•</span>
                                <span>
                                  {p.reviewScore !== null && p.reviewScore !== undefined 
                                    ? `Score ${p.reviewScore}/100` 
                                    : "No Score"}
                                </span>
                              </div>
                              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-white/60 line-clamp-1">{p.description}</p>
                              
                              {p.reviewFlags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3">
                                  {p.reviewFlags.map((f, i) => (
                                    <span key={i} className="px-1.5 sm:px-2 py-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-sm sm:rounded-md text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-white/60">{f}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                            <button onClick={() => { adminAPI.resolveContentReview(p._id, "approve").then(() => { toast.success("Approved"); fetchTabData("content"); }).catch(() => toast.error("Failed")); }}
                              className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-emerald-500 transition-all flex-1 sm:flex-none">
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Approve
                            </button>
                            <button onClick={() => setModal({ type: "content-reject", id: p._id, name: p.title })}
                              className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-red-500 transition-all flex-1 sm:flex-none">
                              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Reject
                            </button>
                            <Link href={`/product/${p.slug || p._id}`}
                              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] rounded-lg sm:rounded-xl text-[11px] font-black uppercase tracking-wide transition-all text-slate-600 dark:text-white shrink-0">
                              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div ref={contentObserverTarget} className="h-4 w-full mt-4">
                {contentLoadingMore && (
                  <div className="flex justify-center p-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-white/50">Loading more flagged products...</span>
                  </div>
                )}
              </div>
            </SectionBox>
          </div>
          )
        )}

        {/* ════ IDENTITY TAB ════ */}
        {activeTab === "identity" && (
          tabLoading || !pendingIdentity ? (
            <TabLoading />
          ) : (
          <SectionBox title={`Pending Verifications`} accent="cyan" icon={<UserCheck className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
            count={pendingIdentity.sellers?.length || 0} noPadding={true}>
            {(!pendingIdentity || !pendingIdentity.sellers || pendingIdentity.sellers.length === 0) ? (
              <div className="p-8">
                <EmptyState icon={<UserCheck className="w-8 h-8 text-slate-300 dark:text-white/10" />} text="No pending identity verifications" />
              </div>
            ) : (
              <div className="flex flex-col">
                {pendingIdentity.sellers.map((s: any) => (
                  <div key={s._id} className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/[0.05] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center justify-between">
                      <div className="min-w-0 flex-1 flex gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-500 dark:text-white/50 shrink-0 mt-0.5 sm:mt-0">
                          <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-1.5">
                            <p className="font-bold text-[13px] sm:text-base text-slate-900 dark:text-white truncate">{s.name}</p>
                            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shrink-0">
                              Round {s.identityDocuments && s.identityDocuments.length > 0 ? Math.max(...s.identityDocuments.map((d: any) => d.submissionRound || 1)) : 1}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-white/50 mb-1.5 sm:mb-3 font-medium">
                            <span className="truncate">{s.email}</span>
                            {s.phone && <>
                              <span className="opacity-50">•</span>
                              <span className="flex items-center gap-1 shrink-0"><Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{s.phone}</span>
                            </>}
                            <span className="opacity-50">•</span>
                            <span className="shrink-0">{new Date(s.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {s.identityDocuments && s.identityDocuments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {s.identityDocuments.map((doc: any, i: number) => (
                                <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-md sm:rounded-lg">
                                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-white/80">{doc.documentType?.replace('_', ' ') || 'document'}</span>
                                  <div className="w-[1px] h-3 sm:h-4 bg-slate-200 dark:bg-white/10 mx-0.5"></div>
                                  <button onClick={() => handleViewDocument(doc.public_id)}
                                    className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-600">View</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                        <button onClick={() => setModal({ type: "identity-verify", id: s._id, name: s.name })}
                          className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-cyan-500 transition-all flex-1 sm:flex-none">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Verify
                        </button>
                        <button onClick={() => setModal({ type: "identity-reject", id: s._id, name: s.name })}
                          className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-red-500 transition-all flex-1 sm:flex-none">
                          <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Reject
                        </button>
                        <Link href={`/dashboard/admin/users/${s._id}`}
                          className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] rounded-lg sm:rounded-xl text-[11px] font-black uppercase tracking-wide transition-all text-slate-600 dark:text-white shrink-0">
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div ref={identityObserverTarget} className="h-4 w-full mt-4">
              {identityLoadingMore && (
                <div className="flex justify-center p-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-white/50">Loading more verifications...</span>
                </div>
              )}
            </div>
          </SectionBox>
          )
        )}
      </section>

      {/* ── Action Modal ── */}
      {modal.type && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 dark:bg-black/70 backdrop-blur-sm"
          onClick={closeModal}>
          <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.08] rounded-3xl w-full max-w-md shadow-2xl p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                modal.type === "identity-verify"
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              }`}>
                {modal.type === "identity-verify"
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  : <XCircle className="w-5 h-5 text-red-400" />}
              </div>
              <div>
                <h2 className="text-sm font-black">
                  {modal.type === "content-reject"   && "Reject Product"}
                  {modal.type === "identity-verify"  && "Verify Identity"}
                  {modal.type === "identity-reject"  && "Reject Verification"}
                </h2>
                <p className="text-xs text-slate-400 dark:text-white/40">{modal.name}</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 mb-1.5">
                {modal.type === "identity-verify" ? "Notes (optional)" : "Reason *"}
              </label>
              <textarea value={modalInput} onChange={e => setModalInput(e.target.value)} rows={3}
                placeholder={modal.type === "identity-verify" ? "Add any verification notes…" : "Enter reason…"}
                className="w-full bg-slate-50 dark:bg-[#1c1c24] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-all resize-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleModalSubmit}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white ${
                  modal.type === "identity-verify"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}>
                {modal.type === "identity-verify" ? "✓ Confirm Verify" : "✗ Confirm Reject"}
              </button>
              <button onClick={closeModal}
                className="px-5 py-2.5 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Preview Modal ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => { URL.revokeObjectURL(previewDoc.url); setPreviewDoc(null); }}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#16161e] rounded-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/[0.1]"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1a1a24]">
              <h3 className="font-bold text-sm uppercase tracking-wide text-slate-800 dark:text-white flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-cyan-500" /> Secure Document Preview
              </h3>
              <button onClick={() => { URL.revokeObjectURL(previewDoc.url); setPreviewDoc(null); }} className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-200/50 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-white transition-all">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-black/50 p-2 sm:p-4 min-h-[50vh]">
              {previewDoc.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewDoc.url} alt="Document Preview" className="max-w-full max-h-[75vh] object-contain rounded-lg border border-slate-200 dark:border-white/[0.1]" />
              ) : (
                <iframe src={previewDoc.url} className="w-full h-[75vh] border-0 rounded-lg bg-white dark:bg-transparent" />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function TabLoading() {
  return (
    <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-8">
      <div className="flex items-center justify-center gap-3 text-slate-500 dark:text-white/60">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading tab data...</span>
      </div>
    </div>
  );
}

/* ── Mini Stat Card ── */
function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorMap: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    cyan:    { border: "sm:border-cyan-500/20", bg: "sm:bg-cyan-500/[0.05]", text: "text-cyan-600 dark:text-cyan-400", icon: "bg-cyan-500/10" },
    emerald: { border: "sm:border-emerald-500/20", bg: "sm:bg-emerald-500/[0.05]", text: "text-emerald-600 dark:text-emerald-400", icon: "bg-emerald-500/10" },
    red:     { border: "sm:border-red-500/20", bg: "sm:bg-red-500/[0.05]", text: "text-red-600 dark:text-red-400", icon: "bg-red-500/10" },
    indigo:  { border: "sm:border-indigo-500/20", bg: "sm:bg-indigo-500/[0.05]", text: "text-indigo-600 dark:text-indigo-400", icon: "bg-indigo-500/10" },
    amber:   { border: "sm:border-amber-500/20", bg: "sm:bg-amber-500/[0.05]", text: "text-amber-600 dark:text-amber-400", icon: "bg-amber-500/10" },
    gray:    { border: "sm:border-slate-200 dark:sm:border-white/[0.08]", bg: "sm:bg-slate-50 dark:sm:bg-white/[0.03]", text: "text-slate-600 dark:text-white/60", icon: "bg-slate-100 dark:bg-white/[0.04]" },
  };

  const colors = colorMap[color] || colorMap.gray;
  const iconMap: Record<string, React.ReactNode> = {
    "Total Scans": <BarChart3 className="w-5 h-5" />,
    "Clean Products": <CheckCircle2 className="w-5 h-5" />,
    "With Detections": <AlertTriangle className="w-5 h-5" />,
    "Scan Rate": <RefreshCw className="w-5 h-5" />,
    "Total Flagged": <FileSearch className="w-5 h-5" />,
    "High Severity": <AlertTriangle className="w-5 h-5" />,
    "Medium Severity": <AlertTriangle className="w-5 h-5" />,
    "Low Severity": <CheckCircle2 className="w-5 h-5" />,
  };

  return (
    <div className={`py-2.5 sm:p-4 rounded-none sm:rounded-xl border-b sm:border border-slate-100 dark:border-white/[0.05] last:border-b-0 sm:last:border-[1px] flex items-center justify-between transition-all hover:border-opacity-40 bg-transparent dark:bg-transparent ${colors.border} ${colors.bg}`}>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 ${colors.icon} ${colors.text}`}>
          {React.isValidElement(iconMap[label]) 
            ? React.cloneElement(iconMap[label] as React.ReactElement<any>, { className: "w-3 h-3 sm:w-4 sm:h-4" }) 
            : <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 leading-tight">{label}</p>
      </div>
      <p className="text-[15px] sm:text-xl font-black text-slate-900 dark:text-white leading-none shrink-0">{value}</p>
    </div>
  );
}

/* ── Section Box ── */
function SectionBox({ title, accent, icon, count, action, noPadding, children }: {
  title: string; accent: string; icon: React.ReactNode; count: number; action?: React.ReactNode; noPadding?: boolean; children: React.ReactNode;
}) {
  const border: Record<string, string> = {
    red: "border-red-500/15", amber: "border-amber-500/15", cyan: "border-cyan-500/15",
  };
  return (
    <div className={`bg-white dark:bg-[#16161e] border rounded-2xl overflow-hidden transition-all ${border[accent] || "border-slate-200 dark:border-white/[0.06]"}`}>
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.02]">
        <div className="flex items-center">
          <h2 className="text-sm sm:text-base font-black flex items-center gap-2.5 text-slate-900 dark:text-white">{icon}{title}</h2>
          <span className="px-3 py-1 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[10px] font-black text-slate-500 dark:text-white/40 whitespace-nowrap ml-3">{count}</span>
        </div>
        {action && (
          <div className="shrink-0 ml-4 hidden sm:block">
            {action}
          </div>
        )}
      </div>
      {action && (
        <div className="sm:hidden px-5 py-3 border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#16161e]/50">
          {action}
        </div>
      )}
      <div className={noPadding ? "" : "p-4 sm:p-5"}>{children}</div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm sm:text-base font-black text-slate-400 dark:text-white/30">{text}</p>
    </div>
  );
}
