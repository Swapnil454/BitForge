import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/models/Product.js";

dotenv.config();

const migrate = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    // Backfill scanStatus
    console.log("Migrating scanStatus...");
    const products = await Product.find({ scanStatus: { $exists: false } });
    console.log(`Found ${products.length} products to migrate.`);
    
    let updatedCount = 0;
    for (const product of products) {
      if (product.malwareScanned === true) {
        if (product.malwareScanDetails?.detections?.malicious > 0 || product.malwareScanDetails?.detections?.suspicious > 0) {
          product.scanStatus = "MALICIOUS";
        } else {
          product.scanStatus = "CLEAN";
        }
      } else {
        product.scanStatus = "PENDING";
      }
      await product.save({ validateBeforeSave: false }); // Skip validation for old data
      updatedCount++;
    }
    
    console.log(`Successfully migrated ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
