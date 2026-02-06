

import Product from "../models/Product.js";

export const getMarketplaceProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      status: "approved",
      changeRequest: "none"  // Only show products without pending changes
    })
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};


export const getMarketplaceProductById = async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    status: "approved",
    changeRequest: "none"  // Only show products without pending changes
  }).populate("sellerId", "name email");

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};
