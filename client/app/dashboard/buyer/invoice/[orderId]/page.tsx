"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  productName: string;
  productDescription: string;
  // New fields
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  priceAfterDiscount: number;
  gstRate: number;
  gstAmount: number;
  platformFeeRate: number;
  platformFee: number;
  totalAmount: number;
  // Old/legacy fields for backward compatibility
  productPrice?: number;
  totalPlatformAmount?: number;
  // Payment
  razorpayOrderId: string;
  razorpayPaymentId: string;
  paymentMethod: string;
  orderId: string;
}

export default function InvoicePage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${orderId}/data`);
        setInvoice(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchInvoice();
    }
  }, [orderId]);

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return "0.00";
    return parseFloat(amount.toString())
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-red-400 mb-4">{error || "Invoice not found"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const gstPercent = Math.round((invoice.gstRate || 0.05) * 100);
  const platformPercent = Math.round((invoice.platformFeeRate || 0.02) * 100);

  // Compute values with fallbacks for old invoices
  // Old invoices: productPrice = amount paid, totalPlatformAmount = platformFee + gstAmount
  // New invoices: originalPrice, priceAfterDiscount, totalAmount (includes taxes)
  const productPrice = invoice.originalPrice || invoice.productPrice || invoice.priceAfterDiscount || 0;
  const subtotal = invoice.priceAfterDiscount || invoice.productPrice || productPrice;
  const discountAmt = invoice.discountAmount || 0;
  const discountPct = invoice.discountPercent || 0;
  const gstAmt = invoice.gstAmount || 0;
  const platformFeeAmt = invoice.platformFee || 0;
  // For old invoices: buyer paid productPrice, for new: totalAmount
  const totalPaid = invoice.totalAmount || invoice.productPrice || subtotal || productPrice;

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            font-size: 11px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-6 px-4">
        {/* Action Buttons - Hidden on Print */}
        <div className="no-print max-w-3xl mx-auto mb-4 flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-lg font-semibold transition shadow-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Invoice
          </button>
        </div>

        {/* Invoice Card - Compact for single page */}
        <div ref={printRef} className="print-area max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header - Compact */}
          <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">BitForge</h1>
              <p className="text-slate-400 text-xs">India&apos;s Trusted Digital Marketplace</p>
            </div>
            <span className="text-xl font-bold text-indigo-400">INVOICE</span>
          </div>

          {/* Company & Invoice Info - Combined Row */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between text-sm">
            <div>
              <p className="font-semibold text-gray-800">BitForge Technologies</p>
              <p className="text-xs text-gray-500">Lonavala, Maharashtra, India | support@bitforge.in</p>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p><span className="text-gray-500">Invoice:</span> <span className="font-semibold">{invoice.invoiceNumber}</span></p>
              <p><span className="text-gray-500">Date:</span> <span className="font-semibold">{formatDate(invoice.invoiceDate || invoice.createdAt)}</span></p>
              <p><span className="text-gray-500">Order:</span> <span className="font-semibold">{invoice.razorpayOrderId || invoice.orderId?.slice(-8)?.toUpperCase()}</span></p>
            </div>
          </div>

          {/* Billing Section - Compact */}
          <div className="px-6 py-3 flex gap-4">
            <div className="flex-1 border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-indigo-500 mb-1">BILLED TO</p>
              <p className="font-semibold text-gray-800 text-sm">{invoice.buyerName || "Valued Customer"}</p>
              <p className="text-xs text-gray-500">{invoice.buyerEmail || "N/A"}</p>
            </div>
            <div className="flex-1 border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-indigo-500 mb-1">SELLER</p>
              <p className="font-semibold text-gray-800 text-sm">{invoice.sellerName || "BitForge Seller"}</p>
              <p className="text-xs text-gray-500">Via BitForge Platform</p>
            </div>
          </div>

          {/* Products Table - Compact */}
          <div className="px-6 py-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">DESCRIPTION</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600 w-16">QTY</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600 w-24">PRICE</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600 w-24">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-gray-800">{invoice.productName || "Digital Product"}</p>
                    <p className="text-xs text-gray-500">{invoice.productDescription?.substring(0, 60) || "Digital download"}</p>
                  </td>
                  <td className="text-center px-3 py-3 text-gray-600">1</td>
                  <td className="text-right px-3 py-3 text-gray-600">₹{formatCurrency(productPrice)}</td>
                  <td className="text-right px-3 py-3 font-semibold text-gray-800">₹{formatCurrency(subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary - Compact Side by Side */}
          <div className="px-6 py-3 flex justify-between items-start gap-4">
            <div className="flex flex-col gap-2">
              <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                PAID
              </div>
              <p className="text-xs text-gray-500">Transaction: {invoice.razorpayPaymentId || "N/A"}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 min-w-[220px] text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Subtotal:</span>
                <span className="text-gray-800">₹{formatCurrency(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between py-1 text-emerald-600">
                  <span>Discount ({discountPct}%):</span>
                  <span>-₹{formatCurrency(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-gray-500">GST ({gstPercent}%):</span>
                <span className="text-gray-800">₹{formatCurrency(gstAmt)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Platform Fee ({platformPercent}%):</span>
                <span className="text-gray-800">₹{formatCurrency(platformFeeAmt)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200 mt-1 font-bold text-indigo-600">
                <span>TOTAL:</span>
                <span>₹{formatCurrency(totalPaid)}</span>
              </div>
            </div>
          </div>

          {/* Footer - Compact */}
          <div className="bg-gray-50 px-6 py-3 text-center border-t border-gray-200">
            <p className="font-semibold text-gray-800">Thank you for your purchase!</p>
            <p className="text-xs text-gray-500">Your digital product is ready for download in your dashboard.</p>
          </div>

          {/* Notes - Compact Single Line */}
          <div className="px-6 py-2 border-t border-gray-100 text-xs text-gray-500">
            <p>• Digitally generated invoice - no signature required • Refunds: support@bitforge.in (within 7 days) • Products are non-transferable</p>
          </div>

          {/* Copyright */}
          <div className="text-center py-2 text-xs text-gray-400 border-t border-gray-100">
            © {new Date().getFullYear()} BitForge Technologies. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}
