"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

interface MalwareStats {
  totalScans: number;
  productsWithDetections: number;
  cleanProducts: number;
  basicCheckOnly: number;
  recentScans: number;
  scanRate: number;
  highThreatProducts: Array<{
    _id: string;
    title: string;
    virusTotalLink: string;
    malwareScanDetails: {
      detections: {
        malicious: number;
        suspicious: number;
        harmless: number;
        undetected: number;
      };
    };
    sellerId: {
      name: string;
      email: string;
    };
    createdAt: string;
  }>;
}

interface ContentReviewQueue {
  products: Array<{
    _id: string;
    title: string;
    description: string;
    price: number;
    reviewFlags: string[];
    reviewSeverity: "high" | "medium" | "low";
    contentQualityScore: number;
    requiresManualReview: boolean;
    sellerId: {
      name: string;
      email: string;
      identityVerified: boolean;
    };
    createdAt: string;
  }>;
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface PendingIdentity {
  sellers: Array<{
    _id: string;
    name: string;
    email: string;
    phone?: string;
    totalSales: number;
    averageRating: number;
    createdAt: string;
  }>;
  total: number;
}

export default function SecurityDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [malwareStats, setMalwareStats] = useState<MalwareStats | null>(null);
  const [contentReview, setContentReview] = useState<ContentReviewQueue | null>(null);
  const [pendingIdentity, setPendingIdentity] = useState<PendingIdentity | null>(null);
  const [activeTab, setActiveTab] = useState<"malware" | "content" | "identity">("malware");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [malware, content, identity] = await Promise.all([
        adminAPI.getMalwareDashboardStats(),
        adminAPI.getContentReviewQueue(),
        adminAPI.getPendingIdentityVerifications(),
      ]);
      setMalwareStats(malware);
      setContentReview(content);
      setPendingIdentity(identity);
    } catch (error) {
      console.error("Failed to fetch security data:", error);
      toast.error("Failed to load security dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveContent = async (productId: string, action: "approve" | "reject", reason?: string) => {
    try {
      await adminAPI.resolveContentReview(productId, action, reason);
      toast.success(`Product ${action === "approve" ? "approved" : "rejected"} successfully`);
      fetchAllData();
    } catch (error) {
      console.error("Failed to resolve content review:", error);
      toast.error("Failed to resolve content review");
    }
  };

  const handleVerifyIdentity = async (sellerId: string, verified: boolean, notes?: string) => {
    try {
      await adminAPI.verifySellerIdentity(sellerId, verified, notes);
      toast.success(`Seller identity ${verified ? "verified" : "verification revoked"}`);
      fetchAllData();
    } catch (error) {
      console.error("Failed to verify identity:", error);
      toast.error("Failed to verify seller identity");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              🛡️ Trust & Security Dashboard
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-black/40 p-1 rounded-xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab("malware")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "malware"
                ? "bg-red-500/20 text-red-300 border border-red-500/50"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            🦠 Malware Scans
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "content"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            🔍 Content Review
          </button>
          <button
            onClick={() => setActiveTab("identity")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "identity"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            ✅ Identity Verification
          </button>
        </div>

        {/* Malware Tab */}
        {activeTab === "malware" && malwareStats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Scans"
                value={malwareStats.totalScans}
                icon="📊"
                color="blue"
              />
              <StatCard
                label="Clean Products"
                value={malwareStats.cleanProducts}
                icon="✅"
                color="green"
              />
              <StatCard
                label="With Detections"
                value={malwareStats.productsWithDetections}
                icon="⚠️"
                color="red"
              />
              <StatCard
                label="Scan Rate"
                value={`${malwareStats.scanRate}%`}
                icon="📈"
                color="purple"
              />
            </div>

            {/* High Threat Products */}
            <div className="bg-black/40 border border-red-500/30 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                High Threat Products
              </h2>
              
              {malwareStats.highThreatProducts.length === 0 ? (
                <p className="text-white/60 text-center py-8">No high-threat products detected</p>
              ) : (
                <div className="space-y-3">
                  {malwareStats.highThreatProducts.map((product) => (
                    <div
                      key={product._id}
                      className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 hover:border-red-500/50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{product.title}</h3>
                          <p className="text-sm text-white/60">
                            by {product.sellerId.name} ({product.sellerId.email})
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-red-400 font-bold text-lg">
                            {product.malwareScanDetails.detections.malicious} 🦠
                          </div>
                          <div className="text-orange-400 text-sm">
                            {product.malwareScanDetails.detections.suspicious} suspicious
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        {product.virusTotalLink && (
                          <a
                            href={product.virusTotalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition border border-white/20"
                          >
                            View VirusTotal Report →
                          </a>
                        )}
                        <Link
                          href={`/dashboard/admin/products/${product._id}`}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition border border-red-500/50"
                        >
                          Manage Product
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Review Tab */}
        {activeTab === "content" && contentReview && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total Flagged" value={contentReview.summary.total} icon="📋" color="gray" />
              <StatCard label="High Severity" value={contentReview.summary.high} icon="🔴" color="red" />
              <StatCard label="Medium Severity" value={contentReview.summary.medium} icon="🟡" color="yellow" />
              <StatCard label="Low Severity" value={contentReview.summary.low} icon="🟢" color="green" />
            </div>

            {/* Flagged Products */}
            <div className="bg-black/40 border border-orange-500/30 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Products Requiring Manual Review
              </h2>

              {contentReview.products.length === 0 ? (
                <p className="text-white/60 text-center py-8">No products flagged for review</p>
              ) : (
                <div className="space-y-4">
                  {contentReview.products.map((product) => (
                    <div
                      key={product._id}
                      className={`border rounded-lg p-4 ${
                        product.reviewSeverity === "high"
                          ? "bg-red-500/10 border-red-500/30"
                          : product.reviewSeverity === "medium"
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-green-500/10 border-green-500/30"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{product.title}</h3>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                product.reviewSeverity === "high"
                                  ? "bg-red-500/20 text-red-300"
                                  : product.reviewSeverity === "medium"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-green-500/20 text-green-300"
                              }`}
                            >
                              {product.reviewSeverity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-white/60 mb-2">
                            by {product.sellerId.name} {product.sellerId.identityVerified && "✅"}
                          </p>
                          <p className="text-sm text-white/80 line-clamp-2">{product.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-white font-semibold">₹{product.price}</div>
                          <div className="text-xs text-white/60">
                            Quality: {product.contentQualityScore}/100
                          </div>
                        </div>
                      </div>

                      {/* Flags */}
                      {product.reviewFlags && product.reviewFlags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {product.reviewFlags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white/10 rounded text-xs text-white/80 border border-white/20"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveContent(product._id, "approve")}
                          className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-sm font-medium transition border border-green-500/50"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Enter rejection reason:");
                            if (reason) handleResolveContent(product._id, "reject", reason);
                          }}
                          className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition border border-red-500/50"
                        >
                          ❌ Reject
                        </button>
                        <Link
                          href={`/marketplace/${product._id}`}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition border border-white/20"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Identity Verification Tab */}
        {activeTab === "identity" && pendingIdentity && (
          <div className="space-y-6">
            <div className="bg-black/40 border border-blue-500/30 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">✅</span>
                Pending Identity Verifications ({pendingIdentity.total})
              </h2>

              {pendingIdentity.sellers.length === 0 ? (
                <p className="text-white/60 text-center py-8">No pending identity verifications</p>
              ) : (
                <div className="space-y-4">
                  {pendingIdentity.sellers.map((seller) => (
                    <div
                      key={seller._id}
                      className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 hover:border-blue-500/50 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{seller.name}</h3>
                          <p className="text-sm text-white/60">{seller.email}</p>
                          {seller.phone && <p className="text-sm text-white/60">📱 {seller.phone}</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            {seller.totalSales} sales
                          </div>
                          <div className="text-sm text-yellow-400">
                            ⭐ {seller.averageRating.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-white/50 mb-3">
                        Member since: {new Date(seller.createdAt).toLocaleDateString()}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const notes = prompt("Enter verification notes (optional):");
                            handleVerifyIdentity(seller._id, true, notes || undefined);
                          }}
                          className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-sm font-medium transition border border-green-500/50"
                        >
                          ✅ Verify Identity
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt("Enter reason for rejection:");
                            if (notes) handleVerifyIdentity(seller._id, false, notes);
                          }}
                          className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition border border-red-500/50"
                        >
                          ❌ Reject
                        </button>
                        <Link
                          href={`/seller/${seller._id}`}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition border border-white/20"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: "blue" | "green" | "red" | "purple" | "yellow" | "gray";
}) {
  const colorClasses = {
    blue: "border-blue-500/30 bg-blue-500/10",
    green: "border-green-500/30 bg-green-500/10",
    red: "border-red-500/30 bg-red-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    yellow: "border-yellow-500/30 bg-yellow-500/10",
    gray: "border-white/20 bg-white/5",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-white/60 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
