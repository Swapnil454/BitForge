// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { adminAPI } from "@/lib/api";
// import toast from "react-hot-toast";
// import { getStoredUser } from "@/lib/cookies";

// interface Dispute {
//   _id: string;
//   orderId: string;
//   buyerName: string;
//   sellerName: string;
//   productName: string;
//   amount: number;
//   reason: string;
//   status: string;
//   createdAt: string;
// }

// export default function DisputesPage() {
//   const [disputes, setDisputes] = useState<Dispute[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState<string | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     const parsed = getStoredUser<{ role?: string }>();
//     if (!parsed) {
//       router.push("/login");
//       return;
//     }

//     if (parsed.role !== "admin") {
//       router.push("/dashboard");
//       return;
//     }

//     fetchDisputes();
//   }, [router]);

//   const fetchDisputes = async () => {
//     try {
//       const data = await adminAPI.getOpenDisputes();
//       setDisputes(data.disputes || []);
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to load disputes");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApproveRefund = async (disputeId: string) => {
//     if (!confirm("Approve refund for this dispute?")) return;

//     setProcessing(disputeId);
//     try {
//       await adminAPI.approveRefund(disputeId);
//       toast.success("Refund approved");
//       fetchDisputes();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to approve refund");
//     } finally {
//       setProcessing(null);
//     }
//   };

//   const handleReject = async (disputeId: string) => {
//     const reason = prompt("Enter rejection reason:");
//     if (!reason) return;

//     setProcessing(disputeId);
//     try {
//       await adminAPI.rejectDispute(disputeId, reason);
//       toast.success("Dispute rejected");
//       fetchDisputes();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to reject dispute");
//     } finally {
//       setProcessing(null);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-6">
//           <button
//             onClick={() => router.push("/dashboard/admin")}
//             className="text-purple-600 hover:text-purple-700 mb-4"
//           >
//             ← Back to Dashboard
//           </button>
//           <h1 className="text-3xl font-bold text-gray-900">Open Disputes</h1>
//           <p className="text-gray-600 mt-2">Review and resolve customer disputes</p>
//         </div>

//         {disputes.length === 0 ? (
//           <div className="bg-white rounded-lg shadow p-8 text-center">
//             <p className="text-gray-500">No open disputes</p>
//           </div>
//         ) : (
//           <div className="grid gap-4">
//             {disputes.map((dispute) => (
//               <div key={dispute._id} className="bg-white rounded-lg shadow p-6">
//                 <div className="flex justify-between items-start">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-3">
//                       <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800">
//                         {dispute.status}
//                       </span>
//                       <span className="text-sm text-gray-500">
//                         Order #{dispute.orderId}
//                       </span>
//                     </div>
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                       {dispute.productName}
//                     </h3>
//                     <div className="grid grid-cols-2 gap-4 text-sm mb-3">
//                       <div>
//                         <span className="text-gray-500">Buyer:</span>
//                         <span className="ml-2 font-medium">{dispute.buyerName}</span>
//                       </div>
//                       <div>
//                         <span className="text-gray-500">Seller:</span>
//                         <span className="ml-2 font-medium">{dispute.sellerName}</span>
//                       </div>
//                     </div>
//                     <div className="bg-gray-50 p-4 rounded-lg mb-3">
//                       <p className="text-sm text-gray-700">
//                         <span className="font-semibold">Reason:</span> {dispute.reason}
//                       </p>
//                     </div>
//                     <div className="flex items-center gap-4 text-sm">
//                       <span className="font-semibold text-lg text-purple-600">
//                         ₹{dispute.amount.toLocaleString()}
//                       </span>
//                       <span className="text-gray-500">
//                         Filed: {new Date(dispute.createdAt).toLocaleDateString()}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="flex gap-2 ml-4">
//                     <button
//                       onClick={() => handleApproveRefund(dispute._id)}
//                       disabled={processing === dispute._id}
//                       className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
//                     >
//                       {processing === dispute._id ? "Processing..." : "Approve Refund"}
//                     </button>
//                     <button
//                       onClick={() => handleReject(dispute._id)}
//                       disabled={processing === dispute._id}
//                       className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
//                     >
//                       Reject
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";

interface Dispute {
  _id: string;
  orderId: string;
  buyerName: string;
  sellerName: string;
  productName: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
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
    fetchDisputes();
  }, [router]);

  const fetchDisputes = async () => {
    try {
      const data = await adminAPI.getOpenDisputes();
      setDisputes(data.disputes || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRefund = async (disputeId: string) => {
    if (!confirm("Approve refund for this dispute?")) return;
    setProcessing(disputeId);
    try {
      await adminAPI.approveRefund(disputeId);
      toast.success("Refund approved");
      fetchDisputes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve refund");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (disputeId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    setProcessing(disputeId);
    try {
      await adminAPI.rejectDispute(disputeId, reason);
      toast.success("Dispute rejected");
      fetchDisputes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject dispute");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="text-cyan-400 text-sm mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Open Disputes</h1>
          <p className="text-white/60">
            Review and resolve customer disputes
          </p>
        </div>

        {/* Empty State */}
        {disputes.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-white/70">No open disputes</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {disputes.map(dispute => (
              <div
                key={dispute._id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/30 transition"
              >
                <div className="flex justify-between gap-6">

                  {/* Left */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 text-xs rounded-full bg-red-500/20 border border-red-400/30 text-red-300">
                        {dispute.status}
                      </span>
                      <span className="text-xs text-white/50">
                        Order #{dispute.orderId}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold">
                      {dispute.productName}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/50">Buyer:</span>
                        <span className="ml-2 font-medium">
                          {dispute.buyerName}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Seller:</span>
                        <span className="ml-2 font-medium">
                          {dispute.sellerName}
                        </span>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                      <p className="text-sm text-white/80">
                        <span className="font-semibold text-white">Reason:</span>{" "}
                        {dispute.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-bold text-lg text-emerald-400">
                        ₹{dispute.amount.toLocaleString()}
                      </span>
                      <span className="text-white/50">
                        Filed{" "}
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <button
                      onClick={() => handleApproveRefund(dispute._id)}
                      disabled={processing === dispute._id}
                      className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30 transition disabled:opacity-50"
                    >
                      {processing === dispute._id
                        ? "Processing..."
                        : "Approve Refund"}
                    </button>
                    <button
                      onClick={() => handleReject(dispute._id)}
                      disabled={processing === dispute._id}
                      className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
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
