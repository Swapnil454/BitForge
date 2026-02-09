"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface PurchaseDetails {
  _id: string;
  orderId: string;
  productName: string;
  productDescription: string;
  productId: string;
  thumbnailUrl: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  purchaseDate: string;
  downloadUrl: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  category: string;
}

export default function PurchaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id as string;
  
  const [purchase, setPurchase] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (purchaseId) {
      fetchPurchaseDetails();
    }
  }, [purchaseId]);

  const fetchPurchaseDetails = async () => {
    try {
      const data = await buyerAPI.getPurchaseDetails(purchaseId);
      setPurchase(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load purchase details");
      router.push("/dashboard/buyer");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (purchase?.downloadUrl) {
      // Create a temporary anchor element to force download
      const link = document.createElement('a');
      link.href = purchase.downloadUrl;
      link.download = purchase.productName ? `${purchase.productName.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'download.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started!");
    } else {
      toast.error("Download URL not available");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Purchase not found</p>
          <button
            onClick={() => router.push("/dashboard/buyer")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/buyer")}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2 font-semibold"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Purchase Details</h1>
          <p className="text-gray-600 mt-2">Complete information about your purchase</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-purple-600">
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                {purchase.thumbnailUrl ? (
                  <img 
                    src={purchase.thumbnailUrl} 
                    alt={purchase.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-9xl">📦</span>
                )}
              </div>
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{purchase.productName}</h2>
                    {purchase.category && (
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {purchase.category}
                      </span>
                    )}
                  </div>
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold border-2 border-green-300">
                    ✅ Purchased
                  </span>
                </div>
                
                {purchase.productDescription && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{purchase.productDescription}</p>
                  </div>
                )}

                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
                >
                  <span>⬇️</span> Download Product
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Product Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <p className="text-gray-700 font-semibold">Product ID</p>
                  <p className="text-gray-600 font-mono text-sm">{purchase.productId}</p>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <p className="text-gray-700 font-semibold">Order ID</p>
                  <p className="text-gray-600 font-mono text-sm">{purchase.orderId}</p>
                </div>
                {purchase.razorpayOrderId && (
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <p className="text-gray-700 font-semibold">Razorpay Order ID</p>
                    <p className="text-gray-600 font-mono text-sm">{purchase.razorpayOrderId}</p>
                  </div>
                )}
                {purchase.razorpayPaymentId && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700 font-semibold">Payment ID</p>
                    <p className="text-gray-600 font-mono text-sm">{purchase.razorpayPaymentId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Seller & Purchase Info */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-8 border-2 border-green-200 shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-green-200">
                  <p className="text-gray-700 font-semibold">Amount Paid</p>
                  <p className="text-3xl font-bold text-green-600">₹{purchase.amount.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-700 font-semibold">Status</p>
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                    ✅ Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>👤</span> Seller Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Seller Name</p>
                  <p className="text-gray-900 font-bold text-lg">{purchase.sellerName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Contact Email</p>
                  <p className="text-gray-900">{purchase.sellerEmail}</p>
                </div>
              </div>
            </div>

            {/* Purchase Timeline */}
            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📅</span> Purchase Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Purchase Completed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(purchase.purchaseDate).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">⬇</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Product Available</p>
                    <p className="text-sm text-gray-600">Ready for download</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Stats */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-8 shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-700">Days Since Purchase</p>
                  <p className="text-purple-700 font-bold">
                    {Math.floor((Date.now() - new Date(purchase.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-700">Purchase Time</p>
                  <p className="text-purple-700 font-bold">
                    {new Date(purchase.purchaseDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-700">Purchase Date</p>
                  <p className="text-purple-700 font-bold">
                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={() => router.push("/dashboard/buyer")}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition"
          >
            Back to Purchases
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            Download Again
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
