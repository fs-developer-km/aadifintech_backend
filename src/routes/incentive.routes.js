// src/routes/incentive.routes.js
import express from "express";
import {
  calculateIncentive,
  getMyIncentives,
  getIncentiveById,
  getAllIncentives,
  updateIncentive,
  approveIncentive,
  rejectIncentive,
  markIncentiveAsPaid,
  getIncentiveStats,
  deleteIncentive
} from "../controllers/incentive.controller.js";
import { protect, verifyAdmin, verifyEmployee, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();


// =============================================
// 👨‍💼 EMPLOYEE ROUTES
// =============================================

// Calculate/view incentive (employee can calculate for themselves)
router.post("/calculate", protect, verifyEmployee, calculateIncentive);

// Get my incentives
router.get("/my-incentives", protect, verifyEmployee, getMyIncentives);

// Get single incentive by ID
router.get("/:incentiveId", protect, verifyEmployee, getIncentiveById);

// =============================================
// 🔐 ADMIN ROUTES
// =============================================

// Get all incentives (with filters)
router.get("/admin/all", protect, verifyAdmin, getAllIncentives);

// Get statistics
router.get("/admin/stats", protect, verifyAdmin, getIncentiveStats);

// Calculate incentive for any employee
router.post("/admin/calculate", protect, verifyAdmin, calculateIncentive);

// Update incentive details
router.patch("/admin/:incentiveId", protect, verifyAdmin, updateIncentive);

// Approve incentive
router.patch("/admin/:incentiveId/approve", protect, verifyAdmin, approveIncentive);

// Reject incentive
router.patch("/admin/:incentiveId/reject", protect, verifyAdmin, rejectIncentive);

// Mark as paid
router.patch("/admin/:incentiveId/mark-paid", protect, verifyAdmin, markIncentiveAsPaid);

// Delete incentive
router.delete("/admin/:incentiveId", protect, verifyAdmin, deleteIncentive);

export default router;