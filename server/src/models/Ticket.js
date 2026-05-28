import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  // Identity
  ticketNumber:  { type: String, unique: true }, // "TKT-00142"
  subject:       { type: String, required: true, maxlength: 150 },
  category: {
    type: String,
    enum: ['payment','listing','account','dispute','shipping','other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low','medium','high','urgent'],
    default: 'medium'
  },

  // Participants
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole:    { type: String, enum: ['buyer','seller'] },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // admin

  // Lifecycle
  status: {
    type: String,
    enum: ['open','pending','resolved','closed'],
    default: 'open'
  },
  source:      { type: String, enum: ['user','admin'], default: 'user' },

  // SLA timestamps
  firstResponseAt:  { type: Date, default: null },
  resolvedAt:       { type: Date, default: null },
  closedAt:         { type: Date, default: null },
  lastUserReplyAt:  { type: Date, default: null },
  lastAdminReplyAt: { type: Date, default: null },

  // Reopen tracking
  reopenCount:  { type: Number, default: 0 },
  reopenedAt:   { type: Date, default: null },

  // Stats (denormalized for performance)
  messageCount:     { type: Number, default: 0 },
  avgResponseTime:  { type: Number, default: null }, // minutes

  // Soft delete
  isDeleted: { type: Boolean, default: false },
  tags: [String],
}, { timestamps: true });

// Indexes for performance
TicketSchema.index({ userId: 1, status: 1 });
TicketSchema.index({ assignedTo: 1, status: 1 });
TicketSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Ticket", TicketSchema);
