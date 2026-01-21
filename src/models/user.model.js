// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true, minlength: 2 },
//     mobile: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       index: true,
//       match: [/^\+?\d{10,15}$/, "Please provide a valid mobile number"]
//     },
//     password: { type: String, required: true },
//     role: {
//       type: String,
//       enum: ["user", "admin"],    
//       default: "user"             
//     }
//   },
//   { timestamps: true }
// );

// userSchema.index({ mobile: 1 });

// export default mongoose.model("User", userSchema);


// new code for update login time date and count

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      trim: true, 
      minlength: 2 
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      match: [/^\+?\d{10,15}$/, "Please provide a valid mobile number"],
    },

    password: { 
      type: String, 
      required: true 
    },

    role: {
      type: String,
      enum: ["user", "admin", "employee", "partner"],
      default: "user"
    },

    // ===============================
    // 🔵 Common System Fields
    // ===============================
    signupDate: { 
      type: Date, 
      default: Date.now 
    },
    lastLoginDate: { 
      type: Date, 
      default: null 
    },
    lastLoginTime: { 
      type: String, 
      default: null 
    },
    loginCount: { 
      type: Number, 
      default: 0 
    },
    accountStatus: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    // ===============================
    // 🔶 EMPLOYEE EXTRA FIELDS
    // ===============================
    employeeCode: { 
      type: String, 
      default: null 
    },
    department: { 
      type: String, 
      default: null 
    },
    designation: { 
      type: String, 
      default: null 
    },
    reportingTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    },
    allowedPermissions: { 
      type: Array, 
      default: [] 
    },

    // ===============================
    // 🟣 PARTNER EXTRA FIELDS
    // ===============================
    companyName: { 
      type: String, 
      default: null 
    },
    businessType: { 
      type: String, 
      default: null 
    },
    commissionType: { 
      type: String, 
      enum: ["fixed", "percent"], 
      default: null 
    },
    commissionValue: { 
      type: Number, 
      default: null 
    },
    gstNumber: { 
      type: String, 
      default: null 
    },
    address: { 
      type: String, 
      default: null 
    },

    // ✅ NEW: Partner Tagging System
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    assignedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

// Index for faster lookups
userSchema.index({ mobile: 1 });
userSchema.index({ role: 1 });

export default mongoose.model("User", userSchema);

