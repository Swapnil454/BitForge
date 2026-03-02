


import PDFDocument from "pdfkit";

/**
 * BitForge Professional Invoice PDF Generator
 * Production-level invoice with company branding
 */
export const generateInvoicePDF = (invoice, res) => {
  const doc = new PDFDocument({ 
    size: 'A4',
    margin: 50,
    info: {
      Title: `Invoice ${invoice.invoiceNumber}`,
      Author: 'BitForge Technologies',
      Subject: 'Digital Product Invoice',
    }
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${invoice.invoiceNumber}.pdf`
  );

  doc.pipe(res);

  // Colors
  const primaryColor = '#6366F1'; // Indigo
  const textDark = '#1F2937';
  const textMuted = '#6B7280';
  const borderColor = '#E5E7EB';

  // ========== HEADER SECTION ==========
  // Company Logo Area (gradient bar)
  doc.rect(0, 0, 612, 100).fill('#0F172A');
  
  // Company Name
  doc.font('Helvetica-Bold')
     .fontSize(28)
     .fillColor('#FFFFFF')
     .text('BitForge', 50, 35);
  
  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#94A3B8')
     .text('India\'s Trusted Digital Marketplace', 50, 65);

  // Invoice Label (right side)
  doc.font('Helvetica-Bold')
     .fontSize(24)
     .fillColor(primaryColor)
     .text('INVOICE', 400, 40, { align: 'right', width: 162 });

  // ========== INVOICE INFO SECTION ==========
  const infoY = 120;
  
  // Left Column - Company Details
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor(textDark)
     .text('BitForge Technologies', 50, infoY);
  
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor(textMuted)
     .text('Lonavala, Maharashtra, India', 50, infoY + 15)
     .text('Email: support@bitforge.in', 50, infoY + 28)
     .text('Website: www.bitforge.in', 50, infoY + 41);

  // Right Column - Invoice Details
  const invoiceInfoX = 380;
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor(textMuted);
  
  doc.text('Invoice Number:', invoiceInfoX, infoY);
  doc.font('Helvetica-Bold')
     .fillColor(textDark)
     .text(invoice.invoiceNumber, invoiceInfoX + 90, infoY);
  
  doc.font('Helvetica')
     .fillColor(textMuted)
     .text('Invoice Date:', invoiceInfoX, infoY + 15);
  doc.font('Helvetica-Bold')
     .fillColor(textDark)
     .text(formatDate(invoice.invoiceDate || invoice.createdAt), invoiceInfoX + 90, infoY + 15);
  
  doc.font('Helvetica')
     .fillColor(textMuted)
     .text('Order ID:', invoiceInfoX, infoY + 30);
  doc.font('Helvetica-Bold')
     .fillColor(textDark)
     .text(invoice.razorpayOrderId || invoice.orderId?.toString()?.slice(-8)?.toUpperCase() || 'N/A', invoiceInfoX + 90, infoY + 30);
  
  doc.font('Helvetica')
     .fillColor(textMuted)
     .text('Payment Method:', invoiceInfoX, infoY + 45);
  doc.font('Helvetica-Bold')
     .fillColor(textDark)
     .text(invoice.paymentMethod || 'Razorpay', invoiceInfoX + 90, infoY + 45);

  // ========== BILLING INFO ==========
  const billingY = 200;
  
  // Billed To Box
  doc.rect(50, billingY, 250, 70)
     .lineWidth(1)
     .stroke(borderColor);
  
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor(primaryColor)
     .text('BILLED TO', 60, billingY + 10);
  
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor(textDark)
     .text(invoice.buyerName || 'Valued Customer', 60, billingY + 28);
  
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor(textMuted)
     .text(invoice.buyerEmail || 'N/A', 60, billingY + 45);

  // Paid To Box
  doc.rect(312, billingY, 250, 70)
     .lineWidth(1)
     .stroke(borderColor);
  
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor(primaryColor)
     .text('SELLER', 322, billingY + 10);
  
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor(textDark)
     .text(invoice.sellerName || 'BitForge Seller', 322, billingY + 28);
  
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor(textMuted)
     .text('Via BitForge Platform', 322, billingY + 45);

  // ========== PRODUCT TABLE ==========
  const tableY = 295;
  
  // Table Header
  doc.rect(50, tableY, 512, 30)
     .fill('#F3F4F6');
  
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor(textDark);
  
  doc.text('DESCRIPTION', 60, tableY + 10);
  doc.text('QTY', 340, tableY + 10);
  doc.text('PRICE', 400, tableY + 10);
  doc.text('TOTAL', 490, tableY + 10);

  // Table Row
  const rowY = tableY + 35;
  doc.font('Helvetica-Bold')
     .fontSize(10)
     .fillColor(textDark)
     .text(truncate(invoice.productName || 'Digital Product', 40), 60, rowY);
  
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor(textMuted)
     .text(truncate(invoice.productDescription || 'Digital download', 50), 60, rowY + 15);
  
  doc.font('Helvetica')
     .fontSize(10)
     .fillColor(textDark)
     .text('1', 350, rowY + 5)
     .text(`₹${formatCurrency(invoice.originalPrice || invoice.priceAfterDiscount)}`, 400, rowY + 5)
     .text(`₹${formatCurrency(invoice.priceAfterDiscount || invoice.originalPrice)}`, 490, rowY + 5);

  // Table Border
  doc.rect(50, tableY, 512, 60)
     .lineWidth(1)
     .stroke(borderColor);

  // ========== PRICING SUMMARY ==========
  const summaryY = 380;
  const summaryX = 380;
  const summaryWidth = 182;
  
  // Summary Box
  doc.rect(summaryX, summaryY, summaryWidth, 120)
     .lineWidth(1)
     .stroke(borderColor);

  let currentY = summaryY + 15;

  // Subtotal
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor(textMuted)
     .text('Subtotal:', summaryX + 15, currentY);
  doc.font('Helvetica')
     .fillColor(textDark)
     .text(`₹${formatCurrency(invoice.priceAfterDiscount || invoice.originalPrice)}`, summaryX + summaryWidth - 75, currentY);
  
  currentY += 18;

  // Discount (if any)
  if (invoice.discountAmount && invoice.discountAmount > 0) {
    doc.fillColor('#10B981')
       .text(`Discount (${invoice.discountPercent}%):`, summaryX + 15, currentY);
    doc.text(`-₹${formatCurrency(invoice.discountAmount)}`, summaryX + summaryWidth - 75, currentY);
    currentY += 18;
  }

  // GST
  const gstPercent = Math.round((invoice.gstRate || 0.05) * 100);
  doc.fillColor(textMuted)
     .text(`GST (${gstPercent}%):`, summaryX + 15, currentY);
  doc.fillColor(textDark)
     .text(`₹${formatCurrency(invoice.gstAmount || 0)}`, summaryX + summaryWidth - 75, currentY);
  
  currentY += 18;

  // Platform Fee
  const platformPercent = Math.round((invoice.platformFeeRate || 0.02) * 100);
  doc.fillColor(textMuted)
     .text(`Platform Fee (${platformPercent}%):`, summaryX + 15, currentY);
  doc.fillColor(textDark)
     .text(`₹${formatCurrency(invoice.platformFee || 0)}`, summaryX + summaryWidth - 75, currentY);
  
  currentY += 20;

  // Total Divider
  doc.moveTo(summaryX + 10, currentY)
     .lineTo(summaryX + summaryWidth - 10, currentY)
     .stroke(borderColor);
  
  currentY += 12;

  // Grand Total
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor(primaryColor)
     .text('TOTAL PAID:', summaryX + 15, currentY);
  doc.text(`₹${formatCurrency(invoice.totalAmount || 0)}`, summaryX + summaryWidth - 75, currentY);

  // ========== PAYMENT STATUS BADGE ==========
  doc.rect(50, summaryY, 120, 35)
     .fill('#ECFDF5');
  
  doc.font('Helvetica-Bold')
     .fontSize(12)
     .fillColor('#059669')
     .text('✓ PAID', 75, summaryY + 12);

  // Transaction ID
  doc.font('Helvetica')
     .fontSize(8)
     .fillColor(textMuted)
     .text(`Transaction: ${invoice.razorpayPaymentId || 'N/A'}`, 50, summaryY + 45);

  // ========== FOOTER SECTION ==========
  const footerY = 520;
  
  // Thank you message
  doc.font('Helvetica-Bold')
     .fontSize(12)
     .fillColor(textDark)
     .text('Thank you for your purchase!', 50, footerY, { align: 'center', width: 512 });
  
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor(textMuted)
     .text('Your digital product is ready for download in your dashboard.', 50, footerY + 18, { align: 'center', width: 512 });

  // Divider
  doc.moveTo(50, footerY + 45)
     .lineTo(562, footerY + 45)
     .stroke(borderColor);

  // Footer Notes
  doc.font('Helvetica')
     .fontSize(8)
     .fillColor(textMuted);
  
  const notesY = footerY + 60;
  doc.text('• This is a digitally generated invoice. No physical signature is required.', 50, notesY);
  doc.text('• For refund queries, please contact support@bitforge.in within 7 days of purchase.', 50, notesY + 12);
  doc.text('• All digital products are non-transferable and for personal use only.', 50, notesY + 24);

  // Copyright
  doc.font('Helvetica')
     .fontSize(8)
     .fillColor('#9CA3AF')
     .text(`© ${new Date().getFullYear()} BitForge Technologies. All rights reserved.`, 50, 750, { align: 'center', width: 512 });

  doc.end();
};

// Helper functions
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit',
    month: 'long', 
    year: 'numeric' 
  });
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '0.00';
  return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function truncate(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}
