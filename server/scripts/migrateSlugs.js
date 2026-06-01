import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import { generateSlug, generateUniqueSlug } from "../src/utils/slug.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const migrateSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    console.log("Migrating Users...");
    const users = await User.find({ slug: { $exists: false } });
    let migratedUsers = 0;
    for (let user of users) {
      if (user.name) {
        const baseSlug = generateSlug(user.name);
        user.slug = await generateUniqueSlug(User, baseSlug, user._id);
        await user.save();
        migratedUsers++;
        console.log(`Migrated user: ${user.name} -> ${user.slug}`);
      }
    }
    console.log(`Finished migrating ${migratedUsers} users.`);

    console.log("Migrating Products...");
    const products = await Product.find({ slug: { $exists: false } });
    let migratedProducts = 0;
    for (let product of products) {
      if (product.title) {
        const baseSlug = generateSlug(product.title);
        product.slug = await generateUniqueSlug(Product, baseSlug, product._id);
        product.categorySlug = generateSlug(product.category || "software");
        await product.save({ validateBeforeSave: false }); // Skip validation in case old products are missing new required fields
        migratedProducts++;
        console.log(`Migrated product: ${product.title} -> ${product.slug}`);
      }
    }
    console.log(`Finished migrating ${migratedProducts} products.`);

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateSlugs();
