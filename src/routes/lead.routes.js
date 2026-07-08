import express from "express";
import { createLead, getLeads, assignLead , deleteLead , getLeadsss, updateLeadStatus} from "../controllers/lead.controller.js";
import { verifyAdmin,protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// POST -> create lead
router.post("/create", createLead);

// GET -> fetch all leads
router.get("/list", protect, getLeads);
router.get("/lists", getLeadsss);

// PUT assign lead to employee


// router.put("/assign/:id", assignLead);

router.put("/assign/:id", protect, verifyAdmin, assignLead);

// delete api 


router.delete("/delete/:id",  protect ,verifyAdmin, deleteLead);

// actioon update

router.put("/update-status/:id", protect, updateLeadStatus);



export default router;
