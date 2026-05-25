import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrate() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Grandfather existing verified sellers
    const result = await db.collection('users').updateMany(
      { 
        role: 'seller', 
        $or: [
          { isVerified: true }, 
          { identityVerified: true }
        ] 
      },
      { 
        $set: { identityVerificationStatus: 'verified' } 
      }
    );
    
    console.log(`Migration complete. Modified ${result.modifiedCount} users.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrate();
