

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { paymentAPI, buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";
import ReviewModal from "../components/ReviewModal";

interface Order {
  _id: string;
  productId: {
    _id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl?: string;
  };
  amount: number;
  status: string;
  razorpayOrderId: string;
  createdAt: string;
  downloadCount?: number;
  downloadLimit?: number;
}

export default function PurchasesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const router = useRouter();

  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) {
      router.push("/login");
      return;
    }

    if (parsed.role !== "buyer") {
      router.push("/dashboard");
      return;
    }

    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const data = await paymentAPI.getMyOrders();
      setOrders(data.orders || data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const download = async (orderId: string) => {
    const loadingToast = toast.loading("Preparing secure download...");
    
    try {
      // Download directly from our server (it proxies from Cloudinary with watermark)
      const response = await api.get(`/download/${orderId}`, {
        responseType: 'blob',
      });

      // Create blob URL from response
      const contentType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download.pdf';
      
      console.log('Content-Disposition header:', contentDisposition);
      console.log('All headers:', response.headers);
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"|filename=([^;\s]+)/);
        if (filenameMatch) {
          filename = filenameMatch[1] || filenameMatch[2];
          console.log('✅ Extracted filename:', filename);
        }
      }

      // Get download count info from headers
      const downloadCount = response.headers['x-download-count'];
      const downloadLimit = response.headers['x-download-limit'];

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      
      if (downloadCount && downloadLimit) {
        const remaining = parseInt(downloadLimit) - parseInt(downloadCount);
        toast.success(`Download started! ${remaining} downloads remaining.`);
      } else {
        toast.success("Download started successfully!");
      }

      // Refresh orders to update download count
      fetchOrders();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error("Download error", error);
      
      // Handle download limit exceeded
      if (error.response?.status === 403 && error.response?.data?.downloadLimit) {
        toast.error(`Download limit reached (${error.response.data.downloadLimit}). Contact support for assistance.`);
      } else {
        toast.error(error.response?.data?.message || error.message || "Download failed");
      }
    }
  };

  const raiseDispute = async (orderId: string) => {
    const reason = prompt("Enter reason for dispute:");
    if (!reason) return;

    try {
      await api.post("/disputes", { orderId, reason });
      toast.success("Dispute raised successfully");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to raise dispute");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
      case "paid":
        return "bg-green-500/20 text-green-300 border border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
      case "failed":
        return "bg-red-500/20 text-red-300 border border-red-500/30";
      default:
        return "bg-white/10 text-white/70 border border-white/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Loading purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20 backdrop-blur-md border-b border-white/10 text-white py-5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/buyer")}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">My Purchases</h1>
              <p className="text-white/70 mt-1">View your order history, downloads and disputes</p>
              <button
                onClick={() => router.push("/marketplace")}
                className="mt-3 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition shadow-lg shadow-cyan-500/30"
              >
                Browse Marketplace
              </button>
              <button
                onClick={() => router.push("/dashboard/buyer/disputes")}
                className="mt-3 ml-0 md:ml-3 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition"
              >
                View My Disputes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {orders.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-12 text-center">
            <div className="text-8xl mb-6">🛍️</div>
            <h2 className="text-2xl font-bold text-white mb-3">No purchases yet</h2>
            <p className="text-white/60 mb-6">Start exploring our marketplace and make your first purchase!</p>
            <button
              onClick={() => router.push("/marketplace")}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition shadow-lg shadow-cyan-500/30"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order._id} 
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    {order.productId?.thumbnailUrl ? (
                      <img
                        src={order.productId.thumbnailUrl}
                        alt={order.productId.title}
                        className="w-full md:w-32 h-32 object-cover rounded-xl border border-white/10"
                      />
                    ) : (
                      <div className="w-full md:w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/10 rounded-xl flex items-center justify-center">
                        <span className="text-5xl">📦</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {order.productId?.title || "Product"}
                          </h3>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">
                              ₹{order.productId?.price?.toLocaleString() || order.amount.toLocaleString()}
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>Purchased on {new Date(order.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {/* Download Button with remaining count */}
                        {(() => {
                          const downloadCount = order.downloadCount || 0;
                          const downloadLimit = order.downloadLimit || 5;
                          const remaining = downloadLimit - downloadCount;
                          const isLimitReached = remaining <= 0;
                          
                          return (
                            <div className="relative group">
                              <button
                                onClick={() => !isLimitReached && download(order._id)}
                                disabled={isLimitReached}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition shadow-lg ${
                                  isLimitReached 
                                    ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-cyan-500/30'
                                }`}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Download
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                  isLimitReached 
                                    ? 'bg-red-500/30 text-red-300' 
                                    : remaining <= 2 
                                      ? 'bg-yellow-500/30 text-yellow-300' 
                                      : 'bg-white/20 text-white/80'
                                }`}>
                                  {remaining}/{downloadLimit}
                                </span>
                              </button>
                              {isLimitReached && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-red-500/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                  Download limit reached. Contact support.
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        
                        {(order.status === "completed" || order.status === "success" || order.status === "paid") && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setReviewModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-xl font-semibold transition shadow-lg shadow-yellow-500/30"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            Write Review
                          </button>
                        )}
                        
                        <button
                          onClick={() => router.push(`/marketplace/${order.productId._id}`)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                          </svg>
                          View Product
                        </button>
                        
                        <button
                          onClick={() => raiseDispute(order._id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          Raise Dispute
                        </button>
                        <a
                          href={`/dashboard/buyer/invoice/${order._id}`}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          Invoice
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedOrder && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedOrder(null);
          }}
          productId={selectedOrder.productId._id}
          productTitle={selectedOrder.productId.title}
          orderId={selectedOrder._id}
          onReviewSubmitted={() => {
            toast.success("Thank you for your review!");
          }}
        />
      )}
    </div>
  );
}
