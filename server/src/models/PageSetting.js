import mongoose from "mongoose";

const pageSettingSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      unique: true,
    },
    legalEffectiveDate: {
      type: String,
      default: "January 1, 2026",
    },
    legalLastUpdatedDate: {
      type: String,
      default: "February 1, 2026",
    },
  },
  {
    timestamps: true,
  }
);

const PageSetting = mongoose.model("PageSetting", pageSettingSchema);

export default PageSetting;
