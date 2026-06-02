export function generateUpiQrPayload({
  upiId,
  payeeName,
  amount,
  invoiceNo,
  invoiceDate,
  transactionRef,
  gstin,
  cgst = 0,
  sgst = 0,
  igst = 0,
  expiresAt,
}) {
  const params = new URLSearchParams({
    ver: "01",
    mode: "15",
    pa: upiId,
    pn: payeeName,
    tr: transactionRef,
    am: amount.toFixed(2),
    cu: "INR",
    mc: "5399",
    invoiceNo,
    invoiceDate,
    gstIn: gstin || "",
    gstBrkUp: `CGST:${cgst.toFixed(2)}|SGST:${sgst.toFixed(2)}|IGST:${igst.toFixed(2)}`,
    QRexpire: expiresAt.toISOString(),
    QRts: new Date().toISOString(),
  });

  return `upi://pay?${params.toString()}`;
}
