import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import PromotionRequest from './src/models/PromotionRequest.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const promo = await PromotionRequest.findOne({}).sort({createdAt: -1}).lean();
  console.log('Latest promo from DB (lean):', promo);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
