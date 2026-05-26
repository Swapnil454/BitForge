"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api, { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import PageHeader from "../../transactions/components/PageHeader";
import { 
  Package, 
  CheckCircle2, 
  DownloadCloud, 
  User, 
  Clock, 
  Printer, 
  ArrowLeft,
  FileText,
  CreditCard,
  History,
  Calendar,
  Tag,
  Receipt
} from "lucide-react";

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
  razorpayPaymentId: string;
  razorpayOrderId: string;
  category: string;
  downloadCount?: number;
  downloadLimit?: number;
}

export default function PurchaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id as string;
  
  const [purchase, setPurchase] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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

  const handleDownload = async () => {
    if (!purchase?._id) {
      toast.error("Download not available");
      return;
    }

    try {
      setDownloading(true);
      const response = await api.get(`/download/${purchase._id}`, { responseType: "blob" });
      const contentType = response.headers["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const contentDisposition = response.headers["content-disposition"];
      let filename = "download.pdf";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"|filename=([^;\s]+)/);
        if (match) filename = match[1] || match[2];
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started!");
    } catch (error: any) {
      console.error("Download error", error);
      toast.error(error.response?.data?.message || error.message || "Failed to download");
    } finally {
      setDownloading(false);
    }
  };

  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
        {/* Skeleton Header matching PageHeader */}
        <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-linear-to-r from-black via-slate-950 to-black/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="relative flex min-h-[58px] items-center justify-center">
              <div className="absolute left-0 flex items-center gap-2 opacity-50">
                <div className="h-8 w-8 rounded-md bg-slate-200 dark:bg-white/10 animate-pulse" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-white/10 rounded animate-pulse hidden sm:block" />
              </div>

              <div className="px-16 text-center space-y-2 flex flex-col items-center opacity-50">
                <div className="h-6 w-40 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-32 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Column Skeleton */}
            <div className="flex-1 space-y-6">
              {/* Product Card */}
              <div className="bg-white dark:bg-[#08111d] rounded-2xl border border-slate-200 dark:border-white/5 p-5 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-full sm:w-48 aspect-video sm:aspect-square rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse shrink-0" />
                  <div className="flex-1 w-full space-y-4 py-2">
                    <div className="h-6 w-3/4 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-24 bg-slate-100 dark:bg-white/5 rounded animate-pulse mt-4" />
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white dark:bg-[#08111d] rounded-2xl border border-slate-200 dark:border-white/5 p-5 sm:p-6 lg:p-8">
                <div className="h-3 w-32 bg-slate-100 dark:bg-white/5 rounded animate-pulse mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-50 dark:bg-[#05050a] border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-2">
                      <div className="h-3 w-16 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                      <div className="h-4 w-full bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:w-[340px] xl:w-[380px] space-y-6 shrink-0">
              {/* Payment Summary */}
              <div className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-2xl p-5 sm:p-6">
                <div className="h-3 w-28 bg-slate-100 dark:bg-white/5 rounded animate-pulse mb-6" />
                <div className="space-y-4">
                  <div className="h-3 w-20 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                  <div className="h-px w-full bg-slate-100 dark:bg-white/5" />
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    <div className="h-5 w-16 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-2xl p-5 sm:p-6">
                <div className="h-3 w-24 bg-slate-100 dark:bg-white/5 rounded animate-pulse mb-6" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    <div className="h-4 w-40 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-2xl p-5 sm:p-6">
                <div className="h-3 w-20 bg-slate-100 dark:bg-white/5 rounded animate-pulse mb-6" />
                <div className="space-y-6 pl-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-28 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex flex-col items-center justify-center space-y-2">
                    <div className="h-4 w-4 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    <div className="h-2 w-16 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white flex items-center justify-center p-6">
        <div className="text-center bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/10 rounded-3xl p-10 max-w-md w-full shadow-2xl">
          <Package className="w-16 h-16 text-slate-700 mx-auto mb-6" />
          <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">Purchase Not Found</p>
          <p className="text-slate-400 text-sm mb-8">This purchase could not be found or you don't have access to it.</p>
          <button
            onClick={() => router.push("/dashboard/buyer/downloads")}
            className="w-full py-3 bg-white hover:bg-slate-200 text-slate-950 rounded-xl font-bold transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Downloads
          </button>
        </div>
      </div>
    );
  }

  const purchaseDate = new Date(purchase.purchaseDate);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20">
      
      <PageHeader
        backHref="/dashboard/buyer/downloads"
        backLabel="Downloads"
        title="Purchase Details"
        subtitle={`Transaction #${purchase.orderId}`}
        rightSlot={
          <div className="flex items-center gap-2">
             <button 
                onClick={() => router.push(`/dashboard/buyer/invoice/${purchase._id}`)} 
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-900 dark:text-white transition"
             >
                <Printer className="w-4 h-4" /> <span className="hidden md:inline">Receipt</span>
             </button>
             <button 
                onClick={handleDownload} 
                disabled={downloading} 
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold shadow-lg shadow-black/5 dark:shadow-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <DownloadCloud className="w-4 h-4" /> 
                <span className="hidden lg:inline">{downloading ? "Downloading..." : "Download File"}</span>
                <span className="hidden sm:inline lg:hidden">{downloading ? "..." : "Download"}</span>
             </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column - Product Info */}
          <div className="flex-1 space-y-6">
            
            {/* Compact Product Card */}
            <div className="bg-white dark:bg-[#08111d] rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-full sm:w-48 aspect-video sm:aspect-square shrink-0 rounded-xl overflow-hidden bg-slate-50 dark:bg-[#05050a] border border-slate-200 dark:border-white/5 shadow-inner">
                  {purchase.thumbnailUrl ? (
                    <img 
                      src={purchase.thumbnailUrl} 
                      alt={purchase.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col justify-center items-center w-full h-full bg-slate-900/30 text-slate-600">
                      <Package className="w-10 h-10 mb-2" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">File</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug mb-3">
                    {purchase.productName}
                  </h2>
                  
                  {purchase.productDescription && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-2xl whitespace-pre-wrap">
                      {purchase.productDescription}
                    </p>
                  )}
                  
                  {purchase.category && (
                    <div className="mt-5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                      <Tag className="w-3 h-3" />
                      {purchase.category}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-xl">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-5 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> System Reference
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#05050a] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Product ID</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-mono break-all">{purchase.productId}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#05050a] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Order ID</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-mono break-all">{purchase.orderId}</p>
                </div>
                {purchase.razorpayOrderId && (
                  <div className="bg-slate-50 dark:bg-[#05050a] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                    <p className="text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Razorpay Order</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-mono break-all">{purchase.razorpayOrderId}</p>
                  </div>
                )}
                {purchase.razorpayPaymentId && (
                  <div className="bg-slate-50 dark:bg-[#05050a] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                    <p className="text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Payment Ref</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-mono break-all">{purchase.razorpayPaymentId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details & Stats */}
          <div className="lg:w-[340px] xl:w-[380px] space-y-6 shrink-0">
            
            {/* Payment Summary */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80 mb-5 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Payment Summary
              </h3>
              
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Amount Paid</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{currency.format(purchase.amount)}</p>
                </div>
                
                <div className="h-px w-full bg-emerald-500/10" />
                
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</p>
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-5 flex items-center gap-2">
                <User className="w-4 h-4" /> Seller Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Seller Name</p>
                  <p className="text-sm text-slate-900 dark:text-white font-bold">{purchase.sellerName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Contact Email</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 break-all font-medium">{purchase.sellerEmail}</p>
                </div>
              </div>
            </div>

            {/* Purchase Timeline */}
            <div className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-5 flex items-center gap-2">
                <History className="w-4 h-4" /> Timeline
              </h3>
              
              <div className="relative pl-6 space-y-5 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-slate-200 dark:before:bg-white/10">
                <div className="relative">
                  <div className="absolute -left-[29px] w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Purchase Completed</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {purchaseDate.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[29px] w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                    <DownloadCloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Product Available</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Ready for instant download</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-lg">
                <Calendar className="w-4 h-4 text-slate-500 mb-2" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Purchased On</p>
                <p className="text-xs text-slate-900 dark:text-white font-bold">{purchaseDate.toLocaleDateString()}</p>
              </div>
              <div className="bg-white dark:bg-[#08111d] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-lg">
                <DownloadCloud className="w-4 h-4 text-slate-500 mb-2" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Downloads</p>
                <p className="text-xs text-slate-900 dark:text-white font-bold">
                  {purchase.downloadCount || 0} / {purchase.downloadLimit || 5}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
