import Ticket from "../models/Ticket.js";
import ChatMessage from "../models/ChatMessage.js";
import TicketEvent from "../models/TicketEvent.js";
import { getIO } from "../lib/socket.js";
import { logEvent } from "./ticket.controller.js";
import { createNotification } from "./notification.controller.js";
import User from "../models/User.js";
import Counter from "../models/Counter.js";

const STATUS_TRANSITIONS = {
  admin: {
    open:     ['pending', 'resolved', 'closed'],
    pending:  ['open', 'resolved', 'closed'],
    resolved: ['open', 'closed'],
    closed:   ['open'], 
  }
};

function canTransition(currentStatus, newStatus, role) {
  return STATUS_TRANSITIONS[role]?.[currentStatus]?.includes(newStatus) ?? false;
}

// GET /api/admin/tickets
export const listAllTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, role, assignedTo, search } = req.query;

    let filter = { isDeleted: false };
    
    if (status && status !== 'all') filter.status = status;
    if (role && role !== 'all') filter.userRole = role;
    if (assignedTo === 'me') filter.assignedTo = req.user._id;
    else if (assignedTo === 'unassigned') filter.assignedTo = null;
    
    if (search) {
      const q = search.trim().toLowerCase();
      // Find users matching search by name or email
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }).select('_id').lean();
      
      const userIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { ticketNumber: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    let tickets = await Ticket.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email role')
      .populate('assignedTo', 'name')
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
          from: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
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
    console.error("admin listAllTickets error", err);
    res.status(500).json({ error: "Failed to list tickets" });
  }
};

// GET /api/admin/tickets/stats
export const getTicketStats = async (req, res) => {
  try {
    const openCount = await Ticket.countDocuments({ status: 'open', isDeleted: false });
    const pendingCount = await Ticket.countDocuments({ status: 'pending', isDeleted: false });
    const resolvedCount = await Ticket.countDocuments({ status: 'resolved', isDeleted: false });
    const unassignedCount = await Ticket.countDocuments({ assignedTo: null, isDeleted: false, status: { $in: ['open', 'pending'] } });

    res.json({ openCount, pendingCount, resolvedCount, unassignedCount });
  } catch (err) {
    console.error("admin getTicketStats error", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// GET /api/admin/tickets/:id
export const getTicketDetails = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await Ticket.findById(ticketId)
      .populate('userId', 'name email role')
      .populate('assignedTo', 'name');
      
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Mark unread messages as read by admin
    const now = new Date();
    await ChatMessage.updateMany(
      {
        ticketId,
        from: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
        messageType: { $ne: 'note' }
      },
      {
        $addToSet: { readBy: req.user._id },
        $set: { readAt: now }
      }
    );

    const messages = await ChatMessage.find({ ticketId })
      .sort({ createdAt: 1 })
      .populate("from", "name role");

    res.json({ ticket, messages });
  } catch (err) {
    console.error("admin getTicketDetails error", err);
    res.status(500).json({ error: "Failed to get ticket details" });
  }
};

// GET /api/admin/tickets/:id/events
export const getTicketEvents = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const events = await TicketEvent.find({ ticketId })
      .sort({ createdAt: 1 })
      .populate('actor', 'name role');
      
    res.json({ events });
  } catch (err) {
    console.error("admin getTicketEvents error", err);
    res.status(500).json({ error: "Failed to get ticket events" });
  }
}

// POST /api/admin/tickets/:id/messages
export const replyToTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { content, attachments } = req.body;
    const adminId = req.user._id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket || ticket.isDeleted) return res.status(404).json({ error: "Ticket not found" });

    if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: "Message or attachment is required" });
    }

    const msg = await ChatMessage.create({
      ticketId, 
      from: adminId, 
      fromRole: 'admin',
      toRole: ticket.userRole,
      message: content?.trim() || "", 
      attachments: attachments || [],
      messageType: 'message'
    });
    
    await msg.populate("from", "name role");

    const updateData = {
      $inc: { messageCount: 1 },
      lastAdminReplyAt: new Date(),
    };
    
    if (!ticket.firstResponseAt) {
      updateData.firstResponseAt = new Date();
      updateData.status = 'pending';
    }

    await ticket.updateOne(updateData);
    await logEvent(ticket._id, adminId, 'admin', 'message_sent', {});
    
    const io = getIO();
    const room = io.sockets.adapter.rooms.get(`ticket:${ticketId}`);
    const userRoom = io.sockets.adapter.rooms.get(String(ticket.userId));
    
    let isUserActiveInChat = false;
    if (room && userRoom) {
      for (const socketId of room) {
        if (userRoom.has(socketId)) {
          isUserActiveInChat = true;
          break;
        }
      }
    }

    if (!isUserActiveInChat) {
      await createNotification(
        ticket.userId,
        "ticket_reply",
        `Admin replied to ${ticket.ticketNumber}`,
        content?.trim() || "An attachment was shared",
        ticket._id,
        "Ticket",
        { 
          audienceRole: ticket.userRole, 
          category: "chat",
          actionUrl: `/dashboard/support/${ticket._id}`,
          pushWhenInactiveOnly: false
        }
      );
    }
    io.to(`ticket:${ticketId}`).emit('ticket:new-message', msg);
    io.to('admins').emit('ticket:new-message', msg);
    io.to(String(ticket.userId)).emit('ticket:new-message', msg);
    
    if (updateData.status === 'pending') {
      io.to(`ticket:${ticketId}`).emit('ticket:status-changed', { ticketId, status: 'pending' });
      io.to('admins').emit('ticket:status-changed', { ticketId, status: 'pending' });
    }

    return res.status(201).json({ message: msg });
  } catch (err) {
    console.error("admin replyToTicket error", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// POST /api/admin/tickets/:id/notes
export const addInternalNote = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { content } = req.body;
    const adminId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Note content is required" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const note = await ChatMessage.create({
      ticketId, 
      from: adminId, 
      fromRole: 'admin',
      message: content.trim(), 
      messageType: 'note'
    });
    
    await note.populate("from", "name role");

    await logEvent(ticket._id, adminId, 'admin', 'note_added', {});

    const io = getIO();
    // Only emit to admins, NOT to the ticket room to protect note security
    io.to('admins').emit('ticket:new-note', { ticketId, note });

    return res.status(201).json({ note });
  } catch (err) {
    console.error("admin addInternalNote error", err);
    res.status(500).json({ error: "Failed to add note" });
  }
};

// PATCH /api/admin/tickets/:id/status
export const changeStatus = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status: newStatus } = req.body;
    const adminId = req.user._id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (!canTransition(ticket.status, newStatus, 'admin')) {
      return res.status(400).json({
        error: `Cannot change status from ${ticket.status} to ${newStatus}`
      });
    }

    const updateData = { status: newStatus };
    if (newStatus === 'resolved') updateData.resolvedAt = new Date();
    if (newStatus === 'closed') updateData.closedAt = new Date();

    await ticket.updateOne(updateData);
    await logEvent(ticket._id, adminId, 'admin', 'status_changed', {
      from: ticket.status, to: newStatus
    });

    const eventMsg = await ChatMessage.create({
      ticketId, from: adminId, messageType: 'event',
      message: `Ticket marked as ${newStatus} by support agent.`
    });

    await createNotification(
      ticket.userId,
      `ticket_${newStatus}`,
      `Your ticket ${ticket.ticketNumber} is now ${newStatus}`,
      "Check the ticket for more details.",
      ticket._id,
      "Ticket",
      { audienceRole: ticket.userRole, category: "chat" }
    );

    const io = getIO();
    io.to(`ticket:${ticketId}`).emit('ticket:new-message', eventMsg);
    io.to(`ticket:${ticketId}`).emit('ticket:status-changed', { ticketId, status: newStatus });

    return res.json({ success: true, status: newStatus });
  } catch (err) {
    console.error("admin changeStatus error", err);
    res.status(500).json({ error: "Failed to change status" });
  }
};

// PATCH /api/admin/tickets/:id/priority
export const changePriority = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { priority } = req.body;
    const adminId = req.user._id;

    if (!['low','medium','high','urgent'].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }

    const ticket = await Ticket.findByIdAndUpdate(ticketId, { priority });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    await logEvent(ticket._id, adminId, 'admin', 'priority_changed', {
      from: ticket.priority, to: priority
    });
    
    const io = getIO();
    io.to('admins').emit('ticket:updated', { ticketId, priority });

    return res.json({ success: true, priority });
  } catch (err) {
    console.error("admin changePriority error", err);
    res.status(500).json({ error: "Failed to change priority" });
  }
};

// PATCH /api/admin/tickets/:id/assign
export const assignTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { adminId: assignedTo } = req.body; // Can be null to unassign
    const adminId = req.user._id;

    const update = { assignedTo: assignedTo || null };
    const ticket = await Ticket.findByIdAndUpdate(ticketId, update, { new: true }).populate('assignedTo', 'name');
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    await logEvent(ticket._id, adminId, 'admin', assignedTo ? 'assigned' : 'unassigned', {
      adminId: assignedTo, adminName: ticket.assignedTo?.name
    });

    const io = getIO();
    io.to('admins').emit('ticket:updated', { ticketId, assignedTo: ticket.assignedTo });

    return res.json({ success: true, assignedTo: ticket.assignedTo });
  } catch (err) {
    console.error("admin assignTicket error", err);
    res.status(500).json({ error: "Failed to assign ticket" });
  }
};

// POST /api/admin/tickets/:id/reject-reopen
export const rejectReopen = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const adminId = req.user._id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Delete the reopen_request message so it disappears from UI
    await ChatMessage.deleteMany({
      ticketId,
      messageType: 'reopen_request'
    });

    const eventMsg = await ChatMessage.create({
      ticketId, 
      from: adminId, 
      fromRole: 'admin',
      messageType: 'event',
      message: "Ticket reopen request was rejected by admin."
    });

    await logEvent(ticket._id, adminId, 'admin', 'reopen_rejected', {});

    const io = getIO();
    // Notify clients to refresh their chat messages or push the event
    io.to(`ticket:${ticketId}`).emit('ticket:reopen-rejected', eventMsg);
    io.to('admins').emit('ticket:reopen-rejected', eventMsg);

    return res.status(200).json({ message: "Reopen request rejected" });
  } catch (err) {
    console.error("rejectReopen error", err);
    res.status(500).json({ error: "Failed to reject reopen request" });
  }
};

export const searchUsersForTicket = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });
    
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('name email role avatar').limit(10).lean();
    
    res.json({ users });
  } catch (err) {
    console.error("searchUsersForTicket error", err);
    res.status(500).json({ error: "Failed to search users" });
  }
};

export const createTicketForUser = async (req, res) => {
  try {
    const { userId, subject, category, message, attachments } = req.body;
    
    if (!userId || !subject || !category || (!message && (!attachments || attachments.length === 0))) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const counter = await Counter.findByIdAndUpdate(
      'ticket',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const ticketNumber = `TKT-${String(counter.seq).padStart(5, '0')}`;

    const ticket = await Ticket.create({
      ticketNumber,
      subject,
      category,
      userId: targetUser._id,
      userRole: targetUser.role,
      status: 'open',
      source: 'admin',
      assignedTo: req.user._id,
    });

    const formattedMessage = `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}\nSubject: ${subject}\n\nMessage:\n${message?.trim() || "No message provided."}`;

    const chatMsg = await ChatMessage.create({
      ticketId: ticket._id,
      from: req.user._id,
      fromRole: 'admin',
      toRole: targetUser.role,
      message: formattedMessage,
      attachments: attachments || [],
      messageType: 'message',
    });
    
    await chatMsg.populate([{ path: "from", select: "name role avatar" }]);

    await ticket.updateOne({ messageCount: 1, lastUserReplyAt: new Date() });

    await logEvent(ticket._id, req.user._id, req.user.role, 'created', { subject, category, createdFor: targetUser._id });

    const io = getIO();
    io.to('admins').emit('ticket:new', { ticket, message: chatMsg });
    io.to(`user:${targetUser._id}`).emit('ticket:new', { ticket, message: chatMsg });
    
    createNotification(targetUser._id, 'ticket_update', `Admin created a new ticket for you: ${subject}`, `/dashboard/support`);

    return res.status(201).json({ ticket });
  } catch (err) {
    console.error("createTicketForUser error", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
};
