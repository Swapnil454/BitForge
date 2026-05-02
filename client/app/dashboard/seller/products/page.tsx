
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import PageHeader from "../../buyer/transactions/components/PageHeader";
import { MoreVertical, Calendar, Package, Plus, Pencil, Trash2, X } from "lucide-react";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

type ProductStatus = "pending" | "approved" | "rejected";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  status: ProductStatus;
  changeRequest?: "none" | "pending_update" | "pending_deletion";
  fileUrl: string;
  fileKey: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export default function MyProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ================= EDIT STATE ================= */
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileError, setEditFileError] = useState("");
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  /* ================= DELETE STATE ================= */
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ================= MENU STATE ================= */
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/mine");
      setProducts(res.data || []);
    } catch {
      showError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  /* ================= HANDLERS ================= */

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setEditTitle(p.title);
    setEditDescription(p.description);
    setEditPrice(p.price);
    setEditDiscount(p.discount);
    setEditFile(null);
    setEditFileError("");
    setEditThumbnail(null);
    setEditThumbnailPreview(p.thumbnailUrl || null);
    setOpenMenuId(null);
  };

  const handleEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setEditFile(null);
      setEditFileError("");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setEditFileError(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      setEditFile(null);
      return;
    }

    setEditFileError("");
    setEditFile(selected);
  };

  const handleEditThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      showError("Thumbnail must be an image file");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      showError("Thumbnail size must be under 5MB");
      return;
    }

    setEditThumbnail(selected);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const removeEditThumbnail = async () => {
    if (!editingProduct) return;

    // If there's a new thumbnail file, just remove the preview
    if (editThumbnail) {
      setEditThumbnail(null);
      setEditThumbnailPreview(editingProduct.thumbnailUrl || null);
      return;
    }

    // If there's an existing thumbnail on the server, delete it
    if (editingProduct.thumbnailUrl) {
      try {
        const formData = new FormData();
        formData.append("title", editTitle);
        formData.append("description", editDescription);
        formData.append("price", editPrice.toString());
        formData.append("discount", editDiscount.toString());
        formData.append("deleteThumbnail", "true");

        const res = await api.patch(`/products/${editingProduct._id}`, formData);
        
        showSuccess("Thumbnail deleted");
        setProducts((p) =>
          p.map((x) => (x._id === editingProduct._id ? res.data.product : x))
        );
        setEditingProduct(res.data.product);
        setEditThumbnailPreview(null);
      } catch (error: any) {
        console.error("Delete thumbnail error:", error);
        showError("Failed to delete thumbnail");
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingProductId(id);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/products/${deletingProductId}`);
      
      // Check if it's a pending deletion request (202 status indicates approval needed)
      if (res.status === 202 || res.data?.changeRequest === "pending_deletion") {
        showSuccess("Deletion submitted for admin approval");
      } else {
        showSuccess("Product deleted");
      }
      
      setProducts((p) => p.filter((x) => x._id !== deletingProductId));
      setDeletingProductId(null);
    } catch {
      showError("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("description", editDescription);
      formData.append("price", editPrice.toString());
      formData.append("discount", editDiscount.toString());
      if (editFile) formData.append("file", editFile);
      if (editThumbnail) formData.append("thumbnail", editThumbnail);

      const res = await api.patch(`/products/${editingProduct._id}`, formData);
      
      // Check if it's a pending update request (202 status indicates approval needed)
      if (res.status === 202 || res.data?.changeRequest === "pending_update") {
        showSuccess("Update submitted for admin approval");
      } else {
        showSuccess("Product updated");
      }

      setProducts((prev) =>
        prev.map((p) => (p._id === editingProduct._id ? res.data.product || p : p))
      );

      setEditingProduct(null);
      setEditThumbnail(null);
      setEditThumbnailPreview(null);
    } catch {
      showError("Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl bg-[#18181b] border border-[#27272a] px-4 py-3 text-sm text-white placeholder:text-zinc-500 hover:border-zinc-600 focus:bg-[#1f1f22] focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all shadow-sm";

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05050a] text-white">
        <PageHeader
          backHref="/dashboard/seller"
          backLabel="Dashboard"
          title="My Products"
        />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col bg-[#0b0b14] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
                {/* Thumbnail Skeleton */}
                <div className="w-full aspect-video bg-white/5" />
                
                {/* Content Skeleton */}
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="h-5 bg-white/10 rounded-md w-3/4" />
                  <div className="space-y-2 mt-1">
                    <div className="h-3 bg-white/10 rounded-md w-full" />
                    <div className="h-3 bg-white/10 rounded-md w-4/5" />
                  </div>
                  
                  {/* Price & Footer Skeleton */}
                  <div className="mt-auto pt-4 flex items-end justify-between border-t border-white/5">
                    <div className="h-7 bg-white/10 rounded-md w-1/3" />
                    <div className="h-3 bg-white/10 rounded-md w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  /* ================= RENDER ================= */

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="My Products"
        subtitle={`${products.length} product${products.length !== 1 ? "s" : ""}`}
        rightSlot={
          <button
            onClick={() => router.push("/dashboard/seller/upload")}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#05050a] px-5 py-2 text-sm font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span className="hidden sm:inline">Upload Product</span>
          </button>
        }
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => {
            const approved = p.status === "approved";
            const finalPrice =
              p.discount > 0
                ? Math.max(p.price - (p.price * p.discount) / 100, 0)
                : p.price;

            return (
              <motion.div
                key={p._id}
                whileHover={approved ? { y: -4 } : {}}
                className={`relative flex flex-col bg-[#0b0b14] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300
                  ${approved ? "hover:border-cyan-500/30 hover:shadow-[0_8px_30px_rgba(6,182,212,0.1)]" : "opacity-90"}
                `}
              >
                {/* THUMBNAIL AREA */}
                <div className="relative w-full aspect-video bg-white/5 group-hover:bg-white/10 transition-colors">
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <Package className="w-12 h-12" />
                    </div>
                  )}

                  {/* OVERLAY GRADIENT */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b14] via-transparent to-transparent opacity-80" />

                  {/* STATUS BADGE OVERLAY */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md border
                        ${
                          approved
                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                            : p.status === "rejected"
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          approved ? "bg-green-400" : p.status === "rejected" ? "bg-red-400" : "bg-amber-400"
                        }`}
                      />
                      {p.status}
                    </span>
                  </div>

                  {/* CHANGE REQUEST OVERLAY */}
                  {approved && p.changeRequest && p.changeRequest !== "none" && (
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                        {p.changeRequest === "pending_update" ? "Update" : "Delete"}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  {/* HEADER */}
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-white truncate">{p.title}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    {/* MENU */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === p._id ? null : p._id)
                        }
                        className="h-8 w-8 grid place-items-center rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {openMenuId === p._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, transformOrigin: "top right" }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-40 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl z-20 overflow-hidden"
                          >
                            <MenuItem
                              label="Edit Details"
                              icon={<Pencil className="w-3.5 h-3.5" />}
                              disabled={p.changeRequest === "pending_update" || p.changeRequest === "pending_deletion"}
                              onClick={() => handleEditClick(p)}
                              tooltip={approved && p.changeRequest === "none" ? "Changes require admin approval" : undefined}
                            />
                            <MenuItem
                              label="Delete Product"
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              danger
                              disabled={p.changeRequest === "pending_update" || p.changeRequest === "pending_deletion"}
                              onClick={() => handleDeleteClick(p._id)}
                              tooltip={approved && p.changeRequest === "none" ? "Deletion requires admin approval" : undefined}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* PRICE & FOOTER STRETCH */}
                  <div className="mt-auto pt-4 flex items-end justify-between border-t border-white/5">
                    <div>
                      {p.discount > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] line-through text-zinc-500 font-medium tracking-wide">
                            ₹{p.price}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-lg text-cyan-400 leading-none">
                              ₹{finalPrice}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md">
                              -{p.discount}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-end h-full pb-0.5">
                          <span className="font-black text-lg text-white leading-none">
                            ₹{p.price}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ================= EDIT MODAL (UNCHANGED STYLE) ================= */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0b0b14] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-black">Edit Product</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-2">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-2">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-2">Price (₹)</label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(+e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-2">Discount (%)</label>
                  <input type="number" value={editDiscount} onChange={(e) => setEditDiscount(+e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-2">Update File (Optional)</label>
                <input
                  type="file"
                  onChange={handleEditFile}
                  className="
                    w-full text-sm text-zinc-400
                    file:mr-4 file:rounded-lg
                    file:border-0 file:bg-[#27272a]
                    file:px-4 file:py-2.5
                    file:text-sm file:font-medium
                    file:text-white
                    hover:file:bg-[#3f3f46]
                    cursor-pointer transition-all
                  "
                />
                {editFile && (
                  <div className="mt-2 text-xs text-white/60">
                    📄 {editFile.name} • {(editFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
                {editFileError && (
                  <p className="text-xs text-red-400 mt-1">{editFileError}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-2">Update Thumbnail (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditThumbnail}
                  className="
                    w-full text-sm text-zinc-400
                    file:mr-4 file:rounded-lg
                    file:border-0 file:bg-[#27272a]
                    file:px-4 file:py-2.5
                    file:text-sm file:font-medium
                    file:text-white
                    hover:file:bg-[#3f3f46]
                    cursor-pointer transition-all
                  "
                />
                {editThumbnailPreview && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={editThumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-32 h-24 object-cover rounded-lg border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={removeEditThumbnail}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingProduct(null)} disabled={editLoading} className="flex-1 py-2 bg-white/10 rounded-lg disabled:opacity-50">Cancel</button>
              <button onClick={handleUpdateProduct} disabled={editLoading} className="flex-1 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-lg disabled:opacity-50">
                {editLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ================= DELETE MODAL ================= */}
      {deletingProductId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div className="bg-[#0b0b14] border border-red-500/20 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-black text-red-400">Delete Product?</h2>
            <p className="text-sm text-white/60">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingProductId(null)} className="flex-1 py-2 bg-white/10 rounded-lg">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="flex-1 py-2 bg-red-600/20 border border-red-500/30 rounded-lg">
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

/* ================= MENU ITEM ================= */

function MenuItem({
  label,
  icon,
  onClick,
  disabled,
  danger,
  tooltip,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="relative group">
      <button
        onClick={disabled ? undefined : onClick}
        className={`w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm transition-colors
          ${disabled
            ? "opacity-40 cursor-not-allowed"
            : danger
            ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
            : "text-zinc-300 hover:bg-white/5 hover:text-white"}
        `}
      >
        {icon}
        {label}
      </button>
      {tooltip && (
        <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-max text-[10px] uppercase font-bold tracking-wider bg-black border border-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          {tooltip}
        </div>
      )}
    </div>
  );
}
