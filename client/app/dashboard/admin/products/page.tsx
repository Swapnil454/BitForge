"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";
import { RefreshCw } from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

/* ================= TYPES ================= */

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  changeRequest?: "pending_update" | "pending_deletion";
  pendingChanges?: Partial<Product>;
  sellerId: {
    email: string;
  };
}

type TabType = "new" | "changes";

/* ================= DIFF ROW ================= */

function DiffRow({
  label,
  oldValue,
  newValue,
}: {
  label: string;
  oldValue: any;
  newValue: any;
}) {
  if (oldValue === newValue) return null;

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3">
        <div className="text-xs text-red-300 mb-1">Old {label}</div>
        <div>{oldValue ?? "-"}</div>
      </div>
      <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-3">
        <div className="text-xs text-green-300 mb-1">New {label}</div>
        <div>{newValue ?? "-"}</div>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function AdminProductsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("new");
  const [products, setProducts] = useState<Product[]>([]);
  const [changes, setChanges] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* ================= AUTH ================= */

  useEffect(() => {
    const user = getStoredUser<{ role?: string }>();
    if (!user || user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    loadAll();
  }, []);

  /* ================= FETCH ================= */

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    await Promise.all([fetchNew(), fetchChanges()]);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchNew = async () => {
    const res = await adminAPI.getPendingProducts();
    setProducts(Array.isArray(res) ? res : res.products || []);
  };

  const fetchChanges = async () => {
    const res = await adminAPI.getPendingProductChanges();
    setChanges(Array.isArray(res) ? res : res.products || []);
  };

  /* ================= SELECT ================= */

  const toggleSelect = (id: string) => {
    setSelected(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    );
  };

  const clearSelection = () => setSelected([]);

  /* ================= ACTIONS ================= */

  // Actions for brand new pending products
  const approvePendingProduct = async (id: string) => {
    setProcessingId(id);
    try {
      await adminAPI.approveProduct(id);
      toast.success("Product approved");
      await fetchNew();
    } catch {
      toast.error("Failed to approve product");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectPendingProduct = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;

    setProcessingId(id);
    try {
      await adminAPI.rejectProduct(id, reason);
      toast.success("Product rejected");
      await fetchNew();
    } catch {
      toast.error("Failed to reject product");
    } finally {
      setProcessingId(null);
    }
  };

  const approveOne = async (id: string) => {
    setProcessingId(id);
    try {
      await adminAPI.approveProductChange(id);
      toast.success("Change approved");
      fetchChanges();
    } catch {
      toast.error("Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectOne = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;

    setProcessingId(id);
    try {
      await adminAPI.rejectProductChange(id, reason);
      toast.success("Change rejected");
      fetchChanges();
    } catch {
      toast.error("Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  const bulkApprove = async () => {
    if (selected.length === 0) return;
    for (const id of selected) {
      await adminAPI.approveProductChange(id);
    }
    toast.success("Bulk approve done");
    clearSelection();
    fetchChanges();
  };

  const bulkReject = async () => {
    if (selected.length === 0) return;
    const reason = prompt("Rejection reason for all:");
    if (!reason) return;

    for (const id of selected) {
      await adminAPI.rejectProductChange(id, reason);
    }
    toast.success("Bulk reject done");
    clearSelection();
    fetchChanges();
  };

  /* ================= KEYBOARD ================= */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeTab !== "changes") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      if (e.key.toLowerCase() === "a") {
        bulkApprove();
      }
      if (e.key.toLowerCase() === "r") {
        bulkReject();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, activeTab]);

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a]">
        <div className="h-16 w-full border-b border-white/[0.05] bg-[#0a0a0f]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-pulse">
          <div className="flex gap-3">
            <div className="h-10 w-36 bg-[#16161e] rounded-xl" />
            <div className="h-10 w-40 bg-[#16161e] rounded-xl" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#16161e] border border-white/[0.05] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-white/[0.04] rounded-lg" />
                  <div className="h-3 w-64 bg-white/[0.03] rounded-md" />
                  <div className="h-3 w-40 bg-white/[0.03] rounded-md" />
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-20 bg-white/[0.04] rounded-lg" />
                  <div className="h-9 w-20 bg-white/[0.04] rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#05050a] text-white pb-24">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Back"
        title="Product Moderation"
        subtitle="Approve products & review changes"
        rightSlot={
          <button
            onClick={() => loadAll(true)}
            disabled={refreshing}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        }
      />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-5">

        {/* Tabs */}
        <div className="flex bg-[#16161e] rounded-2xl p-1 gap-1 border border-white/[0.05]">
          <button
            onClick={() => {
              setActiveTab("new");
              clearSelection();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "new"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span>New Products</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeTab === "new" ? "bg-white/20 text-white" : "bg-white/10 text-white/70"
                }`}
              >
                {products.length}
              </span>
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("changes");
              clearSelection();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "changes"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span>Pending Changes</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeTab === "changes" ? "bg-white/20 text-white" : "bg-white/10 text-white/70"
                }`}
              >
                {changes.length}
              </span>
            </span>
          </button>
        </div>

        {/* Bulk bar */}
        {activeTab === "changes" && selected.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-[#16161e] border border-white/[0.06] rounded-xl p-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
              {selected.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={bulkApprove}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-xs font-black uppercase tracking-widest transition-all"
              >
                Approve (A)
              </button>
              <button
                onClick={bulkReject}
                className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-xs font-black uppercase tracking-widest transition-all"
              >
                Reject (R)
              </button>
            </div>
          </div>
        )}

        {/* Content - New products */}
        {!loading && activeTab === "new" && (
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="min-h-[52vh] flex items-center justify-center">
                <p className="text-lg font-semibold tracking-wide text-white/70 md:text-xl">
                  No new products awaiting approval.
                </p>
              </div>
            ) : (
              products.map(p => (
                <div
                  key={p._id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{p.title}</h3>
                      <p className="text-sm text-white/60 line-clamp-3">{p.description}</p>
                      <p className="text-sm text-white/60">
                        Seller: <span className="font-medium">{p.sellerId?.email}</span>
                      </p>
                      <div className="flex gap-3 text-sm text-white/80">
                        <span>Price: ₹{p.price}</span>
                        {typeof p.discount === "number" && p.discount > 0 && (
                          <span>Discount: {p.discount}%</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 sm:flex-col sm:items-end">
                      <button
                        onClick={() => approvePendingProduct(p._id)}
                        disabled={processingId === p._id}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectPendingProduct(p._id)}
                        disabled={processingId === p._id}
                        className="px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Content - Pending change requests */}
        {!loading && activeTab === "changes" && (
          <div className="space-y-4">
            {changes.map(p => (
              <div
                key={p._id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(p._id)}
                    onChange={() => toggleSelect(p._id)}
                  />

                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="text-sm text-white/60">
                        Seller: {p.sellerId.email}
                      </p>
                      {p.changeRequest && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs
                          border-white/15 bg-white/5 text-white/80">
                          <span className="h-2 w-2 rounded-full bg-purple-400" />
                          <span>
                            {p.changeRequest === "pending_update"
                              ? "Update request"
                              : p.changeRequest === "pending_deletion"
                              ? "Deletion request"
                              : "Change request"}
                          </span>
                        </div>
                      )}
                    </div>

                    {p.changeRequest === "pending_update" && p.pendingChanges && (
                      <div className="space-y-2">
                        <p className="text-xs text-white/50 uppercase tracking-wide">
                          Requested field changes
                        </p>
                        <DiffRow label="Title" oldValue={p.title} newValue={p.pendingChanges.title} />
                        <DiffRow label="Description" oldValue={p.description} newValue={p.pendingChanges.description} />
                        <DiffRow label="Price" oldValue={p.price} newValue={p.pendingChanges.price} />
                        <DiffRow label="Discount" oldValue={p.discount} newValue={p.pendingChanges.discount} />
                      </div>
                    )}

                    {p.changeRequest === "pending_deletion" && (
                      <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                        The seller has requested this product to be permanently
                        deleted from the marketplace.
                      </div>
                    )}

                    {/* INLINE ACTIONS */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => approveOne(p._id)}
                        disabled={processingId === p._id}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectOne(p._id)}
                        disabled={processingId === p._id}
                        className="px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}
