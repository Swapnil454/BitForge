

import express from "express";
import { razorpayWebhook } from "../controllers/webhook.controller.js";

const router = express.Router();

router.post("/razorpay", express.json({ verify: (req, res, buf) => {
  req.rawBody = buf;
}}), razorpayWebhook);

export default router;
