import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await mongoose.connection.db.collection('tickets').deleteMany({ subject: 'Test Ticket API' });
  console.log(`Deleted ${result.deletedCount} fake tickets.`);
  process.exit(0);
});
