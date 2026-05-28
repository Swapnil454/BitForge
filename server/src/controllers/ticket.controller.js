import Ticket from "../models/Ticket.js";
import ChatMessage from "../models/ChatMessage.js";
import TicketEvent from "../models/TicketEvent.js";
import Counter from "../models/Counter.js";
import { getIO } from "../lib/socket.js";
import { createNotification } from "./notification.controller.js";

const CATEGORIES = [
  { id: 'payment',  icon: 'ti-credit-card', label: 'Payment issue' },
  { id: 'listing',  icon: 'ti-package',     label: 'Listing problem' },
  { id: 'account',  icon: 'ti-user',        label: 'Account issue' },
  { id: 'dispute',  icon: 'ti-alert',       label: 'Dispute / fraud' },
  { id: 'shipping', icon: 'ti-truck',       label: 'Shipping issue' },
  { id: 'other',    icon: 'ti-help',        label: 'Other' },
];

async function getNextTicketNumber() {
  const counter = await Counter.findByIdAndUpdate(
    'ticket',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `TKT-${String(counter.seq).padStart(5, '0')}`;
}

export async function logEvent(ticketId, actorId, actorRole, action, meta = {}) {
  await TicketEvent.create({
    ticketId,
    actor: actorId,
    actorRole,
    action,
    meta,
  });
}

// GET /api/tickets/categories
export const getCategories = (req, res) => {
  res.json({ categories: CATEGORIES });
};

// POST /api/tickets
export const createTicket = async (req, res) => {
  try {
    const { subject, category, message, attachments } = req.body;
    const userId = req.user._id;

    if (!subject || !category || (!message && (!attachments || attachments.length === 0))) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Rate limit: max 5 open tickets per user
    const openCount = await Ticket.countDocuments({
      userId, status: { $in: ['open','pending'] }
    });
    if (openCount >= 5) {
      return res.status(429).json({
        error: 'You already have 5 open tickets. Please wait for a response before creating more.'
      });
    }

    const ticketNumber = await getNextTicketNumber();

    const ticket = await Ticket.create({
      ticketNumber,
      subject,
      category,
      userId,
      userRole: req.user.role,
      status: 'open',
      source: 'user',
    });

    // Create the first message
    const chatMsg = await ChatMessage.create({
      ticketId: ticket._id,
      from: userId,
      fromRole: req.user.role,
      toRole: 'admin', // target role
      message: message?.trim() || "",
      attachments: attachments || [],
      messageType: 'message',
    });
    
    // populate for emit
    await chatMsg.populate([{ path: "from", select: "name role" }]);

    await ticket.updateOne({ messageCount: 1, lastUserReplyAt: new Date() });

    // Log event
    await logEvent(ticket._id, userId, req.user.role, 'created', { subject, category });

    // Notify all admins (could be done via notification system or socket)
    const io = getIO();
    io.to('admins').emit('ticket:new', { ticket, message: chatMsg });

    return res.status(201).json({ ticket });
  } catch (err) {
    console.error("createTicket error", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

// GET /api/tickets
export const listMyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    let filter = { userId, isDeleted: false };
    if (status && status !== 'all') {
      filter.status = status;
    }

    let tickets = await Ticket.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const ticketIds = tickets.map(t => t._id);
    const lastMessages = await ChatMessage.aggregate([
      { $match: { ticketId: { $in: ticketIds }, messageType: 'message' } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$ticketId', lastMessage: { $first: '$message' }, attachments: { $first: '$attachments' } } }
    ]);
    
    const lastMsgMap = {};
    const lastAttMap = {};
    lastMessages.forEach(m => { 
      lastMsgMap[m._id] = m.lastMessage; 
      lastAttMap[m._id] = m.attachments;
    });
    
    const unreadCounts = await ChatMessage.aggregate([
      { $match: { 
          ticketId: { $in: ticketIds }, 
          from: { $ne: userId },
          readBy: { $ne: userId },
          messageType: { $ne: 'note' }
      }},
      { $group: { _id: '$ticketId', count: { $sum: 1 } } }
    ]);
    const unreadMap = {};
    unreadCounts.forEach(m => { unreadMap[m._id] = m.count; });
    
    tickets.forEach(t => {
      t.lastMessageText = lastMsgMap[t._id] || (t.subject !== 'Migrated Conversation' ? t.subject : '');
      t.lastMessageAttachments = lastAttMap[t._id] || [];
      t.unreadCount = unreadMap[t._id] || 0;
    });
      
    const total = await Ticket.countDocuments(filter);

    res.json({ tickets, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("listMyTickets error", err);
    res.status(500).json({ error: "Failed to list tickets" });
  }
};

// GET /api/tickets/:id
export const getTicket = async (req, res) => {
  try {
    // Ticket access is verified by middleware `req.ticket`
    const ticket = req.ticket;

    // Users should not see 'note' messageTypes
    const messages = await ChatMessage.find({ 
      ticketId: ticket._id,
      messageType: { $ne: 'note' } 
    })
    .sort({ createdAt: 1 })
    .populate("from", "name role");

    res.json({ ticket, messages });
  } catch (err) {
    console.error("getTicket error", err);
    res.status(500).json({ error: "Failed to get ticket" });
  }
};

// POST /api/tickets/:id/messages
export const sendMessage = async (req, res) => {
  try {
    const ticketId = req.ticket._id;
    const { content, attachments } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    const ticket = req.ticket;

    if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: "Message or attachment is required" });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({
        error: 'This ticket is closed.',
        action: 'create_new_ticket',
        message: 'Please open a new ticket for your issue.'
      });
    }

    let wasReopened = false;

    // Reopen logic
    if (ticket.status === 'resolved') {
      const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : Date.now();
      const hoursSinceResolved = (Date.now() - resolvedTime) / 3_600_000;
      if (ticket.resolvedAt && hoursSinceResolved > 72) {
        return res.status(400).json({
          error: 'This ticket has been closed after 72 hours.',
          action: 'create_new_ticket'
        });
      }
      
      const updatedTicket = await Ticket.findOneAndUpdate(
        { _id: ticket._id, status: 'resolved' },
        { 
          status: 'open', 
          reopenedAt: new Date(), 
          $inc: { reopenCount: 1 }
        },
        { new: true }
      );
      
      if (updatedTicket) {
        wasReopened = true;
        ticket.status = 'open'; // update local reference
        
        await logEvent(ticket._id, senderId, senderRole, 'reopened', {
          reason: 'user_replied_within_72h'
        });
        
        const eventMsg = await ChatMessage.create({
          ticketId, messageType: 'event',
          message: 'Ticket was reopened by user reply.'
        });
        
        const io = getIO();
        io.to(`ticket:${ticketId}`).emit('ticket:new-message', eventMsg);
        io.to(`ticket:${ticketId}`).emit('ticket:status-changed', { ticketId, status: 'open' });
      }
    }

    const msg = await ChatMessage.create({
      ticketId, 
      from: senderId, 
      fromRole: senderRole, 
      toRole: 'admin',
      message: content?.trim() || "", 
      attachments: attachments || [],
      messageType: 'message'
    });
    
    await msg.populate("from", "name role");

    const updateData = {
      $inc: { messageCount: 1 },
      lastUserReplyAt: new Date(),
    };
    
    let changedToOpen = false;
    if (ticket.status === 'pending') {
      updateData.status = 'open';
      changedToOpen = true;
      ticket.status = 'open';
    }

    await Ticket.updateOne({ _id: ticket._id }, updateData);
    await logEvent(ticket._id, senderId, senderRole, 'message_sent', {});

    const io = getIO();
    io.to(`ticket:${ticketId}`).emit('ticket:new-message', msg);
    io.to('admins').emit('ticket:new-message', msg);
    io.to(String(ticket.userId)).emit('ticket:new-message', msg);
    
    if (changedToOpen && !wasReopened) {
        io.to(`ticket:${ticketId}`).emit('ticket:status-changed', { ticketId, status: 'open' });
        io.to('admins').emit('ticket:status-changed', { ticketId, status: 'open' });
    }

    return res.status(201).json({ message: msg });
  } catch (err) {
    console.error("sendMessage error", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// POST /api/tickets/:id/request-reopen
export const requestReopenTicket = async (req, res) => {
  try {
    const ticketId = req.ticket._id;
    const senderId = req.user._id;
    const ticket = req.ticket;

    if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
      return res.status(400).json({ error: "Ticket is already open or pending." });
    }

    const msg = await ChatMessage.create({
      ticketId, 
      from: senderId, 
      fromRole: req.user.role, 
      toRole: 'admin',
      message: "User requested to reopen this ticket.", 
      messageType: 'reopen_request'
    });
    
    await msg.populate("from", "name role");
    await logEvent(ticket._id, senderId, req.user.role, 'reopen_requested', {});

    const io = getIO();
    io.to(`ticket:${ticketId}`).emit('ticket:new-message', msg);
    io.to('admins').emit('ticket:new-message', msg);

    return res.status(201).json({ message: msg });
  } catch (err) {
    console.error("requestReopenTicket error", err);
    res.status(500).json({ error: "Failed to request reopen" });
  }
};

// DELETE /api/tickets/:id/cancel-reopen
export const cancelReopenTicket = async (req, res) => {
  try {
    const ticketId = req.ticket._id;
    const senderId = req.user._id;

    // Delete the reopen_request message so it disappears from UI
    await ChatMessage.deleteMany({
      ticketId,
      messageType: 'reopen_request'
    });

    const eventMsg = await ChatMessage.create({
      ticketId, 
      from: senderId, 
      fromRole: req.user.role,
      messageType: 'event',
      message: "Ticket reopen request was cancelled by user."
    });

    const io = getIO();
    io.to(`ticket:${ticketId}`).emit('ticket:reopen-rejected', eventMsg); // Reuse the same socket event to clear UI
    io.to('admins').emit('ticket:reopen-rejected', eventMsg);

    return res.status(200).json({ message: "Reopen request cancelled" });
  } catch (err) {
    console.error("cancelReopenTicket error", err);
    res.status(500).json({ error: "Failed to cancel reopen request" });
  }
};
