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
    submittedDate: { type: String },
    submittedTime: { type: String },
    leadSource: { type: String, default: "Website" },
    notes: { type: String, default: "New inquiry from popup form" },
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
    