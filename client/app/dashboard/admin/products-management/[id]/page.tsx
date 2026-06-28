"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowUpRight, ChevronLeft, ChevronRight, Copy, Edit2, MoreVertical, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "@/lib/api";

interface Seller {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface RecentPurchase {
  _id: string;
  buyerName: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface Product {
  _id: string;
  slug?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: "approved" | "pending" | "rejected";
  discount?: number;
  thumbnailUrl?: string;
  fileUrl?: string;
  sellerId?: Seller;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  recentPurchases?: RecentPurchase[];
  totalSales?: number;
  totalRevenue?: number;
  avgRating?: number;
  totalViews?: number;
}

const statusPalette = {
  approved: {
    backgroundColor: "#EAF3DE",
    color: "#3B6D11",
    borderColor: "#97C459",
  },
  pending: {
    backgroundColor: "#FAEEDA",
    color: "#854F0B",
    borderColor: "#EF9F27",
  },
  rejected: {
    backgroundColor: "#FCEBEB",
    color: "#A32D2D",
    borderColor: "#F09595",
  },
};

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: 0,
    discount: 0,
    editReason: "",
  });
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Product["status"]>("pending");
  const [statusReason, setStatusReason] = useState("");
  const [statusProcessing, setStatusProcessing] = useState(false);

  const headerMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    if (product) {
      setSelectedStatus(product.status);
      setStatusReason("");
    }
  }, [product]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (headerMenuRef.current && !headerMenuRef.current.contains(target)) {
        setHeaderMenuOpen(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(target)) {
        setStatusMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchProductDetails = async () => {
    try {
      const data = await adminAPI.getProductDetails(productId);
      setProduct(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load product details");
      router.push("/dashboard/admin/products-management");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!product) return;
    setEditFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      discount: product.discount || 0,
      editReason: "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = () => {
    setDeleteReason("");
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const handleEditProduct = async () => {
    if (!editFormData.editReason?.trim()) {
      toast.error("Edit reason is required");
      return;
    }

    if (!editFormData.title?.trim() || editFormData.title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    if (!editFormData.price || editFormData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    if (!product) return;

    setProcessing(true);
    try {
      await adminAPI.editProduct(product._id, editFormData);
      toast.success("Product updated successfully");
      setShowEditModal(false);
      await fetchProductDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to edit product");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;

    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

    if (normalize(deleteConfirmText) !== normalize(product.title)) {
      toast.error(`Type "${product.title}" to confirm deletion`);
      return;
    }

    if (!deleteReason.trim() || deleteReason.trim().length < 5) {
      toast.error("Delete reason must be at least 5 characters");
      return;
    }

    setProcessing(true);
    try {
      await adminAPI.deleteProduct(product._id, deleteReason);
      toast.success("Product deleted successfully");
      router.push("/dashboard/admin/products-management");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async () => {
    if (!product) return;

    if (selectedStatus === product.status) {
      toast.error("Select a different status to continue");
      return;
    }

    if (selectedStatus === "rejected" && !statusReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setStatusProcessing(true);
    try {
      if (selectedStatus === "approved") {
        await adminAPI.approveProduct(product._id);
      } else if (selectedStatus === "pending") {
        await adminAPI.pendingProduct(product._id, statusReason.trim() || undefined);
      } else {
        await adminAPI.rejectProduct(product._id, [statusReason.trim()]);
      }
      toast.success(`Status updated to ${selectedStatus}`);
      setStatusMenuOpen(false);
      setStatusReason("");
      await fetchProductDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setStatusProcessing(false);
    }
  };

  const handleCopyProductId = async () => {
    if (!product) return;
    try {
      await navigator.clipboard.writeText(product._id);
      toast.success("Product ID copied");
    } catch (error) {
      toast.error("Failed to copy product ID");
    }
  };

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const formatDateTime = (value: string) => new Date(value).toLocaleString("en-IN");

  const getStatusLabel = (status: Product["status"], pendingReview = false) => {
    if (status === "pending") return pendingReview ? "Pending Review" : "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (!parts.length) return "S";
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-slate-900 dark:text-white text-xl">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-slate-900 dark:text-white text-xl">Product not found</div>
      </div>
    );
  }

  const discount = product.discount || 0;
  const effectivePrice = discount > 0 ? product.price - (product.price * discount) / 100 : product.price;
  const totalSales = product.totalSales;
  const totalRevenue = product.totalRevenue;
  const avgRating = product.avgRating;
  const totalViews = product.totalViews;
  const recentPurchases = product.recentPurchases || [];
  const productIdDisplay = `${product._id.slice(0, 8)}...${product._id.slice(-6)}`;
  const statusChanged = selectedStatus !== product.status;

  const seller = product.sellerId;

  const approvalHistory = [
    {
      label: "Submitted",
      date: product.createdAt,
      actor: seller?.name || "Seller",
      tone: "submitted",
    },
  ];

  if (product.status !== "pending") {
    approvalHistory.unshift({
      label: getStatusLabel(product.status),
      date: product.updatedAt,
      actor: "Admin",
      tone: product.status === "approved" ? "approved" : "rejected",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white pb-20">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0b0b12]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-white/70 sm:justify-start shrink-0">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Back</span>
              </button>
            </div>

            <div className="text-center sm:justify-self-center min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">{product.title}</h1>
              <p className="text-xs text-slate-500 dark:text-white/55 truncate">
                {product.category} · Created {formatDate(product.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:justify-self-end shrink-0">
              <button
                onClick={openEditModal}
                className="hidden sm:inline-flex h-9 px-4 items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition text-xs font-semibold uppercase tracking-wider"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <div className="relative" ref={headerMenuRef}>
                <button
                  onClick={() => setHeaderMenuOpen((prev) => !prev)}
                  className="h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] inline-flex items-center justify-center hover:border-slate-300 dark:hover:border-white/20 transition"
                  aria-label="Open actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {headerMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14141c] shadow-xl p-1 z-50">
                    <button
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        openEditModal();
                      }}
                      className="sm:hidden w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      Edit Product
                    </button>
                    <button
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        openDeleteModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      Delete Product
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-6">
            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <div className="relative w-full aspect-[14/9] bg-slate-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10">
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-white/20 text-2xl font-semibold">
                      No Image
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70">
                      {product.category}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">{product.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">{formatCurrency(product.price)}</span>
                      <span className="text-xs text-slate-500 dark:text-white/50">base price</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-white/50">{discount}% discount</span>
                        <span className="text-xs text-slate-400 dark:text-white/30">-&gt;</span>
                        <span className="font-mono text-lg">{formatCurrency(effectivePrice)}</span>
                        <span className="text-xs text-slate-500 dark:text-white/50">effective</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category</p>
                  <p className="text-sm font-semibold mt-1">{product.category}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created</p>
                  <p className="text-sm mt-1">{formatDateTime(product.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Updated</p>
                  <p className="text-sm mt-1">{formatDateTime(product.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product ID</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-mono text-slate-600 dark:text-white/70">{productIdDisplay}</span>
                    <button
                      onClick={handleCopyProductId}
                      className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/10 inline-flex items-center justify-center hover:border-slate-300 dark:hover:border-white/20 transition"
                      aria-label="Copy product ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-6 shadow-sm">
              {seller ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/70 flex items-center justify-center font-semibold">
                      {getInitials(seller.name || "Seller")}
                    </div>
                    <div>
                      <p className="text-base font-semibold">{seller.name}</p>
                      <p className="text-sm text-slate-500 dark:text-white/60">{seller.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/admin/users/${seller._id}`)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View Seller Profile
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                  Seller information not available (seller may have been deleted or suspended).
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Recent Purchases {totalSales ? `(${totalSales})` : ""}
                </h3>
                <button
                  onClick={() => router.push(`/dashboard/admin/transactions?productId=${product._id}`)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all orders
                </button>
              </div>
              {recentPurchases.length > 0 ? (
                <div className="mt-4 divide-y divide-slate-100 dark:divide-white/5">
                  {recentPurchases.slice(0, 5).map((purchase) => (
                    <div key={purchase._id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{purchase.buyerName}</p>
                        <p className="text-xs text-slate-500 dark:text-white/50">
                          {formatDate(purchase.createdAt)} · {purchase.status}
                        </p>
                      </div>
                      <span className="font-mono text-sm">{formatCurrency(purchase.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500 dark:text-white/60">No purchases yet.</p>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approval Status</p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={statusPalette[product.status]}
                >
                  {getStatusLabel(product.status)}
                </span>
              </div>
              <div className="mt-4 relative" ref={statusMenuRef}>
                <button
                  onClick={() => setStatusMenuOpen((prev) => !prev)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-700 dark:text-white/80 hover:border-slate-300 dark:hover:border-white/20 transition"
                >
                  Change Status
                </button>
                {statusMenuOpen && (
                  <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14141c] shadow-xl p-2 z-40">
                    {(["pending", "approved", "rejected"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status);
                          setStatusMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition ${
                          selectedStatus === status
                            ? "bg-slate-100 dark:bg-white/10"
                            : "hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {getStatusLabel(status, true)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {statusChanged && (
                <p className="mt-2 text-xs text-slate-500 dark:text-white/60">
                  Selected: {getStatusLabel(selectedStatus, true)}
                </p>
              )}
              {selectedStatus === "rejected" && statusChanged && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(event) => setStatusReason(event.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-500/40 resize-none"
                    placeholder="Provide a reason for rejection"
                  />
                </div>
              )}
              {product.status === "rejected" && product.rejectionReason && (
                <p className="mt-3 text-xs text-rose-600 dark:text-rose-300">
                  Current rejection reason: {product.rejectionReason}
                </p>
              )}
              {statusChanged && (
                <button
                  onClick={handleStatusChange}
                  disabled={statusProcessing}
                  className="mt-4 w-full h-10 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {statusProcessing ? "Updating..." : "Confirm Status Change"}
                </button>
              )}
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product Performance</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.03] p-3">
                  <p className="text-xs text-slate-400">Total Sales</p>
                  <p className="font-semibold">{typeof totalSales === "number" ? totalSales : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.03] p-3">
                  <p className="text-xs text-slate-400">Revenue</p>
                  <p className="font-mono">
                    {typeof totalRevenue === "number" ? formatCurrency(totalRevenue) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.03] p-3">
                  <p className="text-xs text-slate-400">Avg Rating</p>
                  <p className="font-semibold" title="Coming soon">
                    {typeof avgRating === "number" ? avgRating.toFixed(1) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.03] p-3">
                  <p className="text-xs text-slate-400">Total Views</p>
                  <p className="font-semibold" title="Coming soon">
                    {typeof totalViews === "number" ? totalViews : "—"}
                  </p>
                </div>
              </div>
              {typeof totalSales === "number" && totalSales === 0 && (
                <p className="mt-3 text-xs text-slate-500 dark:text-white/60">No sales yet.</p>
              )}
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approval History</p>
              <div className="mt-4 space-y-3">
                {approvalHistory.map((entry, index) => {
                  const dotClass =
                    entry.tone === "approved"
                      ? "bg-emerald-500"
                      : entry.tone === "rejected"
                        ? "bg-rose-500"
                        : "bg-slate-400 dark:bg-white/40";
                  return (
                    <div key={`${entry.label}-${index}`} className="flex items-start gap-3">
                      <span className={`mt-1 h-2 w-2 rounded-full ${dotClass}`} />
                      <div>
                        <p className="text-sm font-semibold">{entry.label}</p>
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          {formatDate(entry.date)} — {entry.actor}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-6 shadow-sm">
              <button
                onClick={openEditModal}
                className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Edit Product
              </button>
              <a
                href={`/product/${product.slug || product._id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 inline-flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-white/80 hover:border-slate-300 dark:hover:border-white/20 transition"
              >
                View on Marketplace
              </a>
              <div className="my-4 border-t border-slate-100 dark:border-white/5" />
              <button
                onClick={openDeleteModal}
                className="text-sm font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
              >
                Delete Product
              </button>
            </section>
          </aside>
        </div>

        <AnimatePresence>
          {showEditModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditModal(false)}
                className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-[900]"
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:w-[480px] bg-white dark:bg-[#16161e] shadow-2xl border-l border-slate-200 dark:border-white/10 z-[1000] flex flex-col"
              >
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                  <h2 className="text-lg font-bold">Edit Product</h2>
                  <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer body */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Product Title</label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                        placeholder="Enter product title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none resize-none"
                        placeholder="Enter product description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Price (₹)</label>
                        <input
                          type="number"
                          value={editFormData.price}
                          onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                          className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Discount (%)</label>
                        <input
                          type="number"
                          value={editFormData.discount}
                          onChange={(e) => setEditFormData({ ...editFormData, discount: Number(e.target.value) })}
                          className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Edit Reason *</label>
                      <textarea
                        value={editFormData.editReason}
                        onChange={(e) => setEditFormData({ ...editFormData, editReason: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none resize-none"
                        placeholder="Explain why you're editing this product (required)"
                      />
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-5 pb-8 sm:pb-5 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#16161e] flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditProduct}
                    disabled={processing}
                    className="flex-[2] px-4 py-2.5 bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeleteModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteModal(false)}
                className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-[900]"
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:w-[480px] bg-white dark:bg-[#16161e] shadow-2xl border-l border-slate-200 dark:border-white/10 z-[1000] flex flex-col"
              >
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                  <h2 className="text-lg font-bold text-rose-600">Delete Product</h2>
                  <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer body */}
                <div className="flex-1 overflow-y-auto p-5">
                  <p className="text-sm text-slate-500 dark:text-white/60 mb-6">This action cannot be undone.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Type "{product.title}" to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Delete Reason *</label>
                      <textarea
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none resize-none"
                        placeholder="Explain why you're deleting this product (minimum 5 characters)"
                      />
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-5 pb-8 sm:pb-5 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#16161e] flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    disabled={processing}
                    className="flex-[2] px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? "Deleting..." : "Delete Product"}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
