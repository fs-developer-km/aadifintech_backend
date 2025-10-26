import Lead from "../models/lead.model.js";

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
    const { leadName, leadPhone } = req.body;

    if (!leadName || !leadPhone) {
      return res.status(400).json({ success: false, msg: "Name and phone required" });
    }

    const { submittedDate, submittedTime } = getDateTime();

    const lead = await Lead.create({
      leadName,
      leadPhone,
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
export const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, total: leads.length, leads });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};
