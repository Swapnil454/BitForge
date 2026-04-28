"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
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
  const [downloading, setDownloading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
      router.push("/dashboard/buyer/transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!transaction?.downloadUrl) return;

    setDownloading(true);
    try {
      const link = document.createElement("a");
      link.href = transaction.downloadUrl;
      link.download = transaction.productName
        ? `${transaction.productName.replace(/[^a-z0-9]/gi, "_")}.pdf`
        : "download.pdf";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");
    } catch (error) {
      toast.error("Failed to start download");
    } finally {
      setDownloading(false);
    }
  };

  const handleContactSeller = () => {
    if (transaction?.sellerEmail) {
      window.location.href = `mailto:${transaction.sellerEmail}?subject=Regarding Order ${transaction.orderId}&body=Hello, I have a query regarding my purchase of "${transaction.productName}".`;
    }
  };

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownloadInvoice = () => {
    // Set dynamic PDF filename based on product name
    const productName = transaction?.productName
      ?.replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase() || "invoice";

    const originalTitle = document.title;
    document.title = `${productName}_invoice`;

    window.print();

    // Restore original title after print dialog
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          label: "Payment Successful",
          shortLabel: "Success",
          bgColor: "bg-emerald-500/20",
          textColor: "text-emerald-400",
          borderColor: "border-emerald-500/40",
          gradientFrom: "from-emerald-500/20",
          gradientTo: "to-green-500/20",
          glowColor: "shadow-emerald-500/30",
          dotColor: "bg-emerald-400",
          message: "Your payment has been successfully processed. You can now download your product.",
        };
      case "failed":
        return {
          label: "Payment Failed",
          shortLabel: "Failed",
          bgColor: "bg-red-500/20",
          textColor: "text-red-400",
          borderColor: "border-red-500/40",
          gradientFrom: "from-red-500/20",
          gradientTo: "to-rose-500/20",
          glowColor: "shadow-red-500/30",
          dotColor: "bg-red-400",
          message: "Your payment could not be processed. Please try again or contact support.",
        };
      case "created":
        return {
          label: "Payment Pending",
          shortLabel: "Pending",
          bgColor: "bg-amber-500/20",
          textColor: "text-amber-400",
          borderColor: "border-amber-500/40",
          gradientFrom: "from-amber-500/20",
          gradientTo: "to-yellow-500/20",
          glowColor: "shadow-amber-500/30",
          dotColor: "bg-amber-400",
          message: "Your payment is pending. Please complete the payment process to access the product.",
        };
      default:
        return {
          label: "Unknown Status",
          shortLabel: "Unknown",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/40",
          gradientFrom: "from-gray-500/20",
          gradientTo: "to-slate-500/20",
          glowColor: "shadow-gray-500/30",
          dotColor: "bg-gray-400",
          message: "Unable to determine payment status.",
        };
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white">
        <header className="sticky top-0 z-40 bg-gradient-to-r from-black via-slate-900 to-black backdrop-blur-xl border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-4">
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          </div>
          <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
        </main>
      </div>
    );
  }

  // Not Found State
  if (!transaction) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-6"
        >
          <h1 className="text-2xl font-bold text-white mb-3">Transaction Not Found</h1>
          <p className="text-white/60 mb-8 max-w-md">
            The transaction you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => router.push("/dashboard/buyer/transactions")}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
          >
            View All Transactions
          </button>
        </motion.div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(transaction.status);

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* Printable Invoice - Professional Amazon/Razorpay Style */}
      <div className="print-invoice hidden" style={{ minHeight: 'auto', height: 'auto' }}>
        <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '0', color: '#1a1a1a', minHeight: 'auto', height: 'auto' }}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '2px solid #1a1a1a', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>BitForge</h1>
              <p style={{ fontSize: '12px', color: '#555', margin: '0' }}>India's Trusted Digital Marketplace</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1a1a1a' }}>INVOICE</h2>
              <p style={{ fontSize: '12px', color: '#555', margin: '0' }}>Tax Invoice / Bill of Supply</p>
            </div>
          </div>

          {/* Invoice Details Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', padding: '16px', backgroundColor: '#f9f9f9', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order ID</p>
              <p style={{ fontSize: '13px', fontWeight: '600', margin: '0', fontFamily: 'monospace' }}>{transaction.orderId}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Date</p>
              <p style={{ fontSize: '13px', fontWeight: '600', margin: '0' }}>
                {new Date(transaction.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
              <p style={{ fontSize: '13px', fontWeight: '600', margin: '0', color: transaction.status === 'paid' ? '#16a34a' : transaction.status === 'failed' ? '#dc2626' : '#d97706' }}>
                {transaction.status === 'paid' ? 'PAID' : transaction.status === 'failed' ? 'FAILED' : 'PENDING'}
              </p>
            </div>
          </div>

          {/* Billing Section - Two Columns */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', gap: '40px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', borderBottom: '1px solid #e5e5e5', paddingBottom: '4px' }}>Billed To</p>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>Customer</p>
              <p style={{ fontSize: '12px', color: '#444', margin: '0' }}>Digital Product Purchase</p>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', borderBottom: '1px solid #e5e5e5', paddingBottom: '4px' }}>Sold By</p>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>{transaction.sellerName}</p>
              <p style={{ fontSize: '12px', color: '#444', margin: '0' }}>{transaction.sellerEmail}</p>
            </div>
          </div>

          {/* Product Table */}
          {(() => {
            // Calculate pricing breakdown
            const totalAmount = transaction.amount;
            const gstRate = 0.18; // 18% GST
            const platformFeeRate = 0.05; // 5% Platform Fee

            // Reverse calculate from total (total is inclusive of all fees)
            // Total = Base + Platform Fee + GST on (Base + Platform Fee)
            // Total = (Base + Platform Fee) * 1.18
            // Base + Platform Fee = Total / 1.18
            const amountBeforeGST = totalAmount / (1 + gstRate);
            const gstAmount = totalAmount - amountBeforeGST;

            // Platform fee is part of amountBeforeGST
            const platformFee = amountBeforeGST * platformFeeRate;
            const basePrice = amountBeforeGST - platformFee;

            // CGST and SGST split (9% each for intra-state)
            const cgst = gstAmount / 2;
            const sgst = gstAmount / 2;

            return (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a1a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#fff', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Description</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', width: '60px' }}>Qty</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>HSN/SAC</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#fff', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Rate</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#fff', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e5e5e5', fontSize: '13px' }}>
                      <strong style={{ display: 'block', marginBottom: '2px' }}>{transaction.productName}</strong>
                      <span style={{ fontSize: '11px', color: '#666' }}>Digital Product ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ ID: {transaction.productId.slice(-8)}</span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e5e5e5', textAlign: 'center', fontSize: '13px' }}>1</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e5e5e5', textAlign: 'center', fontSize: '12px', color: '#666' }}>998431</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e5e5e5', textAlign: 'right', fontSize: '13px' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e5e5e5', textAlign: 'right', fontSize: '13px', fontWeight: '500' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
                <tfoot>
                  {/* Subtotal */}
                  <tr>
                    <td colSpan={3} style={{ padding: '0' }}></td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', color: '#555', borderBottom: '1px solid #eee' }}>Subtotal</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', borderBottom: '1px solid #eee' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  {/* Platform Fee */}
                  <tr>
                    <td colSpan={3} style={{ padding: '0' }}></td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', color: '#555', borderBottom: '1px solid #eee' }}>Platform Fee (5%)</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', borderBottom: '1px solid #eee' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹{platformFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  {/* Taxable Amount */}
                  <tr>
                    <td colSpan={3} style={{ padding: '0' }}></td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', color: '#555', fontWeight: '500', borderBottom: '1px solid #eee' }}>Taxable Amount</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '500', borderBottom: '1px solid #eee' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹{amountBeforeGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  {/* CGST */}
                  <tr>
                    <td colSpan={3} style={{ padding: '0' }}></td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', color: '#555', borderBottom: '1px solid #eee' }}>CGST @ 9%</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', borderBottom: '1px solid #eee' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  {/* SGST */}
                  <tr>
                    <td colSpan={3} style={{ padding: '0' }}></td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', color: '#555', borderBottom: '1px solid #eee' }}>SGST @ 9%</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', borderBottom: '1px solid #eee' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  {/* Total GST */}
                  <tr>
                    <td colSpan={3} style={{ padding: '0' }}></td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', color: '#555', fontWeight: '500', borderBottom: '1px solid #ddd' }}>Total GST (18%)</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '500', borderBottom: '1px solid #ddd' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  {/* Grand Total */}
                  <tr style={{ backgroundColor: '#1a1a1a' }}>
                    <td colSpan={3} style={{ padding: '0' }}></td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#fff' }}>GRAND TOTAL</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '16px', fontWeight: '700', color: '#fff' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            );
          })()}

          {/* Amount in Words */}
          <div style={{ padding: '12px 16px', backgroundColor: '#f5f5f5', borderTop: '1px solid #e5e5e5', marginBottom: '0' }}>
            <p style={{ fontSize: '11px', color: '#666', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount in Words</p>
            <p style={{ fontSize: '12px', fontWeight: '600', margin: '0', color: '#1a1a1a' }}>
              Indian Rupees {(() => {
                const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                const numToWords = (n: number): string => {
                  if (n < 20) return ones[n];
                  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
                  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
                  if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
                  if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
                  return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
                };
                const amt = Math.round(transaction.amount);
                return numToWords(amt) + ' Only';
              })()}
            </p>
          </div>

          {/* Tax Note */}
          <div style={{ padding: '10px 16px', backgroundColor: '#fff', borderTop: '1px dashed #ddd', fontSize: '10px', color: '#666' }}>
            <p style={{ margin: '0 0 4px 0' }}><strong>SAC Code 998431:</strong> Online content (Digital Products)</p>
            <p style={{ margin: '0' }}>GST is calculated at 18% (CGST 9% + SGST 9%) on digital products as per GST regulations.</p>
          </div>

          {/* Payment Information */}
          {transaction.razorpayPaymentId && (
            <div style={{ padding: '14px 16px', backgroundColor: '#fafafa', border: '1px solid #e5e5e5', borderTop: 'none' }}>
              <p style={{ fontSize: '11px', color: '#666', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Payment Information</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <p style={{ fontSize: '10px', color: '#888', margin: '0 0 2px 0' }}>Payment Method</p>
                  <p style={{ fontSize: '12px', fontWeight: '600', margin: '0' }}>Razorpay</p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: '#888', margin: '0 0 2px 0' }}>Payment ID</p>
                  <p style={{ fontSize: '12px', fontWeight: '600', margin: '0', fontFamily: 'monospace' }}>{transaction.razorpayPaymentId}</p>
                </div>
                {transaction.razorpayOrderId && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#888', margin: '0 0 2px 0' }}>Razorpay Order ID</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', margin: '0', fontFamily: 'monospace' }}>{transaction.razorpayOrderId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '16px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '10px', color: '#666', margin: '0 0 2px 0' }}>For any queries, contact:</p>
                <p style={{ fontSize: '11px', color: '#1a1a1a', margin: '0' }}>support@bitforge.in</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Authorized Signatory</p>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', margin: '4px 0 0 0' }}>BitForge</p>
              </div>
            </div>
            <div style={{ textAlign: 'center', paddingTop: '12px', borderTop: '1px dashed #ccc' }}>
              <p style={{ fontSize: '10px', color: '#888', margin: '0 0 2px 0' }}>This is a computer-generated invoice. No signature required.</p>
              <p style={{ fontSize: '11px', color: '#1a1a1a', margin: '0', fontWeight: '500' }}>Thank you for your purchase!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Content */}
      <div className="screen-content">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-black via-slate-900 to-black backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard/buyer/transactions")}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
              >
                <span className="text-sm font-medium">←</span>
              </button>
              <div className="h-6 w-px bg-white/20 hidden sm:block" />
              <h1 className="text-lg sm:text-xl font-bold text-white">Transaction Details</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
              >
                Open Invoice Page
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section - Status & Amount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden bg-gradient-to-br ${statusConfig.gradientFrom} ${statusConfig.gradientTo} border ${statusConfig.borderColor} rounded-3xl p-6 sm:p-8 shadow-xl ${statusConfig.glowColor}`}
        >
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left - Status Info */}
            <div>
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{statusConfig.label}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                    {statusConfig.shortLabel}
                  </span>
                </div>
                <p className="text-white/70 text-sm sm:text-base max-w-xl">
                  {statusConfig.message}
                </p>
              </div>
            </div>

            {/* Right - Amount */}
            <div className="lg:text-right">
              <p className="text-white/50 text-xs sm:text-sm font-medium mb-1">Total Amount</p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Rs. {transaction.amount.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Product Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
              <h3 className="text-lg font-bold text-white">
                Product Information
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-white/5">
                <span className="text-white/50 text-sm font-medium">Product Name</span>
                <span className="text-white font-semibold text-right">{transaction.productName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-white/50 text-sm font-medium">Product ID</span>
                <span className="text-white/70 font-mono text-sm bg-white/5 px-2 py-1 rounded-lg">
                  {transaction.productId}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Seller Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
              <h3 className="text-lg font-bold text-white">
                Seller Information
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-white/5">
                <span className="text-white/50 text-sm font-medium">Seller Name</span>
                <span className="text-white font-semibold">{transaction.sellerName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-white/50 text-sm font-medium">Email</span>
                <span className="text-white/70 text-sm">{transaction.sellerEmail}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Transaction Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
            <h3 className="text-lg font-bold text-white">
              Transaction Details
            </h3>
          </div>
          <div className="p-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-4 bg-white/5 rounded-xl group relative">
                <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Order ID</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-sm break-all flex-1">{transaction.orderId}</span>
                  <button
                    onClick={() => handleCopyToClipboard(transaction.orderId, "Order ID")}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all opacity-60 hover:opacity-100"
                    title="Copy Order ID"
                  >
                    {copiedField === "Order ID" ? (
                      <span className="text-emerald-400 text-xs font-medium">Copied</span>
                    ) : (
                      <span className="text-xs font-medium text-white/70">Copy</span>
                    )}
                  </button>
                </div>
              </div>

              {transaction.razorpayOrderId && (
                <div className="flex flex-col gap-1 p-4 bg-white/5 rounded-xl">
                  <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Razorpay Order ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 font-mono text-sm break-all flex-1">{transaction.razorpayOrderId}</span>
                    <button
                      onClick={() => handleCopyToClipboard(transaction.razorpayOrderId!, "Razorpay Order ID")}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-all opacity-60 hover:opacity-100"
                      title="Copy Razorpay Order ID"
                    >
                      {copiedField === "Razorpay Order ID" ? (
                        <span className="text-emerald-400 text-xs font-medium">Copied</span>
                      ) : (
                        <span className="text-xs font-medium text-white/70">Copy</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {transaction.razorpayPaymentId && (
                <div className="flex flex-col gap-1 p-4 bg-white/5 rounded-xl">
                  <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Payment ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 font-mono text-sm break-all flex-1">{transaction.razorpayPaymentId}</span>
                    <button
                      onClick={() => handleCopyToClipboard(transaction.razorpayPaymentId!, "Payment ID")}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-all opacity-60 hover:opacity-100"
                      title="Copy Payment ID"
                    >
                      {copiedField === "Payment ID" ? (
                        <span className="text-emerald-400 text-xs font-medium">Copied</span>
                      ) : (
                        <span className="text-xs font-medium text-white/70">Copy</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 p-4 bg-white/5 rounded-xl">
                <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Date & Time</span>
                <span className="text-white text-sm">
                  {new Date(transaction.date).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="text-white/60 text-xs">
                  {new Date(transaction.date).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-white/5 rounded-xl">
                <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Payment Status</span>
                <span className={`${statusConfig.textColor} font-semibold`}>
                  {statusConfig.shortLabel}
                </span>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-white/5 rounded-xl">
                <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Payment Method</span>
                <span className="text-white text-sm">Razorpay</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          {/* Download Button - Only for paid transactions */}
          {transaction.status === "paid" && transaction.downloadUrl && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] shadow-xl shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">{downloading ? "Downloading..." : "Download Product"}</span>
            </button>
          )}

          {/* Contact Seller */}
          <button
            onClick={handleContactSeller}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 text-white font-semibold rounded-2xl transition-all hover:scale-[1.02]"
          >
            <span>Contact Seller</span>
          </button>

          {/* Retry Payment - Only for failed transactions */}
          {transaction.status === "failed" && (
            <button
              onClick={() => router.push(`/product/${transaction.productId}`)}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] shadow-xl shadow-amber-500/30"
            >
              <span>Retry Payment</span>
            </button>
          )}

          {/* View Invoice */}
          <button
            onClick={handleDownloadInvoice}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/30 text-white font-semibold rounded-2xl transition-all hover:scale-[1.02]"
          >
            <span>Download Invoice</span>
          </button>
        </motion.div>

        {/* Print Receipt - Mobile Only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sm:hidden"
        >
          <button
            onClick={() => window.print()}
            className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
          >
            Print Receipt
          </button>
        </motion.div>

        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex justify-center pt-4"
        >
          <button
            onClick={() => router.push("/dashboard/buyer/transactions")}
            className="text-white/50 hover:text-white text-sm font-medium transition-colors"
          >
            Back to all transactions
          </button>
        </motion.div>
      </main>
      </div>

      {/* Print Styles - Professional Invoice Layout */}
      <style jsx global>{`
        @media print {
          html, body {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 12px !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: auto !important;
            height: auto !important;
          }

          /* Hide screen content */
          .screen-content {
            display: none !important;
          }

          /* Show print invoice */
          .print-invoice {
            display: block !important;
            background: #fff !important;
            min-height: auto !important;
            height: auto !important;
          }

          /* Print-specific table styles */
          .print-invoice table {
            page-break-inside: avoid !important;
          }

          .print-invoice thead {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Ensure proper background colors print */
          .print-invoice [style*="background"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Remove min-height from root element */
          #__next, main, div {
            min-height: auto !important;
            height: auto !important;
          }

          @page {
            margin: 15mm 12mm;
            size: A4;
          }
        }

        /* Hide print invoice on screen */
        @media screen {
          .print-invoice {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}


