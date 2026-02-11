

import Product from "../models/Product.js";
import { getSellerStats } from "../utils/sellerStats.js";

export const getMarketplaceProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      status: "approved",
      changeRequest: "none"  // Only show products without pending changes
    })
      .populate("sellerId", "name email isVerified identityVerifiedAt profilePictureUrl bio")
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};


export const getMarketplaceProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      status: "approved",
      changeRequest: "none"  // Only show products without pending changes
    }).populate("sellerId", "name email isVerified identityVerifiedAt profilePictureUrl bio");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Attach seller credibility stats
    const sellerStats = await getSellerStats(product.sellerId._id);
    
    // Convert to plain object and add stats
    const productWithStats = product.toObject();
    productWithStats.sellerStats = sellerStats;

    res.json(productWithStats);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};
