// src/server.js
import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

// ✅ Connect Database
connectDB();

// ✅ Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT} [${process.env.NODE_ENV}]`);
});

// ✅ Handle unhandled errors
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
