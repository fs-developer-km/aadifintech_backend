// src/models/conveyance.model.js
import mongoose from "mongoose";
import { calculateConveyanceAmount } from "../config/conveyanceRates.js";

const conveyanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    employeeName: {
      type: String,
      required: true
    },
    employeeMobile: {
      type: String,
      required: true
    },
    month: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    entries: [
      {
        date: {
          type: Date,
          required: true
        },
        fromLocation: {
          type: String,
          required: true,
          trim: true
        },
        toLocation: {
          type: String,
          required: true,
          trim: true
        },
        distance: {
          type: Number,
          required: true,
          min: 0
        },
        mode: {
          type: String,
          enum: ["bike", "car", "auto", "taxi", "public_transport", "own_vehicle"],
          required: true
        },
        ratePerKm: {
          type: Number,
          default: 0
        },
        amount: {
          type: Number,
          default: 0
          // 👆 ab client se nahi aata, auto-calculate hota hai neeche pre-save me
        },
        purpose: {
          type: String,
          required: true,
          trim: true
        },
        remarks: {
          type: String,
          trim: true
        }
      }
    ],
    totalDistance: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "paid"],
      default: "draft"
    },
    submittedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    adminRemarks: { type: String }
  },
  { timestamps: true }
);

conveyanceSchema.index({ employeeId: 1, month: 1 });
conveyanceSchema.index({ status: 1 });

// 🔥 Har entry ka amount + rate auto-calculate, phir total sum
conveyanceSchema.pre("save", function (next) {
  if (this.entries && this.entries.length > 0) {
    this.entries.forEach(entry => {
      const { amount, ratePerKm } = calculateConveyanceAmount(entry.mode, entry.distance);
      entry.amount = amount;
      entry.ratePerKm = ratePerKm;
    });

    this.totalDistance = this.entries.reduce((sum, e) => sum + e.distance, 0);
    this.totalAmount = this.entries.reduce((sum, e) => sum + e.amount, 0);
  }
  next();
});

const Conveyance = mongoose.model("Conveyance", conveyanceSchema);
export default Conveyance;