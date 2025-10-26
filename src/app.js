// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import leadRoutes from "./routes/lead.routes.js"
import cookiesRoutes from "./routes/visitorRoutes.js"

const app = express();

// ✅ Security Headers (prevents XSS, clickjacking, etc.)
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images/fonts from CDN
}));

// ✅ Enable CORS (allow frontend only)
app.use(cors({
  origin: ["http://localhost:4200", "https://aadifintechh.netlify.app"], // angular origin
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ✅ Parse JSON body (10kb limit for safety)
app.use(express.json({ limit: "10kb" }));

// ✅ Response compression (makes APIs super fast)
app.use(compression());

// ✅ Request logging in dev mode only
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ✅ Rate limiter (protect from brute-force attacks)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 200, // 200 requests per 10 minutes
  message: { success: false, msg: "Too many requests, try again later" },
});
app.use(limiter);

// ✅ Base Routes
app.use("/api/auth", authRoutes);
app.use("/api/lead", leadRoutes);
app.use("/api/visitor", cookiesRoutes);

// ✅ Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, msg: "API route not found" });
});

export default app;
