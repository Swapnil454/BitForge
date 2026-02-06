


import Invoice from "../models/Invoice.js";
import { generateInvoicePDF } from "../utils/invoicePdf.js";

export const downloadInvoice = async (req, res) => {
  const invoice = await Invoice.findOne({
    orderId: req.params.orderId,
  });

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  generateInvoicePDF(invoice, res);
};
