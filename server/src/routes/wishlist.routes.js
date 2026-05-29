import express from "express";
import auth from "../middleware/auth.js";
import {
  toggleWishlist,
  getWishlist,
  getWishlistCount
} from "../controllers/wishlist.controller.js";

const router = express.Router();

router.use(auth);

router.get("/", getWishlist);
router.post("/toggle", toggleWishlist);
router.get("/count", getWishlistCount);

export default router;
