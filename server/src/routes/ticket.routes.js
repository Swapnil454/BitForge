import express from "express";
import authMiddleware from "../middleware/auth.js";
import { requireTicketAccess } from "../middleware/ticketAccess.js";
import {
  getCategories,
  createTicket,
  listMyTickets,
  getTicket,
  sendMessage,
  requestReopenTicket,
  cancelReopenTicket
} from "../controllers/ticket.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/categories", getCategories);
router.post("/", createTicket);
router.get("/", listMyTickets);
router.get("/:id", requireTicketAccess, getTicket);
router.post("/:id/messages", requireTicketAccess, sendMessage);
router.post("/:id/request-reopen", requireTicketAccess, requestReopenTicket);
router.delete("/:id/cancel-reopen", requireTicketAccess, cancelReopenTicket);

export default router;
