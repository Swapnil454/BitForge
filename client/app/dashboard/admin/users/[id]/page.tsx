"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeft, Shield, ShieldBan, Trash2, Mail, Calendar,
  ShoppingBag, DollarSign, Package, AlertTriangle, Check,
  ChevronLeft, ChevronRight, Edit2, Save, X, RefreshCw,
  TrendingUp, Clock, User, BadgeCheck, Activity,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────── */
interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  accountStatus: "active" | "banned" | "deleted";
  bannedReason?: string;
  productLimit: number;
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
  profilePictureUrl?: string;
  avatar?: string;
  authProvider?: string;
  totalSalesCount?: number;
  averageRating?: number;
}

interface Transaction {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  date?: string;
  productName?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderId?: string;
  seller?: { name: string };
  sellerName?: string;
  buyerName?: string;
  type?: string;
}

/* ─── Helpers ─────────────────────────────────────────────────── */
const avatarColors = [
  { bg: "#dbeafe", text: "#1d4ed8" }, { bg: "#dcfce7", text: "#15803d" },
  { bg: "#fce7f3", text: "#be185d" }, { bg: "#fef3c7", text: "#b45309" },
  { bg: "#ede9fe", text: "#6d28d9" }, { bg: "#ffedd5", text: "#c2410c" },
];
const getAvatarStyle = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

const timeSince = (date?: string) => {
  if (!date) return "—";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  if (s < 31536000) return `${Math.floor(s / 2592000)} months ago`;
  return `${Math.floor(s / 31536000)}y ago`;
};

const statusBadge = (status: string) => {
  if (status === "paid" || status === "completed" || status === "success")
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"><Check className="w-2.5 h-2.5" />{status}</span>;
  if (status === "pending")
    return <span className="inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">{status}</span>;
  return <span className="inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white/40">{status}</span>;
};

/* ─── Component ───────────────────────────────────────────────── */
export default function AdminUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params?.id as string;
  const requestedRole = searchParams.get("role");

  /* --- State --- */
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<{ totalOrders?: number; totalProducts?: number; totalSpent?: number }>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const TX_LIMIT = 10;

  /* --- Confirm dialogs --- */
  const [confirmDialog, setConfirmDialog] = useState<null | "suspend" | "unsuspend" | "delete">(null);
  const [confirmReason, setConfirmReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  /* --- Limit editing --- */
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitValue, setLimitValue] = useState<number>(10);
  const [limitLoading, setLimitLoading] = useState(false);

  /* ─── Fetch user ── */
  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await adminAPI.getUserById(userId);
      setUser(data.user);
      setStats(data.stats || {});
      setLimitValue(data.user.productLimit ?? 10);
    } catch {
      toast.error("Failed to load user");
      router.push(requestedRole === "seller" ? "/dashboard/admin/users/sellers" : "/dashboard/admin/users");
    } finally {
      setLoading(false);
    }
  }, [requestedRole, router, userId]);

  /* ─── Fetch transactions ── */
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setTxLoading(true);
    try {
      const data = await adminAPI.getAllTransactions({
        page: txPage,
        limit: TX_LIMIT,
        userId: user._id,
      });
      const allTx: Transaction[] = (data.transactions || []).map((tx: Transaction) => ({
        ...tx,
        createdAt: tx.createdAt || tx.date || new Date().toISOString(),
      }));
      setTransactions(allTx);
      setTxTotal(data.pagination?.total || 0);
    } catch {
      /* ignore silently */
    } finally {
      setTxLoading(false);
    }
  }, [userId, txPage, user?.email]);

  useEffect(() => { fetchUser(); }, [fetchUser]);
  useEffect(() => {
    if (user) fetchTransactions();
  }, [fetchTransactions, txPage, user]);

  /* ─── Actions ── */
  const handleSuspend = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await adminAPI.suspendUser(user._id, confirmReason || "Violation of terms");
      toast.success("Account suspended");
      setConfirmDialog(null);
      setConfirmReason("");
      await fetchUser();
    } catch {
      toast.error("Failed to suspend account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await adminAPI.unbanUser(user._id);
      toast.success("Account reinstated");
      setConfirmDialog(null);
      await fetchUser();
    } catch {
      toast.error("Failed to reinstate account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await adminAPI.deleteUser(user._id);
      toast.success("Account deleted");
      router.push(listRoute);
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveLimit = async () => {
    if (!user) return;
    setLimitLoading(true);
    try {
      await adminAPI.updateUserLimit(user._id, limitValue);
      toast.success("Product limit updated");
      setEditingLimit(false);
      await fetchUser();
    } catch {
      toast.error("Failed to update limit");
    } finally {
      setLimitLoading(false);
    }
  };

  /* ─── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isSuspended = user.accountStatus === "banned";
  const isDeleted = user.accountStatus === "deleted";
  const avatarStyle = getAvatarStyle(user.name);
  const totalPages = Math.ceil(txTotal / TX_LIMIT);
  const listRoute =
    user.role === "seller" || requestedRole === "seller"
      ? "/dashboard/admin/users/sellers"
      : "/dashboard/admin/users";
  const listLabel = listRoute.endsWith("/sellers") ? "Back to Sellers" : "Back to Buyers";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#0d0d14] border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(listRoute)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-white/50 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {listLabel}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#12121a] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden"
        >
          {/* Top accent bar */}
          <div className={`h-1.5 w-full ${isSuspended ? "bg-amber-500" : isDeleted ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`} />
          
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0 shadow-lg"
              style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
            >
              {user.name[0]?.toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{user.name}</h1>
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                {isSuspended && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    <ShieldBan className="w-3 h-3" /> Suspended
                  </span>
                )}
                {isDeleted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                    <X className="w-3 h-3" /> Deleted
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-white/50 flex items-center gap-1.5 mb-3">
                <Mail className="w-4 h-4" />{user.email}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-white/40">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Role: <strong className="text-slate-700 dark:text-white/70 capitalize">{user.role}</strong></span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined: <strong className="text-slate-700 dark:text-white/70">{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
                <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Last seen: <strong className="text-slate-700 dark:text-white/70">{timeSince(user.lastActiveAt || user.updatedAt)}</strong></span>
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Auth: <strong className="text-slate-700 dark:text-white/70 capitalize">{user.authProvider || "local"}</strong></span>
              </div>
              {isSuspended && user.bannedReason && (
                <div className="mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                  <strong>Suspension reason:</strong> {user.bannedReason}
                </div>
              )}
            </div>

            {/* ID */}
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider mb-1">User ID</p>
              <p className="text-xs font-mono text-slate-600 dark:text-white/50 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">{user._id}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { icon: ShoppingBag, label: "Total Orders", value: stats.totalOrders ?? 0, color: "from-indigo-500/20 to-violet-500/20", iconColor: "text-indigo-500" },
            { icon: DollarSign, label: "Total Spent", value: `₹${(stats.totalSpent ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-500" },
            { icon: Package, label: user.role === "seller" ? "Products Listed" : "Purchases", value: stats.totalProducts ?? (stats.totalOrders ?? "—"), color: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-500" },
            { icon: TrendingUp, label: user.role === "seller" ? "Upload Limit" : "Last Active", value: user.role === "seller" ? (user.productLimit ?? 10) : timeSince(user.lastActiveAt || user.updatedAt), color: "from-rose-500/20 to-pink-500/20", iconColor: "text-rose-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl border border-white/50 dark:border-white/10 p-5 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-white/50 font-medium mb-0.5">{s.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Management Controls Row ── */}
        <div className={`grid grid-cols-1 ${user.role === "seller" ? "md:grid-cols-2" : ""} gap-4`}>

          {/* Product Limit Card */}
          {user.role === "seller" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#12121a] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Product Upload Limit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/40">
                    Max products this user can list
                  </p>
                </div>
              </div>
              {!editingLimit ? (
                <button
                  onClick={() => { setEditingLimit(true); setLimitValue(user.productLimit ?? 10); }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setEditingLimit(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {editingLimit ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-xl px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={limitValue}
                    onChange={(e) => setLimitValue(Number(e.target.value))}
                    className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-lg focus:outline-none"
                    autoFocus
                  />
                  <span className="text-xs text-slate-400 dark:text-white/30 shrink-0">
                    products
                  </span>
                </div>
                <button
                  onClick={handleSaveLimit}
                  disabled={limitLoading}
                  className="flex items-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {limitLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{user.productLimit ?? 10}</span>
                <span className="text-sm text-slate-400 dark:text-white/30">
                  products
                </span>
              </div>
            )}
          </motion.div>
          )}

          {/* Account Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white dark:bg-[#12121a] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSuspended ? "bg-amber-100 dark:bg-amber-500/20" : "bg-emerald-100 dark:bg-emerald-500/20"}`}>
                <Shield className={`w-5 h-5 ${isSuspended ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Account Status</h3>
                <p className="text-xs text-slate-500 dark:text-white/40">Control user access to the platform</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                  isSuspended ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                  : isDeleted ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isSuspended ? "bg-amber-500" : isDeleted ? "bg-rose-500" : "bg-emerald-500"}`} />
                  {isSuspended ? "Suspended" : isDeleted ? "Deleted" : "Active"}
                </div>
              </div>
              {!isDeleted && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDialog(isSuspended ? "unsuspend" : "suspend")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isSuspended
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "border border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    }`}
                  >
                    {isSuspended ? "Reinstate" : "Suspend"}
                  </button>
                  <button
                    onClick={() => setConfirmDialog("delete")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-rose-400 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Transactions Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-[#12121a] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Transaction History</h2>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">{txTotal} total transactions</p>
            </div>
            <button
              onClick={fetchTransactions}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${txLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0d0d14]">
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {txLoading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag className="w-5 h-5 text-slate-400 dark:text-white/20" />
                      </div>
                      <p className="text-sm text-slate-400 dark:text-white/30 font-medium">No transactions yet</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-[#16161e] transition-colors">
                      <td className="px-6 py-3">
                        <span className="text-xs font-mono text-slate-500 dark:text-white/40">
                          {tx.orderId || tx.razorpayOrderId?.slice(-8) || tx._id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-slate-800 dark:text-white/80 truncate max-w-[200px]">
                          {tx.productName || "—"}
                        </p>
                        {(tx.seller?.name || tx.sellerName || tx.buyerName) && (
                          <p className="text-xs text-slate-400 dark:text-white/30">
                            {tx.seller?.name || tx.sellerName || tx.buyerName}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-white/40">
                          <Clock className="w-3 h-3" />
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </td>
                      <td className="px-6 py-3">{statusBadge(tx.status)}</td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0a0a0f] flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-white/40">
                Page {txPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setTxPage((p) => Math.max(1, p - 1))} disabled={txPage === 1}
                  className="p-1.5 rounded bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-indigo-500 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))} disabled={txPage === totalPages}
                  className="p-1.5 rounded bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-indigo-500 disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Confirmation Dialogs ── */}
      <AnimatePresence>
        {confirmDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
              onClick={() => { setConfirmDialog(null); setConfirmReason(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#16161e] rounded-2xl p-6 z-[201] shadow-2xl border border-slate-200 dark:border-white/10"
            >
              {/* Suspend */}
              {confirmDialog === "suspend" && (
                <>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                      <ShieldBan className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Suspend Account</h3>
                      <p className="text-sm text-slate-500 dark:text-white/40">{user.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-white/60 mb-4">
                    This will block the user from accessing the platform. You can reinstate them at any time.
                  </p>
                  <textarea
                    placeholder="Reason for suspension (optional)"
                    value={confirmReason}
                    onChange={(e) => setConfirmReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 mb-4 resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => { setConfirmDialog(null); setConfirmReason(""); }}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSuspend} disabled={actionLoading}
                      className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldBan className="w-4 h-4" />}
                      Suspend Account
                    </button>
                  </div>
                </>
              )}

              {/* Unsuspend */}
              {confirmDialog === "unsuspend" && (
                <>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reinstate Account</h3>
                      <p className="text-sm text-slate-500 dark:text-white/40">{user.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-white/60 mb-5">
                    This will restore the user&apos;s access to the platform. They will be notified by email.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDialog(null)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleUnsuspend} disabled={actionLoading}
                      className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Reinstate Account
                    </button>
                  </div>
                </>
              )}

              {/* Delete */}
              {confirmDialog === "delete" && (
                <>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Account</h3>
                      <p className="text-sm text-slate-500 dark:text-white/40">{user.email}</p>
                    </div>
                  </div>
                  <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-rose-700 dark:text-rose-400">
                      This action is a soft-delete. The account data will be retained but the user will lose access permanently.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDialog(null)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleDelete} disabled={actionLoading}
                      className="flex-1 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete Account
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
