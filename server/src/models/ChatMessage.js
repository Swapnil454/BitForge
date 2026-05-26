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
      required: false, // Make it optional since a message could just be an attachment
      trim: true,
    },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String, required: true }, // e.g., 'image/png', 'application/pdf'
        name: { type: String, required: true },
      }
    ],
    supportTicketId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "deleted", "placeholderDeleted"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
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
