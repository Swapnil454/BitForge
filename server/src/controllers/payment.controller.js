


import razorpay from "../config/razorpay.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import CartOrder from "../models/CartOrder.js";
import Cart from "../models/Cart.js";

// Cart-based checkout - creates ONE Razorpay order for entire cart
export const createCartCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      select: 'title price discount sellerId status thumbnailUrl',
    });
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    
    // Validate all products and calculate totals
    const cartItems = [];
    let subtotal = 0;
    let totalGst = 0;
    let totalPlatformFee = 0;
    
    for (const item of cart.items) {
      const product = item.productId;
      
      if (!product || product.status !== "approved") {
        return res.status(400).json({ 
          message: `Product "${item.productId?.title || 'Unknown'}" is no longer available` 
        });
      }
      
      // Calculate pricing for this item
      const originalPrice = product.price;
      const discountPercent = product.discount || 0;
      const finalPrice = discountPercent > 0 
        ? Math.max(originalPrice - (originalPrice * discountPercent) / 100, 0)
        : originalPrice;
      
      const gst = finalPrice * 0.05; // 5% GST
      const platformFee = finalPrice * 0.02; // 2% platform fee
      const sellerAmount = finalPrice + gst - platformFee;
      const itemTotal = finalPrice + gst + platformFee;
      
      cartItems.push({
        productId: product._id,
        sellerId: product.sellerId,
        productName: product.title,
        quantity: item.quantity,
        originalPrice,
        discountPercent,
        finalPrice,
        gst,
        platformFee,
        sellerAmount,
        itemTotal,
      });
      
      subtotal += finalPrice;
      totalGst += gst;
      totalPlatformFee += platformFee;
    }
    
    const totalAmount = subtotal + totalGst + totalPlatformFee;
    const amountInPaise = Math.round(totalAmount * 100);
    
    console.log('🛒 Cart Checkout:');
    console.log(`   Items: ${cartItems.length}`);
    console.log(`   Subtotal: ₹${subtotal.toFixed(2)}`);
    console.log(`   GST (5%): ₹${totalGst.toFixed(2)}`);
    console.log(`   Platform Fee (2%): ₹${totalPlatformFee.toFixed(2)}`);
    console.log(`   Total Amount: ₹${totalAmount.toFixed(2)} (${amountInPaise} paise)`);
    
    // Create ONE Razorpay order for entire cart
    // Receipt must be max 40 chars: use short format
    const shortId = userId.toString().slice(-8);
    const timestamp = Date.now().toString().slice(-10);
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `cart_${shortId}_${timestamp}`,
    });
    
    // Create CartOrder document
    const cartOrder = await CartOrder.create({
      buyerId: userId,
      items: cartItems,
      subtotal,
      totalGst,
      totalPlatformFee,
      totalAmount,
      razorpayOrderId: razorpayOrder.id,
    });
    
    console.log(`✅ Cart order created: ${cartOrder._id}`);
    console.log(`   Razorpay Order: ${razorpayOrder.id}`);
    
    res.json({
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: "INR",
      cartOrderId: cartOrder._id,
      itemCount: cartItems.length,
      items: cartItems.map(item => ({
        productName: item.productName,
        finalPrice: item.finalPrice,
        itemTotal: item.itemTotal,
      })),
    });
    
  } catch (error) {
    console.error("❌ Cart checkout error:", error);
    res.status(500).json({ message: "Failed to create checkout", error: error.message });
  }
};

// Single product order (kept for backward compatibility)
export const createOrder = async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product || product.status !== "approved") {
    return res.status(404).json({ message: "Product not found" });
  }

  // Calculate final price after discount (matching frontend logic)
  const finalPrice = product.discount > 0 
    ? Math.max(product.price - (product.price * product.discount) / 100, 0)
    : product.price;

  // Calculate GST (5% on final price)
  const gst = finalPrice * 0.05;

  // Calculate platform fee (2% on final price)
  const platformFee = finalPrice * 0.02;

  // Calculate total amount
  const totalAmount = finalPrice + gst + platformFee;

  // Calculate seller amount (final price - platform fee, GST goes to seller)
  const sellerAmount = finalPrice + gst - platformFee;

  // Convert to paise for Razorpay (keep exact decimal, Razorpay accepts paise)
  const amountInPaise = Math.round(totalAmount * 100);

  console.log('💰 Payment Calculation:');
  console.log(`   Original Price: ₹${product.price}`);
  console.log(`   Discount: ${product.discount}%`);
  console.log(`   Final Price: ₹${finalPrice.toFixed(2)}`);
  console.log(`   GST (5%): ₹${gst.toFixed(2)}`);
  console.log(`   Platform Fee (2%): ₹${platformFee.toFixed(2)}`);
  console.log(`   Total Amount: ₹${totalAmount.toFixed(2)} (${amountInPaise} paise)`);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  const order = await Order.create({
    buyerId: req.user.id,
    sellerId: product.sellerId,
    productId: product._id,
    productName: product.title, // Store product name for historical records
    razorpayOrderId: razorpayOrder.id,
    amount: totalAmount, // Store exact total amount
    platformFee,
    sellerAmount,
  });

  res.json({
    razorpayOrderId: razorpayOrder.id,
    key: process.env.RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: "INR",
    orderId: order._id,
  });
};


export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id,
      status: "paid",
    }).populate("productId", "title price thumbnailUrl fileUrl");

    // Add default download tracking for backward compatibility
    const ordersWithDownloadInfo = orders.map(order => ({
      ...order.toObject(),
      downloadCount: order.downloadCount || 0,
      downloadLimit: order.downloadLimit || 5,
    }));

    console.log(`==> User ${req.user.id} has ${orders.length} paid orders`);
    res.json(ordersWithDownloadInfo);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// Debug endpoint - shows ALL orders with their statuses
export const getAllMyOrders = async (req, res) => {
  try {
    const allOrders = await Order.find({
      buyerId: req.user.id,
    }).populate("productId", "title price").sort({ createdAt: -1 });

    const statusCounts = {
      created: allOrders.filter(o => o.status === 'created').length,
      paid: allOrders.filter(o => o.status === 'paid').length,
      failed: allOrders.filter(o => o.status === 'failed').length,
    };

    console.log(`==> DEBUG: User ${req.user.id} order status:`, statusCounts);
    
    res.json({
      orders: allOrders,
      statusCounts,
      webhookIssue: statusCounts.created > 0 && statusCounts.paid === 0,
      message: statusCounts.created > 0 && statusCounts.paid === 0 
        ? "⚠️ Orders stuck in 'created' status - webhook not working!" 
        : "✅ All orders processed correctly"
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
