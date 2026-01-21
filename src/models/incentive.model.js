// src/models/incentive.model.js
import mongoose from "mongoose";


const incentiveSchema = new mongoose.Schema(

  
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
      required: true // Format: "YYYY-MM"
    },
    year: {
      type: Number,
      required: true
    },
    // Loan Performance Metrics
    loanMetrics: {
      totalLoans: {
        type: Number,
        default: 0
      },
      approvedLoans: {
        type: Number,
        default: 0
      },
      disbursedLoans: {
        type: Number,
        default: 0
      },
      totalDisbursedAmount: {
        type: Number,
        default: 0
      },
      conversionRate: {
        type: Number,
        default: 0 // Percentage
      }
    },
    // Incentive Calculation
    incentiveBreakdown: {
      perLoanIncentive: {
        type: Number,
        default: 0
      },
      performanceBonus: {
        type: Number,
        default: 0
      },
      targetAchievementBonus: {
        type: Number,
        default: 0
      },
      qualityBonus: {
        type: Number,
        default: 0
      },
      penalties: {
        type: Number,
        default: 0
      }
    },
    // Targets
    targets: {
      loanTarget: {
        type: Number,
        default: 0
      },
      amountTarget: {
        type: Number,
        default: 0
      },
      achievedPercentage: {
        type: Number,
        default: 0
      }
    },
    // Final Calculation
    grossIncentive: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netIncentive: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["draft", "calculated", "approved", "rejected", "paid"],
      default: "draft"
    },
    calculatedAt: {
      type: Date
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvedAt: {
      type: Date
    },
    paidAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    adminRemarks: {
      type: String
    },
    paymentReference: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes
incentiveSchema.index({ employeeId: 1, month: 1 });
incentiveSchema.index({ status: 1 });

// Calculate net incentive before saving
incentiveSchema.pre("save", function (next) {
  const breakdown = this.incentiveBreakdown;
  
  this.grossIncentive = 
    breakdown.perLoanIncentive +
    breakdown.performanceBonus +
    breakdown.targetAchievementBonus +
    breakdown.qualityBonus;
  
  this.netIncentive = this.grossIncentive - breakdown.penalties - this.deductions;
  
  next();
});

const Incentive = mongoose.model("Incentive", incentiveSchema);

export default Incentive;