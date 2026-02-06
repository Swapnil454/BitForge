"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";

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
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "✅";
      case "pending":
        return "⏳";
      case "rejected":
        return "❌";
      default:
        return "📦";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] flex items-center justify-center">
        <div className="text-white text-xl">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] flex items-center justify-center">
        <div className="text-white text-xl">Product not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/admin/products-management")}
            className="mb-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm flex items-center gap-2"
          >
            ← Back to Products
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-bold">Product Details</h1>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 text-sm rounded-full border ${getStatusColor(product.status)}`}>
                {getStatusBadge(product.status)} {product.status.toUpperCase()}
              </span>
              <button
                onClick={openEditModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-semibold"
              >
                ✏️ Edit Product
              </button>
              <button
                onClick={openDeleteModal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-semibold"
              >
                🗑️ Delete Product
              </button>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📷 Product Image</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {product.thumbnailUrl && (
              <div className="relative group">
                <img
                  src={product.thumbnailUrl}
                  alt="Product Thumbnail"
                  className="w-full h-48 object-cover rounded-lg border border-white/10"
                />
              </div>
            )}
            {!product.thumbnailUrl && (
              <div className="w-full h-48 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <span className="text-6xl">📦</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📋 Product Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm">Product Name</label>
              <p className="text-lg font-semibold">{product.title}</p>
            </div>
            <div>
              <label className="text-white/60 text-sm">Description</label>
              <p className="text-white/90">{product.description}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white/60 text-sm">Price</label>
                <p className="text-lg font-semibold text-cyan-400">₹{product.price.toLocaleString()}</p>
              </div>
              {product.discount && (
                <div>
                  <label className="text-white/60 text-sm">Discount</label>
                  <p className="text-lg font-semibold text-green-400">{product.discount}%</p>
                </div>
              )}
              <div>
                <label className="text-white/60 text-sm">Category</label>
                <p className="text-lg font-semibold">{product.category}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm">Created At</label>
                <p className="text-white/90">{new Date(product.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-white/60 text-sm">Last Updated</label>
                <p className="text-white/90">{new Date(product.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Reason (if rejected) */}
        {product.rejectionReason && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-red-400">❌ Rejection Reason</h2>
            <p className="text-white/90">{product.rejectionReason}</p>
          </div>
        )}

        {/* Seller Information */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">👤 Seller Information</h2>
          {product.sellerId ? (
            <div className="space-y-3">
              <div>
                <label className="text-white/60 text-sm">Seller Name</label>
                <p className="text-lg font-semibold">{product.sellerId.name}</p>
              </div>
              <div>
                <label className="text-white/60 text-sm">Email</label>
                <p className="text-white/90">{product.sellerId.email}</p>
              </div>
              {product.sellerId.phone && (
                <div>
                  <label className="text-white/60 text-sm">Phone</label>
                  <p className="text-white/90">{product.sellerId.phone}</p>
                </div>
              )}
              <div>
                <label className="text-white/60 text-sm">Seller ID</label>
                <p className="text-white/70 text-sm font-mono">{product.sellerId._id}</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400">⚠️ Seller information not available (seller may have been deleted)</p>
            </div>
          )}
        </div>

        {/* EDIT MODAL */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#0f0f1e] to-[#14142b] border border-white/20 rounded-xl max-w-2xl w-full p-8">
              <h2 className="text-2xl font-bold mb-6">✏️ Edit Product</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Enter product title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none resize-none"
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
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Discount (%)</label>
                    <input
                      type="number"
                      value={editFormData.discount}
                      onChange={(e) => setEditFormData({ ...editFormData, discount: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
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
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none resize-none"
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
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#0f0f1e] to-[#14142b] border border-red-500/30 rounded-xl max-w-md w-full p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-red-400">Delete Product</h2>
                <p className="text-white/60 mt-2">This action cannot be undone</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Delete Reason *</label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
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
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
