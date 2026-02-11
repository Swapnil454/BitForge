

import Order from "../models/Order.js";
import Dispute from "../models/Dispute.js";

export const createDispute = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId || !reason) {
      return res.status(400).json({ message: "Order and reason are required" });
    }

    const order = await Order.findById(orderId);

    if (!order || order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Invalid order" });
    }

    if (order.isRefunded) {
      return res.status(400).json({ message: "Order is already refunded" });
    }

    const existingOpenDispute = await Dispute.findOne({
      orderId,
      buyerId: req.user.id,
      status: "open",
    });

    if (existingOpenDispute) {
      return res.status(400).json({ message: "You already have an open dispute for this order" });
    }

    await Dispute.create({
      orderId,
      buyerId: req.user.id,
      reason,
    });

    res.json({ message: "Dispute submitted" });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({ message: "Failed to submit dispute" });
  }
};
