// src/middlewares/rateLimit.middleware.js
import rateLimit from "express-rate-limit";

// ✅ 1️⃣ General API rate limit (for all users)
export const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // ⏱ 10 minutes window
  max: 200, // ⚙️ Max 200 requests per 10 minutes
  standardHeaders: true, // ✅ return rate limit info in headers
  legacyHeaders: false,  // ❌ disable old headers
  message: {
    success: false,
    msg: "Too many requests, please try again after 10 minutes.",
  },
});

// ✅ 2️⃣ Auth-specific rate limit (for login/signup)
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // ⏱ 5 minutes
  max: 5, // ⚙️ Allow only 5 login/signup attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    msg: "Too many attempts! Try again in 5 minutes.",
  },
});
