import mongoose from "mongoose";

const partnerSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    mobile: { 
      type: String, 
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter valid 10 digit mobile number"]
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    adminRemarks: {
      type: String,
      trim: true
    },

    // ✅ NEW: extra lead fields from website "Become a Partner" form
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    profession: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    experienceYears: {
      type: Number
    },
    companyName: {
      type: String,
      trim: true
    }
  },
  { 
    timestamps: true, // ✅ Automatically adds createdAt & updatedAt
    versionKey: false
  }
);

// ✅ Indexes for fast queries
partnerSchema.index({ mobile: 1 });
partnerSchema.index({ createdAt: -1 }); // For sorting by date

export default mongoose.model("Partner", partnerSchema);




// import mongoose from "mongoose";

// console.log("🔥 Partner schema LOADED from:", import.meta.url);

// const partnerSchema = new mongoose.Schema(
//   {
//     fullName: { type: String,  },
//     email: { type: String,  },
//     phone: { type: String,  },
//     city: { type: String,  },
//     state: { type: String,  },
//     profession: { type: String,  },

//     loanTypes: [{ type: String }], // Home loan, Personal loan, Business loan etc.

//     experienceYears: { type: Number, default: 0 },
//     companyName: { type: String },
//     gstNumber: { type: String },

//     status: {
//       type: String,
//       enum: ["Pending", "Approved", "Rejected"],
//       default: "Pending",
//     },

//     adminRemarks: { type: String },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Partner", partnerSchema);


// import mongoose from "mongoose";

// const partnerSchema = new mongoose.Schema(
//   {
//     name: { 
//       type: String, 
//       required: [true, "Name is required"],
//       trim: true,
//       minlength: [3, "Name must be at least 3 characters"],
//       maxlength: [50, "Name cannot exceed 50 characters"]
//     },
//     mobile: { 
//       type: String, 
//       required: [true, "Mobile number is required"],
//       unique: true,
//       trim: true,
//       match: [/^[6-9]\d{9}$/, "Please enter valid 10 digit mobile number"]
//     },
//     isVerified: {
//       type: Boolean,
//       default: false,
//       index: true
//     },
//     verifiedAt: {
//       type: Date,
//       default: null
//     },

//        status: {
//       type: String,
//       enum: ["Pending", "Approved", "Rejected"],
//       default: "Pending",
//     },
    
//   },
//   { 
//     timestamps: true, // ✅ Automatically adds createdAt & updatedAt
//     versionKey: false
//   }
// );

// // ✅ Indexes for fast queries
// partnerSchema.index({ mobile: 1 });
// partnerSchema.index({ createdAt: -1 }); // For sorting by date

// export default mongoose.model("Partner", partnerSchema);

