



import express from "express";
import auth from "../middleware/auth.js";
import { downloadInvoice } from "../controllers/invoice.controller.js";

const router = express.Router();

router.get("/:orderId", auth, downloadInvoice);

export default router;
