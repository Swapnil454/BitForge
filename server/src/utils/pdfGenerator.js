import PDFDocument from "pdfkit";

export const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Colors
      const primaryColor = "#0f172a";
      const secondaryColor = "#64748b";
      const highlightColor = "#16a34a"; // green

      // Header
      doc.fontSize(24).fillColor(primaryColor).text("BitForge.in", 50, 50);
      doc.fontSize(10).fillColor(secondaryColor).text("TAX INVOICE", 50, 80, { characterSpacing: 2 });
      
      // Signature Box
      doc.rect(50, 100, 200, 60).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.fillColor(highlightColor).fontSize(10).text("Signature valid", 60, 110);
      doc.fillColor(primaryColor).fontSize(8).text("Digitally signed by Bitforge Technology Services Pvt. Ltd.", 60, 125);
      
      const d = new Date(invoice.createdAt || Date.now());
      const pad = (n) => n.toString().padStart(2, '0');
      const dateStr = `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
      
      doc.fillColor(secondaryColor).text(`Date: ${dateStr}`, 60, 137);
      doc.text("Reason: Invoice", 60, 147);

      // Invoice Info (Right side)
      doc.fontSize(10).fillColor(secondaryColor).text("Invoice Number", 400, 50, { align: "right" });
      doc.fontSize(12).fillColor(primaryColor).text(invoice.invoiceNumber || "INV-PENDING", 400, 65, { align: "right" });
      
      doc.fontSize(10).fillColor(secondaryColor).text("Invoice Date", 400, 90, { align: "right" });
      doc.fontSize(12).fillColor(primaryColor).text(new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 400, 105, { align: "right" });

      // Seller & Buyer
      doc.rect(50, 180, 230, 70).stroke("#e2e8f0");
      doc.fontSize(8).fillColor(secondaryColor).text("SELLER", 60, 190, { characterSpacing: 1 });
      doc.fontSize(11).fillColor(primaryColor).text(invoice.sellerName || "BitForge Seller", 60, 205);
      doc.fontSize(9).fillColor(secondaryColor).text("Sold via BitForge platform", 60, 225);

      doc.rect(300, 180, 245, 70).stroke("#e2e8f0");
      doc.fontSize(8).fillColor(secondaryColor).text("BILLED TO", 310, 190, { characterSpacing: 1 });
      doc.fontSize(11).fillColor(primaryColor).text(invoice.buyerName || "Valued Customer", 310, 205);
      doc.fontSize(9).fillColor(secondaryColor).text(invoice.buyerEmail || "", 310, 225);

      // Order Info
      doc.fontSize(8).fillColor(secondaryColor).text("ORDER ID", 50, 270, { characterSpacing: 1 });
      doc.fontSize(10).fillColor(primaryColor).text(invoice.orderId || invoice.razorpayOrderId || "N/A", 50, 285);

      doc.fontSize(8).fillColor(secondaryColor).text("PAYMENT ID", 250, 270, { characterSpacing: 1 });
      doc.fontSize(10).fillColor(primaryColor).text(invoice.razorpayPaymentId || "N/A", 250, 285);

      doc.fontSize(8).fillColor(secondaryColor).text("PAYMENT METHOD", 450, 270, { characterSpacing: 1 });
      doc.fontSize(10).fillColor(primaryColor).text(invoice.paymentMethod || "Razorpay", 450, 285);

      // Table Header
      doc.rect(50, 320, 495, 25).fill("#f1f5f9");
      doc.fillColor(secondaryColor).fontSize(9);
      doc.text("DESCRIPTION", 60, 328, { characterSpacing: 1 });
      doc.text("QTY", 320, 328, { characterSpacing: 1, align: "center", width: 40 });
      doc.text("PRICE", 380, 328, { characterSpacing: 1, align: "right", width: 60 });
      doc.text("AMOUNT", 460, 328, { characterSpacing: 1, align: "right", width: 75 });

      // Table Row
      doc.fillColor(primaryColor).fontSize(10);
      doc.text(invoice.productName || "Digital Product", 60, 360, { width: 240 });
      doc.text("1", 320, 360, { align: "center", width: 40 });
      doc.text(`Rs. ${(invoice.originalPrice || invoice.productPrice || 0).toFixed(2)}`, 380, 360, { align: "right", width: 60 });
      doc.text(`Rs. ${(invoice.totalAmount || 0).toFixed(2)}`, 460, 360, { align: "right", width: 75 });

      // Totals
      const subtotal = invoice.originalPrice || invoice.productPrice || 0;
      const discount = invoice.discountAmount || 0;
      const gst = invoice.gstAmount || 0;
      const platformFee = invoice.platformFee || 0;
      const total = invoice.totalAmount || 0;

      let currentY = 400;
      
      doc.fontSize(10).fillColor(secondaryColor);
      doc.text("Subtotal", 350, currentY);
      doc.fillColor(primaryColor).text(`Rs. ${subtotal.toFixed(2)}`, 450, currentY, { align: "right", width: 85 });
      currentY += 20;

      if (discount > 0) {
        doc.fillColor(highlightColor).text(`Discount (${invoice.discountPercent || 0}%)`, 350, currentY);
        doc.text(`-Rs. ${discount.toFixed(2)}`, 450, currentY, { align: "right", width: 85 });
        currentY += 20;
      }

      doc.fillColor(secondaryColor).text(`GST (${invoice.gstRate || 0}%)`, 350, currentY);
      doc.fillColor(primaryColor).text(`Rs. ${gst.toFixed(2)}`, 450, currentY, { align: "right", width: 85 });
      currentY += 20;

      doc.fillColor(secondaryColor).text(`Platform Fee (${invoice.platformFeeRate || 0}%)`, 350, currentY);
      doc.fillColor(primaryColor).text(`Rs. ${platformFee.toFixed(2)}`, 450, currentY, { align: "right", width: 85 });
      currentY += 20;

      doc.moveTo(350, currentY).lineTo(535, currentY).stroke("#e2e8f0");
      currentY += 15;

      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold");
      doc.text("Total Paid", 350, currentY);
      doc.text(`Rs. ${total.toFixed(2)}`, 450, currentY, { align: "right", width: 85 });
      doc.font("Helvetica");

      // Status Badge
      currentY += 25;
      doc.rect(465, currentY - 5, 70, 20).fill("#f1f5f9");
      doc.fontSize(9).fillColor(primaryColor).text("Status: Paid", 465, currentY, { align: "center", width: 70 });

      // Footer
      doc.fontSize(8).fillColor(secondaryColor);
      doc.text("This is a digitally generated invoice. No physical signature is required.", 50, 720, { align: "center" });
      doc.text("Thank you for your purchase.", 50, 735, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
