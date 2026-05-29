import mongoose from "mongoose";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ChatMessage from "../src/models/ChatMessage.js";
import Ticket from "../src/models/Ticket.js";
import User from "../src/models/User.js";
import Counter from "../src/models/Counter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

async function getNextTicketNumber() {
  const counter = await Counter.findByIdAndUpdate(
    'ticket',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `TKT-${String(counter.seq).padStart(5, '0')}`;
}

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for migration");

    // Get all unique users who have engaged in chat (excluding admins)
    const threads = await ChatMessage.aggregate([
      {
        $group: {
          _id: {
            $cond: {
              if: { $in: ["$fromRole", ["admin", "system"]] },
              then: "$to",
              else: "$from"
            }
          }
        }
      }
    ]);

    let migratedCount = 0;
    
    for (const { _id: userId } of threads) {
      if (!userId) continue;

      const user = await User.findById(userId);
      if (!user) continue;

      // Find all messages involving this user
      const messages = await ChatMessage.find({
        $or: [
          { from: userId },
          { to: userId }
        ],
        ticketId: { $exists: false } // only migrate those without ticketId
      }).sort({ createdAt: 1 });

      if (!messages.length) continue;

      const ticketNumber = await getNextTicketNumber();
      
      const ticket = await Ticket.create({
        ticketNumber,
        subject: 'Migrated Conversation',
        category: 'other',
        userId,
        userRole: user.role,
        status: 'resolved', // Mark migrated old threads as resolved by default to keep open tickets clean
        source: 'user',
        createdAt: messages[0].createdAt,
        messageCount: messages.length,
        lastUserReplyAt: messages[messages.length - 1].createdAt,
      });

      // Attach all messages to this ticket
      await ChatMessage.updateMany(
        { _id: { $in: messages.map(m => m._id) } },
        { $set: { ticketId: ticket._id, messageType: 'message' } }
      );
      
      migratedCount++;
    }

    console.log(`Migration complete. Created ${migratedCount} tickets.`);
    
    // Verify integrity
    const unmigrated = await ChatMessage.countDocuments({ ticketId: { $exists: false } });
    console.log(`Unmigrated messages remaining: ${unmigrated}`);
    if (unmigrated > 0) {
      console.warn("WARNING: Some messages were not migrated!");
    } else {
      console.log("SUCCESS: All messages migrated successfully.");
    }
    
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
