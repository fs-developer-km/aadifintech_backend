// src/models/conveyance.model.js
import mongoose from "mongoose";

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
      required: true // Format: "YYYY-MM" (e.g., "2025-01")
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
        amount: {
          type: Number,
          required: true,
          min: 0
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
    submittedAt: {
      type: Date
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    adminRemarks: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
conveyanceSchema.index({ employeeId: 1, month: 1 });
conveyanceSchema.index({ status: 1 });

// Calculate totals before saving
conveyanceSchema.pre("save", function (next) {
  if (this.entries && this.entries.length > 0) {
    this.totalDistance = this.entries.reduce((sum, entry) => sum + entry.distance, 0);
    this.totalAmount = this.entries.reduce((sum, entry) => sum + entry.amount, 0);
  }
  next();
});

const Conveyance = mongoose.model("Conveyance", conveyanceSchema);

export default Conveyance;