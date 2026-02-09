"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { buyerAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface TransactionDetails {
  _id: string;
  orderId: string;
  productName: string;
  productId: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  status: "paid" | "created" | "failed";
  date: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  downloadUrl?: string;
}

export default function TransactionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchTransactionDetails();
    }
  }, [orderId]);

  const fetchTransactionDetails = async () => {
    try {
      const data = await buyerAPI.getTransactionDetails(orderId);
      setTransaction(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load transaction details");
      router.push("/dashboard/buyer");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "created":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 border-green-300";
      case "failed":
        return "bg-red-100 border-red-300";
      case "created":
        return "bg-yellow-100 border-yellow-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return "✅";
      case "failed":
        return "❌";
      case "created":
        return "⏳";
      default:
        return "📦";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Transaction not found</p>
          <button
            onClick={() => router.push("/dashboard/buyer")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/buyer")}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2 font-semibold"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Transaction Details</h1>
        </div>

        {/* Status Badge */}
        <div className="mb-6 flex items-center justify-center">
          <span className={`px-8 py-4 rounded-full text-xl font-bold border-2 ${getStatusBgColor(transaction.status)}`}>
            {getStatusIcon(transaction.status)} {transaction.status === "paid" ? "Payment Successful" : transaction.status === "failed" ? "Payment Failed" : "Payment Pending"}
          </span>
        </div>

        {/* Product Information */}
        <div className="bg-white rounded-lg shadow p-8 mb-6 border-l-4 border-purple-600">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <p className="text-gray-700 font-semibold">Product Name</p>
              <p className="text-gray-900 text-lg font-bold">{transaction.productName}</p>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <p className="text-gray-700 font-semibold">Product ID</p>
              <p className="text-gray-600 font-mono text-sm">{transaction.productId}</p>
            </div>
          </div>
        </div>

        {/* Seller Information */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Seller Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-blue-200">
              <p className="text-gray-700 font-semibold">Seller Name</p>
              <p className="text-gray-900 text-lg font-bold">{transaction.sellerName}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-700 font-semibold">Seller Email</p>
              <p className="text-gray-900">{transaction.sellerEmail}</p>
            </div>
          </div>
        </div>

        {/* Transaction Information */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <p className="text-gray-700 font-semibold">Order ID</p>
              <p className="text-gray-900 font-mono">{transaction.orderId}</p>
            </div>
            {transaction.razorpayOrderId && (
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <p className="text-gray-700 font-semibold">Razorpay Order ID</p>
                <p className="text-gray-600 font-mono text-sm">{transaction.razorpayOrderId}</p>
              </div>
            )}
            {transaction.razorpayPaymentId && (
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <p className="text-gray-700 font-semibold">Payment ID</p>
                <p className="text-gray-600 font-mono text-sm">{transaction.razorpayPaymentId}</p>
              </div>
            )}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <p className="text-gray-700 font-semibold">Transaction Date</p>
              <p className="text-gray-900">{new Date(transaction.date).toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-700 font-semibold">Status</p>
              <span className={`px-4 py-2 rounded-full font-semibold ${getStatusBgColor(transaction.status)}`}>
                {transaction.status === "paid" ? "Success" : transaction.status === "failed" ? "Failed" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-8 mb-6 border-2 border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Amount</h2>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-gray-700 text-sm mb-2">Total Amount Paid</p>
              <p className="text-5xl font-bold text-green-600">₹{transaction.amount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl">{getStatusIcon(transaction.status)}</p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {transaction.status === "paid" && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <p className="text-green-900 font-semibold text-lg mb-2">✅ Payment Completed</p>
            <p className="text-green-700">
              Thank you! Your payment has been successfully processed. You can now download your product.
            </p>
            {transaction.downloadUrl && (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = transaction.downloadUrl;
                  link.download = transaction.productName ? `${transaction.productName.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'download.pdf';
                  link.target = '_blank';
                  link.rel = 'noopener noreferrer';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="inline-block mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition cursor-pointer"
              >
                Download Product
              </button>
            )}
          </div>
        )}

        {transaction.status === "failed" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-900 font-semibold text-lg mb-2">❌ Payment Failed</p>
            <p className="text-red-700">
              Your payment could not be processed. Please try again or contact support for assistance.
            </p>
          </div>
        )}

        {transaction.status === "created" && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-900 font-semibold text-lg mb-2">⏳ Payment Pending</p>
            <p className="text-yellow-700">
              Your payment is pending. Please complete the payment process to access the product.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/dashboard/buyer")}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition"
          >
            Back to Transactions
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
