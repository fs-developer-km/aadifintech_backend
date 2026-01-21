// src/controllers/incentive.controller.js
import Incentive from "../models/incentive.model.js";
import User from "../models/user.model.js";

// =============================================
// 📊 Calculate Incentive (Employee can view, Admin can create)
// =============================================
export const calculateIncentive = async (req, res, next) => {
  try {
    const {
      employeeId,
      month,
      year,
      loanMetrics,
      targets,
      rateCard // { perLoan, performanceRate, targetBonusRate }
    } = req.body;

    // If employee, use their own ID
    const finalEmployeeId = req.user.role === "employee" ? req.user.id : employeeId;

    if (!finalEmployeeId || !month || !year || !loanMetrics || !targets) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields"
      });
    }

    // Get employee details
    const employee = await User.findById(finalEmployeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        msg: "Employee not found"
      });
    }

    // Default rate card
    const rates = rateCard || {
      perLoan: 500, // ₹500 per disbursed loan
      performanceRate: 0.02, // 2% of total disbursed amount
      targetBonusRate: 0.05, // 5% bonus if target achieved
      qualityBonusRate: 0.01 // 1% for quality
    };

    // Calculate conversion rate
    const conversionRate = loanMetrics.totalLoans > 0
      ? (loanMetrics.disbursedLoans / loanMetrics.totalLoans) * 100
      : 0;

    // Calculate target achievement
    const achievedPercentage = targets.loanTarget > 0
      ? (loanMetrics.disbursedLoans / targets.loanTarget) * 100
      : 0;

    // Calculate incentive breakdown
    const perLoanIncentive = loanMetrics.disbursedLoans * rates.perLoan;
    const performanceBonus = loanMetrics.totalDisbursedAmount * rates.performanceRate;
    
    let targetAchievementBonus = 0;
    if (achievedPercentage >= 100) {
      targetAchievementBonus = loanMetrics.totalDisbursedAmount * rates.targetBonusRate;
    }

    let qualityBonus = 0;
    if (conversionRate >= 80) {
      qualityBonus = loanMetrics.totalDisbursedAmount * rates.qualityBonusRate;
    }

    // Penalties (if conversion rate is too low)
    let penalties = 0;
    if (conversionRate < 50 && loanMetrics.totalLoans > 10) {
      penalties = perLoanIncentive * 0.1; // 10% penalty
    }

    // Check if already exists
    let incentive = await Incentive.findOne({
      employeeId: finalEmployeeId,
      month,
      year
    });

    const incentiveData = {
      employeeId: finalEmployeeId,
      employeeName: employee.name,
      employeeMobile: employee.mobile,
      month,
      year,
      loanMetrics: {
        ...loanMetrics,
        conversionRate: conversionRate.toFixed(2)
      },
      targets: {
        ...targets,
        achievedPercentage: achievedPercentage.toFixed(2)
      },
      incentiveBreakdown: {
        perLoanIncentive,
        performanceBonus,
        targetAchievementBonus,
        qualityBonus,
        penalties
      },
      status: req.user.role === "admin" ? "calculated" : "draft",
      calculatedAt: new Date()
    };

    if (incentive) {
      Object.assign(incentive, incentiveData);
      await incentive.save();
    } else {
      incentive = await Incentive.create(incentiveData);
    }

    res.status(200).json({
      success: true,
      msg: "Incentive calculated successfully",
      data: incentive
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error calculating incentive",
      error: err.message
    });
  }
};

// =============================================
// 📋 Get My Incentives (Employee)
// =============================================
export const getMyIncentives = async (req, res, next) => {
  try {
    const employeeId = req.user.id;
    const { status, month, year } = req.query;

    const filter = { employeeId };
    if (status) filter.status = status;
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);

    const incentives = await Incentive.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: incentives.length,
      data: incentives
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error fetching incentives",
      error: err.message
    });
  }
};

// =============================================
// 🔍 Get Single Incentive (Employee)
// =============================================
export const getIncentiveById = async (req, res, next) => {
  try {
    const { incentiveId } = req.params;
    const employeeId = req.user.id;

    const incentive = await Incentive.findOne({
      _id: incentiveId,
      employeeId
    });

    if (!incentive) {
      return res.status(404).json({
        success: false,
        msg: "Incentive not found"
      });
    }

    res.status(200).json({
      success: true,
      data: incentive
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error fetching incentive",
      error: err.message
    });
  }
};

// =============================================
// 👨‍💼 ADMIN: Get All Incentives
// =============================================
export const getAllIncentives = async (req, res, next) => {
  try {
    const { status, month, year, employeeId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    if (employeeId) filter.employeeId = employeeId;

    const incentives = await Incentive.find(filter)
      .populate("employeeId", "name mobile email")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

       // 🔥🔥🔥 FLATTEN HERE
    const formatted = incentives.map(i => ({
      _id: i._id,
      employeeId: i.employeeId?._id || null,
      employeeName: i.employeeId?.name || "",
      employeeMobile: i.employeeId?.mobile || "",
      month: i.month,
      year: i.year,
      loanMetrics: i.loanMetrics,
      targets: i.targets,
      incentiveBreakdown: i.incentiveBreakdown,
      grossIncentive: i.grossIncentive,
      deductions: i.deductions,
      netIncentive: i.netIncentive,
      status: i.status,
      calculatedAt: i.calculatedAt,
      approvedAt: i.approvedAt,
      paidAt: i.paidAt,
      adminRemarks: i.adminRemarks,
      rejectionReason: i.rejectionReason,
      paymentReference: i.paymentReference
    }));

    res.status(200).json({
      success: true,
      count: incentives.length,
      data: incentives
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error fetching incentives",
      error: err.message
    });
  }
};

// =============================================
// 📝 ADMIN: Update Incentive Details
// =============================================
export const updateIncentive = async (req, res, next) => {
  try {
    const { incentiveId } = req.params;
    const updates = req.body;

    const incentive = await Incentive.findById(incentiveId);

    if (!incentive) {
      return res.status(404).json({
        success: false,
        msg: "Incentive not found"
      });
    }

    // Update allowed fields
    const allowedFields = [
      "loanMetrics",
      "targets",
      "incentiveBreakdown",
      "deductions",
      "adminRemarks"
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        incentive[field] = updates[field];
      }
    });

    await incentive.save();

    res.status(200).json({
      success: true,
      msg: "Incentive updated successfully",
      data: incentive
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error updating incentive",
      error: err.message
    });
  }
};

// =============================================
// ✅ ADMIN: Approve Incentive
// =============================================
export const approveIncentive = async (req, res, next) => {
  try {
    const { incentiveId } = req.params;
    const { adminRemarks } = req.body;
    const adminId = req.user.id;

    const incentive = await Incentive.findById(incentiveId);

    if (!incentive) {
      return res.status(404).json({
        success: false,
        msg: "Incentive not found"
      });
    }

    if (incentive.status !== "calculated") {
      return res.status(400).json({
        success: false,
        msg: `Cannot approve. Current status: ${incentive.status}`
      });
    }

    incentive.status = "approved";
    incentive.approvedBy = adminId;
    incentive.approvedAt = new Date();
    if (adminRemarks) incentive.adminRemarks = adminRemarks;

    await incentive.save();

    res.status(200).json({
      success: true,
      msg: "Incentive approved successfully",
      data: incentive
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error approving incentive",
      error: err.message
    });
  }
};

// =============================================
// ❌ ADMIN: Reject Incentive
// =============================================
export const rejectIncentive = async (req, res, next) => {
  try {
    const { incentiveId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        msg: "Rejection reason is required"
      });
    }

    const incentive = await Incentive.findById(incentiveId);

    if (!incentive) {
      return res.status(404).json({
        success: false,
        msg: "Incentive not found"
      });
    }

    incentive.status = "rejected";
    incentive.rejectionReason = rejectionReason;
    incentive.approvedBy = adminId;
    incentive.approvedAt = new Date();

    await incentive.save();

    res.status(200).json({
      success: true,
      msg: "Incentive rejected",
      data: incentive
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error rejecting incentive",
      error: err.message
    });
  }
};

// =============================================
// 💰 ADMIN: Mark as Paid
// =============================================
export const markIncentiveAsPaid = async (req, res, next) => {
  try {
    const { incentiveId } = req.params;
    const { paymentReference } = req.body;

    const incentive = await Incentive.findById(incentiveId);

    if (!incentive) {
      return res.status(404).json({
        success: false,
        msg: "Incentive not found"
      });
    }

    if (incentive.status !== "approved") {
      return res.status(400).json({
        success: false,
        msg: "Only approved incentives can be marked as paid"
      });
    }

    incentive.status = "paid";
    incentive.paidAt = new Date();
    if (paymentReference) incentive.paymentReference = paymentReference;

    await incentive.save();

    res.status(200).json({
      success: true,
      msg: "Incentive marked as paid",
      data: incentive
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error updating incentive",
      error: err.message
    });
  }
};

// =============================================
// 📊 ADMIN: Get Incentive Statistics
// =============================================
export const getIncentiveStats = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);

    const stats = await Incentive.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalGross: { $sum: "$grossIncentive" },
          totalNet: { $sum: "$netIncentive" }
        }
      }
    ]);

    const totalStats = await Incentive.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalGrossIncentive: { $sum: "$grossIncentive" },
          totalNetIncentive: { $sum: "$netIncentive" },
          totalPenalties: { $sum: "$incentiveBreakdown.penalties" }
        }
      }
    ]);

    const employeeWise = await Incentive.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$employeeId",
          employeeName: { $first: "$employeeName" },
          totalIncentive: { $sum: "$netIncentive" },
          totalLoans: { $sum: "$loanMetrics.disbursedLoans" }
        }
      },
      { $sort: { totalIncentive: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        overall: totalStats[0] || {
          totalRecords: 0,
          totalGrossIncentive: 0,
          totalNetIncentive: 0,
          totalPenalties: 0
        },
        topEmployees: employeeWise
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error fetching statistics",
      error: err.message
    });
  }
};

// =============================================
// 🗑️ ADMIN: Delete Incentive
// =============================================
export const deleteIncentive = async (req, res, next) => {
  try {
    const { incentiveId } = req.params;

    const incentive = await Incentive.findById(incentiveId);

    if (!incentive) {
      return res.status(404).json({
        success: false,
        msg: "Incentive not found"
      });
    }

    if (incentive.status === "paid") {
      return res.status(400).json({
        success: false,
        msg: "Cannot delete paid incentives"
      });
    }

    await Incentive.findByIdAndDelete(incentiveId);

    res.status(200).json({
      success: true,
      msg: "Incentive deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error deleting incentive",
      error: err.message
    });
  }
};