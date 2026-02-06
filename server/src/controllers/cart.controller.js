import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      select: 'title description price discount thumbnailUrl fileUrl sellerId status',
      populate: {
        path: 'sellerId',
        select: 'name email'
      }
    });

    // Create new cart if doesn't exist
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Filter out any items with deleted products
    cart.items = cart.items.filter(item => item.productId != null);
    
    res.json({
      success: true,
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Check if product exists and is approved
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Product is not available for purchase' });
    }

    // Check if user is trying to buy their own product
    if (product.sellerId.toString() === userId) {
      return res.status(400).json({ success: false, message: 'You cannot add your own product to cart' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item already exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();

    // Populate cart items for response
    await cart.populate({
      path: 'items.productId',
      select: 'title description price discount thumbnailUrl fileUrl sellerId',
      populate: {
        path: 'sellerId',
        select: 'name email'
      }
    });

    res.json({
      success: true,
      message: 'Item added to cart',
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice
      }
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity are required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    await cart.populate({
      path: 'items.productId',
      select: 'title description price discount thumbnailUrl fileUrl sellerId',
      populate: {
        path: 'sellerId',
        select: 'name email'
      }
    });

    res.json({
      success: true,
      message: 'Cart updated',
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice
      }
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    await cart.save();

    await cart.populate({
      path: 'items.productId',
      select: 'title description price discount thumbnailUrl fileUrl sellerId',
      populate: {
        path: 'sellerId',
        select: 'name email'
      }
    });

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice
      }
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item from cart' });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      cart: {
        _id: cart._id,
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
};

// Get cart item count
export const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    
    const count = cart ? cart.totalItems : 0;

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ success: false, message: 'Failed to get cart count' });
  }
};
