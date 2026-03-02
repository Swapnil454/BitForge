

import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import { createOrder, createCartCheckout, getMyOrders, getAllMyOrders } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-order", auth, requireRole(["buyer"]), createOrder);
router.post("/cart-checkout", auth, requireRole(["buyer"]), createCartCheckout);
router.get("/my-orders", auth, requireRole(["buyer"]), getMyOrders);
router.get("/all-my-orders", auth, requireRole(["buyer"]), getAllMyOrders);

export default router;
