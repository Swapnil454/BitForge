import PDFDocument from "pdfkit";

/**
 * BitForge Professional Invoice PDF Generator
 * Amazon-style layout with Dynamic QR
 */
export const generateInvoicePDF = (invoice, res) => {
   const doc = new PDFDocument({
      size: 'A4',
      margin: 30,
      info: {
         Title: `Invoice ${invoice.invoiceNumber}`,
         Author: 'BitForge Technologies',
         Subject: 'Tax Invoice',
      }
   });

   res.setHeader("Content-Type", "application/pdf");
   res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNumber}.pdf`
   );

   doc.pipe(res);

   const textDark = '#000000';
   const textMuted = '#333333';
   const borderColor = '#000000';

   // Calculate totals
   const originalPrice = Number(invoice.originalPrice || invoice.productPrice || invoice.priceAfterDiscount || 0);
   const subtotal = Number(invoice.priceAfterDiscount || invoice.productPrice || originalPrice || 0);
   const gstAmount = Number(invoice.gstAmount || 0);
   const platformFee = Number(invoice.platformFee || 0);
   const totalPaid = Number(invoice.totalAmount || subtotal + gstAmount + platformFee);
   
   const cgst = invoice.gstBreakup?.cgst || gstAmount / 2;
   const sgst = invoice.gstBreakup?.sgst || gstAmount / 2;
   const gstPercent = (invoice.gstRate || 0.05) * 100;

   // ========== HEADER ==========
   doc.font('Helvetica-Bold')
      .fontSize(22)
      .fillColor(textDark)
      .text('BitForge.in', 30, 30);

   doc.font('Helvetica-Bold')
      .fontSize(10)
      .text('Tax Invoice/Bill of Supply/Cash Memo', 300, 30, { align: 'right', width: 250 })
      .font('Helvetica')
      .text('(Original for Recipient)', 300, 45, { align: 'right', width: 250 });

   doc.moveTo(30, 65).lineTo(565, 65).stroke(borderColor);

   // ========== TWO COLUMN LAYOUT ==========
   const leftX = 30;
   const rightX = 320;
   
   // Row 1: Signature Block
   let topY = 75;
   
   // Checkmark (thick parrot green, black outline, black shadow) - Draw FIRST so it stays behind text
   doc.save();
   doc.translate(leftX + 110, topY);
   doc.lineWidth(0.5);
   
   // Draw shadow polygon
   doc.save();
   doc.translate(1, 1.2);
   doc.moveTo(9.9, 16.5).lineTo(14.5, 21.1).lineTo(24.4, 6.9).lineTo(28.4, 9.6).lineTo(15.2, 28.4).lineTo(6.6, 19.8).closePath();
   doc.fill('#000000');
   doc.restore();

   // Draw parrot green tick polygon
   doc.moveTo(9.9, 16.5).lineTo(14.5, 21.1).lineTo(24.4, 6.9).lineTo(28.4, 9.6).lineTo(15.2, 28.4).lineTo(6.6, 19.8).closePath();
   doc.fillAndStroke('#00b050', '#000000');
   
   doc.restore();

   // Text - Draw SECOND so it overlays the checkmark
   doc.font('Helvetica-Bold').fontSize(8).text('Signature valid', leftX, topY);
   doc.text('Digitally signed by Bitforge Technology Services Pvt. Ltd.', leftX, topY + 10);
   doc.text(`Date: ${formatSignatureDate(invoice.invoiceDate || invoice.createdAt)}`, leftX, topY + 28);
   doc.text('Reason: Invoice', leftX, topY + 38);

   // Row 2: Sold By and Billing Address
   let leftY = topY + 60;
   let rightY = topY + 60;

   // -- LEFT COLUMN --
   doc.font('Helvetica-Bold').fontSize(11).text('Sold By :', leftX, leftY);
   leftY += 14;
   doc.font('Helvetica').fontSize(10).text(invoice.sellerName, leftX, leftY);
   leftY += 12;
   doc.text(invoice.sellerEmail || "N/A", leftX, leftY);
   leftY += 16;
   doc.font('Helvetica-Bold').fontSize(9).text('PAN No:', leftX, leftY, { continued: true }).font('Helvetica').text('N/A');
   leftY += 12;
   doc.font('Helvetica-Bold').text('GST Registration No:', leftX, leftY, { continued: true }).font('Helvetica').text('N/A');
   leftY += 12;
   doc.font('Helvetica-Bold').text('CIN No:', leftX, leftY, { continued: true }).font('Helvetica').text('N/A');
   leftY += 20;

   // QR Code
   doc.font('Helvetica-Bold').text('Dynamic QR Code:', leftX, leftY);
   leftY += 12;
   if (invoice.dynamicQr && invoice.dynamicQr.qrImageUrl) {
      const base64Data = invoice.dynamicQr.qrImageUrl.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, 'base64');
      doc.image(imgBuffer, leftX, leftY, { width: 70 });
   } else {
      doc.rect(leftX, leftY, 70, 70).stroke();
      doc.font('Helvetica').text('No QR', leftX + 20, leftY + 30);
   }
   leftY += 75;
   doc.font('Helvetica-Bold').text('Order Number:', leftX, leftY, { continued: true }).font('Helvetica').text(invoice.razorpayOrderId || invoice.orderId);
   leftY += 12;
   doc.font('Helvetica-Bold').text('Order Date:', leftX, leftY, { continued: true }).font('Helvetica').text(formatDate(invoice.createdAt));

   // -- RIGHT COLUMN --
   doc.font('Helvetica-Bold').fontSize(9).text('Billing Address :', rightX, rightY, { align: 'right', width: 245 });
   rightY += 12;
   doc.font('Helvetica').text(invoice.buyerName, rightX, rightY, { align: 'right', width: 245 });
   rightY += 12;
   doc.text(invoice.buyerEmail, rightX, rightY, { align: 'right', width: 245 });
   rightY += 20;

   doc.font('Helvetica-Bold').fontSize(9).text('Shipping Address :', rightX, rightY, { align: 'right', width: 245 });
   rightY += 12;
   doc.font('Helvetica').text(invoice.buyerName, rightX, rightY, { align: 'right', width: 245 });
   rightY += 12;
   doc.text(invoice.buyerEmail, rightX, rightY, { align: 'right', width: 245 });
   rightY += 20;

   doc.font('Helvetica-Bold').text('Invoice Number : ' + (invoice.invoiceNumber || 'BF-2026-0009'), rightX, rightY, { align: 'right', width: 245 });
   rightY += 12;
   doc.font('Helvetica-Bold').text('Invoice Details : ' + (invoice.razorpayPaymentId || "N/A"), rightX, rightY, { align: 'right', width: 245 });
   rightY += 12;
   doc.font('Helvetica-Bold').text('Invoice Date : ' + formatDate(invoice.invoiceDate || invoice.createdAt), rightX, rightY, { align: 'right', width: 245 });
   rightY += 20;

   // Find the max Y from both columns to start the table
   const tableY = Math.max(leftY, rightY) + 20;

   // ========== TABLE ==========
   doc.rect(30, tableY, 535, 20).fill('#f3f4f6').stroke();
   
   const cols = [
      { x: 30, w: 30, title: 'Sl. No', align: 'center' },
      { x: 60, w: 120, title: 'Description', align: 'left' },
      { x: 180, w: 50, title: 'Unit Price', align: 'right' },
      { x: 230, w: 30, title: 'Qty', align: 'center' },
      { x: 260, w: 60, title: 'Net Amount', align: 'right' },
      { x: 320, w: 40, title: 'Tax Rate', align: 'center' },
      { x: 360, w: 45, title: 'Tax Type', align: 'center' },
      { x: 405, w: 55, title: 'Tax Amount', align: 'right' },
      { x: 460, w: 50, title: 'Platform Fee', align: 'right' },
      { x: 510, w: 55, title: 'Total Amount', align: 'right' }
   ];

   doc.font('Helvetica-Bold').fontSize(7).fillColor(textDark);
   cols.forEach(c => {
      doc.rect(c.x, tableY, c.w, 20).stroke();
      doc.text(c.title, c.x + 2, tableY + 6, { width: c.w - 4, align: c.align });
   });

   // Row 1
   const rowY = tableY + 20;
   const rowHeight = 45;
   
   doc.font('Helvetica').fontSize(8);
   
   cols.forEach(c => doc.rect(c.x, rowY, c.w, rowHeight).stroke());
   
   doc.text('1', cols[0].x, rowY + 18, { width: cols[0].w, align: 'center' });
   doc.font('Helvetica-Bold').text(invoice.productName, cols[1].x + 2, rowY + 5, { width: cols[1].w - 4 });
   const titleHeight = doc.heightOfString(invoice.productName, { width: cols[1].w - 4 });
   doc.font('Helvetica').fontSize(6).fillColor('#475569').text(invoice.productDescription.substring(0, 70) + '...', cols[1].x + 2, rowY + 5 + titleHeight + 2, { width: cols[1].w - 4 });
   
   doc.font('Helvetica').fontSize(8).fillColor(textDark);
   doc.text(formatCurrency(originalPrice), cols[2].x, rowY + 18, { width: cols[2].w - 2, align: 'right' });
   doc.text('1', cols[3].x, rowY + 10, { width: cols[3].w, align: 'center' });
   doc.text(formatCurrency(subtotal), cols[4].x, rowY + 10, { width: cols[4].w - 2, align: 'right' });
   doc.text(`${gstPercent}%`, cols[5].x, rowY + 10, { width: cols[5].w, align: 'center' });
   
   doc.text('CGST', cols[6].x + 2, rowY + 3);
   doc.moveTo(cols[6].x, rowY + 15).lineTo(cols[6].x + cols[6].w, rowY + 15).dash(2, { space: 2 }).stroke().undash();
   doc.text('SGST', cols[6].x + 2, rowY + 18);

   doc.text(formatCurrency(cgst), cols[7].x, rowY + 3, { width: cols[7].w - 2, align: 'right' });
   doc.moveTo(cols[7].x, rowY + 15).lineTo(cols[7].x + cols[7].w, rowY + 15).dash(2, { space: 2 }).stroke().undash();
   doc.text(formatCurrency(sgst), cols[7].x, rowY + 18, { width: cols[7].w - 2, align: 'right' });

   doc.text(formatCurrency(platformFee), cols[8].x, rowY + 10, { width: cols[8].w - 2, align: 'right' });
   doc.font('Helvetica-Bold').text(formatCurrency(totalPaid), cols[9].x, rowY + 10, { width: cols[9].w - 2, align: 'right' });

   // Total Row
   const totalY = rowY + rowHeight;
   doc.rect(30, totalY, 535, 15).stroke();
   // Lines for total row to align with columns
   [cols[4].x, cols[7].x, cols[8].x, cols[9].x].forEach(x => {
      doc.moveTo(x, totalY).lineTo(x, totalY + 15).stroke();
   });

   doc.font('Helvetica-Bold').fontSize(8);
   doc.text('TOTAL:', 30, totalY + 4, { width: cols[4].x - 30 - 5, align: 'right' });
   doc.text(formatCurrency(subtotal), cols[4].x, totalY + 4, { width: cols[4].w - 2, align: 'right' });
   doc.text(formatCurrency(gstAmount), cols[7].x, totalY + 4, { width: cols[7].w - 2, align: 'right' });
   doc.text(formatCurrency(platformFee), cols[8].x, totalY + 4, { width: cols[8].w - 2, align: 'right' });
   doc.text(formatCurrency(totalPaid), cols[9].x, totalY + 4, { width: cols[9].w - 2, align: 'right' });

   // ========== FOOTER SECTION ==========
   let footerY = totalY + 15;

   // Top half border
   doc.rect(30, footerY, 535, 30).stroke();
   doc.font('Helvetica-Bold').fontSize(9).text('Amount in Words:', 32, footerY + 4);
   doc.font('Helvetica').fontSize(9).text(amountToWords(totalPaid), 32, footerY + 16);

   // Bottom half border
   footerY += 30;
   doc.rect(30, footerY, 535, 70).stroke();
   
   doc.font('Helvetica-Bold').text('For Bitforge Technology Services Pvt. Ltd.:', 300, footerY + 4, { align: 'right', width: 260 });
   
   doc.text('Authorized Signatory', 300, footerY + 55, { align: 'right', width: 260 });

   footerY += 95;
   doc.font('Helvetica-Bold').fontSize(10).text('Thank you for purchase', 30, footerY, { align: 'center', width: 535 });
   footerY += 16;
   doc.font('Helvetica-Bold').fontSize(8).text('If any Query please contact support@bittforge.in', 30, footerY, { align: 'center', width: 535 });
   footerY += 12;
   doc.font('Helvetica-Bold').fontSize(8).text('© 2026 BitForge Technologies. All rights reserved', 30, footerY, { align: 'center', width: 535 });
   doc.end();
};

// Helper functions
function formatDate(date) {
   if (!date) return 'N/A';
   const d = new Date(date);
   return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
   }).replace(/\//g, '.');
}

function formatSignatureDate(date) {
   if (!date) return 'N/A';
   const d = new Date(date);
   const pad = (n) => n.toString().padStart(2, '0');
   return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

function formatCurrency(amount) {
   if (!amount && amount !== 0) return '0.00';
   return parseFloat(amount).toFixed(2);
}

function amountToWords(amount) {
   const numberToWords = (num) => {
      const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
      const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
      if ((num = num.toString()).length > 9) return "overflow";
      let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
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
