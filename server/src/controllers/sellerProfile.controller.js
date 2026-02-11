import User from "../models/User.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { getSellerStats } from "../utils/sellerStats.js";

/**
 * Get public seller profile by ID
 * GET /api/sellers/:sellerId
 */
export const getSellerProfile = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Get seller basic info
    const seller = await User.findById(sellerId).select(
      "name email bio profilePictureUrl isVerified identityVerifiedAt createdAt totalSalesCount averageRating ratingCount"
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Get seller stats
    const stats = await getSellerStats(sellerId);

    // Get seller's approved products
    const products = await Product.find({
      sellerId: sellerId,
      status: "approved",
      changeRequest: "none"
    })
      .select("title description price discount thumbnailUrl createdAt pageCount format")
      .sort({ createdAt: -1 })
      .limit(20);

    // Get recent reviews for this seller
    const reviews = await Review.find({
      sellerId: sellerId,
      isHidden: false
    })
      .populate("buyerId", "name profilePictureUrl")
      .populate("productId", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        bio: seller.bio,
        profilePictureUrl: seller.profilePictureUrl,
        isVerified: seller.isVerified,
        identityVerifiedAt: seller.identityVerifiedAt,
        memberSince: seller.createdAt,
        totalSalesCount: seller.totalSalesCount,
        averageRating: seller.averageRating,
        ratingCount: seller.ratingCount
      },
      stats,
      products,
      reviews
    });
  } catch (error) {
    console.error("Get seller profile error:", error);
    res.status(500).json({ message: "Failed to fetch seller profile" });
  }
};

/**
 * Get seller's products (paginated)
 * GET /api/sellers/:sellerId/products
 */
export const getSellerProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      sellerId: sellerId,
      status: "approved",
      changeRequest: "none"
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({
      sellerId: sellerId,
      status: "approved",
      changeRequest: "none"
    });

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get seller products error:", error);
    res.status(500).json({ message: "Failed to fetch seller products" });
  }
};

/**
 * Get seller's reviews (paginated)
 * GET /api/sellers/:sellerId/reviews
 */
export const getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      sellerId: sellerId,
      isHidden: false
    })
      .populate("buyerId", "name profilePictureUrl")
      .populate("productId", "title thumbnailUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      sellerId: sellerId,
      isHidden: false
    });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get seller reviews error:", error);
    res.status(500).json({ message: "Failed to fetch seller reviews" });
  }
};

/**
 * Update own seller profile
 * PATCH /api/sellers/profile (requires auth)
 */
export const updateSellerProfile = async (req, res) => {
  try {
    const { bio } = req.body;

    if (bio && bio.length > 500) {
      return res.status(400).json({ message: "Bio must be 500 characters or less" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { bio: bio?.trim() },
      { new: true, runValidators: true }
    ).select("name email bio profilePictureUrl");

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update seller profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
