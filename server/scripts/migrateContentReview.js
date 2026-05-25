import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import { autoReviewContent } from '../src/utils/contentReview.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const migrate = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({ 
      status: { $ne: 'rejected' },
      $or: [
        { requiresManualReview: { $exists: false } },
        { reviewScore: null },
        { reviewScore: { $exists: false } }
      ]
    });

    console.log(`Migrating ${products.length} products...`);
    let flagged = 0;

    for (const product of products) {
      const reviewResult = autoReviewContent({
        title: product.title,
        description: product.description,
        price: product.price,
        pageCount: product.pageCount,
        fileSizeBytes: product.fileSizeBytes
      });

      await Product.findByIdAndUpdate(product._id, {
        $set: {
          requiresManualReview: reviewResult.requiresManualReview ?? false,
          reviewSeverity: reviewResult.severity ?? null,
          reviewFlags: reviewResult.flags ?? [],
          reviewScore: reviewResult.score ?? null,
        }
      });

      if (reviewResult.requiresManualReview) flagged++;
    }

    console.log(`Done. ${flagged} products flagged for review.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

migrate();
