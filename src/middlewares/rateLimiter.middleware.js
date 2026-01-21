import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    msg: "Too many requests from this IP, please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for lead creation (Partner)
export const leadCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 lead submissions per hour per partner
  message: {
    success: false,
    msg: "Lead creation limit exceeded. Maximum 50 leads per hour allowed."
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: {
    success: false,
    msg: "Too many login attempts, please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Status update limiter (prevent spam updates)
export const statusUpdateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 updates per minute
  message: {
    success: false,
    msg: "Too many status updates, please slow down"
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});