


import Invoice from "../models/Invoice.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { generateInvoicePDF } from "../utils/invoicePdf.js";

// Get invoice data as JSON with populated names
export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      orderId: req.params.orderId,
    }).lean();

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Populate missing fields from Order/User collections for old invoices
    const needsPopulation = !invoice.buyerName || !invoice.sellerName || 
                            !invoice.productName || !invoice.razorpayPaymentId ||
                            !invoice.originalPrice;
    
    if (needsPopulation) {
      const order = await Order.findById(invoice.orderId)
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name')
        .populate('productId', 'title description');

      if (order) {
        // Populate buyer info
        if (!invoice.buyerName && order.buyerId?.name) {
          invoice.buyerName = order.buyerId.name;
        }
        if (!invoice.buyerEmail && order.buyerId?.email) {
          invoice.buyerEmail = order.buyerId.email;
        }
        
        // Populate seller info
        if (!invoice.sellerName && order.sellerId?.name) {
          invoice.sellerName = order.sellerId.name;
        }
        
        // Populate product info
        if (!invoice.productName && (order.productId?.title || order.productName)) {
          invoice.productName = order.productId?.title || order.productName;
        }
        if (!invoice.productDescription && order.productId?.description) {
          invoice.productDescription = order.productId.description.substring(0, 100);
        }
        
        // Populate payment info from order
        if (!invoice.razorpayPaymentId && order.razorpayPaymentId) {
          invoice.razorpayPaymentId = order.razorpayPaymentId;
        }
        if (!invoice.razorpayOrderId && order.razorpayOrderId) {
          invoice.razorpayOrderId = order.razorpayOrderId;
        }
        
        // Populate pricing for old invoices
        if (!invoice.originalPrice && !invoice.productPrice && order.amount) {
          invoice.productPrice = order.amount;
          invoice.originalPrice = order.amount;
          invoice.priceAfterDiscount = order.amount;
          invoice.totalAmount = order.amount;
        }
      }
    }

    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
};

export const downloadInvoice = async (req, res) => {
  const invoice = await Invoice.findOne({
    orderId: req.params.orderId,
  });

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  generateInvoicePDF(invoice, res);
};

// HTML Invoice for browser viewing/printing
export const viewInvoice = async (req, res) => {
  const invoice = await Invoice.findOne({
    orderId: req.params.orderId,
  });

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { 
      day: '2-digit',
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const gstPercent = Math.round((invoice.gstRate || 0.05) * 100);
  const platformPercent = Math.round((invoice.platformFeeRate || 0.02) * 100);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: #0F172A;
      color: white;
      padding: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo h1 { font-size: 28px; font-weight: bold; }
    .logo p { color: #94A3B8; font-size: 12px; margin-top: 5px; }
    .invoice-label { 
      font-size: 24px; 
      color: #6366F1; 
      font-weight: bold; 
    }
    .info-section {
      padding: 30px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #E5E7EB;
    }
    .company-details h3 { font-size: 14px; margin-bottom: 10px; }
    .company-details p { font-size: 12px; color: #6B7280; line-height: 1.8; }
    .invoice-details { text-align: right; }
    .invoice-details .row { 
      display: flex; 
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .invoice-details .label { color: #6B7280; }
    .invoice-details .value { font-weight: 600; }
    .billing-section {
      padding: 30px;
      display: flex;
      gap: 20px;
    }
    .billing-box {
      flex: 1;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px;
    }
    .billing-box .title {
      font-size: 11px;
      color: #6366F1;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .billing-box .name { font-size: 14px; font-weight: 600; margin-bottom: 5px; }
    .billing-box .email { font-size: 12px; color: #6B7280; }
    .table-section { padding: 0 30px 30px; }
    .products-table {
      width: 100%;
      border-collapse: collapse;
    }
    .products-table th {
      background: #F3F4F6;
      padding: 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #374151;
    }
    .products-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #E5E7EB;
    }
    .product-name { font-weight: 600; }
    .product-desc { font-size: 12px; color: #6B7280; margin-top: 5px; }
    .summary-section {
      padding: 0 30px 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .paid-badge {
      background: #ECFDF5;
      color: #059669;
      padding: 15px 30px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 14px;
    }
    .summary-box {
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px;
      min-width: 250px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .summary-row.total {
      border-top: 1px solid #E5E7EB;
      padding-top: 12px;
      margin-top: 12px;
      font-weight: bold;
      color: #6366F1;
    }
    .discount { color: #10B981; }
    .footer {
      padding: 30px;
      text-align: center;
      border-top: 1px solid #E5E7EB;
    }
    .footer h3 { font-size: 16px; margin-bottom: 10px; }
    .footer p { font-size: 12px; color: #6B7280; }
    .notes {
      padding: 0 30px 30px;
    }
    .notes li {
      font-size: 11px;
      color: #6B7280;
      margin-bottom: 5px;
      list-style: disc;
      margin-left: 20px;
    }
    .copyright {
      text-align: center;
      padding: 20px;
      font-size: 11px;
      color: #9CA3AF;
    }
    .print-buttons {
      text-align: center;
      margin: 20px 0;
    }
    .print-buttons button {
      background: #6366F1;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      margin: 0 10px;
    }
    .print-buttons button:hover { background: #4F46E5; }
    .print-buttons button.secondary {
      background: white;
      color: #374151;
      border: 1px solid #E5E7EB;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; }
      .print-buttons { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-buttons">
    <button onclick="window.print()">🖨️ Print Invoice</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>
  
  <div class="invoice-container">
    <div class="header">
      <div class="logo">
        <h1>BitForge</h1>
        <p>India's Trusted Digital Marketplace</p>
      </div>
      <div class="invoice-label">INVOICE</div>
    </div>

    <div class="info-section">
      <div class="company-details">
        <h3>BitForge Technologies</h3>
        <p>Pune, Maharashtra, India</p>
        <p>Email: support@bitforge.in</p>
        <p>Website: www.bittforge.in</p>
      </div>
      <div class="invoice-details">
        <div class="row">
          <span class="label">Invoice Number:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="row">
          <span class="label">Invoice Date:</span>
          <span class="value">${formatDate(invoice.invoiceDate || invoice.createdAt)}</span>
        </div>
        <div class="row">
          <span class="label">Order ID:</span>
          <span class="value">${invoice.razorpayOrderId || invoice.orderId?.toString()?.slice(-8)?.toUpperCase() || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Payment Method:</span>
          <span class="value">${invoice.paymentMethod || 'Razorpay'}</span>
        </div>
      </div>
    </div>

    <div class="billing-section">
      <div class="billing-box">
        <div class="title">BILLED TO</div>
        <div class="name">${invoice.buyerName || 'Valued Customer'}</div>
        <div class="email">${invoice.buyerEmail || 'N/A'}</div>
      </div>
      <div class="billing-box">
        <div class="title">SELLER</div>
        <div class="name">${invoice.sellerName || 'BitForge Seller'}</div>
        <div class="email">Via BitForge Platform</div>
      </div>
    </div>

    <div class="table-section">
      <table class="products-table">
        <thead>
          <tr>
            <th style="width: 50%">DESCRIPTION</th>
            <th>QTY</th>
            <th>PRICE</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="product-name">${invoice.productName || 'Digital Product'}</div>
              <div class="product-desc">${invoice.productDescription || 'Digital download'}</div>
            </td>
            <td>1</td>
            <td>₹${formatCurrency(invoice.originalPrice || invoice.priceAfterDiscount)}</td>
            <td>₹${formatCurrency(invoice.priceAfterDiscount || invoice.originalPrice)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary-section">
      <div class="paid-badge">✓ PAID</div>
      <div class="summary-box">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>₹${formatCurrency(invoice.priceAfterDiscount || invoice.originalPrice)}</span>
        </div>
        ${invoice.discountAmount && invoice.discountAmount > 0 ? `
        <div class="summary-row discount">
          <span>Discount (${invoice.discountPercent}%):</span>
          <span>-₹${formatCurrency(invoice.discountAmount)}</span>
        </div>
        ` : ''}
        <div class="summary-row">
          <span>GST (${gstPercent}%):</span>
          <span>₹${formatCurrency(invoice.gstAmount || 0)}</span>
        </div>
        <div class="summary-row">
          <span>Platform Fee (${platformPercent}%):</span>
          <span>₹${formatCurrency(invoice.platformFee || 0)}</span>
        </div>
        <div class="summary-row total">
          <span>TOTAL PAID:</span>
          <span>₹${formatCurrency(invoice.totalAmount || 0)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <h3>Thank you for your purchase!</h3>
      <p>Your digital product is ready for download in your dashboard.</p>
    </div>

    <ul class="notes">
      <li>This is a digitally generated invoice. No physical signature is required.</li>
      <li>For refund queries, please contact support@bitforge.in within 7 days of purchase.</li>
      <li>All digital products are non-transferable and for personal use only.</li>
      <li>Transaction ID: ${invoice.razorpayPaymentId || 'N/A'}</li>
    </ul>

    <div class="copyright">
      © ${new Date().getFullYear()} BitForge Technologies. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
