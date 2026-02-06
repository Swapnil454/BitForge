"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";

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
  discount?: number;
  fileUrl?: string;
  thumbnailUrl?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  sellerId: Seller;
  createdAt: string;
}

export default function AdminAllProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: 0,
    discount: 0,
    editReason: "",
  });
  const [deleteReason, setDeleteReason] = useState("");
  const router = useRouter();

  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) {
      router.push("/login");
      return;
    }

    if (parsed.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchAllProducts();
  }, [router]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllProducts();
      const items = Array.isArray(data) ? data : data?.products || [];
      setProducts(items);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const viewProductDetails = (productId: string) => {
    router.push(`/dashboard/admin/products-list/${productId}`);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setEditFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      discount: product.discount || 0,
      editReason: "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  const handleEditProduct = async () => {
    if (!editFormData.editReason.trim()) {
      toast.error("Edit reason is required");
      return;
    }

    if (editFormData.title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    if (editFormData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    setProcessing(true);
    try {
      await adminAPI.editProduct(selectedProduct!._id, editFormData);
      toast.success("Product updated successfully");
      setShowEditModal(false);
      fetchAllProducts();
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

    setProcessing(true);
    try {
      await adminAPI.deleteProduct(selectedProduct!._id, deleteReason);
      toast.success("Product deleted successfully");
      setShowDeleteModal(false);
      fetchAllProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sellerId?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sellerId?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: products.length,
    approved: products.filter((p) => p.status === "approved").length,
    pending: products.filter((p) => p.status === "pending").length,
    rejected: products.filter((p) => p.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="text-purple-600 hover:text-purple-700 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          <p className="text-gray-600 mt-2">View, edit, and manage all products</p>
        </div>

        {/* FILTER BUTTONS */}
        <div className="mb-6 flex gap-4 flex-wrap">
          {(["all", "approved", "pending", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === status
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-purple-600"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* SEARCH */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by product name, seller name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>

        {/* PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
              >
                {/* THUMBNAIL */}
                {product.thumbnailUrl && (
                  <div className="relative h-40 bg-gray-100">
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          product.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : product.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* CONTENT */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                  {/* PRICE */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-purple-600">₹{product.price}</span>
                    {product.discount && product.discount > 0 && (
                      <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                        {product.discount}% off
                      </span>
                    )}
                  </div>

                  {/* SELLER INFO */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-xs text-gray-500">Seller</p>
                    <p className="font-semibold text-gray-900 text-sm">{product.sellerId?.name || "Unknown Seller"}</p>
                    <p className="text-xs text-gray-600">{product.sellerId?.email || "No email"}</p>
                  </div>

                  {/* REJECTION REASON */}
                  {product.status === "rejected" && product.rejectionReason && (
                    <div className="mb-4 p-2 bg-red-50 rounded border border-red-200">
                      <p className="text-xs text-red-700 font-semibold mb-1">Rejection Reason:</p>
                      <p className="text-xs text-red-600">{product.rejectionReason}</p>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewProductDetails(product._id)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(product)}
                      className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editFormData.discount}
                    onChange={(e) => setEditFormData({ ...editFormData, discount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Edit Reason *</label>
                <textarea
                  value={editFormData.editReason}
                  onChange={(e) => setEditFormData({ ...editFormData, editReason: e.target.value })}
                  placeholder="Why are you editing this product? (Seller will be notified)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 h-20"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleEditProduct}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                >
                  {processing ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-red-600">Delete Product</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-bold text-red-900 mb-2">⚠️ Warning</h3>
                <p className="text-red-700">
                  You are about to permanently delete the product <strong>"{selectedProduct.title}"</strong>. This action cannot be undone.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Seller Notification:</strong> The seller will receive a notification about this deletion with the reason you provide.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delete Reason *</label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Why are you deleting this product? (Seller will be notified)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 h-24"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 5 characters required</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleDeleteProduct}
                  disabled={processing || deleteReason.trim().length < 5}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  {processing ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
