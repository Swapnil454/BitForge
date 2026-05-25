import mongoose from "mongoose";
import User from "./src/models/User.js";
import ChatMessage from "./src/models/ChatMessage.js";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://Swapnil:Swapnil8888@cluster0.n16t52s.mongodb.net/contentSellify");
    
    const adminId = new mongoose.Types.ObjectId("6975ba7ea1c93aaca18c7104"); // Just for testing
    
    const pipeline = [
      { $match: { role: { $ne: "admin" } } },
      {
        $lookup: {
          from: "chatmessages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ["$from", "$$userId"] }, { $eq: ["$toRole", "admin"] }] },
                    { $and: [{ $eq: ["$to", "$$userId"] }, { $eq: ["$fromRole", "admin"] }] }
                  ]
                },
                status: { $ne: "placeholderDeleted" }
              }
            },
            { $sort: { createdAt: -1 } },
          ],
          as: "chats"
        }
      },
      {
        $project: {
          userId: "$_id",
          name: 1,
          role: 1,
          email: 1,
          createdAt: 1,
          lastMessage: { $arrayElemAt: ["$chats", 0] },
          unreadCount: {
            $size: {
              $filter: {
                input: "$chats",
                as: "chat",
                cond: {
                  $and: [
                    { $eq: ["$$chat.toRole", "admin"] },
                    { $not: { $in: [adminId, { $ifNull: ["$$chat.readBy", []] }] } }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          name: 1,
          role: 1,
          email: 1,
          lastMessageAt: { $ifNull: ["$lastMessage.createdAt", "$createdAt"] },
          lastIncomingMessage: "$lastMessage.message",
          lastIncomingAttachments: "$lastMessage.attachments",
          lastIncomingAt: "$lastMessage.createdAt",
          lastIncomingStatus: "$lastMessage.status",
          lastIncomingIsDeleted: "$lastMessage.isDeleted",
          unreadCount: 1
        }
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 10 }
    ];

    const results = await User.aggregate(pipeline);
    console.log(JSON.stringify(results, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
