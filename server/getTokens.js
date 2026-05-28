import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const admin = await User.findOne({ role: 'admin' });
  const buyer = await User.findOne({ role: 'buyer' });
  
  if (!admin || !buyer) {
    console.log("Could not find admin or buyer");
    process.exit(1);
  }
  
  const adminToken = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET);
  const buyerToken = jwt.sign({ userId: buyer._id }, process.env.JWT_SECRET);
  
  console.log("Admin token:", adminToken);
  console.log("Buyer token:", buyerToken);
  
  process.exit(0);
}

run();
