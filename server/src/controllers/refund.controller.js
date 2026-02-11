

import razorpay from "../config/razorpay.js";
import Order from "../models/Order.js";
import Dispute from "../models/Dispute.js";
import Payout from "../models/Payout.js";

export const approveRefund = async (req, res) => {
  const { disputeId } = req.params;

  const dispute = await Dispute.findById(disputeId).populate("orderId");
  const order = dispute.orderId;

  if (order.isRefunded) {
    return res.status(400).json({ message: "Already refunded" });
  }

  // 1️⃣ Razorpay refund
  const refund = await razorpay.payments.refund(
    order.razorpayPaymentId,
    {
      amount: order.amount * 100,
    }
  );

  // 2️⃣ Update order
  order.isRefunded = true;
  order.status = "failed";
  order.refundId = refund.id;
  await order.save();

  // 3️⃣ Reverse seller payout if exists
  await Payout.updateMany(
    { sellerId: order.sellerId, status: { $ne: "paid" } },
    { status: "rejected", rejectionReason: "Refund issued" }
  );

  // 4️⃣ Update dispute
  dispute.status = "approved";
  await dispute.save();

  res.json({ message: "Refund processed" });
};


export const rejectDispute = async (req, res) => {
  const { disputeId } = req.params;
  const { adminNote, reason } = req.body;

  const note = adminNote ?? reason ?? "";

  await Dispute.findByIdAndUpdate(disputeId, {
    status: "rejected",
    adminNote: note,
  });

  res.json({ message: "Dispute rejected" });
};
