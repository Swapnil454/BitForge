import mongoose from "mongoose";

const TicketEventSchema = new mongoose.Schema({
  ticketId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  actor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = system
  actorRole: { type: String, enum: ['buyer','seller','admin','system'] },
  action: {
    type: String,
    enum: [
      'created', 'assigned', 'unassigned',
      'status_changed', 'priority_changed',
      'message_sent', 'note_added', 'file_attached',
      'reopened', 'resolved', 'closed', 'auto_closed', 'reopen_requested', 'reopen_rejected'
    ]
  },
  meta: { type: Map, of: mongoose.Schema.Types.Mixed },
  // meta examples:
  // status_changed: { from: 'open', to: 'resolved' }
  // assigned:       { adminId: '...', adminName: 'Support Agent' }
  // auto_closed:    { reason: '72h_no_reply' }
}, { timestamps: true });

TicketEventSchema.index({ ticketId: 1, createdAt: 1 });

export default mongoose.model("TicketEvent", TicketEventSchema);
