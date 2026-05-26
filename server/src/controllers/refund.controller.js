import razorpay from "../config/razorpay.js";
import Dispute from "../models/Dispute.js";
import Payout from "../models/Payout.js";
import { createNotification } from "./notification.controller.js";

export const approveRefund = async (req, res) => {
  try {
    const { disputeId } = req.params;

    const dispute = await Dispute.findById(disputeId).populate("orderId");
    if (!dispute || !dispute.orderId) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    const order = dispute.orderId;

    if (order.isRefunded) {
      return res.status(400).json({ message: "Already refunded" });
    }

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: order.amount * 100,
    });

    order.isRefunded = true;
    order.status = "failed";
    order.refundId = refund.id;
    await order.save();

    await Payout.updateMany(
      { sellerId: order.sellerId, status: { $ne: "paid" } },
      { status: "rejected", rejectionReason: "Refund issued" }
    );

    dispute.status = "resolved";
    await dispute.save();

    await createNotification(
      order.buyerId,
      "dispute_resolved",
      "Refund approved",
      "Your dispute has been approved and your refund is now being processed.",
      dispute._id,
      "Dispute",
      {
        audienceRole: "buyer",
      }
    );

    await createNotification(
      order.sellerId,
      "dispute_resolved",
      "Refund issued on an order",
      "A dispute on one of your orders has been resolved in the buyer's favor.",
      dispute._id,
      "Dispute",
      {
        audienceRole: "seller",
      }
    );

    res.json({ message: "Refund processed", dispute });
  } catch (error) {
    console.error("Error approving refund:", error);
    res.status(500).json({ message: "Failed to process refund" });
  }
};

export const rejectDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { adminNote, reason } = req.body;
    const note = adminNote ?? reason ?? "";

    const dispute = await Dispute.findByIdAndUpdate(
      disputeId,
      {
        status: "rejected",
        adminNote: note,
      },
      { new: true }
    ).populate("orderId");

    if (!dispute || !dispute.orderId) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    const order = dispute.orderId;

    await createNotification(
      order.buyerId,
      "dispute_rejected",
      "Dispute rejected",
      note
        ? `Your dispute was rejected. Admin note: ${note}`
        : "Your dispute was rejected after review.",
      dispute._id,
      "Dispute",
      {
        audienceRole: "buyer",
      }
    );

    await createNotification(
      order.sellerId,
      "dispute_rejected",
      "Dispute closed",
      "A dispute on one of your orders was reviewed and closed.",
      dispute._id,
      "Dispute",
      {
        audienceRole: "seller",
      }
    );

    res.json({ message: "Dispute rejected", dispute });
  } catch (error) {
    console.error("Error rejecting dispute:", error);
    res.status(500).json({ message: "Failed to reject dispute" });
  }
};
