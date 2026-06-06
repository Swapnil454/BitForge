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
  sellerEmail?: string;
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
  dynamicQr?: {
    qrImageUrl: string;
  };
  gstBreakup?: {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  };
}

function amountToWords(amount: number) {
  const numberToWords = (num: any) => {
    const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    if ((num = num.toString()).length > 9) return "overflow";
    let n: any = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = "";
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore " : "";
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh " : "";
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand " : "";
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred " : "";
    str += (n[5] != 0) ? ((str != "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) : "";
    return str;
  };
  const wholeNumber = Math.floor(amount);
  const decimalPart = Math.round((amount - wholeNumber) * 100);
  let result = wholeNumber > 0 ? numberToWords(wholeNumber) + "Rupees" : "Zero Rupees";
  if (decimalPart > 0) {
    result += " and " + numberToWords(decimalPart) + "Paise";
  }
  return result.trim() + " Only";
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
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, '.');
  };

  const formatSignatureDate = (date: string) => {
    if (!date) return "N/A";
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
  };

  const formatMoney = (amount: number) => {
    const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const filename = `${(invoice?.productName || "Invoice").replace(/[^a-zA-Z0-9\s]/g, "")} Invoice`;
    document.title = filename;

    window.print();

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
    
    // CGST and SGST
    const cgst = invoice.gstBreakup?.cgst || gstAmount / 2;
    const sgst = invoice.gstBreakup?.sgst || gstAmount / 2;
    const igst = invoice.gstBreakup?.igst || 0;

    return {
      originalPrice,
      subtotal,
      discountAmount,
      discountPercent,
      gstAmount,
      platformFee,
      totalPaid,
      cgst,
      sgst,
      igst
    };
  }, [invoice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error || !invoice || !totals) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <p className="mb-4 text-red-500">{error || "Invoice not found"}</p>
          <button
            onClick={() => router.back()}
            className="rounded bg-slate-200 px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const actionButtons = (
    <>
      <button
        onClick={handlePrint}
        className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto flex items-center justify-center gap-2"
      >
        Print
      </button>
      <button
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto flex items-center justify-center gap-2"
      >
        {downloading ? "Downloading..." : "Download PDF"}
      </button>
    </>
  );

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0mm; /* Hides browser headers/footers */
          }
          header, nav, aside, footer, .no-print {
            display: none !important;
          }
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            padding: 10mm !important;
          }
          main {
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
        }
      `}</style>

      <div className="no-print">
        <PageHeader
          backLabel="Back"
          title="Tax Invoice"
          subtitle={invoice?.invoiceNumber ? `Invoice #${invoice.invoiceNumber}` : ""}
          rightSlot={<div className="hidden sm:flex gap-3">{actionButtons}</div>}
        />
      </div>

      <main className="min-h-screen bg-slate-100 px-4 py-5 text-black sm:px-6 sm:py-8 font-sans">
        <div className="mx-auto max-w-5xl">
          <div className="no-print mb-5 flex justify-end">
            <div className="grid grid-cols-2 gap-3 w-full sm:hidden">
              {actionButtons}
            </div>
          </div>

          <div className="overflow-x-auto bg-white border border-slate-200 shadow-sm w-full">
            <section className="p-4 sm:p-8 text-[13px] leading-relaxed min-w-[700px]">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-black pb-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">BitForge.in</h1>
                </div>
                <div className="text-right">
                  <p className="font-bold text-base">Tax Invoice/Bill of Supply/Cash Memo</p>
                  <p>(Original for Recipient)</p>
                </div>
              </div>

              {/* Signature Block - Row 1 */}
              <div className="mb-6 relative text-xs inline-block font-semibold text-slate-800">
                <p className="text-sm">Signature valid</p>
                <div className="relative inline-block">
                  <p className="whitespace-nowrap relative z-20">Digitally signed by Bitforge Technology Services Pvt. Ltd.</p>
                  <div className="absolute top-[60%] left-[50%] w-12 h-12 pointer-events-none z-10" style={{ transform: 'translate(-50%, -50%)' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                      {/* Shadow */}
                      <path d="M 30 50 L 44 64 L 74 21 L 86 29 L 46 86 L 20 60 Z" fill="black" transform="translate(1.5, 2)" />
                      {/* Green Tick */}
                      <path d="M 30 50 L 44 64 L 74 21 L 86 29 L 46 86 L 20 60 Z" fill="#00b050" stroke="black" strokeWidth="1" strokeLinejoin="miter" />
                    </svg>
                  </div>
                </div>
                <p className="whitespace-nowrap mt-2">Date: {formatSignatureDate(invoice.invoiceDate || invoice.createdAt)}</p>
                <p>Reason: Invoice</p>
              </div>

              {/* Top section: Seller / Buyer - Row 2 */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                {/* Left Column */}
                <div>
                  {/* Sold By */}
                  <div className="mb-4">
                    <p className="font-bold text-sm">Sold By :</p>
                    <p className="font-medium">{invoice.sellerName}</p>
                    <p className="font-medium">{invoice.sellerEmail || "N/A"}</p>
                    <p className="font-medium"><span className="font-bold">PAN No:</span> N/A</p>
                    <p className="font-medium"><span className="font-bold">GST Registration No:</span> N/A</p>
                    <p className="font-medium"><span className="font-bold">CIN No:</span> N/A</p>
                  </div>
                  {/* Dynamic QR */}
                  <div>
                    <p className="font-bold mb-1">Dynamic QR Code:</p>
                    {invoice.dynamicQr?.qrImageUrl ? (
                      <img src={invoice.dynamicQr.qrImageUrl} alt="UPI QR Code" className="w-20 h-20 border border-slate-200" />
                    ) : (
                      <div className="w-20 h-20 border border-slate-300 flex items-center justify-center text-[10px] text-slate-400">No QR</div>
                    )}
                    
                    <div className="mt-2 text-xs leading-tight">
                      <p className="font-medium"><span className="font-bold">Order Number:</span> {invoice.razorpayOrderId || invoice.orderId}</p>
                      <p className="font-medium"><span className="font-bold">Order Date:</span> {formatDate(invoice.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="text-right flex flex-col items-end">
                  {/* Billing Address */}
                  <div className="mb-4">
                    <p className="font-bold text-sm">Billing Address :</p>
                    <p className="font-medium">{invoice.buyerName}</p>
                    <p className="font-medium">{invoice.buyerEmail}</p>
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-4">
                    <p className="font-bold text-sm">Shipping Address :</p>
                    <p className="font-medium">{invoice.buyerName}</p>
                    <p className="font-medium">{invoice.buyerEmail}</p>
                  </div>

                  {/* Invoice Details */}
                  <div className="mt-2 text-xs leading-tight text-right">
                    <p className="font-medium"><span className="font-bold">Invoice Number :</span> {invoice.invoiceNumber || 'BF-2026-0009'}</p>
                    <p className="font-medium"><span className="font-bold">Invoice Details :</span> {invoice.razorpayPaymentId || 'N/A'}</p>
                    <p className="font-medium"><span className="font-bold">Invoice Date :</span> {formatDate(invoice.invoiceDate || invoice.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-black text-[10px] sm:text-xs text-center">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black font-bold">
                      <th className="border border-black p-1 w-6 sm:w-8">Sl. No</th>
                      <th className="border border-black p-1 text-left">Description</th>
                      <th className="border border-black p-1">Unit Price</th>
                      <th className="border border-black p-1 w-8 sm:w-12">Qty</th>
                      <th className="border border-black p-1">Net Amount</th>
                      <th className="border border-black p-1">Tax Rate</th>
                      <th className="border border-black p-1">Tax Type</th>
                      <th className="border border-black p-1">Tax Amount</th>
                      <th className="border border-black p-1">Platform Fee</th>
                      <th className="border border-black p-1">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1">1</td>
                      <td className="border border-black p-1 text-left">
                        <p className="font-bold">{invoice.productName}</p>
                        <p className="text-[9px] text-slate-600">{invoice.productDescription}</p>
                      </td>
                      <td className="border border-black p-1">{formatMoney(totals.originalPrice)}</td>
                      <td className="border border-black p-1">1</td>
                      <td className="border border-black p-1">{formatMoney(totals.subtotal)}</td>
                      <td className="border border-black p-1">{(invoice.gstRate || 0.05) * 100}%</td>
                      <td className="border border-black p-1">
                        <div className="flex justify-between px-1"><span>CGST</span></div>
                        <div className="flex justify-between px-1 border-t border-dotted border-slate-400 mt-1 pt-1"><span>SGST</span></div>
                      </td>
                      <td className="border border-black p-1">
                        <div className="text-right px-1">{formatMoney(totals.cgst)}</div>
                        <div className="text-right px-1 border-t border-dotted border-slate-400 mt-1 pt-1">{formatMoney(totals.sgst)}</div>
                      </td>
                      <td className="border border-black p-1">{formatMoney(totals.platformFee)}</td>
                      <td className="border border-black p-1 font-bold">{formatMoney(totals.totalPaid)}</td>
                    </tr>
                    {/* Totals Row */}
                    <tr className="font-bold">
                      <td colSpan={4} className="border border-black p-1 text-right">TOTAL:</td>
                      <td className="border border-black p-1 text-right">{formatMoney(totals.subtotal)}</td>
                      <td className="border border-black p-1 text-right"></td>
                      <td className="border border-black p-1 text-right"></td>
                      <td className="border border-black p-1 text-right">{formatMoney(totals.gstAmount)}</td>
                      <td className="border border-black p-1 text-right">{formatMoney(totals.platformFee)}</td>
                      <td className="border border-black p-1 text-right">{formatMoney(totals.totalPaid)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Section */}
              <div className="border-x border-b border-black text-xs mb-6">
                <div className="p-2 border-b border-black">
                  <p className="font-bold mb-1">Amount in Words:</p>
                  <p>{amountToWords(totals.totalPaid)}</p>
                </div>
                <div className="p-2 h-24 relative">
                  <p className="font-bold text-right right-2 top-2 absolute">For Bitforge Technology Services Pvt. Ltd.:</p>
                  <p className="font-bold text-right right-2 bottom-2 absolute">Authorized Signatory</p>
                </div>
              </div>

              <div className="text-center mb-2 mt-8 text-slate-700 font-semibold">
                <p className="text-xs mb-1">Thank you for purchase</p>
                <p className="text-[10px] leading-none">If any Query please contact support@bittforge.in</p>
                <p className="text-[10px] leading-none mt-1">© 2026 BitForge Technologies. All rights reserved</p>
              </div>

            </section>
          </div>
        </div>
      </main>
    </>
  );
}
