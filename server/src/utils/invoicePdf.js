


import PDFDocument from "pdfkit";

export const generateInvoicePDF = (invoice, res) => {
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${invoice.invoiceNumber}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(20).text("BitForge GST Invoice", { align: "center" });
  doc.moveDown();

  doc.text(`Invoice No: ${invoice.invoiceNumber}`);
  doc.text(`Buyer Email: ${invoice.buyerEmail}`);
  doc.text(`Date: ${new Date(invoice.createdAt).toDateString()}`);
  doc.moveDown();

  doc.text(`Product Price: ₹${invoice.productPrice}`);
  doc.text(`Platform Fee: ₹${invoice.platformFee}`);
  doc.text(`GST (18%): ₹${invoice.gstAmount}`);
  doc.text(`Total (GST included): ₹${invoice.totalPlatformAmount}`);

  doc.moveDown();
  doc.text("GSTIN: 27ABCDE1234F1Z5");
  doc.text("Seller: BitForge Pvt Ltd");

  doc.end();
};
