import express from "express"; // ✅ must have
import { signup, login , getAllUsers} from "../controllers/auth.controller.js";
// import { createAdmin } from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/getUser", getAllUsers);

// router.post("/create-admin", createAdmin); // optional route for manual admin creation

export default router;
