// Test script to check pending product changes endpoint
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Product = mongoose.model('Product', new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  description: String,
  price: Number,
  discount: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  changeRequest: { type: String, enum: ["none", "pending_update", "pending_deletion"], default: "none" },
  pendingChanges: {
    title: String,
    description: String,
    price: Number,
    discount: Number,
    fileKey: String,
    fileUrl: String,
    thumbnailKey: String,
    thumbnailUrl: String,
  },
}, { timestamps: true }));

async function testPendingChanges() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products with pending changes
    const products = await Product.find({
      changeRequest: { $in: ["pending_update", "pending_deletion"] }
    });

    console.log(`\n📋 Products with pending changes: ${products.length}`);
    
    if (products.length > 0) {
      products.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.title}`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Change Request: ${p.changeRequest}`);
        console.log(`   Pending Changes:`, p.pendingChanges);
      });
    }

    // Also check all products to see their changeRequest status
    const allProducts = await Product.find({});
    console.log(`\n📊 All products in database: ${allProducts.length}`);
    console.log('\nChange Request Status Distribution:');
    const statusCounts = {
      none: 0,
      pending_update: 0,
      pending_deletion: 0,
      undefined: 0
    };
    
    allProducts.forEach(p => {
      const cr = p.changeRequest || 'undefined';
      statusCounts[cr] = (statusCounts[cr] || 0) + 1;
    });
    
    console.log(statusCounts);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPendingChanges();
