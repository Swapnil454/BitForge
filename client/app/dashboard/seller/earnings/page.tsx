


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sellerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/cookies";

interface EarningsData {
  totalEarnings: number;
  withdrawn: number;
  availableBalance: number;
  pendingWithdrawals: number;
}

export default function SellerEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const parsed = getStoredUser<{ role?: string }>();
    if (!parsed) {
      router.push("/login");
      return;
    }

    if (parsed.role !== "seller") {
      router.push("/dashboard");
      return;
    }

    fetchEarnings();
  }, [router]);

  const fetchEarnings = async () => {
    try {
      const response = await sellerAPI.getEarnings();
      setData(response);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (withdrawAmount > (data?.availableBalance || 0)) {
      toast.error("Insufficient balance");
      return;
    }

    setWithdrawing(true);
    try {
      await sellerAPI.requestWithdrawal(withdrawAmount);
      toast.success("Withdrawal request submitted successfully");
      setAmount("");
      fetchEarnings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to request withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/dashboard/seller")}
          className="text-purple-600 hover:text-purple-700 mb-4"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Earnings & Withdrawals</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Total Earnings</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{data?.totalEarnings?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Withdrawn</p>
            <p className="text-3xl font-bold text-orange-600">
              ₹{data?.withdrawn?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Available Balance</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{data?.availableBalance?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Withdrawal</h2>
          
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={withdrawing}
            />
            
            <p className="text-sm text-gray-500 mt-2">
              Available: ₹{data?.availableBalance?.toLocaleString() || 0}
            </p>

            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="mt-4 w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawing ? "Processing..." : "Request Withdrawal"}
            </button>
          </div>

          {data?.pendingWithdrawals ? (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                You have ₹{data.pendingWithdrawals.toLocaleString()} in pending withdrawals
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
