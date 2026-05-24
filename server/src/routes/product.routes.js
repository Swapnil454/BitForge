

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

router.use(auth);

router.post("/", requireRole(["seller"]), createProduct);
router.get("/mine", requireRole(["seller"]), getSellerProducts);
router.get("/:productId", requireRole(["seller", "admin"]), getProductById);

router.post("/upload", requireRole(["seller"]), upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), uploadProduct);
router.patch("/:productId", requireRole(["seller"]), upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), updateProduct);
router.delete("/:productId", requireRole(["seller"]), deleteProduct);

export default router;
