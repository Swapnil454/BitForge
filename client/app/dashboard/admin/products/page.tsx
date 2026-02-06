"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";

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

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchNew(), fetchChanges()]);
    setLoading(false);
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

  return (
    <div className="min-h-screen bg-black text-white px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="text-cyan-400 text-sm mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Product Moderation</h1>
          <p className="text-white/60">Approve products & review changes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setActiveTab("new");
              clearSelection();
            }}
            className={`px-4 py-2 rounded-xl border ${
              activeTab === "new"
                ? "bg-cyan-500/20 border-cyan-400/40"
                : "bg-white/5 border-white/10"
            }`}
          >
            New Products ({products.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("changes");
              clearSelection();
            }}
            className={`px-4 py-2 rounded-xl border ${
              activeTab === "changes"
                ? "bg-purple-500/20 border-purple-400/40"
                : "bg-white/5 border-white/10"
            }`}
          >
            Pending Changes ({changes.length})
          </button>
        </div>

        {/* Bulk bar */}
        {activeTab === "changes" && selected.length > 0 && (
          <div className="flex gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-sm text-white/70">
              {selected.length} selected
            </span>
            <button onClick={bulkApprove} className="text-green-400">
              Approve (A)
            </button>
            <button onClick={bulkReject} className="text-red-400">
              Reject (R)
            </button>
          </div>
        )}

        {/* Content - New products */}
        {!loading && activeTab === "new" && (
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-white/70">
                No new products awaiting approval.
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
                        className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-400/40 text-green-300 text-sm disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectPendingProduct(p._id)}
                        disabled={processingId === p._id}
                        className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-sm disabled:opacity-60"
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
                    </div>

                    {p.pendingChanges && (
                      <div className="space-y-2">
                        <DiffRow label="Title" oldValue={p.title} newValue={p.pendingChanges.title} />
                        <DiffRow label="Description" oldValue={p.description} newValue={p.pendingChanges.description} />
                        <DiffRow label="Price" oldValue={p.price} newValue={p.pendingChanges.price} />
                        <DiffRow label="Discount" oldValue={p.discount} newValue={p.pendingChanges.discount} />
                      </div>
                    )}

                    {/* INLINE ACTIONS */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => approveOne(p._id)}
                        disabled={processingId === p._id}
                        className="px-3 py-1.5 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectOne(p._id)}
                        disabled={processingId === p._id}
                        className="px-3 py-1.5 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300"
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

      </div>
    </div>
  );
}
