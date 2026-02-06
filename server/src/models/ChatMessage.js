import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromRole: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      required: true,
    },
    toRole: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

chatMessageSchema.index({ from: 1, to: 1, createdAt: 1 });
chatMessageSchema.index({ fromRole: 1, toRole: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
