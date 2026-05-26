import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    messageType: {
      type: String,
      enum: ["message", "note", "event", "reopen_request"],
      default: "message",
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Could be null for system event messages
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Could be null for system event messages
    },
    fromRole: {
      type: String,
      enum: ["buyer", "seller", "admin", "system"],
      required: false, // Could be null for system event messages
    },
    toRole: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      required: false,
    },
    message: {
      type: String,
      required: false,
      trim: true,
    },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String, required: true },
        name: { type: String, required: true },
      }
    ],
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
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

chatMessageSchema.index({ ticketId: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
