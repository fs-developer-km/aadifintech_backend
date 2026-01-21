import mongoose from "mongoose";

const partnerLeadSchema = new mongoose.Schema(
  {
    // Basic Lead Info
    customerName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    customerMobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?\d{10,15}$/, "Please enter valid phone number"],
      index: true
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    
    // Loan Details
    loanType: {
      type: String,
      required: true,
      enum: ["Personal Loan", "Home Loan", "Business Loan", "Car Loan", "Education Loan", "Gold Loan", "Other"],
      default: "Personal Loan"
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 0
    },
    monthlyIncome: {
      type: Number,
      min: 0
    },
    employmentType: {
      type: String,
      enum: ["Salaried", "Self-Employed", "Business", "Professional", "Other"],
      default: "Salaried"
    },
    
    // Partner Info - ✅ CHANGED: Now points to User model directly
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",  // ✅ Direct User reference (partner)
      required: true,
      index: true
    },
    partnerName: {
      type: String,
      required: true
    },
    
    // Assignment
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    assignedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    
    // Status Management
    status: {
      type: String,
      enum: ["pending", "in-progress", "documents-pending", "approved", "disbursed", "rejected", "cancelled"],
      default: "pending",
      index: true
    },
    subStatus: {
      type: String,
      enum: ["fresh", "follow-up", "callback", "meeting-scheduled", "documentation", "verification", "bank-processing", "final-approval"],
      default: "fresh"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    
    // Remarks & History
    remarks: [{
      message: { type: String, required: true },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      addedByName: { type: String, required: true },
      addedByRole: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
    
    statusHistory: [{
      status: { type: String, required: true },
      subStatus: { type: String },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      updatedByName: { type: String, required: true },
      remark: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    
    // Follow-up
    nextFollowUpDate: {
      type: Date,
      index: true
    },
    lastFollowUpDate: {
      type: Date
    },
    
    // Documents
    documentsSubmitted: {
      type: Boolean,
      default: false
    },
    documentsList: [{
      name: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Banking Specific
    bankName: {
      type: String,
      trim: true
    },
    applicationNumber: {
      type: String,
      trim: true,
      sparse: true,
      unique: true
    },
    sanctionedAmount: {
      type: Number,
      min: 0
    },
    disbursementDate: {
      type: Date
    },
    interestRate: {
      type: Number,
      min: 0
    },
    tenure: {
      type: Number,
      min: 0
    },
    
    // Timestamps
    submittedDate: { type: String },
    submittedTime: { type: String },
    
    // Flags
    isArchived: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
partnerLeadSchema.index({ submittedBy: 1, createdAt: -1 });
partnerLeadSchema.index({ assignedEmployee: 1, status: 1 });
partnerLeadSchema.index({ assignedManager: 1, status: 1 });
partnerLeadSchema.index({ status: 1, priority: 1, createdAt: -1 });
partnerLeadSchema.index({ nextFollowUpDate: 1 });

// Compound index for common queries
partnerLeadSchema.index({ 
  assignedEmployee: 1, 
  status: 1, 
  isArchived: 1,
  isDeleted: 1 
});

export default mongoose.model("PartnerLead", partnerLeadSchema);