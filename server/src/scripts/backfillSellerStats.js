import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';

dotenv.config();

async function backfill() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({ role: { $in: ['seller', 'admin'] } });
    console.log(`Found ${users.length} sellers to process.`);

    for (const user of users) {
      // 1. Get products for this seller
      const products = await Product.find({ sellerId: user._id });
      
      const totalProducts = products.length;
      let approvedProducts = 0;
      let rejectedProducts = 0;
      let changesRequested = 0;

      products.forEach(p => {
        if (p.status === 'approved') approvedProducts++;
        if (p.status === 'rejected') rejectedProducts++;
        if (p.status === 'changes_requested') changesRequested++;
      });

      // We would count disputes here if Dispute model existed and linked. 
      // Assuming 0 for backfill as per typical defaults unless Dispute is loaded.
      const disputes = 0;

      await User.findByIdAndUpdate(user._id, {
        $set: {
          'sellerStats.totalProducts': totalProducts,
          'sellerStats.approvedProducts': approvedProducts,
          'sellerStats.rejectedProducts': rejectedProducts,
          'sellerStats.changesRequested': changesRequested,
          'sellerStats.disputes': disputes,
        }
      });
      
      console.log(`Updated user ${user.email} - Total: ${totalProducts}, Approved: ${approvedProducts}`);
    }

    console.log("Backfill complete!");
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
}

backfill();
