

import express from "express";
import { 
  createProduct, 
  getSellerProducts, 
  uploadProduct,
  updateProduct,
  deleteProduct,
  getProductById
} from "../controllers/product.controller.js";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import upload from "../middleware/upload.js";


const router = express.Router();

router.use(auth, requireRole(["seller"]));

router.post("/", createProduct);
router.get("/mine", getSellerProducts);
router.get("/:productId", getProductById);

router.post("/upload", upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }, { name: "previewPdf", maxCount: 1 }]), uploadProduct);
router.patch("/:productId", upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }, { name: "previewPdf", maxCount: 1 }]), updateProduct);
router.delete("/:productId", deleteProduct);

export default router;
