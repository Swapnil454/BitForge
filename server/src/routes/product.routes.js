

import express from "express";
import { 
  createProduct, 
  getSellerProducts, 
  uploadProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  generateUploadPresignedUrl,
  confirmProductUpload,
  handleWorkerUploadComplete
} from "../controllers/product.controller.js";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Middleware for internal route protection
const internalKeyAuth = (req, res, next) => {
  const key = req.headers["x-internal-key"];
  if (key !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Protected internal route — only Cloudflare Worker can call this
router.post("/internal/upload-complete", internalKeyAuth, handleWorkerUploadComplete);

// User authenticated routes
router.use(auth);

router.post("/", requireRole(["seller"]), createProduct);
router.get("/mine", requireRole(["seller"]), getSellerProducts);
router.get("/:productId", requireRole(["seller", "admin"]), getProductById);

// New Direct-to-Cloud flow routes
router.post("/upload/presign", requireRole(["seller"]), generateUploadPresignedUrl);
router.post("/upload/confirm", requireRole(["seller"]), confirmProductUpload);

// Legacy/Monolithic upload route (deprecated but kept for backward compatibility if needed)
router.post("/upload", requireRole(["seller"]), upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), uploadProduct);
router.patch("/:productId", requireRole(["seller"]), upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), updateProduct);
router.delete("/:productId", requireRole(["seller"]), deleteProduct);

export default router;
