'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function BuyerDebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    try {
      const response = await api.get('/payments/all-my-orders');
      setData(response.data);
    } catch (error: any) {
      toast.error('Failed to load debug data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/buyer')}
            className="mb-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">🔍 Debug Orders</h1>
          <p className="text-white/60">Diagnose webhook and payment issues</p>
        </div>

        {/* Status Summary */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Status Summary</h2>
          
          {data?.webhookIssue ? (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-300 font-bold text-lg">⚠️ WEBHOOK ISSUE DETECTED!</p>
              <p className="text-red-200 mt-2">{data.message}</p>
              <p className="text-red-200 mt-2 text-sm">
                You have orders stuck in "created" status. This means Razorpay webhooks are not working.
              </p>
            </div>
          ) : (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
              <p className="text-green-300 font-bold text-lg">✅ {data?.message}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm mb-1">Created (Unpaid)</p>
              <p className="text-blue-100 text-3xl font-bold">{data?.statusCounts?.created || 0}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-300 text-sm mb-1">Paid (Success)</p>
              <p className="text-green-100 text-3xl font-bold">{data?.statusCounts?.paid || 0}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm mb-1">Failed</p>
              <p className="text-red-100 text-3xl font-bold">{data?.statusCounts?.failed || 0}</p>
            </div>
          </div>
        </div>

        {/* Webhook Fix Instructions */}
        {data?.webhookIssue && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-yellow-300 mb-3">🔧 How to Fix Webhook Issue</h3>
            <ol className="text-yellow-100 space-y-2 list-decimal list-inside">
              <li>Go to: <a href="https://dashboard.razorpay.com" target="_blank" className="text-cyan-400 underline">Razorpay Dashboard</a></li>
              <li>Navigate to: Settings → Webhooks</li>
              <li>Verify webhook URL is: <code className="bg-black/30 px-2 py-1 rounded">https://api.bittforge.in/api/webhooks/razorpay</code></li>
              <li>Ensure "payment.captured" event is selected</li>
              <li>Copy the webhook secret and update it in Render environment variables</li>
              <li>Redeploy the server</li>
            </ol>
          </div>
        )}

        {/* All Orders Table */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">All Orders ({data?.orders?.length || 0})</h2>
          
          {data?.orders?.length === 0 ? (
            <p className="text-white/60 text-center py-8">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/80 py-3 px-2">Product</th>
                    <th className="text-left text-white/80 py-3 px-2">Amount</th>
                    <th className="text-left text-white/80 py-3 px-2">Status</th>
                    <th className="text-left text-white/80 py-3 px-2">Order ID</th>
                    <th className="text-left text-white/80 py-3 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.orders?.map((order: any) => (
                    <tr key={order._id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-2">
                        <p className="text-white font-medium">{order.productId?.title || 'Unknown'}</p>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-white">₹{order.amount}</p>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'paid' 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : order.status === 'failed'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <code className="text-white/60 text-xs">{order.razorpayOrderId?.substring(0, 20)}...</code>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-white/60 text-sm">
                          {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setLoading(true);
              fetchDebugData();
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition shadow-lg"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
