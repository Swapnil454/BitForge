
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";

export default function PurchasesModal({ onClose }: { onClose: () => void }) {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const data = await buyerAPI.getAllPurchases();
      setPurchases(data.purchases || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (purchaseId: string) => {
    onClose();
    router.push(`/dashboard/buyer/purchases/${purchaseId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-white dark:bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-linear-to-br from-slate-900 to-slate-800 rounded-lg max-w-6xl w-full max-h-[80vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-white/10 p-8"
      >
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-slate-100 dark:bg-white/5">
            <ShoppingBag className="h-4 w-4 text-cyan-300" />
          </span>
          My Purchases
        </h2>
        <p className="text-slate-500 dark:text-white/60 mb-6">All your purchased products</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-white/60 text-lg mb-4">No purchases yet</p>
            <button
              onClick={() => {
                onClose();
                router.push("/marketplace");
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white rounded-lg font-semibold transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases.map((purchase) => (
              <div
                key={purchase._id}
                className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden hover:bg-slate-200 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition"
              >
                <div className="aspect-video bg-linear-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">
                  {purchase.thumbnailUrl ? (
                    <img 
                      src={purchase.thumbnailUrl} 
                      alt={purchase.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                      <Package className="h-8 w-8 text-blue-300" />
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2 line-clamp-2">{purchase.productName}</h3>
                  <p className="text-slate-500 dark:text-white/60 text-sm mb-2">
                    Seller: {purchase.sellerName}
                  </p>
                  <p className="text-slate-500 dark:text-white/60 text-sm mb-3">
                    Purchased: {new Date(purchase.purchaseDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-green-400 font-bold text-xl">₹{purchase.amount.toLocaleString()}</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Paid
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewDetails(purchase._id)}
                    className="w-full px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-slate-900 dark:text-white rounded-lg font-semibold transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white font-semibold rounded-lg transition border border-slate-300 dark:border-white/20"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
