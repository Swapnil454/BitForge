"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

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
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  priceAfterDiscount: number;
  gstRate: number;
  gstAmount: number;
  platformFeeRate: number;
  platformFee: number;
  totalAmount: number;
  productPrice?: number;
  totalPlatformAmount?: number;
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
  const [downloading, setDownloading] = useState(false);

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

  const formatMoney = (amount: number) => {
    const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    return `Rs. ${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!orderId) return;

    try {
      setDownloading(true);
      const response = await api.get(`/invoices/${orderId}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${(invoice?.productName || "invoice").replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_invoice.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"|filename=([^;\s]+)/);
        if (match) {
          filename = match[1] || match[2];
        }
      }

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to download invoice");
    } finally {
      setDownloading(false);
    }
  };

  const totals = useMemo(() => {
    if (!invoice) return null;

    const originalPrice = Number(invoice.originalPrice || invoice.productPrice || invoice.priceAfterDiscount || 0);
    const subtotal = Number(invoice.priceAfterDiscount || invoice.productPrice || originalPrice || 0);
    const discountAmount = Number(invoice.discountAmount || 0);
    const discountPercent = Number(invoice.discountPercent || 0);
    const gstAmount = Number(invoice.gstAmount || 0);
    const platformFee = Number(invoice.platformFee || 0);
    const totalPaid = Number(invoice.totalAmount || subtotal + gstAmount + platformFee);
    const gstPercent = Math.round(Number(invoice.gstRate || 0.05) * 100);
    const platformPercent = Math.round(Number(invoice.platformFeeRate || 0.02) * 100);

    return {
      originalPrice,
      subtotal,
      discountAmount,
      discountPercent,
      gstAmount,
      platformFee,
      totalPaid,
      gstPercent,
      platformPercent,
    };
  }, [invoice]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06070b]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
      </div>
    );
  }

  if (error || !invoice || !totals) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06070b] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-900/75 p-8 text-center text-white shadow-2xl">
          <p className="mb-4 text-red-400">{error || "Invoice not found"}</p>
          <button
            onClick={() => router.back()}
            className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background: #ffffff !important;
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
            inset: 0;
            width: 100%;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[#06070b] px-4 py-5 text-white sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="no-print mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Buyer Invoice</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Clean Invoice View</h1>
              <p className="mt-1 text-sm text-slate-400">A simpler invoice layout with actual platform fee and GST values.</p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row">
              <button
                onClick={() => router.back()}
                className="w-full rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08] sm:w-auto"
              >
                Back
              </button>
              <button
                onClick={handlePrint}
                className="w-full rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15 sm:w-auto"
              >
                Print
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="w-full rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {downloading ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </div>

          <section className="print-area overflow-hidden rounded-[30px] border border-slate-200 bg-white text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.32)]">
            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-5 py-6 text-white sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-3xl font-bold tracking-tight">BitForge</p>
                  <p className="mt-1 text-sm text-slate-300">India&apos;s Trusted Digital Marketplace</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Tax Invoice</p>
                </div>

                <div className="grid gap-3 text-sm sm:text-right">
                  <div>
                    <p className="text-slate-400">Invoice Number</p>
                    <p className="font-semibold text-white">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Invoice Date</p>
                    <p className="font-medium text-white">{formatDate(invoice.invoiceDate || invoice.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-b border-slate-200 px-5 py-5 sm:grid-cols-2 sm:px-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Billed To</p>
                <p className="mt-3 text-base font-semibold text-slate-950">{invoice.buyerName || "Valued Customer"}</p>
                <p className="mt-1 break-all text-sm text-slate-600">{invoice.buyerEmail || "N/A"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Seller</p>
                <p className="mt-3 text-base font-semibold text-slate-950">{invoice.sellerName || "BitForge Seller"}</p>
                <p className="mt-1 text-sm text-slate-600">Sold via BitForge platform</p>
              </div>
            </div>

            <div className="grid gap-4 border-b border-slate-200 px-5 py-5 text-sm sm:grid-cols-3 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order ID</p>
                <p className="mt-2 break-all font-medium text-slate-950">{invoice.razorpayOrderId || invoice.orderId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payment ID</p>
                <p className="mt-2 break-all font-medium text-slate-950">{invoice.razorpayPaymentId || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payment Method</p>
                <p className="mt-2 font-medium text-slate-950">{invoice.paymentMethod || "Razorpay"}</p>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-8">
              <div className="hidden rounded-2xl border border-slate-200 sm:block">
                <div className="grid grid-cols-[minmax(0,1fr)_56px_104px_104px] gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  <span>Description</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Amount</span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_56px_104px_104px] gap-3 px-4 py-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-950">{invoice.productName || "Digital Product"}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{invoice.productDescription?.substring(0, 140) || "Digital download"}</p>
                  </div>
                  <div className="text-center text-slate-700">1</div>
                  <div className="text-right text-slate-700">{formatMoney(totals.originalPrice)}</div>
                  <div className="text-right font-semibold text-slate-950">{formatMoney(totals.subtotal)}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Line Item</p>
                <div className="mt-3 border-b border-slate-200 pb-3">
                  <p className="text-base font-semibold text-slate-950">{invoice.productName || "Digital Product"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{invoice.productDescription?.substring(0, 200) || "Digital download"}</p>
                </div>
                <div className="mt-4 grid gap-3">
                  <MobileStat label="Quantity" value="1" />
                  <MobileStat label="Price" value={formatMoney(totals.originalPrice)} />
                  <MobileStat label="Amount" value={formatMoney(totals.subtotal)} strong />
                </div>
              </div>
            </div>

            <div className="grid gap-5 border-b border-slate-200 px-5 py-5 sm:px-8 lg:grid-cols-[1fr_320px] lg:items-start">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Payment Status</p>
                <p className="mt-2 text-lg font-semibold text-emerald-800">Paid</p>
                <p className="mt-1 text-sm text-emerald-700">This invoice is based on the actual values stored for this order.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between gap-4 py-2 text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-950">{formatMoney(totals.subtotal)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between gap-4 py-2 text-sm text-emerald-700">
                    <span>Discount ({totals.discountPercent}%)</span>
                    <span>-{formatMoney(totals.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 py-2 text-sm">
                  <span className="text-slate-600">GST ({totals.gstPercent}%)</span>
                  <span className="font-medium text-slate-950">{formatMoney(totals.gstAmount)}</span>
                </div>
                <div className="flex justify-between gap-4 py-2 text-sm">
                  <span className="text-slate-600">Platform Fee ({totals.platformPercent}%)</span>
                  <span className="font-medium text-slate-950">{formatMoney(totals.platformFee)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-4 border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                  <span>Total Paid</span>
                  <span>{formatMoney(totals.totalPaid)}</span>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Notes</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">This is a digitally generated invoice. No physical signature is required. For invoice support, contact support@bitforge.in.</p>
            </div>

            <div className="bg-slate-50 px-5 py-4 text-center text-sm text-slate-600 sm:px-8">
              <p className="font-medium text-slate-900">Thank you for your purchase.</p>
              <p className="mt-1">Your digital product is available from your buyer dashboard.</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function MobileStat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-semibold text-slate-950" : "font-medium text-slate-800"}>{value}</span>
    </div>
  );
}
