"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [refreshing, setRefreshing]       = useState(false);
  const [malwareStats, setMalwareStats]   = useState<MalwareStats | null>(null);
  const [contentReview, setContentReview] = useState<ContentReviewQueue | null>(null);
  const [pendingIdentity, setPendingIdentity] = useState<PendingIdentity | null>(null);
  const [activeTab, setActiveTab]         = useState<ActiveTab>("malware");
  const [modal, setModal]                 = useState<ModalState>({ type: null, id: "" });
  const [modalInput, setModalInput]       = useState("");

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [malware, content, identity] = await Promise.all([
        adminAPI.getMalwareDashboardStats(),
        adminAPI.getContentReviewQueue(),
        adminAPI.getPendingIdentityVerifications(),
      ]);
      setMalwareStats(malware);
      setContentReview(content);
      setPendingIdentity(identity);
    } catch {
      toast.error("Failed to load security dashboard");
    } finally {
      setLoading(false); setRefreshing(false);
    }
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
      closeModal(); fetchAllData();
    } catch { toast.error("Action failed"); }
  };

  /* ── Skeleton ── */
  if (loading) return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <div className="h-16 border-b border-white/[0.05] bg-[#0a0a0f]" />
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="flex gap-2">
          {[1,2,3].map(i => <div key={i} className="h-11 flex-1 bg-[#16161e] rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#16161e] rounded-2xl" />)}
        </div>
        {[1,2,3].map(i => <div key={i} className="h-28 bg-[#16161e] rounded-2xl" />)}
      </section>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#05050a] text-white pb-24">

      <PageHeader
        title="Trust & Security"
        subtitle="Malware scans, content review & identity verification"
        backHref="/dashboard/admin"
        backLabel="Back"
        rightSlot={
          <button onClick={() => fetchAllData(true)} disabled={refreshing}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ── Tabs ── */}
        <div className="flex bg-[#16161e] rounded-2xl p-1 gap-1 border border-white/[0.05]">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === t.key
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg"
                    : "text-white/30 hover:text-white/60"
                }`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ════ MALWARE TAB ════ */}
        {activeTab === "malware" && malwareStats && (
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <EmptyState icon={<ShieldAlert className="w-8 h-8 text-white/10" />} text="No high-threat products detected" />
              ) : malwareStats.highThreatProducts.map(p => (
                <div key={p._id} className="bg-[#1c1c24] border border-red-500/20 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-sm text-white">{p.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{p.sellerId.name} · {p.sellerId.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-red-400">{p.malwareScanDetails.detections.malicious}</p>
                      <p className="text-[10px] text-amber-400">{p.malwareScanDetails.detections.suspicious} suspicious</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {p.virusTotalLink && (
                      <a href={p.virusTotalLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        <ExternalLink className="w-3 h-3" /> VirusTotal
                      </a>
                    )}
                    <Link href={`/dashboard/admin/products/${p._id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-400 transition-all">
                      Manage Product
                    </Link>
                  </div>
                </div>
              ))}
            </SectionBox>
          </div>
        )}

        {/* ════ CONTENT REVIEW TAB ════ */}
        {activeTab === "content" && contentReview && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <EmptyState icon={<FileSearch className="w-8 h-8 text-white/10" />} text="No products flagged for review" />
              ) : contentReview.products.map(p => {
                const s = SEVERITY_STYLES[p.reviewSeverity];
                return (
                  <div key={p._id} className={`border rounded-xl p-4 ${s.card}`}>
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-black text-sm text-white truncate">{p.title}</p>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${s.badge}`}>
                            {p.reviewSeverity}
                          </span>
                        </div>
                        <p className="text-xs text-white/40">{p.sellerId.name}</p>
                        <p className="text-xs text-white/60 mt-1 line-clamp-2">{p.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-white">₹{p.price}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">Score {p.contentQualityScore}/100</p>
                      </div>
                    </div>
                    {p.reviewFlags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.reviewFlags.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[10px] text-white/50">{f}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { adminAPI.resolveContentReview(p._id, "approve").then(() => { toast.success("Approved"); fetchAllData(); }).catch(() => toast.error("Failed")); }}
                        className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-all flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => setModal({ type: "content-reject", id: p._id, name: p.title })}
                        className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 transition-all flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <Link href={`/marketplace/${p._id}`}
                        className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </SectionBox>
          </div>
        )}

        {/* ════ IDENTITY TAB ════ */}
        {activeTab === "identity" && pendingIdentity && (
          <SectionBox title={`Pending Verifications`} accent="cyan" icon={<UserCheck className="w-4 h-4 text-cyan-400" />}
            count={pendingIdentity.total}>
            {pendingIdentity.sellers.length === 0 ? (
              <EmptyState icon={<UserCheck className="w-8 h-8 text-white/10" />} text="No pending identity verifications" />
            ) : pendingIdentity.sellers.map(s => (
              <div key={s._id} className="bg-[#1c1c24] border border-cyan-500/15 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-black text-sm text-white">{s.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{s.email}</p>
                    {s.phone && <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{s.phone}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-white">{s.totalSales} sales</p>
                    <p className="text-xs text-amber-400 flex items-center justify-end gap-0.5 mt-0.5"><Star className="w-3 h-3" />{s.averageRating.toFixed(1)}</p>
                    <p className="text-[10px] text-white/25 flex items-center justify-end gap-0.5 mt-1"><Calendar className="w-3 h-3" />{new Date(s.createdAt).toLocaleDateString()}</p>
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
                    className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </SectionBox>
        )}
      </section>

      {/* ── Action Modal ── */}
      {modal.type && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeModal}>
          <div className="bg-[#16161e] border border-white/[0.08] rounded-3xl w-full max-w-md shadow-2xl p-6"
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
                <p className="text-xs text-white/40">{modal.name}</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">
                {modal.type === "identity-verify" ? "Notes (optional)" : "Reason *"}
              </label>
              <textarea value={modalInput} onChange={e => setModalInput(e.target.value)} rows={3}
                placeholder={modal.type === "identity-verify" ? "Add any verification notes…" : "Enter reason…"}
                className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-all resize-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleModalSubmit}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  modal.type === "identity-verify"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}>
                {modal.type === "identity-verify" ? "✓ Confirm Verify" : "✗ Confirm Reject"}
              </button>
              <button onClick={closeModal}
                className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ── Mini Stat Card ── */
function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  const accent: Record<string, string> = {
    cyan:    "border-cyan-500/20 bg-cyan-500/[0.05] text-cyan-400",
    emerald: "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400",
    red:     "border-red-500/20 bg-red-500/[0.05] text-red-400",
    indigo:  "border-indigo-500/20 bg-indigo-500/[0.05] text-indigo-400",
    amber:   "border-amber-500/20 bg-amber-500/[0.05] text-amber-400",
    gray:    "border-white/[0.08] bg-white/[0.03] text-white/60",
  };
  return (
    <div className={`border rounded-2xl p-4 ${accent[color] || accent.gray}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
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
    <div className={`bg-[#16161e] border rounded-2xl overflow-hidden ${border[accent] || "border-white/[0.06]"}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
        <h2 className="text-sm font-black flex items-center gap-2">{icon}{title}</h2>
        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-[10px] font-black text-white/40">{count}</span>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {icon}
      <p className="text-sm font-black text-white/20 mt-3">{text}</p>
    </div>
  );
}
