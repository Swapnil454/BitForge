import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Invoice from "./src/models/Invoice.js";
import Order from "./src/models/Order.js";
import Product from "./src/models/Product.js";

async function fixInvoices() {
    await mongoose.connect(process.env.MONGO_URI);
    const invoices = await Invoice.find();
    let fixedCount = 0;

    for (const invoice of invoices) {
        const order = await Order.findById(invoice.orderId);
        const product = await Product.findById(invoice.productId);
        
        if (order && product) {
            console.log(`Fixing Invoice ${invoice.invoiceNumber}. Old Total=${invoice.totalAmount}`);
            
            const GST_RATE = 0.05;
            const PLATFORM_FEE_RATE = 0.02;
            const discountPercent = product.discount || 0;
            
            const originalPrice = product.price;
            const discountAmount = originalPrice * (discountPercent / 100);
            const priceAfterDiscount = originalPrice - discountAmount;
            const gstAmount = originalPrice * GST_RATE;
            const platformFee = originalPrice * PLATFORM_FEE_RATE;
            const totalAmount = priceAfterDiscount + gstAmount + platformFee;
            
            // Update Invoice
            invoice.originalPrice = originalPrice;
            invoice.priceAfterDiscount = priceAfterDiscount;
            invoice.discountAmount = discountAmount;
            invoice.gstAmount = gstAmount;
            invoice.platformFee = platformFee;
            invoice.totalAmount = totalAmount;
            invoice.productPrice = originalPrice;
            
            await invoice.save();
            
            // Update Order so it matches everywhere
            order.amount = totalAmount;
            // The sellerAmount is 90% of priceAfterDiscount
            order.sellerAmount = priceAfterDiscount * 0.90;
            await order.save();
            
            fixedCount++;
        }
    }
    console.log(`Fixed ${fixedCount} invoices with EXACT product math.`);
    mongoose.disconnect();
}

fixInvoices().catch(console.error);
