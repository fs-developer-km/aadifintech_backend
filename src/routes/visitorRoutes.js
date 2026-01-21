import express from "express";
import { trackVisitor, getAllVisitors } from "../controllers/visitorController.js";

const router = express.Router();

router.post("/create", trackVisitor);
router.get("/all", getAllVisitors);

export default router;
