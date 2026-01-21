// src/routes/conveyance.routes.js
import express from "express";
import {
  createOrUpdateConveyance,
  submitConveyance,
  getMyConveyances,
  getConveyanceById,
  deleteConveyance,
  getAllConveyances,
  approveConveyance,
  rejectConveyance,
  markConveyanceAsPaid,
  getConveyanceStats
} from "../controllers/conveyance.controller.js";
import { protect, verifyAdmin, verifyEmployee } from "../middlewares/auth.middleware.js";

const router = express.Router();

// =============================================
// 👨‍💼 EMPLOYEE ROUTES
// =============================================

// Create or update conveyance (draft)
router.post("/", protect, verifyEmployee, createOrUpdateConveyance);

// Submit conveyance for approval
router.patch("/:conveyanceId/submit", protect, verifyEmployee, submitConveyance);

// Get my conveyances
router.get("/my-conveyances", protect, verifyEmployee, getMyConveyances);

// Get single conveyance by ID
router.get("/:conveyanceId", protect, verifyEmployee, getConveyanceById);

// Delete conveyance (only draft)
router.delete("/:conveyanceId", protect, verifyEmployee, deleteConveyance);

// =============================================
// 🔐 ADMIN ROUTES
// =============================================

// Get all conveyances (with filters)
router.get("/admin/all", protect, verifyAdmin, getAllConveyances);

// Get statistics
router.get("/admin/stats", protect, verifyAdmin, getConveyanceStats);

// Approve conveyance
router.patch("/admin/:conveyanceId/approve", protect, verifyAdmin, approveConveyance);

// Reject conveyance
router.patch("/admin/:conveyanceId/reject", protect, verifyAdmin, rejectConveyance);

// Mark as paid
router.patch("/admin/:conveyanceId/mark-paid", protect, verifyAdmin, markConveyanceAsPaid);

export default router;