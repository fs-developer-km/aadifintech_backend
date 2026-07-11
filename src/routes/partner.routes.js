// ==========================================
// 5. ROUTES - routes/partner.routes.js
// ==========================================
import express from 'express';
import {
  sendOTP,
  verifyOTPAndRegister,
  resendOTP,
  getAllPartners,
  getPartnerById,
  deletePartner,
  getPartnerStats,
  updatePartnerStatus,
   registerPartnerDirect, 
} from '../controllers/partner.controller.js';

const router = express.Router();

// ✅ Public Routes (Partner Registration)
router.post('/send-otp', sendOTP);
router.post('/verify-register', verifyOTPAndRegister);
router.post('/resend-otp', resendOTP);

router.post('/register', registerPartnerDirect); 

// ✅ Admin Routes (Add auth middleware in production)
router.get('/partners', getAllPartners);
router.get('/partners/stats', getPartnerStats);
router.get('/partners/:id', getPartnerById);
router.delete('/partners/:id', deletePartner);
router.put('/partners/:id', updatePartnerStatus);

export default router;












// otp add therefore commentts this section


// import express from "express";
// import {
//   createPartner,
//   getAllPartners,
//   updatePartnerStatus,
//   deletePartner,
//   // getPartnerById
// } from "../controllers/partner.controller.js";

// const router = express.Router();

// // Public Form Submission
// router.post("/partners", createPartner);

// // Admin: Get List
// router.get("/partners", getAllPartners);

// // Admin: Update Status (approve/reject)
// router.put("/partners/:id", updatePartnerStatus);

// // DELETE a Partner
// router.delete("/partners/:id", deletePartner);

// // router.get("/partners/:id", getPartnerById);


// export default router;
