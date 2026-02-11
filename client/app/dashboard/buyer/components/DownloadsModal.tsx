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
    } catch {
      toast.error("Failed to load downloads");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (download: any) => {
    try {
      setDownloading(download._id);

      const details = await buyerAPI.getPurchaseDetails(download._id);
      const response = await fetch(details.downloadUrl);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const name = (details.filename || download.productName || "download")
        .replace(/[^a-z0-9_\-]/gi, "_")
        .toLowerCase();
      const filename = name.endsWith(".pdf") ? name : `${name}.pdf`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <motion.div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-2"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-6xl
          bg-linear-to-br from-slate-900 to-slate-800
          rounded-t-2xl sm:rounded-xl
          max-h-[92vh] sm:max-h-[80vh]
          overflow-y-auto
          border border-white/10
          p-3 sm:p-8
        "
      >
        <h2 className="text-lg sm:text-3xl font-bold text-white mb-1">
          ⬇️ My Downloads
        </h2>
        <p className="text-white/60 text-xs sm:text-base mb-3 sm:mb-6">
          Re-download anytime
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-6 w-6 border-b-2 border-purple-500 rounded-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((download) => (
              <div
                key={download._id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                  {/* Thumbnail */}
                  <div className="w-18 h-18 sm:w-32 sm:h-32 shrink-0 rounded-md overflow-hidden bg-white/10">
                    {download.thumbnailUrl ? (
                      <img
                        src={download.thumbnailUrl}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm sm:text-xl mb-1">
                      {download.productName}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mb-2">
                      <Info label="Seller" value={download.sellerName} />
                      <Info
                        label="Purchased"
                        value={new Date(download.purchaseDate).toLocaleDateString()}
                      />
                      <Info
                        label="Time"
                        value={new Date(download.purchaseDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      />
                      <Info
                        label="Amount"
                        value={`₹${download.amount}`}
                        highlight
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-between bg-white/5 rounded-md p-2 text-xs mb-3">
                      <span className="text-white/70">
                        {Math.floor(
                          (Date.now() - new Date(download.purchaseDate).getTime()) /
                            86400000
                        )}{" "}
                        days ago
                      </span>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-semibold">
                        Available
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleDownload(download)}
                        disabled={downloading === download._id}
                        className="
                          w-full
                          px-3 py-2
                          text-sm
                          bg-green-600 hover:bg-green-700
                          rounded-md font-medium
                          disabled:opacity-50
                        "
                      >
                        {downloading ? "Downloading…" : "⬇️ Download"}
                      </button>

                      <button
                        onClick={() =>
                          router.push(`/dashboard/buyer/purchases/${download._id}`)
                        }
                        className="
                          w-full sm:w-auto
                          px-4 py-2
                          text-sm
                          bg-purple-600 hover:bg-purple-700
                          rounded-md font-medium
                        "
                      >
                        View
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
          className="w-full mt-3 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-md font-medium"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function Info({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-white/50">{label}</p>
      <p className={highlight ? "text-green-400 font-semibold" : "text-white"}>
        {value}
      </p>
    </div>
  );
}
