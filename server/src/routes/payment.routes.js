

import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import { createOrder, getMyOrders } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-order", auth, requireRole(["buyer"]), createOrder);
router.get("/my-orders", auth, requireRole(["buyer"]), getMyOrders);

export default router;
