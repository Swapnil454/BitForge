import mongoose from "mongoose";

const adSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global",
      unique: true,
      trim: true,
    },
    marketplaceHeroMaxAds: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    autoRotate: {
      type: Boolean,
      default: true,
    },
    defaultDurationDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 365,
    },
    minimumPrice: {
      type: Number,
      default: 2,
      min: 0,
    },
    maximumActiveAdsPerSeller: {
      type: Number,
      default: 5,
      min: 1,
      max: 50,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdSettings", adSettingsSchema);
