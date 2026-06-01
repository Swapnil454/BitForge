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
            // We want to force recalculation with GST and Platform Fee based on originalPrice
            console.log(`Fixing Invoice ${invoice.invoiceNumber}. TotalAmount=${invoice.totalAmount}, OrderAmount=${order.amount}`);
            
            const discountPercent = invoice.discountPercent || 0;
            const gstRate = invoice.gstRate || 0.05;
            const platformFeeRate = invoice.platformFeeRate || 0.02;
            
            // Assume the correct original price is order.amount / (1 - discountPercent/100 + gstRate + platformFeeRate)
            // But wait! Did the user actually PAY order.amount based on the old logic or the new logic?
            // The old logic calculated order.amount using finalPrice for GST!
            // The user paid what was charged. But wait! The UI said 36.05, but Razorpay charged 35.95?
            // Yes! Because the backend charged 35.95 while the UI said 36.05.
            // Now we want the backend to charge 36.05 (which means it calculates GST on originalPrice).
            // For OLD orders, they actually paid 35.95.
            // But the invoice should reflect what they paid. If they paid 35.95, what should the invoice show?
            // If they paid 35.95, and the math on the invoice should add up:
            // Let's just make the invoice math add up exactly.
            // To make it add up, if we use GST on originalPrice, then:
            // trueOriginalPrice = 35.95 / (1 - 0.04 + 0.05 + 0.02) = 35.95 / 1.03 = 34.90.
            // Then UI would look weird.
            // Let's just set the original price to what the product actually costs in the DB?
            // No, the product might have changed price.
            // For now, let's recalculate the old invoices using the NEW math to make them mathematically sound
            // with GST on originalPrice.
            const trueOriginalPrice = order.amount / (1 - discountPercent / 100 + gstRate + platformFeeRate);
            const truePriceAfterDiscount = trueOriginalPrice * (1 - discountPercent / 100);
            
            invoice.originalPrice = trueOriginalPrice;
            invoice.priceAfterDiscount = truePriceAfterDiscount;
            invoice.discountAmount = trueOriginalPrice - truePriceAfterDiscount;
            invoice.gstAmount = trueOriginalPrice * gstRate;
            invoice.platformFee = trueOriginalPrice * platformFeeRate;
            invoice.totalAmount = order.amount;
            invoice.productPrice = trueOriginalPrice;
            
            await invoice.save();
            fixedCount++;
        }
    }
    console.log(`Fixed ${fixedCount} invoices with new GST math.`);
    mongoose.disconnect();
}

fixInvoices().catch(console.error);
