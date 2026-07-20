// src/controllers/conveyance.controller.js
import Conveyance from "../models/conveyance.model.js";
import User from "../models/user.model.js";
import { CONVEYANCE_RATES } from "../config/conveyanceRates.js";

// =============================================
// 📝 Create or Update Conveyance Entry (Employee)
// =============================================
export const createOrUpdateConveyance = async (req, res, next) => {
  try {
    const { month, year, entries } = req.body;
    const employeeId = req.user.id;

    // Validation
    if (!month || !year || !entries || entries.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Month, year, and at least one entry required"
      });
    }

    // Get employee details
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        msg: "Employee not found"
      });
    }

    // Check if conveyance already exists for this month
    let conveyance = await Conveyance.findOne({
      employeeId,
      month,
      year
    });

    if (conveyance) {
      // Update existing
      conveyance.entries = entries;
      conveyance.status = "draft";
      await conveyance.save();
    } else {
      // Create new
      conveyance = await Conveyance.create({
        employeeId,
        employeeName: employee.name,
        employeeMobile: employee.mobile,
        month,
        year,
        entries,
        status: "draft"
      });
    }

    res.status(200).json({
      success: true,
      msg: "Conveyance saved successfully",
      data: conveyance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error saving conveyance",
      error: err.message
    });
  }
};

// =============================================
// 📤 Submit Conveyance for Approval (Employee)
// =============================================
export const submitConveyance = async (req, res, next) => {
  try {
    const { conveyanceId } = req.params;
    const employeeId = req.user.id;

    const conveyance = await Conveyance.findOne({
      _id: conveyanceId,
      employeeId
    });

    if (!conveyance) {
      return res.status(404).json({
        success: false,
        msg: "Conveyance not found"
      });
    }

    if (conveyance.status !== "draft") {
      return res.status(400).json({
        success: false,
        msg: `Cannot submit. Current status: ${conveyance.status}`
      });
    }

    conveyance.status = "submitted";
    conveyance.submittedAt = new Date();
    await conveyance.save();

    res.status(200).json({
      success: true,
      msg: "Conveyance submitted for approval",
      data: conveyance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error submitting conveyance",
      error: err.message
    });
  }
};

// =============================================
// 📋 Get My Conveyances (Employee)
// =============================================
export const getMyConveyances = async (req, res, next) => {
  try {
    const employeeId = req.user.id;
    const { status, month, year } = req.query;

    const filter = { employeeId };
    if (status) filter.status = status;
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);

    const conveyances = await Conveyance.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: conveyances.length,
      data: conveyances
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error fetching conveyances",
      error: err.message
    });
  }
};

// =============================================
// 🔍 Get Single Conveyance (Employee)
// =============================================
export const getConveyanceById = async (req, res, next) => {
  try {
    const { conveyanceId } = req.params;
    const employeeId = req.user.id;

    const conveyance = await Conveyance.findOne({
      _id: conveyanceId,
      employeeId
    });

    if (!conveyance) {
      return res.status(404).json({
        success: false,
        msg: "Conveyance not found"
      });
    }

    res.status(200).json({
      success: true,
      data: conveyance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error fetching conveyance",
      error: err.message
    });
  }
};

// =============================================
// 🗑️ Delete Conveyance (Employee - only draft)
// =============================================
export const deleteConveyance = async (req, res, next) => {
  try {
    const { conveyanceId } = req.params;
    const employeeId = req.user.id;

    const conveyance = await Conveyance.findOne({
      _id: conveyanceId,
      employeeId
    });

    if (!conveyance) {
      return res.status(404).json({
        success: false,
        msg: "Conveyance not found"
      });
    }

    if (conveyance.status !== "draft") {
      return res.status(400).json({
        success: false,
        msg: "Can only delete draft conveyances"
      });
    }

    await Conveyance.findByIdAndDelete(conveyanceId);

    res.status(200).json({
      success: true,
      msg: "Conveyance deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error deleting conveyance",
      error: err.message
    });
  }
};

// =============================================
// 👨‍💼 ADMIN: Get All Conveyances
// =============================================
export const getAllConveyances = async (req, res, next) => {
  try {
    const { status, month, year, employeeId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    if (employeeId) filter.employeeId = employeeId;

    const conveyances = await Conveyance.find(filter)
      .populate("employeeId", "name mobile email")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: conveyances.length,
      data: conveyances
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error fetching conveyances",
      error: err.message
    });
  }
};

// =============================================
// ✅ ADMIN: Approve Conveyance
// =============================================
export const approveConveyance = async (req, res, next) => {
  try {
    const { conveyanceId } = req.params;
    const { adminRemarks } = req.body;
    const adminId = req.user.id;

    const conveyance = await Conveyance.findById(conveyanceId);

    if (!conveyance) {
      return res.status(404).json({
        success: false,
        msg: "Conveyance not found"
      });
    }

    if (conveyance.status !== "submitted") {
      return res.status(400).json({
        success: false,
        msg: `Cannot approve. Current status: ${conveyance.status}`
      });
    }

    conveyance.status = "approved";
    conveyance.approvedBy = adminId;
    conveyance.approvedAt = new Date();
    if (adminRemarks) conveyance.adminRemarks = adminRemarks;

    await conveyance.save();

    res.status(200).json({
      success: true,
      msg: "Conveyance approved successfully",
      data: conveyance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error approving conveyance",
      error: err.message
    });
  }
};

// =============================================
// ❌ ADMIN: Reject Conveyance
// =============================================
export const rejectConveyance = async (req, res, next) => {
  try {
    const { conveyanceId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        msg: "Rejection reason is required"
      });
    }

    const conveyance = await Conveyance.findById(conveyanceId);

    if (!conveyance) {
      return res.status(404).json({
        success: false,
        msg: "Conveyance not found"
      });
    }

    if (conveyance.status !== "submitted") {
      return res.status(400).json({
        success: false,
        msg: `Cannot reject. Current status: ${conveyance.status}`
      });
    }

    conveyance.status = "rejected";
    conveyance.rejectionReason = rejectionReason;
    conveyance.approvedBy = adminId;
    conveyance.approvedAt = new Date();

    await conveyance.save();

    res.status(200).json({
      success: true,
      msg: "Conveyance rejected",
      data: conveyance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error rejecting conveyance",
      error: err.message
    });
  }
};

// =============================================
// 💰 ADMIN: Mark as Paid
// =============================================
export const markConveyanceAsPaid = async (req, res, next) => {
  try {
    const { conveyanceId } = req.params;

    const conveyance = await Conveyance.findById(conveyanceId);

    if (!conveyance) {
      return res.status(404).json({
        success: false,
        msg: "Conveyance not found"
      });
    }

    if (conveyance.status !== "approved") {
      return res.status(400).json({
        success: false,
        msg: "Only approved conveyances can be marked as paid"
      });
    }

    conveyance.status = "paid";
    await conveyance.save();

    res.status(200).json({
      success: true,
      msg: "Conveyance marked as paid",
      data: conveyance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error updating conveyance",
      error: err.message
    });
  }
};

// =============================================
// 📊 ADMIN: Get Conveyance Statistics
// =============================================
export const getConveyanceStats = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);

    const stats = await Conveyance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalDistance: { $sum: "$totalDistance" }
        }
      }
    ]);

    const totalStats = await Conveyance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalConveyances: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalDistance: { $sum: "$totalDistance" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        overall: totalStats[0] || {
          totalConveyances: 0,
          totalAmount: 0,
          totalDistance: 0
        }
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


export const getConveyanceRates = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: CONVEYANCE_RATES
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error fetching rates",
      error: err.message
    });
  }
};
