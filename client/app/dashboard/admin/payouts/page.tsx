"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api, { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import {
  Search, RefreshCw, CheckCircle2, XCircle, Clock,
  Banknote, Building2, Filter, X, ChevronDown
} from "lucide-react";

/* ─── Types ─── */
interface Payout {
  _id: string;
  sellerId?: { id: string; name: string; email: string };
  amount: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  rejectionReason?: string;
  paymentReference?: string;
  paymentMethod?: string;
  paidBy?: { name: string; email: string };
  primaryBankAccount?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
  };
  financialBreakdown?: {
    requestedAmount: number;
    gstOnCommission: number;
    totalDeductions: number;
    netPayableAmount: number;
  };
}

type Tab = "pending" | "history";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  rejected: "bg-red-500/10 text-red-400 border-red-500/25",
};

const PRESETS = [
  { label: "Today", key: "today" },
  { label: "7 Days", key: "7days" },
  { label: "Month", key: "month" },
];

export default function AdminPayoutsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("pending");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Search / filter */
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showFilterBar, setShowFilterBar] = useState(false);

  /* Mark-as-paid modal */
  const [payModal, setPayModal] = useState<Payout | null>(null);
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payProcessing, setPayProcessing] = useState(false);

  /* Reject modal */
  const [rejectModal, setRejectModal] = useState<Payout | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectProcessing, setRejectProcessing] = useState(false);

  /* ─── Auth guard ─── */
  useEffect(() => {
    const u = getStoredUser<{ role?: string }>();
    if (!u) return router.push("/login");
    if (u.role !== "admin") return router.push("/dashboard");
  }, []);

  /* ─── Fetch ─── */
  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = tab === "pending"
        ? await adminAPI.getPendingPayouts()
        : await adminAPI.getAllPayouts({ status: "all" });
      setPayouts(res.payouts || []);
      setSearch(""); setFromDate(""); setToDate(""); setActivePreset(null);
    } catch {
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  /* ─── Preset dates ─── */
  const applyPreset = (key: string) => {
    if (activePreset === key) {
      setActivePreset(null); setFromDate(""); setToDate(""); return;
    }
    const now = new Date();
    let from = new Date();
    if (key === "today") from = new Date(now.setHours(0, 0, 0, 0));
    else if (key === "7days") from.setDate(from.getDate() - 6);
    else from = new Date(now.getFullYear(), now.getMonth(), 1);
    setActivePreset(key);
    setFromDate(from.toISOString().slice(0, 10));
    setToDate(new Date().toISOString().slice(0, 10));
  };

  /* ─── Filtered list ─── */
  const filtered = useMemo(() => {
    let list = payouts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.sellerId?.name?.toLowerCase().includes(q) ||
        p.sellerId?.email?.toLowerCase().includes(q)
      );
    }
    if (fromDate && toDate) {
      const f = new Date(fromDate).getTime();
      const t = new Date(toDate).getTime() + 86399999;
      list = list.filter(p => {
        const d = new Date(p.createdAt).getTime();
        return d >= f && d <= t;
      });
    }
    return list;
  }, [payouts, search, fromDate, toDate]);

  /* ─── Approve ─── */
  const handleApprove = async () => {
    if (!payModal || !payRef.trim()) {
      toast.error("Payment reference is required"); return;
    }
    setPayProcessing(true);
    try {
      await adminAPI.approvePayout(payModal._id, {
        paymentReference: payRef, paymentNotes: payNotes, paymentMethod: "manual"
      });
      toast.success("Payout marked as paid");
      setPayModal(null); setPayRef(""); setPayNotes("");
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally { setPayProcessing(false); }
  };

  /* ─── Reject ─── */
  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast.error("Reason is required"); return;
    }
    setRejectProcessing(true);
    try {
      await adminAPI.rejectPayout(rejectModal._id, rejectReason);
      toast.success("Payout rejected");
      setRejectModal(null); setRejectReason("");
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally { setRejectProcessing(false); }
  };

  /* ─── Skeleton ─── */
  if (loading) return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <div className="h-16 border-b border-white/[0.05] bg-[#0a0a0f]" />
      <section className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-[#16161e] rounded-2xl border border-white/[0.05]" />
        ))}
      </section>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#05050a] text-white pb-24">

      {/* ── Header ── */}
      <PageHeader
        title="Payouts"
        subtitle="Review and manage seller payout requests"
        backHref="/dashboard/admin"
        backLabel="Back"
        rightSlot={
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-5">

        {/* ── Tabs ── */}
        <div className="flex bg-[#16161e] rounded-2xl p-1 gap-1 border border-white/[0.05]">
          {(["pending", "history"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg"
                  : "text-white/30 hover:text-white/60"
                }`}
            >
              {t === "pending" ? " Pending" : "History"}
            </button>
          ))}
        </div>

        {/* ── Search + Filter Row ── */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by seller name or email…"
                className="w-full h-10 pl-9 pr-3 bg-[#16161e] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilterBar(v => !v)}
              className={`h-10 px-3 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${showFilterBar || activePreset || fromDate
                  ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                  : "bg-[#16161e] border-white/[0.06] text-white/40 hover:text-white"
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

          {/* Expanded filter bar */}
          {showFilterBar && (
            <div className="bg-[#16161e] border border-white/[0.06] rounded-xl p-3 space-y-3">
              {/* Presets */}
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${activePreset === p.key
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                        : "bg-white/[0.04] border-white/[0.06] text-white/40 hover:text-white"
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
                {(activePreset || fromDate) && (
                  <button
                    onClick={() => { setActivePreset(null); setFromDate(""); setToDate(""); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              {/* Date range */}
              <div className="flex gap-2">
                <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setActivePreset(null); }}
                  style={{ colorScheme: "dark" }}
                  className="flex-1 h-9 px-3 bg-[#0f0f17] border border-white/[0.06] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/40 transition-all" />
                <span className="text-white/20 self-center text-xs">to</span>
                <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setActivePreset(null); }}
                  style={{ colorScheme: "dark" }}
                  className="flex-1 h-9 px-3 bg-[#0f0f17] border border-white/[0.06] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/40 transition-all" />
              </div>
            </div>
          )}
        </div>

        {/* ── Result count ── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">
          {filtered.length} {tab === "pending" ? "pending" : "total"} payout{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* ── Cards ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/[0.06] rounded-3xl bg-[#16161e]/30">
            <Banknote className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm font-black text-white/20">No payouts found</p>
            <p className="text-xs text-white/10 mt-1">Try changing your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(p => (
              <PayoutCard
                key={p._id}
                payout={p}
                tab={tab}
                onMarkPaid={() => setPayModal(p)}
                onReject={() => setRejectModal(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Mark as Paid Modal ── */}
      {payModal && (
        <Modal onClose={() => { setPayModal(null); setPayRef(""); setPayNotes(""); }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black">Confirm Payment</h2>
              <p className="text-xs text-white/40">{payModal.sellerId?.name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-black text-emerald-400">
                ₹{(payModal.financialBreakdown?.netPayableAmount ?? payModal.amount).toLocaleString()}
              </p>
              <p className="text-[10px] text-white/30">Net Payable</p>
            </div>
          </div>

          {payModal.primaryBankAccount && (
            <div className="bg-[#1c1c24] border border-white/[0.05] rounded-xl p-3 mb-4 text-xs space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Bank Details</p>
              <div className="flex justify-between"><span className="text-white/40">Account</span><span className="font-mono text-white/80">{payModal.primaryBankAccount.accountNumber}</span></div>
              <div className="flex justify-between"><span className="text-white/40">IFSC</span><span className="font-mono text-white/80">{payModal.primaryBankAccount.ifscCode}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Bank</span><span className="text-white/80">{payModal.primaryBankAccount.bankName}</span></div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">UTR / Transaction Reference *</label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)}
                placeholder="Enter UTR or reference number"
                className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Notes (optional)</label>
              <textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} rows={2}
                placeholder="Any notes about this payment…"
                className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all resize-none" />
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={handleApprove} disabled={payProcessing || !payRef.trim()}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              {payProcessing ? "Processing…" : "✓ Confirm Payment"}
            </button>
            <button onClick={() => { setPayModal(null); setPayRef(""); setPayNotes(""); }}
              className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <Modal onClose={() => { setRejectModal(null); setRejectReason(""); }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-black">Reject Payout</h2>
              <p className="text-xs text-white/40">{rejectModal.sellerId?.name} · ₹{rejectModal.amount.toLocaleString()}</p>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Rejection Reason *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="Enter the reason for rejecting this payout…"
              className="w-full bg-[#1c1c24] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/40 transition-all resize-none" />
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={handleReject} disabled={rejectProcessing || !rejectReason.trim()}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              {rejectProcessing ? "Rejecting…" : "✗ Reject Payout"}
            </button>
            <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
              className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* ─── Payout Card ─── */
function PayoutCard({ payout: p, tab, onMarkPaid, onReject }: {
  payout: Payout; tab: Tab;
  onMarkPaid: () => void; onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = p.status as string;

  return (
    <div className={`bg-[#16161e] border rounded-2xl overflow-hidden transition-all ${status === "pending" ? "border-amber-500/15" :
        status === "paid" ? "border-emerald-500/15" :
          "border-red-500/15"
      }`}>
      {/* Card header */}
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start justify-between gap-3 p-5 text-left hover:bg-white/[0.02] transition-all">
        <div className="min-w-0">
          <p className="font-black text-white text-sm leading-tight truncate">{p.sellerId?.name || "Deleted Seller"}</p>
          <p className="text-xs text-white/40 mt-0.5 truncate">{p.sellerId?.email || "N/A"}</p>
          <p className="text-[10px] text-white/25 mt-1">{new Date(p.createdAt).toLocaleString()}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xl font-black ${status === "paid" ? "text-emerald-400" : status === "rejected" ? "text-red-400" : "text-white"}`}>
            ₹{p.amount.toLocaleString()}
          </p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[status] || "bg-white/5 text-white/40 border-white/10"}`}>
            {status}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/[0.04]">
          {/* Bank */}
          {p.primaryBankAccount && (
            <div className="bg-[#1c1c24] border border-white/[0.04] rounded-xl p-3 text-xs space-y-1.5 mt-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> Bank Account Details
              </p>
              <div className="flex justify-between"><span className="text-white/40">Holder</span><span className="font-mono text-white/80">{p.primaryBankAccount.accountHolderName}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Account</span><span className="font-mono text-white/80">{p.primaryBankAccount.accountNumber}</span></div>
              <div className="flex justify-between"><span className="text-white/40">IFSC</span><span className="font-mono text-white/80">{p.primaryBankAccount.ifscCode}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Bank</span><span className="text-white/80">{p.primaryBankAccount.bankName}</span></div>
            </div>
          )}

          {/* Financial breakdown */}
          {p.financialBreakdown && (
            <div className="bg-[#1c1c24] border border-white/[0.04] rounded-xl p-3 text-xs space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1.5">Financial Breakdown</p>
              <div className="flex justify-between"><span className="text-white/40">Requested</span><span className="text-white/80">₹{p.financialBreakdown.requestedAmount.toLocaleString()}</span></div>
              {p.financialBreakdown.gstOnCommission > 0 && (
                <div className="flex justify-between"><span className="text-white/40">GST (18%)</span><span className="text-red-400">-₹{p.financialBreakdown.gstOnCommission.toLocaleString()}</span></div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-white/[0.04] font-black">
                <span>Net Payable</span>
                <span className="text-emerald-400">₹{p.financialBreakdown.netPayableAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* History extra info */}
          {tab === "history" && (
            <div className="bg-[#1c1c24] border border-white/[0.04] rounded-xl p-3 text-xs space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1.5">Resolution</p>
              {p.paidAt && <div className="flex justify-between"><span className="text-white/40">Paid At</span><span className="text-white/80">{new Date(p.paidAt).toLocaleString()}</span></div>}
              {p.paymentReference && <div className="flex justify-between"><span className="text-white/40">UTR Ref</span><span className="font-mono text-white/80">{p.paymentReference}</span></div>}
              {p.paidBy && <div className="flex justify-between"><span className="text-white/40">Processed By</span><span className="text-white/80">{p.paidBy.name}</span></div>}
              {p.rejectionReason && <div className="flex justify-between"><span className="text-white/40">Reason</span><span className="text-red-400 text-right max-w-[60%]">{p.rejectionReason}</span></div>}
            </div>
          )}

          {/* Actions */}
          {tab === "pending" && p.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <button onClick={onMarkPaid}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                ✓ Mark as Paid
              </button>
              <button onClick={onReject}
                className="flex-1 py-2.5 bg-red-600/80 hover:bg-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                ✗ Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Modal wrapper ─── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#16161e] border border-white/[0.08] rounded-3xl w-full max-w-md shadow-2xl p-6"
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
