/**
 * Seller Statistics Aggregation
 * Provides seller credibility metrics for display on product pages
 */

import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

/**
 * Get aggregated seller statistics
 * @param {string} sellerId - Seller's user ID
 * @returns {Promise<Object>} Seller stats including sales, products, rating
 */
export async function getSellerStats(sellerId) {
  try {
    // Count approved products by this seller
    const productCount = await Product.countDocuments({
      sellerId: sellerId,
      status: "approved",
      changeRequest: "none"
    });

    // Count total completed orders for this seller's products
    // First get all approved product IDs for this seller
    const sellerProducts = await Product.find({
      sellerId: sellerId,
      status: "approved"
    }).select("_id");
    
    const productIds = sellerProducts.map(p => p._id);

    // Count orders where status is "completed" or "delivered"
    const totalSales = await Order.countDocuments({
      productId: { $in: productIds },
      status: { $in: ["completed", "delivered"] }
    });

    // Get seller from User model to get rating info
    const seller = await User.findById(sellerId).select("averageRating ratingCount isVerified identityVerifiedAt");

    return {
      totalSales: totalSales,
      productCount: productCount,
      averageRating: seller?.averageRating || 0,
      ratingCount: seller?.ratingCount || 0,
      isVerified: seller?.isVerified || false,
      identityVerifiedAt: seller?.identityVerifiedAt || null,
      isNewSeller: productCount === 0 && totalSales === 0
    };
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    return {
      totalSales: 0,
      productCount: 0,
      averageRating: 0,
      ratingCount: 0,
      isVerified: false,
      identityVerifiedAt: null,
      isNewSeller: true
    };
  }
}

/**
 * Update seller's total sales count in User model
 * Call this after each successful order completion
 * @param {string} sellerId - Seller's user ID
 */
export async function updateSellerSalesCount(sellerId) {
  try {
    const stats = await getSellerStats(sellerId);
    await User.findByIdAndUpdate(sellerId, {
      totalSalesCount: stats.totalSales
    });
  } catch (error) {
    console.error("Error updating seller sales count:", error);
  }
}

/**
 * Add or update a product rating
 * @param {string} sellerId - Seller's user ID
 * @param {number} rating - Rating value (1-5)
 */
export async function addSellerRating(sellerId, rating) {
  try {
    const seller = await User.findById(sellerId);
    if (!seller) return;

    const currentTotal = seller.averageRating * seller.ratingCount;
    const newCount = seller.ratingCount + 1;
    const newAverage = (currentTotal + rating) / newCount;

    await User.findByIdAndUpdate(sellerId, {
      averageRating: parseFloat(newAverage.toFixed(2)),
      ratingCount: newCount
    });
  } catch (error) {
    console.error("Error adding seller rating:", error);
  }
}
