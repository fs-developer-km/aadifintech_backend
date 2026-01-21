import Lead from "../models/lead.model.js";
import mongoose from "mongoose";

// Function to generate formatted date & time
const getDateTime = () => {
  const now = new Date();
  const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
  const submittedDate = now.toLocaleDateString('en-GB', optionsDate); // e.g. "18 Oct 2025"
  const submittedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { submittedDate, submittedTime };
};

// ----------------- Create Lead -----------------
export const createLead = async (req, res) => {
  try {
    const { leadName, leadPhone , notes} = req.body;

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

// NEW CODE FOR GET FILTER EMPLOYEE AND ALL FOR ADMIN

// ----------------- Get All Leads (Admin + Employee Filter) -----------------
export const getLeads = async (req, res) => {
  try {

    console.log("Logged-in User ID =", req.user._id);
console.log("User Role =", req.user.role);


    let leads;

    // ⭐ If logged-in user is Admin → return all leads
    if (req.user.role === "admin") {
      leads = await Lead.find()
        .populate("assignTo", "name email mobile")
        .sort({ createdAt: -1 })
        .lean();
    }

    // ⭐ If logged-in user is Employee → return only their leads
    // else if (req.user.role === "employee") {
    //   leads = await Lead.find({ assignTo: req.user._id })
    //     .populate("assignTo", "name email mobile")
    //     .sort({ createdAt: -1 })
    //     .lean();
    // }

    else if (req.user.role === "employee") {
  leads = await Lead.find({ assignTo: req.user._id })
    .populate("assignTo", "name email mobile")
    .sort({ createdAt: -1 })
    .lean();
}


    // ⭐ Any other user (partner/user) → No access
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
// ⭐ NEW → Assign Lead to Employee
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

    // ✅ Pehle check karo employee exists karta hai ya nahi
    const employeeExists = await mongoose.model('User').findById(employeeId);
    
    if (!employeeExists) {
      console.log("❌ Employee not found:", employeeId);
      return res.status(404).json({
        success: false,
        msg: "Employee not found"
      });
    }

    console.log("✅ Employee found:", employeeExists.name);

    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { assignTo: employeeId },
      { new: true }
    ).populate("assignTo", "name email mobile");
    
    console.log("✅ Updated Lead:", updatedLead);
    console.log("✅ Populated assignTo:", updatedLead.assignTo);

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

// delete lead api 

// ----------------- Delete Lead (Only Admin) -----------------
export const deleteLead = async (req, res) => {
  try {
    const leadId = req.params.id;

    // ✅ ADMIN check (role must be "admin")
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

// only employee filter lead

// action update success and penfin

export const updateLeadStatus = async (req, res) => {
  try {
    const leadId = req.params.id;
    const { status } = req.body;

    // Only allow two values
    if (!["pending", "success"].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Status must be pending or success"
      });
    }

    // Find the lead
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Lead not found"
      });
    }

    // ❌ Admin cannot update lead status
    if (req.user.role === "admin") {
      return res.status(403).json({
        success: false,
        msg: "Only employees can update status"
      });
    }

    // ✔ Employee can update only their assigned leads
    if (req.user.role === "employee" && String(lead.assignTo) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        msg: "You are not allowed to update this lead"
      });
    }

    // Update status
    lead.status = status;
    await lead.save();

    return res.status(200).json({
      success: true,
      msg: "Status updated successfully",
      lead
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};


// 
