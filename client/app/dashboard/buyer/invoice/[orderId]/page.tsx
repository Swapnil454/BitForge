"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

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
    const originalTitle = document.title;
    const filename = `${(invoice?.productName || "Invoice").replace(/[^a-zA-Z0-9\s]/g, "")} Invoice`;
    document.title = filename;
    
    window.print();
    
    // Restore title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
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
      <div className="min-h-screen bg-[#06070b]">
        {/* Skeleton Header */}
        <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-black/95">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="relative flex min-h-[58px] items-center justify-center">
              <div className="h-8 w-24 bg-slate-100 dark:bg-white/5 rounded absolute left-0 animate-pulse"></div>
              <div className="h-6 w-48 bg-slate-100 dark:bg-white/5 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8 w-full">
          <div className="mb-5 flex justify-end">
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <div className="h-10 w-full sm:w-24 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse"></div>
              <div className="h-10 w-full sm:w-32 bg-cyan-400/20 rounded-xl animate-pulse"></div>
            </div>
          </div>
          
          <div className="rounded-[30px] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#12141c]/50 h-[600px] animate-pulse"></div>
        </main>
      </div>
    );
  }

  if (error || !invoice || !totals) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06070b] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 dark:border-white/10 bg-slate-900/75 p-8 text-center text-slate-900 dark:text-white shadow-2xl">
          <p className="mb-4 text-red-400">{error || "Invoice not found"}</p>
          <button
            onClick={() => router.back()}
            className="rounded-full bg-slate-200 dark:bg-white/10 px-5 py-2.5 text-sm font-medium text-slate-900 dark:text-white transition hover:bg-white/15"
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
            margin: 0;
          }

          body {
            background: #ffffff !important;
            margin: 10mm;
          }

          body > *:not(main) {
            display: none !important;
          }

          main {
            min-height: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }

          .print-area {
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .print-area > div {
            padding-top: 12px !important;
            padding-bottom: 12px !important;
          }

          .print-area .gap-4,
          .print-area .gap-5 {
            gap: 12px !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <PageHeader
        backLabel="Back"
        title="Tax Invoice"
        subtitle={invoice?.invoiceNumber ? `Invoice #${invoice.invoiceNumber}` : ""}
      />

      <main className="min-h-screen bg-[#06070b] px-4 py-5 text-slate-900 dark:text-white sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="no-print mb-5 flex justify-end">
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row w-full sm:w-auto">
              <button
                onClick={handlePrint}
                className="w-full rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15 sm:w-auto flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Print
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                )}
                {downloading ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </div>

          <section className="print-area overflow-hidden rounded-[30px] border border-slate-200 bg-white text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.32)]">
            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-5 py-6 text-slate-900 dark:text-white sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-3xl font-bold tracking-tight">BitForge</p>
                  <p className="mt-1 text-sm text-slate-300">India&apos;s Trusted Digital Marketplace</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Tax Invoice</p>
                </div>

                <div className="grid gap-3 text-sm sm:text-right">
                  <div>
                    <p className="text-slate-400">Invoice Number</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Invoice Date</p>
                    <p className="font-medium text-slate-900 dark:text-white">{formatDate(invoice.invoiceDate || invoice.createdAt)}</p>
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
