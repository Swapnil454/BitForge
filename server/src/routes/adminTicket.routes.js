import express from "express";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import {
  listAllTickets,
  getTicketStats,
  getTicketDetails,
  getTicketEvents,
  replyToTicket,
  addInternalNote,
  changeStatus,
  changePriority,
  assignTicket,
  rejectReopen,
  searchUsersForTicket,
  createTicketForUser
} from "../controllers/adminTicket.controller.js";

const router = express.Router();

// All routes here require admin access
router.use(authMiddleware, requireRole(["admin"]));

router.get("/", listAllTickets);
router.get("/stats", getTicketStats);
router.get("/users/search", searchUsersForTicket);
router.post("/create-for-user", createTicketForUser);
router.get("/:id", getTicketDetails);
router.get("/:id/events", getTicketEvents);
router.post("/:id/messages", replyToTicket);
router.post("/:id/notes", addInternalNote);
router.patch("/:id/status", changeStatus);
router.patch("/:id/priority", changePriority);
router.patch("/:id/assign", assignTicket);
router.post("/:id/reject-reopen", rejectReopen);

export default router;
