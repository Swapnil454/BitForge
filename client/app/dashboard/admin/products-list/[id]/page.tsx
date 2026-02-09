"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  updatedAt: string;
}

export default function ProductDetailsPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

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

    fetchProductDetails();
  }, [router, productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getProductDetails(productId);
      setProduct(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load product details");
      router.push("/dashboard/admin/products-list");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/admin/products-list")}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
          >
            ← Back to All Products
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
        </div>

        {/* PRODUCT CARD */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* THUMBNAIL */}
          {product.thumbnailUrl && (
            <div className="relative h-80 bg-gray-100">
              <img
                src={product.thumbnailUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <span
                  className={`inline-block px-4 py-2 text-sm font-bold rounded-full ${
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
          <div className="p-8 space-y-6">
            {/* TITLE & DESCRIPTION */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h2>
              <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
            </div>

            {/* PRICE & DISCOUNT */}
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Price</span>
                <p className="text-3xl font-bold text-purple-600">₹{product.price.toLocaleString()}</p>
              </div>
              {product.discount && product.discount > 0 && (
                <div>
                  <span className="text-sm text-gray-500 block mb-1">Discount</span>
                  <p className="text-3xl font-bold text-red-600">{product.discount}%</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Final Price: ₹{(product.price * (1 - product.discount / 100)).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* PRODUCT INFO */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <span className="text-sm text-blue-600 font-semibold">Product ID</span>
                <p className="text-gray-900 font-mono text-sm mt-1">{product._id}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <span className="text-sm text-blue-600 font-semibold">Created Date</span>
                <p className="text-gray-900 font-semibold mt-1">
                  {new Date(product.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* SELLER INFORMATION */}
            {product.sellerId ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <span>👤</span> Seller Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-blue-600 font-semibold">Name</span>
                    <p className="text-gray-900 text-lg font-semibold">{product.sellerId.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-blue-600 font-semibold">Email</span>
                    <p className="text-gray-900">{product.sellerId.email}</p>
                  </div>
                  {product.sellerId.phone && (
                    <div>
                      <span className="text-sm text-blue-600 font-semibold">Phone</span>
                      <p className="text-gray-900">{product.sellerId.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 flex items-center gap-2">
                  <span>⚠️</span>
                  Seller information not available (seller may have been deleted)
                </p>
              </div>
            )}

            {/* REJECTION REASON */}
            {product.status === "rejected" && product.rejectionReason && (
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                  <span>❌</span> Rejection Reason
                </h3>
                <p className="text-red-700">{product.rejectionReason}</p>
              </div>
            )}

            {/* FILE DOWNLOAD */}
            {product.fileUrl && (
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <span>📁</span> Product File
                </h3>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = product.fileUrl;
                    link.download = product.title ? `${product.title.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'product_file.pdf';
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium cursor-pointer"
                >
                  <span>⬇️</span> View/Download File
                </button>
              </div>
            )}

            {/* TIMESTAMPS */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Created:</span>{" "}
                  {new Date(product.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold">Last Updated:</span>{" "}
                  {new Date(product.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
