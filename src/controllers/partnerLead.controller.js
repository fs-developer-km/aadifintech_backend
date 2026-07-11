import PartnerLead from "../models/partnerLead.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// Utility function for date/time
const getDateTime = () => {
  const now = new Date();
  const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
  const submittedDate = now.toLocaleDateString('en-GB', optionsDate);
  const submittedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { submittedDate, submittedTime };
};

// ✅ FIX: single source of truth for which roles count as "assigned team" roles
const ASSIGNED_ROLES = ["employee", "manager"];

// ==================== PARTNER APIs ====================

// Create Lead by Partner
export const createPartnerLead = async (req, res) => {
  try {
    const {
      customerName,
      customerMobile,
      customerEmail,
      loanType,
      loanAmount,
      monthlyIncome,
      employmentType,
      priority,
      remarks: initialRemark
    } = req.body;

    // Validation
    if (!customerName || !customerMobile || !loanType || !loanAmount) {
      return res.status(400).json({
        success: false,
        msg: "Customer name, mobile, loan type and amount are required"
      });
    }

    // Check if user is partner
    if (req.user.role !== "partner") {
      return res.status(403).json({
        success: false,
        msg: "Only partners can create leads"
      });
    }

    // ✅ Get partner details from User model (not separate Partner model)
    const partner = await User.findById(req.user._id)
      .populate("assignedEmployee", "name email mobile role")
      .populate("assignedManager", "name email mobile role");

    if (!partner) {
      return res.status(404).json({
        success: false,
        msg: "Partner not found"
      });
    }

    if (partner.accountStatus !== "Active") {
      return res.status(403).json({
        success: false,
        msg: "Your partner account is inactive. Please contact admin."
      });
    }

    // ✅ Check if employee and manager are assigned
    if (!partner.assignedEmployee || !partner.assignedManager) {
      return res.status(400).json({
        success: false,
        msg: "Employee and Manager not assigned to your account. Please contact admin."
      });
    }

    const { submittedDate, submittedTime } = getDateTime();

    // Create lead with auto-assignment
    const lead = await PartnerLead.create({
      customerName,
      customerMobile,
      customerEmail,
      loanType,
      loanAmount,
      monthlyIncome,
      employmentType,
      submittedBy: partner._id,  // ✅ Partner user ID directly
      partnerName: partner.companyName || partner.name,  // ✅ Company name ya normal name
      assignedEmployee: partner.assignedEmployee._id,
      assignedManager: partner.assignedManager._id,
      submittedDate,
      submittedTime,
      // ✅ FIX: priority was never set explicitly before, so it silently
      // stayed undefined/blank in the table unless the schema had its own default.
      priority: priority || "medium",
      remarks: initialRemark ? [{
        message: initialRemark,
        addedBy: req.user._id,
        addedByName: partner.companyName || partner.name,
        addedByRole: "partner"
      }] : [],
      statusHistory: [{
        status: "pending",
        subStatus: "fresh",
        updatedBy: req.user._id,
        updatedByName: partner.companyName || partner.name,
        remark: "Lead created by partner"
      }]
    });

    // Populate before sending response
    const populatedLead = await PartnerLead.findById(lead._id)
      .populate("assignedEmployee", "name email mobile")
      .populate("assignedManager", "name email mobile");

    return res.status(201).json({
      success: true,
      msg: "Lead created and assigned successfully",
      lead: populatedLead
    });

  } catch (err) {
    console.error("Create Partner Lead Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// Get Partner's Own Leads
export const getPartnerLeads = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    // Check if user is partner
    if (req.user.role !== "partner") {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access"
      });
    }

    // ✅ Direct user ID use karo, Partner model nahi
    const partnerId = new mongoose.Types.ObjectId(req.user._id);

    // Build query
    const query = {
      submittedBy: partnerId,  // ✅ Direct partner user ID
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } },
        { applicationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [leads, total] = await Promise.all([
      PartnerLead.find(query)
        .populate("assignedEmployee", "name email mobile")
        .populate("assignedManager", "name email mobile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PartnerLead.countDocuments(query)
    ]);

    // Get stats
    const stats = await PartnerLead.aggregate([
      { $match: { submittedBy: partnerId, isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // ✅ NORMALIZED STATUS MAP
    const statusMap = {
      pending: 0,
      'in-progress': 0,
      disbursed: 0
    };

    stats.forEach(item => {
      if (!item._id) return;

      switch (item._id) {
        case 'inProgress':
        case 'in_progress':
          statusMap['in-progress'] = item.count;
          break;

        default:
          statusMap[item._id] = item.count;
      }
    });

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: statusMap,
      leads
    });

  } catch (err) {
    console.error("Get Partner Leads Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// Get Single Lead Details (Partner)
export const getPartnerLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "partner") {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access"
      });
    }

    const lead = await PartnerLead.findOne({
      _id: id,
      submittedBy: req.user._id,  // ✅ Direct partner user ID
      isDeleted: false
    })
      .populate("assignedEmployee", "name email mobile")
      .populate("assignedManager", "name email mobile")
      .populate("remarks.addedBy", "name")
      .populate("statusHistory.updatedBy", "name")
      .lean();

    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    return res.status(200).json({
      success: true,
      lead
    });

  } catch (err) {
    console.error("Get Partner Lead By ID Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ✅ NEW: Edit Lead (Partner — only their own lead, only basic fields)
export const updatePartnerLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "partner") {
      return res.status(403).json({
        success: false,
        msg: "Only partners can edit their leads"
      });
    }

    const {
      customerName,
      customerMobile,
      customerEmail,
      loanType,
      loanAmount,
      monthlyIncome,
      employmentType,
      priority
    } = req.body;

    const lead = await PartnerLead.findOne({
      _id: id,
      submittedBy: req.user._id,
      isDeleted: false
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    // Partner can only edit basic lead info — status/assignment stays
    // in the hands of employee/manager/admin.
    if (customerName) lead.customerName = customerName;
    if (customerMobile) lead.customerMobile = customerMobile;
    if (customerEmail !== undefined) lead.customerEmail = customerEmail;
    if (loanType) lead.loanType = loanType;
    if (loanAmount) lead.loanAmount = loanAmount;
    if (monthlyIncome !== undefined) lead.monthlyIncome = monthlyIncome;
    if (employmentType) lead.employmentType = employmentType;
    if (priority) lead.priority = priority;

    await lead.save();

    const updatedLead = await PartnerLead.findById(id)
      .populate("assignedEmployee", "name email mobile")
      .populate("assignedManager", "name email mobile");

    return res.status(200).json({
      success: true,
      msg: "Lead updated successfully",
      lead: updatedLead
    });

  } catch (err) {
    console.error("Update Partner Lead Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ✅ NEW: Delete Lead (Partner — soft delete their own lead)
export const deletePartnerLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "partner") {
      return res.status(403).json({
        success: false,
        msg: "Only partners can delete their leads"
      });
    }

    const lead = await PartnerLead.findOne({
      _id: id,
      submittedBy: req.user._id,
      isDeleted: false
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    lead.isDeleted = true;
    await lead.save();

    return res.status(200).json({
      success: true,
      msg: "Lead deleted successfully"
    });

  } catch (err) {
    console.error("Delete Partner Lead Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ==================== EMPLOYEE/MANAGER APIs ====================

// Get Assigned Leads (Employee/Manager)
export const getAssignedLeads = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20, search, dateFrom, dateTo } = req.query;

    // ✅ FIX: manager wasn't allowed here before, so a manager's request
    // was rejected with 403 and their assigned leads never loaded.
    if (![...ASSIGNED_ROLES, "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access"
      });
    }

    // Build query
    let query = { isDeleted: false };
    const andConditions = [];

    // For employees/managers, show only leads assigned to them
    // For admin, show all leads
    if (ASSIGNED_ROLES.includes(req.user.role)) {
      andConditions.push({
        $or: [
          { assignedEmployee: req.user._id },
          { assignedManager: req.user._id }
        ]
      });
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    // ✅ FIX: this used to overwrite query.$or (the assignment filter above)
    // so a search by an employee/manager showed everyone's leads, not just theirs.
    // Now it's combined via $and instead of clobbering the same key.
    if (search) {
      andConditions.push({
        $or: [
          { customerName: { $regex: search, $options: 'i' } },
          { customerMobile: { $regex: search, $options: 'i' } },
          { applicationNumber: { $regex: search, $options: 'i' } },
          { partnerName: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [leads, total] = await Promise.all([
      PartnerLead.find(query)
        .populate("submittedBy", "name companyName")  // ✅ Partner User
        .populate("assignedEmployee", "name email mobile")
        .populate("assignedManager", "name email mobile")
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PartnerLead.countDocuments(query)
    ]);

    // Get stats
    const baseMatch = ASSIGNED_ROLES.includes(req.user.role)
      ? {
        $or: [
          { assignedEmployee: req.user._id },
          { assignedManager: req.user._id }
        ],
        isDeleted: false
      }
      : { isDeleted: false };

    const stats = await PartnerLead.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: statusStats,
      leads
    });

  } catch (err) {
    console.error("Get Assigned Leads Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// Update Lead Status (Employee/Manager)
export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      subStatus,
      priority,
      remark,
      nextFollowUpDate,
      bankName,
      applicationNumber,
      sanctionedAmount,
      interestRate,
      tenure
    } = req.body;

    // ✅ FIX: added "manager"
    if (![...ASSIGNED_ROLES, "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: "Only employees/managers can update lead status"
      });
    }

    const lead = await PartnerLead.findOne({
      _id: id,
      isDeleted: false
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    // ✅ FIX: check access for both employee and manager, not just employee
    if (ASSIGNED_ROLES.includes(req.user.role)) {
      const hasAccess =
        String(lead.assignedEmployee) === String(req.user._id) ||
        String(lead.assignedManager) === String(req.user._id);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          msg: "You are not authorized to update this lead"
        });
      }
    }

    // Build update object
    const updateData = {};

    if (status) updateData.status = status;
    if (subStatus) updateData.subStatus = subStatus;
    if (priority) updateData.priority = priority;
    if (nextFollowUpDate) {
      updateData.nextFollowUpDate = new Date(nextFollowUpDate);
      updateData.lastFollowUpDate = new Date();
    }
    if (bankName) updateData.bankName = bankName;
    if (applicationNumber) updateData.applicationNumber = applicationNumber;
    if (sanctionedAmount) updateData.sanctionedAmount = sanctionedAmount;
    if (interestRate) updateData.interestRate = interestRate;
    if (tenure) updateData.tenure = tenure;

    // Add to status history
    const historyEntry = {
      status: status || lead.status,
      subStatus: subStatus || lead.subStatus,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      remark: remark || "Status updated"
    };

    updateData.$push = {
      statusHistory: historyEntry
    };

    // If remark is provided, add to remarks
    if (remark) {
      updateData.$push.remarks = {
        message: remark,
        addedBy: req.user._id,
        addedByName: req.user.name,
        addedByRole: req.user.role
      };
    }

    const updatedLead = await PartnerLead.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("submittedBy", "name companyName")
      .populate("assignedEmployee", "name email mobile")
      .populate("assignedManager", "name email mobile");

    return res.status(200).json({
      success: true,
      msg: "Lead updated successfully",
      lead: updatedLead
    });

  } catch (err) {
    console.error("Update Lead Status Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// Add Remark to Lead
export const addRemarkToLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        msg: "Remark message is required"
      });
    }

    // ✅ FIX: added "manager"
    if (![...ASSIGNED_ROLES, "partner", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access"
      });
    }

    const lead = await PartnerLead.findOne({
      _id: id,
      isDeleted: false
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    // ✅ FIX: check access for both employee and manager
    if (ASSIGNED_ROLES.includes(req.user.role)) {
      const hasAccess =
        String(lead.assignedEmployee) === String(req.user._id) ||
        String(lead.assignedManager) === String(req.user._id);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          msg: "You are not authorized to add remarks to this lead"
        });
      }
    }

    if (req.user.role === "partner") {
      if (String(lead.submittedBy) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          msg: "You are not authorized to add remarks to this lead"
        });
      }
    }

    const remarkEntry = {
      message,
      addedBy: req.user._id,
      addedByName: req.user.name,
      addedByRole: req.user.role
    };

    const updatedLead = await PartnerLead.findByIdAndUpdate(
      id,
      { $push: { remarks: remarkEntry } },
      { new: true }
    )
      .populate("remarks.addedBy", "name")
      .lean();

    return res.status(200).json({
      success: true,
      msg: "Remark added successfully",
      remarks: updatedLead.remarks
    });

  } catch (err) {
    console.error("Add Remark Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// Get Lead by ID (Employee/Manager)
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ FIX: added "manager"
    if (![...ASSIGNED_ROLES, "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access"
      });
    }

    const lead = await PartnerLead.findOne({
      _id: id,
      isDeleted: false
    })
      .populate("submittedBy", "name companyName mobile")  // ✅ Partner User
      .populate("assignedEmployee", "name email mobile")
      .populate("assignedManager", "name email mobile")
      .populate("remarks.addedBy", "name")
      .populate("statusHistory.updatedBy", "name")
      .lean();

    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    // ✅ FIX: check access for both employee and manager
    if (ASSIGNED_ROLES.includes(req.user.role)) {
      const hasAccess =
        (lead.assignedEmployee && String(lead.assignedEmployee._id) === String(req.user._id)) ||
        (lead.assignedManager && String(lead.assignedManager._id) === String(req.user._id));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          msg: "You are not authorized to view this lead"
        });
      }
    }

    return res.status(200).json({
      success: true,
      lead
    });

  } catch (err) {
    console.error("Get Lead By ID Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// Get Dashboard Stats (Employee/Manager)
export const getEmployeeDashboardStats = async (req, res) => {
  try {
    // ✅ FIX: added "manager"
    if (![...ASSIGNED_ROLES, "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access"
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const baseMatch = ASSIGNED_ROLES.includes(req.user.role)
      ? {
        $or: [
          { assignedEmployee: userId },
          { assignedManager: userId }
        ],
        isDeleted: false
      }
      : { isDeleted: false };

    // Get overall stats
    const [statusStats, priorityStats, todayFollowups, overdueTasks] = await Promise.all([
      PartnerLead.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$loanAmount" }
          }
        }
      ]),

      PartnerLead.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 }
          }
        }
      ]),

      PartnerLead.countDocuments({
        ...baseMatch,
        nextFollowUpDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),

      PartnerLead.countDocuments({
        ...baseMatch,
        nextFollowUpDate: { $lt: new Date() },
        status: { $nin: ["approved", "disbursed", "rejected", "cancelled"] }
      })
    ]);

    // ---------- PRIORITY MAP (SAFE DEFAULTS) ----------
    const priorityMap = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    priorityStats.forEach(item => {
      if (item._id) {
        priorityMap[item._id] = item.count;
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        byStatus: statusStats.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalAmount: item.totalAmount
          };
          return acc;
        }, {}),
        byPriority: priorityMap,
        todayFollowups,
        overdueTasks
      }
    });

  } catch (err) {
    console.error("Get Dashboard Stats Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};