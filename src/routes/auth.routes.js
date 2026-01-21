// new routes afte tagging add



import express from "express";
import { 
  signup, 
  login, 
  createEmployee, 
  createPartner,
  getAllEmployees, 
  getAllUsers, 
  getPartnerById,
  deleteUserByAdmin,
  sendForgetPasswordOTP,
  verifyForgetPasswordOTP,
  resetPassword,
  getUserProfile,
  getEmployeesForDropdown,      // ✅ NEW
  updatePartnerTagging,           // ✅ NEW
  getPartnersByEmployee,          // ✅ NEW
  getPartnersByManager            // ✅ NEW
} from "../controllers/auth.controller.js";
import { verifyAdmin, protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Authentication
router.post("/signup", signup);
router.post("/login", login);

// Forget Password Flow (3 steps)
router.post("/forget-password/send-otp", sendForgetPasswordOTP);
router.post("/forget-password/verify-otp", verifyForgetPasswordOTP);
router.post("/forget-password/reset", resetPassword);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get user profile
router.get("/profile/:id", protect, getPartnerById);
router.get("/user/profile/:id", protect, getUserProfile);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// User Management
router.get("/getUser", protect, verifyAdmin, getAllUsers);
router.delete("/delete-user/:id", protect, verifyAdmin, deleteUserByAdmin);

// Employee Management
router.get("/employees", protect, verifyAdmin, getAllEmployees);
router.post("/employees", protect, verifyAdmin, createEmployee);

// ✅ NEW: Get Employees for Dropdown (for partner creation form)
router.get("/employees/dropdown", protect, verifyAdmin, getEmployeesForDropdown);

// Partner Management
router.post("/partners", protect, verifyAdmin, createPartner);

// ✅ NEW: Partner Tagging Management
router.put("/partners/:partnerId/tagging", protect, verifyAdmin, updatePartnerTagging);

// ✅ NEW: Get Partners by Employee
router.get("/employees/:employeeId/partners", protect, getPartnersByEmployee);

// ✅ NEW: Get Partners by Manager  
router.get("/managers/:managerId/partners", protect, getPartnersByManager);

export default router;














// import express from "express";
// import { 
//   signup, 
//   login, 
//   createEmployee, 
//   createPartner,
//   getAllEmployees, 
//   getAllUsers, 
//   getPartnerById,
//   deleteUserByAdmin,
//   sendForgetPasswordOTP,
//   verifyForgetPasswordOTP,
//   resetPassword,
//   getUserProfile
// } from "../controllers/auth.controller.js";
// import { verifyAdmin, protect } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// // ============================================
// // PUBLIC ROUTES (No authentication required)
// // ============================================

// // Authentication
// router.post("/signup", signup);
// router.post("/login", login);

// // Forget Password Flow (3 steps)
// router.post("/forget-password/send-otp", sendForgetPasswordOTP);
// router.post("/forget-password/verify-otp", verifyForgetPasswordOTP);
// router.post("/forget-password/reset", resetPassword);

// // ============================================
// // PROTECTED ROUTES (Authentication required)
// // ============================================

// // Get user profile
// router.get("/profile/:id", protect, getPartnerById);

// // ============================================
// // ADMIN ONLY ROUTES
// // ============================================

// // User Management
// router.get("/getUser", protect, verifyAdmin, getAllUsers);
// router.delete("/delete-user/:id", protect, verifyAdmin, deleteUserByAdmin);

// // Employee Management
// router.get("/employees", protect, verifyAdmin, getAllEmployees);
// router.post("/employees", protect, verifyAdmin, createEmployee);

// // Partner Management
// router.post("/partners", protect, verifyAdmin, createPartner);


// // ✅ NEW: User Profile Route (Works for all roles)
// // User can get their own profile, Admin can get any user's profile
// router.get("/user/profile/:id", protect, getUserProfile);




// export default router;






