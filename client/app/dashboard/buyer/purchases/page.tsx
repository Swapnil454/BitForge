


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { paymentAPI } from "@/lib/api";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";

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
}

export default function PurchasesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const res = await api.get(`/download/${orderId}`);
      if (!res.data.downloadUrl) {
        toast.error("Download URL not available");
        return;
      }

      // Fetch the file as a Blob so we can enforce a proper .pdf filename
      const response = await fetch(res.data.downloadUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const baseName = (res.data.filename || res.data.productTitle || "download")
        .toString()
        .replace(/[^a-z0-9_\-]/gi, "_");
      const filename = baseName.toLowerCase().endsWith(".pdf")
        ? baseName
        : `${baseName}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (error: any) {
      console.error("Download error", error);
      toast.error(error.response?.data?.message || error.message || "Download failed");
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
              <p className="text-white/70 mt-1">View your order history and downloads</p>
              <button
                onClick={() => router.push("/marketplace")}
                className="mt-3 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition shadow-lg shadow-cyan-500/30"
              >
                Browse Marketplace
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
                        <button
                          onClick={() => download(order._id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition shadow-lg shadow-cyan-500/30"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Download
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
                          href={`${process.env.NEXT_PUBLIC_API_URL}/invoices/${order._id}`}
                          target="_blank"
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
    </div>
  );
}
