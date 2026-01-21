import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  visitorId: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  pageVisited: { type: String },
  visitDate: { type: Date, default: Date.now },
  sessionDuration: { type: Number, default: 0 }
}, { timestamps: true });

export const Visitor = mongoose.model("Visitor", visitorSchema);
