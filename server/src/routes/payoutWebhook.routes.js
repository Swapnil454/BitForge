

import express from "express";
import { razorpayXPayoutWebhook } from "../controllers/payoutWebhook.controller.js";
import { rawBodyMiddleware } from "../middleware/rawBody.js";

const router = express.Router();

router.post(
  "/razorpayx",
  express.json({ verify: rawBodyMiddleware }),
  razorpayXPayoutWebhook
);

export default router;
