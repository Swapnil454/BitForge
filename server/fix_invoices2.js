import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Invoice from "./src/models/Invoice.js";
import Order from "./src/models/Order.js";

async function fixInvoices() {
    await mongoose.connect(process.env.MONGO_URI);
    const invoices = await Invoice.find();
    let fixedCount = 0;

    for (const invoice of invoices) {
        const order = await Order.findById(invoice.orderId);
        if (order && order.amount) {
            if (invoice.totalAmount > order.amount + 0.05) {
                console.log(`Fixing Invoice ${invoice.invoiceNumber}. TotalAmount=${invoice.totalAmount}, OrderAmount=${order.amount}`);
                
                const discountPercent = invoice.discountPercent || 0;
                const gstRate = invoice.gstRate || 0.05;
                const platformFeeRate = invoice.platformFeeRate || 0.02;
                
                const trueOriginalPrice = order.amount / (1 + gstRate + platformFeeRate) / (1 - discountPercent / 100);
                const truePriceAfterDiscount = trueOriginalPrice * (1 - discountPercent / 100);
                
                invoice.originalPrice = trueOriginalPrice;
                invoice.priceAfterDiscount = truePriceAfterDiscount;
                invoice.discountAmount = trueOriginalPrice - truePriceAfterDiscount;
                invoice.gstAmount = truePriceAfterDiscount * gstRate;
                invoice.platformFee = truePriceAfterDiscount * platformFeeRate;
                invoice.totalAmount = order.amount;
                invoice.productPrice = trueOriginalPrice;
                
                await invoice.save();
                fixedCount++;
            }
        }
    }
    console.log(`Fixed ${fixedCount} invoices.`);
    mongoose.disconnect();
}

fixInvoices().catch(console.error);
