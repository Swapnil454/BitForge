

import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { getSellerStats } from "../utils/sellerStats.js";

export const getMarketplaceProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      status: "approved",
      changeRequest: "none",  // Only show products without pending changes
      isDeleted: { $ne: true }  // Exclude soft-deleted products
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
    // First try to find active product
    let product = await Product.findOne({
      _id: req.params.id,
      status: "approved",
      changeRequest: "none",  // Only show products without pending changes
      isDeleted: { $ne: true }  // Exclude soft-deleted products
    }).populate("sellerId", "name email isVerified identityVerifiedAt profilePictureUrl bio createdAt");

    // If not found, check if it's a soft-deleted product that buyer purchased
    if (!product) {
      // Check if product exists and is soft-deleted
      const deletedProduct = await Product.findOne({
        _id: req.params.id,
        isDeleted: true
      }).populate("sellerId", "name email isVerified identityVerifiedAt profilePictureUrl bio createdAt");

      if (!deletedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if user is authenticated and has purchased this product
      if (req.user) {
        const hasPurchased = await Order.exists({
          buyerId: req.user.id,
          productId: req.params.id,
          status: "paid"
        });

        if (hasPurchased) {
          // User has purchased - show archived product
          const sellerStats = await getSellerStats(deletedProduct.sellerId._id);
          const productWithStats = deletedProduct.toObject();
          productWithStats.sellerStats = sellerStats;
          productWithStats.isDeleted = true;
          productWithStats.deletedMessage = "This product has been removed from the marketplace. You can still download your purchased files.";
          return res.json(productWithStats);
        }
      }

      // Not purchased or not authenticated - return 404
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
