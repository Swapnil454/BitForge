

import crypto from "crypto";
import Payout from "../models/Payout.js";

// RazorpayX Payout Webhook - TEMPORARILY DISABLED
// This webhook handler is for automated RazorpayX payouts
// Currently using manual payouts, but keeping this for future use

export const razorpayXPayoutWebhook = async (req, res) => {
  // Quick return - webhook disabled for manual payouts
  return res.json({ 
    status: "disabled", 
    message: "RazorpayX webhooks are currently disabled. Using manual payouts." 
  });

  /* 
  // Uncomment when re-enabling RazorpayX automated payouts
  
  const secret = process.env.RAZORPAYX_WEBHOOK_SECRET;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== req.headers["x-razorpay-signature"]) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  const event = req.body.event;
  const payload = req.body.payload?.payout?.entity;

  if (!payload) {
    return res.json({ status: "ignored" });
  }

  const payout = await Payout.findOne({
    razorpayPayoutId: payload.id,
  });

  if (!payout) {
    return res.json({ status: "payout_not_found" });
  }

  // ✅ SUCCESS
  if (event === "payout.processed") {
    payout.status = "paid";
    await payout.save();
  }

  // ❌ FAILURE
  if (event === "payout.failed") {
    payout.status = "rejected";
    payout.failureReason = payload.failure_reason || "Unknown";
    await payout.save();
  }

  res.json({ status: "ok" });
  */
};
