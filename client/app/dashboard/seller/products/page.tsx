
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";

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
    "w-full rounded-xl bg-[#0b0b14] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition";

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-cyan-400 rounded-full" />
      </main>
    );
  }

  /* ================= RENDER ================= */

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <section className="max-w-6xl mx-auto px-4 py-10 space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black">My Products</h1>
            <p className="text-sm text-white/60">
              {products.length} product{products.length !== 1 && "s"}
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/seller/upload")}
            className="rounded-xl bg-cyan-600/20 border border-cyan-500/30 px-6 py-2.5 font-semibold hover:bg-cyan-600/30 transition"
          >
            + Upload Product
          </button>
        </div>

        {/* GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const approved = p.status === "approved";
            const finalPrice =
              p.discount > 0
                ? Math.max(p.price - (p.price * p.discount) / 100, 0)
                : p.price;

            return (
              <motion.div
                key={p._id}
                whileHover={approved ? { scale: 1.02 } : {}}
                className={`relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition
                  ${approved ? "hover:shadow-[0_0_24px_rgba(34,197,94,0.15)]" : ""}
                `}
              >
                {/* THUMBNAIL */}
                {p.thumbnailUrl && (
                  <div className="relative w-full h-40 bg-white/5">
                    <img
                      src={p.thumbnailUrl}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-5">
                  {/* HEADER */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <p className="text-xs text-white/50 line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>

                    {/* STATUS + MENU */}
                    <div className="flex items-center gap-2">
                      {/* STATUS */}
                      <div className="relative group">
                        <span
                          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border
                            ${
                              approved
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : p.status === "rejected"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              approved ? "bg-green-400" : p.status === "rejected" ? "bg-red-400" : "bg-yellow-400"
                            }`}
                          />
                          {p.status}
                        </span>

                        {!approved && (
                          <div className="absolute hidden group-hover:block top-full mt-2 left-1/2 -translate-x-1/2 text-xs bg-[#0b0b14] border border-white/10 px-3 py-1 rounded-lg">
                            Awaiting admin review
                          </div>
                        )}

                        {approved && p.changeRequest && p.changeRequest !== "none" && (
                          <div className="absolute hidden group-hover:block top-full mt-2 left-1/2 -translate-x-1/2 text-xs bg-[#0b0b14] border border-blue-500/30 px-3 py-1 rounded-lg">
                            {p.changeRequest === "pending_update" ? "Update pending approval" : "Deletion pending approval"}
                          </div>
                        )}
                      </div>

                      {/* CHANGE REQUEST BADGE */}
                      {approved && p.changeRequest && p.changeRequest !== "none" && (
                        <div className="relative group">
                          <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                            {p.changeRequest === "pending_update" ? "Update pending" : "Deletion pending"}
                          </span>
                        </div>
                      )}

                      {/* MENU */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === p._id ? null : p._id)
                          }
                          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/10"
                        >
                          ⋯
                        </button>

                        <AnimatePresence>
                          {openMenuId === p._id && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="absolute right-0 mt-2 w-36 bg-[#0b0b14] border border-white/10 rounded-xl shadow-xl z-20"
                            >
                              <MenuItem
                                label="✏️ Edit"
                                disabled={p.changeRequest === "pending_update" || p.changeRequest === "pending_deletion"}
                                onClick={() => handleEditClick(p)}
                                tooltip={approved && p.changeRequest === "none" ? "Changes require admin approval" : undefined}
                              />
                              <MenuItem
                                label="🗑 Delete"
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
                  </div>

                  {/* PRICE */}
                  <div className="mt-4">
                    {p.discount > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs line-through text-white/40">
                          ₹{p.price}
                        </span>
                        <span className="font-semibold text-cyan-400">
                          ₹{finalPrice}
                        </span>
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                          -{p.discount}%
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-cyan-400">
                        ₹{p.price}
                      </span>
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/50">
                    Uploaded {new Date(p.createdAt).toLocaleDateString()}
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
                    w-full text-sm text-white/70
                    file:mr-4 file:rounded-lg
                    file:border-0 file:bg-cyan-500/20
                    file:px-4 file:py-2
                    file:text-sm file:font-medium
                    file:text-cyan-300
                    hover:file:bg-cyan-500/30
                    cursor-pointer
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
                    w-full text-sm text-white/70
                    file:mr-4 file:rounded-lg
                    file:border-0 file:bg-purple-500/20
                    file:px-4 file:py-2
                    file:text-sm file:font-medium
                    file:text-purple-300
                    hover:file:bg-purple-500/30
                    cursor-pointer
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
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ✕
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
  onClick,
  disabled,
  danger,
  tooltip,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="relative group">
      <button
        onClick={disabled ? undefined : onClick}
        className={`w-full text-left px-3 py-2 text-sm rounded-lg
          ${disabled
            ? "opacity-40 cursor-not-allowed"
            : danger
            ? "text-red-400 hover:bg-red-500/10"
            : "text-white/80 hover:bg-white/5"}
        `}
      >
        {label}
      </button>
      {tooltip && (
        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-max text-xs bg-[#0b0b14] border border-cyan-500/30 text-cyan-300 px-2 py-1 rounded-lg whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  );
}
