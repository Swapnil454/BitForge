import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import { manuallyMarkOrderPaid, getStuckOrders } from "../controllers/orderFix.controller.js";

const router = express.Router();

// Admin only - get stuck orders
router.get("/stuck-orders", auth, requireRole(["admin"]), getStuckOrders);

// Admin only - manually mark order as paid
router.post("/mark-paid/:orderId", auth, requireRole(["admin"]), manuallyMarkOrderPaid);

export default router;
