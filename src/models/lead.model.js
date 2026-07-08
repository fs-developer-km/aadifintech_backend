// import mongoose from "mongoose";

// const leadSchema = new mongoose.Schema(
//   {
//     leadName: { type: String, required: true, trim: true },
//     leadPhone: {
//       type: String,
//       required: true,
//       trim: true,
//       match: [/^\+?\d{10,15}$/, "Please enter valid phone number"],
//     },
//     submittedDate: { type: String },
//     submittedTime: { type: String },
//     leadSource: { type: String, default: "Website" },
//     notes: { type: String, default: "New inquiry from popup form" },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Lead", leadSchema);


// lead assign to employee 


import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    leadName: { type: String, required: true, trim: true },

    leadPhone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?\d{10,15}$/, "Please enter valid phone number"],
    },
    status: {
      type: String,
      enum: ["pending", "success"],
      default: "pending"
    },


    submittedDate: { type: String },
    submittedTime: { type: String },

    leadSource: { type: String, default: "Website" },
    notes: { type: String, default: "New inquiry" },

    assignmentHistory: [
      {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        employeeName: String,
        assignedDate: String,
        status: { type: String, enum: ["pending", "completed"], default: "pending" },
        completedDate: String
      }
    ],

    // ⭐ NEW FIELD — Employee ID jisko lead assign hogi
    assignTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",   // employee bhi user model me hi stored hai
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
