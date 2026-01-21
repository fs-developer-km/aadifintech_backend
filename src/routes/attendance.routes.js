// src/routes/attendance.routes.js
import express from 'express';
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getMonthlySummary,
  requestLeave,
  getMyLeaveRequests,
  getAllTodayAttendance,
  getEmployeeAttendance,
  getAttendanceByDateRange,
  getMonthlyReport,
  manageLeaveRequest,
  getAllLeaveRequests,
  manualAttendanceEntry,
  getAttendanceStatistics
} from '../controllers/attendanceController.js';

import { 
  protect, 
  verifyEmployee, 
  verifyAdmin,
  authorizeRoles 
} from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==================== EMPLOYEE ROUTES ====================
// All employee routes require authentication + employee role

// Check-in (POST /api/attendance/check-in)
router.post('/check-in', protect, verifyEmployee, checkIn);

// Check-out (POST /api/attendance/check-out)
router.post('/check-out', protect, verifyEmployee, checkOut);

// Get today's attendance status (GET /api/attendance/today)
router.get('/today', protect, verifyEmployee, getTodayAttendance);

// Get my attendance history (GET /api/attendance/my-attendance)
router.get('/my-attendance', protect, verifyEmployee, getMyAttendance);

// Get monthly summary (GET /api/attendance/monthly-summary)
router.get('/monthly-summary', protect, verifyEmployee, getMonthlySummary);

// Request leave (POST /api/attendance/leave-request)
router.post('/leave-request', protect, verifyEmployee, requestLeave);

// Get my leave requests (GET /api/attendance/my-leave-requests)
router.get('/my-leave-requests', protect, verifyEmployee, getMyLeaveRequests);

// ==================== ADMIN ROUTES ====================
// All admin routes require admin role

// Get all today's attendance (GET /api/attendance/admin/today)
router.get('/admin/today', protect, verifyAdmin, getAllTodayAttendance);

// Get specific employee attendance (GET /api/attendance/admin/employee/:employeeId)
router.get('/admin/employee/:employeeId', protect, verifyAdmin, getEmployeeAttendance);

// Get attendance by date range (GET /api/attendance/admin/date-range)
router.get('/admin/date-range', protect, verifyAdmin, getAttendanceByDateRange);

// Get monthly report (GET /api/attendance/admin/monthly-report)
router.get('/admin/monthly-report', protect, verifyAdmin, getMonthlyReport);

// Approve/Reject leave request (PUT /api/attendance/admin/leave/:leaveRequestId)
router.put('/admin/leave/:leaveRequestId', protect, verifyAdmin, manageLeaveRequest);

// Get all leave requests (GET /api/attendance/admin/leave-requests)
router.get('/admin/leave-requests', protect, verifyAdmin, getAllLeaveRequests);

// Manual attendance entry (POST /api/attendance/admin/manual-entry)
router.post('/admin/manual-entry', protect, verifyAdmin, manualAttendanceEntry);

// Get attendance statistics (GET /api/attendance/admin/statistics)
router.get('/admin/statistics', protect, verifyAdmin, getAttendanceStatistics);

export default router;