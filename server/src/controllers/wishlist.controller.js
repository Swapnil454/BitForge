import Wishlist from "../models/Wishlist.js";

// Toggle product in wishlist
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [productId] });
      await wishlist.save();
      return res.json({ message: "Added to wishlist", wishlist: wishlist.products });
    }

    const index = wishlist.products.findIndex((id) => id.toString() === productId);

    if (index > -1) {
      // Remove
      wishlist.products.splice(index, 1);
      await wishlist.save();
      return res.json({ message: "Removed from wishlist", wishlist: wishlist.products });
    } else {
      // Add
      wishlist.products.push(productId);
      await wishlist.save();
      return res.json({ message: "Added to wishlist", wishlist: wishlist.products });
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    res.status(500).json({ message: "Failed to update wishlist" });
  }
};

// Get wishlist array (populated if needed, but for now just IDs is fine for most pages, or populated for wishlist page)
// We'll support an optional ?populate=true query
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { populate } = req.query;

    const query = Wishlist.findOne({ userId });
    
    if (populate === "true") {
      query.populate("products");
    }

    const wishlist = await query;

    if (!wishlist) {
      return res.json({ wishlist: [] });
    }

    res.json({ wishlist: wishlist.products });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

// Get wishlist count
export const getWishlistCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const wishlist = await Wishlist.findOne({ userId });
    
    res.json({ wishlistCount: wishlist ? wishlist.products.length : 0 });
  } catch (error) {
    console.error("Error fetching wishlist count:", error);
    res.status(500).json({ message: "Failed to fetch wishlist count" });
  }
};
