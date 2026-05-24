export interface TransactionDetails {
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

export type TransactionStatus = TransactionDetails["status"];
