import express from "express";
import {
  createPartnerLead,
  getPartnerLeads,
  getPartnerLeadById,
  getAssignedLeads,
  updateLeadStatus,
  addRemarkToLead,
  getLeadById,
  getEmployeeDashboardStats
} from "../controllers/partnerLead.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ==================== PARTNER ROUTES ====================
// All partner routes require authentication
router.use(protect);

// Create new lead (Partner only)
router.post("/partner/create", createPartnerLead);

// Get partner's own leads with pagination & filters
router.get("/partner/my-leads", getPartnerLeads);

// Get single lead details (Partner)
router.get("/partner/:id", getPartnerLeadById);

// ==================== EMPLOYEE/MANAGER ROUTES ====================

// Get assigned leads with filters & pagination
router.get("/employee/assigned", getAssignedLeads);

// Get single lead details (Employee/Manager)
router.get("/employee/:id", getLeadById);

// Update lead status & details
router.put("/employee/:id/status", updateLeadStatus);

// Add remark to lead (Available to Partner, Employee, Manager)
router.post("/:id/remark", addRemarkToLead);

// Get dashboard stats
router.get("/employee/dashboard/stats", getEmployeeDashboardStats);

export default router;