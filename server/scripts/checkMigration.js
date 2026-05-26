import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const uri = process.env.MONGO_URI;

async function checkMigration() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const result = await db.collection('users').aggregate([
      { $match: { role: 'seller' } },
      { $group: { _id: '$identityVerificationStatus', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Migration Check Result:', result);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkMigration();
