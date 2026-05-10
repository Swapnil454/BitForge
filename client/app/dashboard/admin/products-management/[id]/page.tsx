"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import { Edit2, Trash2, Image as ImageIcon, Info, User, AlertCircle } from "lucide-react";

interface Seller {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: "approved" | "pending" | "rejected";
  discount?: number;
  thumbnailUrl?: string;
  fileUrl?: string;
  sellerId: Seller;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

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

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

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
    if (!deleteReason.trim() || deleteReason.trim().length < 5) {
      toast.error("Delete reason must be at least 5 characters");
      return;
    }

    if (!product) return;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "rejected":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white pb-20">
      <PageHeader
        backHref="/dashboard/admin/products-management"
        backLabel="Back"
        title="Product Details"
        subtitle={`Managing ${product.title}`}
        rightSlot={
          <div className="flex items-center gap-2 pr-1">
            <span className={`h-9 px-3 flex items-center justify-center text-[10px] font-black uppercase tracking-widest rounded-xl border ${getStatusColor(product.status)}`}>
              {product.status}
            </span>
            <button
              onClick={openEditModal}
              className="h-9 px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/30"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={openDeleteModal}
              className="h-9 px-4 flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/30"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        }
      />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Product Images */}
        <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Product Asset</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {product.thumbnailUrl && (
              <div className="relative group">
                <img
                  src={product.thumbnailUrl}
                  alt="Product Thumbnail"
                  className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-white/10"
                />
              </div>
            )}
            {!product.thumbnailUrl && (
              <div className="w-full h-48 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10">
                <span className="text-6xl"></span>
              </div>
            )}
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Product Information</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-slate-500 dark:text-white/60 text-sm">Product Name</label>
              <p className="text-lg font-semibold">{product.title}</p>
            </div>
            <div>
              <label className="text-slate-500 dark:text-white/60 text-sm">Description</label>
              <p className="text-slate-800 dark:text-white/90">{product.description}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-500 dark:text-white/60 text-sm">Price</label>
                <p className="text-lg font-semibold text-cyan-400">₹{product.price.toLocaleString()}</p>
              </div>
              {product.discount && (
                <div>
                  <label className="text-slate-500 dark:text-white/60 text-sm">Discount</label>
                  <p className="text-lg font-semibold text-green-400">{product.discount}%</p>
                </div>
              )}
              <div>
                <label className="text-slate-500 dark:text-white/60 text-sm">Category</label>
                <p className="text-lg font-semibold">{product.category}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-500 dark:text-white/60 text-sm">Created At</label>
                <p className="text-slate-800 dark:text-white/90">{new Date(product.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-slate-500 dark:text-white/60 text-sm">Last Updated</label>
                <p className="text-slate-800 dark:text-white/90">{new Date(product.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Reason (if rejected) */}
        {product.rejectionReason && (
          <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-rose-600 dark:text-rose-400">Rejection Reason</h2>
            </div>
            <p className="text-slate-700 dark:text-white/80 leading-relaxed pl-14">{product.rejectionReason}</p>
          </div>
        )}

        {/* Seller Information */}
        <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Seller Identity</h2>
          </div>
          {product.sellerId ? (
            <div className="space-y-3">
              <div>
                <label className="text-slate-500 dark:text-white/60 text-sm">Seller Name</label>
                <p className="text-lg font-semibold">{product.sellerId.name}</p>
              </div>
              <div>
                <label className="text-slate-500 dark:text-white/60 text-sm">Email</label>
                <p className="text-slate-800 dark:text-white/90">{product.sellerId.email}</p>
              </div>
              {product.sellerId.phone && (
                <div>
                  <label className="text-slate-500 dark:text-white/60 text-sm">Phone</label>
                  <p className="text-slate-800 dark:text-white/90">{product.sellerId.phone}</p>
                </div>
              )}
              <div>
                <label className="text-slate-500 dark:text-white/60 text-sm">Seller ID</label>
                <p className="text-slate-600 dark:text-white/70 text-sm font-mono">{product.sellerId._id}</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-amber-600 dark:text-amber-400 font-medium">Seller information not available (seller may have been deleted or account suspended).</p>
            </div>
          )}
        </div>

        {/* EDIT MODAL */}
        {showEditModal && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 shadow-2xl rounded-xl max-w-2xl w-full p-8">
              <h2 className="text-2xl font-bold mb-6">✏️ Edit Product</h2>
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
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditProduct}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 shadow-2xl rounded-xl max-w-md w-full p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4"></div>
                <h2 className="text-2xl font-bold text-red-400">Delete Product</h2>
                <p className="text-slate-500 dark:text-white/60 mt-2">This action cannot be undone</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Delete Reason *</label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-red-500 focus:outline-none resize-none"
                  placeholder="Explain why you're deleting this product (minimum 5 characters)"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteProduct}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Deleting..." : "Delete Product"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
