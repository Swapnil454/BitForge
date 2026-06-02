

import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { getSellerStats } from "../utils/sellerStats.js";

export const getMarketplaceProducts = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 8));
    const skip  = (page - 1) * limit;

    // Build filter
    const filter = {
      status: "approved",
      changeRequest: "none",
      isDeleted: { $ne: true }
    };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Build sort
    let sort = { createdAt: -1 }; // default: newest first
    if (req.query.sort === "trending") sort = { buyers: -1 };
    if (req.query.sort === "rating")   sort = { rating: -1 };
    if (req.query.sort === "price_asc")  sort = { price: 1 };
    if (req.query.sort === "price_desc") sort = { price: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("sellerId", "name email isVerified identityVerifiedAt profilePictureUrl bio slug")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      products,
      page,
      limit,
      total,
      hasMore: skip + products.length < total,
    });
  } catch (error) {
    console.error("Marketplace fetch error:", error);
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

export const getMarketplaceProductBySlug = async (req, res) => {
  try {
    const param = req.params.slug;
    const query = {
      status: "approved",
      changeRequest: "none",
      isDeleted: { $ne: true }
    };

    // If the parameter is a valid MongoDB ObjectId, check both _id and slug
    // This provides backward compatibility for old links using the product _id
    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ slug: param }, { _id: param }];
    } else {
      query.slug = param;
    }

    const product = await Product.findOne(query).populate("sellerId", "name email isVerified identityVerifiedAt profilePictureUrl bio createdAt slug");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const sellerStats = await getSellerStats(product.sellerId._id);
    const productWithStats = product.toObject();
    productWithStats.sellerStats = sellerStats;

    res.json(productWithStats);
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

export const getProductsByCategorySlug = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 8));
    const skip = (page - 1) * limit;

    const filter = {
      categorySlug: req.params.slug,
      status: "approved",
      changeRequest: "none",
      isDeleted: { $ne: true }
    };

    let sort = { createdAt: -1 };
    if (req.query.sort === "trending") sort = { buyers: -1 };
    if (req.query.sort === "rating") sort = { rating: -1 };
    if (req.query.sort === "price_asc") sort = { price: 1 };
    if (req.query.sort === "price_desc") sort = { price: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("sellerId", "name email isVerified identityVerifiedAt profilePictureUrl bio slug")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      products,
      page,
      limit,
      total,
      hasMore: skip + products.length < total,
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};
