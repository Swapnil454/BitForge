"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import {
  ShieldAlert, FileSearch, UserCheck, RefreshCw,
  ExternalLink, AlertTriangle, CheckCircle2, XCircle,
  Bug, Star, Phone, Calendar, BarChart3
} from "lucide-react";

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
    title: string;
    description: string;
    price: number;
    reviewFlags: string[];
    reviewSeverity: "high" | "medium" | "low";
    contentQualityScore: number;
    requiresManualReview: boolean;
    sellerId: { name: string; email: string; identityVerified: boolean };
    createdAt: string;
  }>;
  summary: { total: number; high: number; medium: number; low: number };
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
  }>;
  total: number;
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
  const [malwareStats, setMalwareStats]   = useState<MalwareStats | null>(null);
  const [contentReview, setContentReview] = useState<ContentReviewQueue | null>(null);
  const [pendingIdentity, setPendingIdentity] = useState<PendingIdentity | null>(null);
  const [activeTab, setActiveTab]         = useState<ActiveTab>("malware");
  const [modal, setModal]                 = useState<ModalState>({ type: null, id: "" });
  const [modalInput, setModalInput]       = useState("");
  const firstLoadRef                      = useRef(true);

  const fetchTabData = useCallback(async (
    tab: ActiveTab,
    options: { isRefresh?: boolean; isInitial?: boolean } = {}
  ) => {
    const { isRefresh = false, isInitial = false } = options;

    if (isRefresh) {
      setRefreshing(true);
    } else if (isInitial) {
      setLoading(true);
    } else {
      setTabLoading(true);
      if (tab === "malware") setMalwareStats(null);
      if (tab === "content") setContentReview(null);
      if (tab === "identity") setPendingIdentity(null);
    }

    try {
      if (tab === "malware") {
        const malware = await adminAPI.getMalwareDashboardStats();
        setMalwareStats(malware);
      } else if (tab === "content") {
        const content = await adminAPI.getContentReviewQueue();
        setContentReview(content);
      } else {
        const identity = await adminAPI.getPendingIdentityVerifications();
        setPendingIdentity(identity);
      }
    } catch {
      toast.error("Failed to load tab data");
    } finally {
      if (isRefresh) setRefreshing(false);
      if (isInitial) setLoading(false);
      if (!isRefresh && !isInitial) setTabLoading(false);
    }
  }, []);

  useEffect(() => {
    const isInitial = firstLoadRef.current;
    fetchTabData(activeTab, { isInitial });
    if (firstLoadRef.current) firstLoadRef.current = false;
  }, [activeTab, fetchTabData]);

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
        subtitle="Malware scans, content review & identity verification"
        backHref="/dashboard/admin"
        backLabel="Back"
        rightSlot={
          <button onClick={() => fetchTabData(activeTab, { isRefresh: true })} disabled={refreshing}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-all text-slate-700 dark:text-white">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8 pb-8">

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
          tabLoading || !malwareStats ? (
            <TabLoading />
          ) : (
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Total Scans",      value: malwareStats.totalScans,              color: "cyan"    },
                { label: "Clean Products",   value: malwareStats.cleanProducts,            color: "emerald" },
                { label: "With Detections",  value: malwareStats.productsWithDetections,   color: "red"     },
                { label: "Scan Rate",        value: `${malwareStats.scanRate}%`,           color: "indigo"  },
              ].map(s => <MiniStat key={s.label} {...s} />)}
            </div>

            {/* High threat list */}
            <SectionBox title="High Threat Products" accent="red" icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
              count={malwareStats.highThreatProducts.length}>
              {malwareStats.highThreatProducts.length === 0 ? (
                <EmptyState icon={<ShieldAlert className="w-8 h-8 text-slate-300 dark:text-white/10" />} text="No high-threat products detected" />
              ) : malwareStats.highThreatProducts.map(p => (
                   <div key={p._id} className="bg-slate-100 dark:bg-[#1c1c24] border border-red-500/20 rounded-xl p-4 sm:p-5 hover:border-red-500/30 transition-all">
                  <div className="flex justify-between items-start mb-3 gap-3 min-h-fit">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">{p.title}</p>
                      <p className="text-xs text-slate-400 dark:text-white/50 mt-1">{p.sellerId.name}</p>
                      <p className="text-xs text-slate-400 dark:text-white/40">{p.sellerId.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg sm:text-xl font-black text-red-400">{p.malwareScanDetails.detections.malicious}</p>
                      <p className="text-[10px] text-amber-400 font-semibold mt-1">Malicious</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap text-[10px]">
                    {p.malwareScanDetails.detections.suspicious > 0 && (
                      <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 font-semibold">
                        {p.malwareScanDetails.detections.suspicious} Suspicious
                      </span>
                    )}
                    {p.malwareScanDetails.detections.harmless > 0 && (
                      <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 font-semibold">
                        {p.malwareScanDetails.detections.harmless} Clean
                      </span>
                    )}
                    {p.malwareScanDetails.detections.undetected > 0 && (
                      <span className="px-2 py-1 bg-slate-200 dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] rounded-lg text-slate-500 dark:text-white/60 font-semibold">
                        {p.malwareScanDetails.detections.undetected} Undetected
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.05]">
                    {p.virusTotalLink && (
                      <a href={p.virusTotalLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[11px] font-black uppercase tracking-wide transition-all text-slate-600 dark:text-white">
                        <ExternalLink className="w-3.5 h-3.5" /> VirusTotal
                      </a>
                    )}
                    <Link href={`/dashboard/admin/products/${p._id}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[11px] font-black uppercase tracking-wide text-red-400 transition-all ml-auto">
                      View Product
                    </Link>
                  </div>
                </div>
              ))}
            </SectionBox>
          </div>
          )
        )}

        {/* ════ CONTENT REVIEW TAB ════ */}
        {activeTab === "content" && (
          tabLoading || !contentReview ? (
            <TabLoading />
          ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Total Flagged",    value: contentReview.summary.total,  color: "gray"    },
                { label: "High Severity",    value: contentReview.summary.high,   color: "red"     },
                { label: "Medium Severity",  value: contentReview.summary.medium, color: "amber"   },
                { label: "Low Severity",     value: contentReview.summary.low,    color: "emerald" },
              ].map(s => <MiniStat key={s.label} {...s} />)}
            </div>

            <SectionBox title="Flagged for Manual Review" accent="amber" icon={<FileSearch className="w-4 h-4 text-amber-400" />}
              count={contentReview.products.length}>
              {contentReview.products.length === 0 ? (
                <EmptyState icon={<FileSearch className="w-8 h-8 text-slate-300 dark:text-white/10" />} text="No products flagged for review" />
              ) : contentReview.products.map(p => {
                const s = SEVERITY_STYLES[p.reviewSeverity];
                return (
                  <div key={p._id} className={`border rounded-xl p-4 ${s.card}`}>
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-black text-sm text-slate-900 dark:text-white truncate">{p.title}</p>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${s.badge}`}>
                            {p.reviewSeverity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-white/40">{p.sellerId.name}</p>
                        <p className="text-xs text-slate-500 dark:text-white/60 mt-1 line-clamp-2">{p.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white">₹{p.price}</p>
                        <p className="text-[10px] text-slate-500 dark:text-white/30 mt-0.5">Score {p.contentQualityScore}/100</p>
                      </div>
                    </div>
                    {p.reviewFlags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.reviewFlags.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[10px] text-slate-500 dark:text-white/50">{f}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { adminAPI.resolveContentReview(p._id, "approve").then(() => { toast.success("Approved"); fetchTabData("content"); }).catch(() => toast.error("Failed")); }}
                        className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-all flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => setModal({ type: "content-reject", id: p._id, name: p.title })}
                        className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 transition-all flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <Link href={`/marketplace/${p._id}`}
                        className="px-4 py-2 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
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
            count={pendingIdentity.total}>
            {pendingIdentity.sellers.length === 0 ? (
              <EmptyState icon={<UserCheck className="w-8 h-8 text-slate-300 dark:text-white/10" />} text="No pending identity verifications" />
            ) : pendingIdentity.sellers.map(s => (
              <div key={s._id} className="bg-white dark:bg-[#1c1c24] border border-cyan-500/15 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">{s.email}</p>
                    {s.phone && <p className="text-xs text-slate-500 dark:text-white/30 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{s.phone}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{s.totalSales} sales</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center justify-end gap-0.5 mt-0.5"><Star className="w-3 h-3" />{s.averageRating.toFixed(1)}</p>
                    <p className="text-[10px] text-slate-500 dark:text-white/25 flex items-center justify-end gap-0.5 mt-1"><Calendar className="w-3 h-3" />{new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal({ type: "identity-verify", id: s._id, name: s.name })}
                    className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-all flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                  </button>
                  <button onClick={() => setModal({ type: "identity-reject", id: s._id, name: s.name })}
                    className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 transition-all flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <Link href={`/seller/${s._id}`}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
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
    cyan:    { border: "border-cyan-500/20", bg: "bg-cyan-500/[0.05]", text: "text-cyan-600 dark:text-cyan-400", icon: "bg-cyan-500/10" },
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.05]", text: "text-emerald-600 dark:text-emerald-400", icon: "bg-emerald-500/10" },
    red:     { border: "border-red-500/20", bg: "bg-red-500/[0.05]", text: "text-red-600 dark:text-red-400", icon: "bg-red-500/10" },
    indigo:  { border: "border-indigo-500/20", bg: "bg-indigo-500/[0.05]", text: "text-indigo-600 dark:text-indigo-400", icon: "bg-indigo-500/10" },
    amber:   { border: "border-amber-500/20", bg: "bg-amber-500/[0.05]", text: "text-amber-600 dark:text-amber-400", icon: "bg-amber-500/10" },
    gray:    { border: "border-slate-200 dark:border-white/[0.08]", bg: "bg-slate-50 dark:bg-white/[0.03]", text: "text-slate-600 dark:text-white/60", icon: "bg-slate-100 dark:bg-white/[0.04]" },
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
    <div className={`border rounded-2xl p-4 sm:p-5 transition-all hover:border-opacity-40 ${colors.border} ${colors.bg}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.icon} ${colors.text}`}>
          {iconMap[label] || <BarChart3 className="w-5 h-5" />}
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-white/40 text-right">{label}</p>
      </div>
      <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
    </div>
  );
}

/* ── Section Box ── */
function SectionBox({ title, accent, icon, count, children }: {
  title: string; accent: string; icon: React.ReactNode; count: number; children: React.ReactNode;
}) {
  const border: Record<string, string> = {
    red: "border-red-500/15", amber: "border-amber-500/15", cyan: "border-cyan-500/15",
  };
  return (
    <div className={`bg-white dark:bg-[#16161e] border rounded-2xl overflow-hidden transition-all ${border[accent] || "border-slate-200 dark:border-white/[0.06]"}`}>
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.02]">
        <h2 className="text-sm sm:text-base font-black flex items-center gap-2.5 text-slate-900 dark:text-white">{icon}{title}</h2>
        <span className="px-3 py-1 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[10px] font-black text-slate-500 dark:text-white/40 whitespace-nowrap ml-3">{count}</span>
      </div>
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">{children}</div>
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
