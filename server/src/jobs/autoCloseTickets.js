import cron from 'node-cron';
import Ticket from '../models/Ticket.js';
import ChatMessage from '../models/ChatMessage.js';
import { logEvent } from '../controllers/ticket.controller.js';
import { createNotification } from '../controllers/notification.controller.js';

export const startTicketAutoCloseJob = () => {
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

      const tickets = await Ticket.find({
        status: { $ne: 'closed' },
        updatedAt: { $lt: cutoff },
        isDeleted: false
      });

      for (const ticket of tickets) {
        await ticket.updateOne({
          status: 'closed',
          closedAt: new Date()
        });
        
        await logEvent(ticket._id, null, 'system', 'auto_closed', {
          reason: '72h_no_user_reply'
        });
        
        await ChatMessage.create({
          ticketId: ticket._id, 
          messageType: 'event',
          message: 'Ticket automatically closed after 72 hours of inactivity.'
        });
        
        await createNotification(
          ticket.userId, 
          'ticket_auto_closed', 
          `Ticket ${ticket.ticketNumber} was automatically closed due to inactivity.`, 
          'Check the ticket for more details.',
          ticket._id,
          'Ticket',
          { audienceRole: ticket.userRole, category: 'chat' }
        );
      }

      if (tickets.length > 0) {
        console.log(`Auto-closed ${tickets.length} resolved tickets`);
      }
    } catch (err) {
      console.error("AutoCloseTickets Job Error:", err);
    }
  });
};
