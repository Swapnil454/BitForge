"use client";

import { TransactionDetails } from "../types";
import { formatAmount } from "../utils";

type PrintInvoiceProps = {
  transaction: TransactionDetails;
};

export default function PrintInvoice({ transaction }: PrintInvoiceProps) {
  return (
    <div className="print-invoice hidden">
      <div style={{ fontFamily: "Arial, Helvetica, sans-serif", maxWidth: "780px", margin: "0 auto", color: "#111827" }}>
        <h1 style={{ margin: 0, fontSize: "28px" }}>BitForge Invoice</h1>
        <p style={{ margin: "4px 0 18px", color: "#4b5563", fontSize: "12px" }}>Tax Invoice / Bill of Supply</p>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "12px" }}>Order ID</td>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "12px", fontFamily: "monospace" }}>{transaction.orderId}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "12px" }}>Date</td>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "12px" }}>{new Date(transaction.date).toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "12px" }}>Product</td>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "12px" }}>{transaction.productName}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "12px" }}>Seller</td>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "12px" }}>{transaction.sellerName} ({transaction.sellerEmail})</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "12px", fontWeight: 700 }}>Amount</td>
              <td style={{ border: "1px solid #d1d5db", padding: "10px", fontSize: "14px", fontWeight: 700 }}>{formatAmount(transaction.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
