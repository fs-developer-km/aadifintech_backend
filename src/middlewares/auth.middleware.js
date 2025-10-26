// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, msg: "Unauthorized - Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, msg: "Invalid or expired token" });
  }
};

// ✅ Role-based access (only admin)
export const isAdmin = (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, msg: "Access denied: Admins only" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Server error in role check" });
  }
};
