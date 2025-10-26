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
    name: { type: String, required: true, trim: true, minlength: 2 },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      match: [/^\+?\d{10,15}$/, "Please provide a valid mobile number"]
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    // ✅ NEW FIELDS (auto managed by backend)
    signupDate: { type: Date, default: Date.now },
    lastLoginDate: { type: Date, default: null },
    lastLoginTime: { type: String, default: null },
    loginCount: { type: Number, default: 0 },
    accountStatus: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active"
    }
  },
  { timestamps: true }
);

// For faster lookup
userSchema.index({ mobile: 1 });

export default mongoose.model("User", userSchema);
