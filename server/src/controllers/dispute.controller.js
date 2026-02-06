

import Order from "../models/Order.js";
import Dispute from "../models/Dispute.js";

export const createDispute = async (req, res) => {
  const { orderId, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order || order.buyerId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Invalid order" });
  }

  if (order.isRefunded) {
    return res.status(400).json({ message: "Already refunded" });
  }

  await Dispute.create({
    orderId,
    buyerId: req.user.id,
    reason,
  });

  res.json({ message: "Dispute submitted" });
};
