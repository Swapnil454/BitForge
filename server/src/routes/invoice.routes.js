



import express from "express";
import auth from "../middleware/auth.js";
import { downloadInvoice, viewInvoice, getInvoice, verifyInvoice } from "../controllers/invoice.controller.js";

const router = express.Router();

// Verify invoice
router.get("/verify/:invoiceNo", verifyInvoice);

// Get invoice data as JSON
router.get("/:orderId/data", auth, getInvoice);

// PDF download
router.get("/:orderId", auth, downloadInvoice);

// HTML view for printing
router.get("/:orderId/view", auth, viewInvoice);

export default router;
