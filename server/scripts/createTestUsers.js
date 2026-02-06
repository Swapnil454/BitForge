import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/contentsellify';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to Mongo');

    const buyerEmail = 'buyer.delete@test.local';
    const sellerEmail = 'seller.delete@test.local';
    const adminEmail = 'admin.notify@test.local';

    const passwordHash = await bcrypt.hash('Pass1234!', 10);

    // Upsert admin
    const admin = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: 'Admin Notify',
        email: adminEmail,
        password: passwordHash,
        role: 'admin',
        isVerified: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Upsert buyer
    const buyer = await User.findOneAndUpdate(
      { email: buyerEmail },
      {
        name: 'Buyer Delete Me',
        email: buyerEmail,
        password: passwordHash,
        role: 'buyer',
        isVerified: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Upsert seller (approved)
    const seller = await User.findOneAndUpdate(
      { email: sellerEmail },
      {
        name: 'Seller Delete Me',
        email: sellerEmail,
        password: passwordHash,
        role: 'seller',
        isVerified: true,
        isApproved: true,
        approvalStatus: 'approved',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('👤 Admin:', admin.email, admin._id.toString());
    console.log('🛒 Buyer:', buyer.email, buyer._id.toString());
    console.log('💼 Seller:', seller.email, seller._id.toString());
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

run();
