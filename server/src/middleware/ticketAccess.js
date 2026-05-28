import Ticket from "../models/Ticket.js";

export const requireTicketAccess = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket || ticket.isDeleted) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const isOwner = ticket.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    req.ticket = ticket;
    next();
  } catch (err) {
    console.error("requireTicketAccess error", err);
    res.status(500).json({ error: "Server error" });
  }
};
