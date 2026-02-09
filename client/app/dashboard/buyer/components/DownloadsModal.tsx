"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";

export default function DownloadsModal({ onClose }: { onClose: () => void }) {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      const data = await buyerAPI.getAllPurchases();
      setDownloads(data.purchases || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load downloads");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (download: any) => {
    try {
      setDownloading(download._id);
      
      // Fetch full details to get download URL
      const details = await buyerAPI.getPurchaseDetails(download._id);
      
      if (details.downloadUrl) {
        // Create a temporary anchor element to force download
        const link = document.createElement('a');
        link.href = details.downloadUrl;
        link.download = details.filename || `${download.productName}.pdf`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Downloading ${download.productName}...`);
      } else {
        toast.error("Download URL not available");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to download");
    } finally {
      setDownloading(null);
    }
  };

  const handleViewDetails = (downloadId: string) => {
    onClose();
    router.push(`/dashboard/buyer/purchases/${downloadId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-linear-to-br from-slate-900 to-slate-800 rounded-lg max-w-6xl w-full max-h-[80vh] overflow-y-auto shadow-xl border border-white/10 p-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <span>⬇️</span> My Downloads
        </h2>
        <p className="text-white/60 mb-6">All your downloaded products - re-download anytime</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : downloads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg mb-4">No downloads yet</p>
            <button
              onClick={() => {
                onClose();
                router.push("/marketplace");
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {downloads.map((download) => (
              <div
                key={download._id}
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-white/20 transition"
              >
                <div className="flex items-start gap-6">
                  {/* Thumbnail */}
                  <div className="w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-linear-to-br from-purple-900/20 to-blue-900/20">
                    {download.thumbnailUrl ? (
                      <img 
                        src={download.thumbnailUrl} 
                        alt={download.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">📦</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-xl mb-2">{download.productName}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-white/60 text-sm mb-1">Seller</p>
                        <p className="text-white font-medium">{download.sellerName}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">Purchased</p>
                        <p className="text-white font-medium">
                          {new Date(download.purchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">Purchase Time</p>
                        <p className="text-white font-medium">
                          {new Date(download.purchaseDate).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">Amount Paid</p>
                        <p className="text-green-400 font-bold text-lg">₹{download.amount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-white/5 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-white/60">Days Since Purchase</p>
                          <p className="text-white font-semibold">
                            {Math.floor((Date.now() - new Date(download.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60">Full Date & Time</p>
                          <p className="text-white font-semibold">
                            {new Date(download.purchaseDate).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60">Status</p>
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                            ✅ Available
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDownload(download)}
                        disabled={downloading === download._id}
                        className="flex-1 px-4 py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {downloading === download._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <span>⬇️</span> Download Again
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleViewDetails(download._id)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition border border-white/20"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}