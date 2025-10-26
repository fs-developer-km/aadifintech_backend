import express from "express";
import { createLead, getLeads } from "../controllers/lead.controller.js";

const router = express.Router();

// POST -> create lead
router.post("/create", createLead);

// GET -> fetch all leads
router.get("/list", getLeads);

export default router;
