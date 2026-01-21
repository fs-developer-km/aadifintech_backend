import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    otp: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ["forget-password", "signup", "login"],
      default: "forget-password"
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => Date.now() + 5 * 60 * 1000, // 5 minutes
      index: true
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3
    }
  },
  { 
    timestamps: true,
    versionKey: false
  }
);

// ✅ Auto delete expired OTPs after 10 minutes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

// ✅ Compound index for faster queries
otpSchema.index({ mobile: 1, purpose: 1 });

export default mongoose.model("OTP", otpSchema);