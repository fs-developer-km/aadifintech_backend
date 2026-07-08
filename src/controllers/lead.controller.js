import Lead from "../models/lead.model.js";
import mongoose from "mongoose";

// Function to generate formatted date & time
const getDateTime = () => {
  const now = new Date();
  const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
  const submittedDate = now.toLocaleDateString('en-GB', optionsDate);
  const submittedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { submittedDate, submittedTime };
};

// ✅ Frontend jaisa dd/mm/yyyy format — history entries isi format me save hongi
const getSimpleDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
};

// ----------------- Create Lead -----------------
export const createLead = async (req, res) => {
  try {
    const { leadName, leadPhone, notes } = req.body;

    if (!leadName || !leadPhone || !notes) {
      return res.status(400).json({ success: false, msg: "Name and phone required" });
    }

    const { submittedDate, submittedTime } = getDateTime();

    const lead = await Lead.create({
      leadName,
      leadPhone,
      notes,
      submittedDate,
      submittedTime,
    });

    return res.status(201).json({
      success: true,
      msg: "Lead created successfully",
      lead,
    });
  } catch (err) {
    console.error("Create Lead Error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

// ----------------- Get All Leads -----------------
export const getLeadsss = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate("assignTo", "name email mobile")
      .populate("assignmentHistory.employee", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      total: leads.length,
      leads
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ----------------- Get All Leads (Admin + Employee Filter) -----------------
export const getLeads = async (req, res) => {
  try {

    console.log("Logged-in User ID =", req.user._id);
    console.log("User Role =", req.user.role);

    let leads;

    if (req.user.role === "admin") {
      leads = await Lead.find()
        .populate("assignTo", "name email mobile")
        .populate("assignmentHistory.employee", "name email")
        .sort({ createdAt: -1 })
        .lean();
    }

    else if (req.user.role === "employee") {
      leads = await Lead.find({ assignTo: req.user._id })
        .populate("assignTo", "name email mobile")
        .populate("assignmentHistory.employee", "name email")
        .sort({ createdAt: -1 })
        .lean();
    }

    else {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access"
      });
    }

    return res.status(200).json({
      success: true,
      total: leads.length,
      leads
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ------------------------------------------------------
// ⭐ Assign Lead to Employee — ab history me push bhi karta hai
// ------------------------------------------------------
export const assignLead = async (req, res) => {
  try {
    const leadId = req.params.id;
    const { employeeId } = req.body;

    console.log("🔵 Assign Request - Lead ID:", leadId);
    console.log("🔵 Assign Request - Employee ID:", employeeId);

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        msg: "Employee ID is required"
      });
    }

    const employeeExists = await mongoose.model('User').findById(employeeId);

    if (!employeeExists) {
      console.log("❌ Employee not found:", employeeId);
      return res.status(404).json({
        success: false,
        msg: "Employee not found"
      });
    }

    console.log("✅ Employee found:", employeeExists.name);

    // ✅ Naya assignment history array me push hoga — purani history untouched rahegi
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      {
        assignTo: employeeId,
        status: "pending",
        $push: {
          assignmentHistory: {
            employee: employeeId,
            employeeName: employeeExists.name,
            assignedDate: getSimpleDate(),
            status: "pending"
          }
        }
      },
      { new: true }
    )
      .populate("assignTo", "name email mobile")
      .populate("assignmentHistory.employee", "name email");

    console.log("✅ Updated Lead:", updatedLead);

    if (!updatedLead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Lead assigned successfully",
      lead: updatedLead
    });
  } catch (err) {
    console.error("❌ Assign Lead Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ----------------- Delete Lead (Only Admin) -----------------
export const deleteLead = async (req, res) => {
  try {
    const leadId = req.params.id;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized. Only admin can delete leads."
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    await Lead.findByIdAndDelete(leadId);

    return res.status(200).json({
      success: true,
      msg: "Lead deleted successfully",
      deletedLeadId: leadId
    });

  } catch (err) {
    console.error("❌ Delete Lead Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ------------------------------------------------------
// ⭐ Update Lead Status — ab latest history entry ko bhi update karta hai
// ------------------------------------------------------
export const updateLeadStatus = async (req, res) => {
  try {
    console.log("========== UPDATE STATUS ==========");
    console.log("User:", req.user._id, req.user.role);
    console.log("Body:", req.body);
    console.log("Lead ID:", req.params.id);

    const leadId = req.params.id;
    const { status } = req.body;

    if (!["pending", "success"].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Status must be pending or success"
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    console.log("Lead AssignTo:", lead.assignTo?.toString());
    console.log("Logged User:", req.user._id?.toString());
    console.log("Role:", req.user.role);

    if (req.user.role === "admin") {
      // Allow
    }
    else if (req.user.role === "employee") {
      if (!lead.assignTo || lead.assignTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          msg: "You are not allowed to update this lead"
        });
      }
    }
    else {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access"
      });
    }

    // ✅ Latest (sabse aakhri) assignment history entry ko update karo
    if (lead.assignmentHistory && lead.assignmentHistory.length > 0) {
      const lastIndex = lead.assignmentHistory.length - 1;
      lead.assignmentHistory[lastIndex].status = status === "success" ? "completed" : "pending";
      lead.assignmentHistory[lastIndex].completedDate = status === "success" ? getSimpleDate() : undefined;
    }

    lead.status = status;
    await lead.save();

    const populatedLead = await Lead.findById(leadId)
      .populate("assignTo", "name email mobile")
      .populate("assignmentHistory.employee", "name email");

    return res.status(200).json({
      success: true,
      msg: "Status updated successfully",
      lead: populatedLead
    });

  } catch (err) {
    console.error("❌ Update Status Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};