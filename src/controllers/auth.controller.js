import User from "../models/user.model.js";
import OTP from "../models/otp.model.js";  // ✅ Import OTP Model
import bcrypt from "bcrypt";              
import jwt from "jsonwebtoken";
import WhatsAppService from "../services/whatsapp.service.js";

// SALT rounds for bcrypt
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "12", 10);

// OTP expiry (5 minutes)
const OTP_EXPIRY_MINUTES = 5;

// Generate JWT token
const genToken = (user) => {
  return jwt.sign(
    { id: user._id, mobile: user.mobile, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


// ============================================
// ✅ NEW: Get Employees for Dropdown
// ============================================
export const getEmployeesForDropdown = async (req, res) => {
  try {
    const employees = await User.find(
      { role: "employee", accountStatus: "Active" },
      {
        _id: 1,
        name: 1,
        employeeCode: 1,
        department: 1,
        designation: 1
      }
    ).sort({ name: 1 }).lean();

    res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });

  } catch (err) {
    console.error("Get employees dropdown error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ============================================
// ✅ FIXED: Get Partner by ID with Populated Employee & Manager
// ============================================
export const getPartnerById = async (req, res) => {
  try {
    const partnerId = req.params.id;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized - Invalid token"
      });
    }

    const loggedInId = req.user._id.toString();

    if (partnerId !== loggedInId) {
      return res.status(403).json({
        success: false,
        msg: "Access denied: Not your account"
      });
    }

    // ✅ CRITICAL FIX: Populate employee and manager details
    const partner = await User.findById(partnerId)
      .populate({
        path: 'assignedEmployee',
        select: 'name employeeCode department designation mobile accountStatus'
      })
      .populate({
        path: 'assignedManager',
        select: 'name employeeCode department designation mobile accountStatus'
      })
      .select("-password")
      .lean();

    if (!partner) {
      return res.status(404).json({
        success: false,
        msg: "Partner not found"
      });
    }

    console.log("✅ Partner Data with Populated Employee & Manager:");
    console.log(JSON.stringify(partner, null, 2));

    return res.status(200).json({
      success: true,
      data: partner
    });

  } catch (err) {
    console.error("❌ Get partner error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};


export const signup = async (req, res) => {
  try {
    const { name, mobile, password, role } = req.body;

    if (!name || !mobile || !password)
      return res.status(400).json({ success: false, msg: "Name, mobile and password required" });

    const normalizedMobile = mobile.trim();
    const existing = await User.findOne({ mobile: normalizedMobile }).lean();
    if (existing)
      return res.status(400).json({ success: false, msg: "Mobile already registered" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      mobile: normalizedMobile,
      password: hashed,
      role: role || "user",
      signupDate: new Date(),
      accountStatus: "Active",
      loginCount: 0
    });

    const token = genToken(user);

    res.status(201).json({
      success: true,
      msg: "Signup successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role, 
        signupDate: user.signupDate,
        accountStatus: user.accountStatus
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        msg: "Mobile and password required"
      });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "User not found"
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        msg: "Invalid credentials"
      });
    }

    const now = new Date();
    const options = { timeZone: "Asia/Kolkata" };

    user.lastLoginDate = now;
    user.lastLoginTime = now.toLocaleTimeString("en-IN", options);
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const token = genToken(user);

    const cleanUserData = {
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      accountStatus: user.accountStatus,
      signupDate: user.signupDate,
      lastLoginDate: user.lastLoginDate,
      lastLoginTime: user.lastLoginTime,
      loginCount: user.loginCount,
    };

    if (user.role === "employee") {
      cleanUserData.department = user.department;
      cleanUserData.designation = user.designation;
      cleanUserData.employeeCode = user.employeeCode;
      cleanUserData.reportingTo = user.reportingTo;
      cleanUserData.allowedPermissions = user.allowedPermissions;
    }

    if (user.role === "partner") {
      cleanUserData.companyName = user.companyName;
      cleanUserData.businessType = user.businessType;
      cleanUserData.commissionType = user.commissionType;
      cleanUserData.commissionValue = user.commissionValue;
      cleanUserData.gstNumber = user.gstNumber;
      cleanUserData.address = user.address;
    }

    return res.status(200).json({
      success: true,
      msg: "Login successful",
      token,
      user: cleanUserData
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, mobile, password, department, designation, reportingTo, allowedPermissions } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        msg: "Name, mobile and password are required"
      });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(400).json({
        success: false,
        msg: "Mobile number already registered"
      });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const employee = await User.create({
      name,
      mobile,
      password: hashed,
      role: "employee",
      accountStatus: "Active",
      department: department || undefined,
      designation: designation || undefined,
      reportingTo: reportingTo || undefined,
      allowedPermissions: allowedPermissions || [],
      signupDate: new Date()
    });

    const cleanEmployee = Object.fromEntries(
      Object.entries(employee.toObject()).filter(([key, value]) => value !== null)
    );

    res.status(201).json({
      success: true,
      msg: "Employee created successfully",
      employee: cleanEmployee
    });

  } catch (err) {
    console.error("Employee create error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find(
      { role: "employee" },
      {
        _id: 1,
        name: 1,
        mobile: 1,
        department: 1,
        designation: 1,
        employeeCode: 1
      }
    ).sort({ name: 1 }).lean();

    res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });

  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ============================================
// ✅ UPDATED: Create Partner with Tagging
// ============================================
export const createPartner = async (req, res) => {
  try {
    const {
      name,
      mobile,
      password,
      companyName,
      businessType,
      commissionType,
      commissionValue,
      gstNumber,
      address,
      assignedEmployee,  // ✅ NEW
      assignedManager    // ✅ NEW
    } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        msg: "Name, mobile and password are required"
      });
    }

    // ✅ Validate Employee and Manager if provided
    if (assignedEmployee) {
      const employee = await User.findOne({ 
        _id: assignedEmployee, 
        role: "employee",
        accountStatus: "Active"
      });

      if (!employee) {
        return res.status(400).json({
          success: false,
          msg: "Invalid employee selected"
        });
      }
    }

    if (assignedManager) {
      const manager = await User.findOne({ 
        _id: assignedManager, 
        role: "employee",
        accountStatus: "Active"
      });

      if (!manager) {
        return res.status(400).json({
          success: false,
          msg: "Invalid manager selected"
        });
      }
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(400).json({
        success: false,
        msg: "Mobile number already registered"
      });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const partner = await User.create({
      name,
      mobile,
      password: hashed,
      role: "partner",
      accountStatus: "Active",
      companyName: companyName || undefined,
      businessType: businessType || undefined,
      commissionType: commissionType || undefined,
      commissionValue: commissionValue || undefined,
      gstNumber: gstNumber || undefined,
      address: address || undefined,
      assignedEmployee: assignedEmployee || null,  // ✅ NEW
      assignedManager: assignedManager || null,    // ✅ NEW
      signupDate: new Date()
    });

    // ✅ Populate employee and manager details
    const populatedPartner = await User.findById(partner._id)
      .populate('assignedEmployee', 'name employeeCode department designation')
      .populate('assignedManager', 'name employeeCode department designation')
      .select('-password')
      .lean();

    res.status(201).json({
      success: true,
      msg: "Partner created successfully",
      partner: populatedPartner
    });

  } catch (err) {
    console.error("Partner create error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};



// ============================================
// ✅ NEW: Update Partner Tagging
// ============================================
export const updatePartnerTagging = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { assignedEmployee, assignedManager } = req.body;

    // Find partner
    const partner = await User.findOne({ 
      _id: partnerId, 
      role: "partner" 
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        msg: "Partner not found"
      });
    }

    // Validate Employee if provided
    if (assignedEmployee) {
      const employee = await User.findOne({ 
        _id: assignedEmployee, 
        role: "employee",
        accountStatus: "Active"
      });

      if (!employee) {
        return res.status(400).json({
          success: false,
          msg: "Invalid employee selected"
        });
      }
      partner.assignedEmployee = assignedEmployee;
    }

    // Validate Manager if provided
    if (assignedManager) {
      const manager = await User.findOne({ 
        _id: assignedManager, 
        role: "employee",
        accountStatus: "Active"
      });

      if (!manager) {
        return res.status(400).json({
          success: false,
          msg: "Invalid manager selected"
        });
      }
      partner.assignedManager = assignedManager;
    }

    await partner.save();

    // Populate and return updated partner
    const updatedPartner = await User.findById(partner._id)
      .populate('assignedEmployee', 'name employeeCode department designation')
      .populate('assignedManager', 'name employeeCode department designation')
      .select('-password')
      .lean();

    res.status(200).json({
      success: true,
      msg: "Partner tagging updated successfully",
      partner: updatedPartner
    });

  } catch (err) {
    console.error("Update partner tagging error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ============================================
// ✅ NEW: Get Partners by Employee
// ============================================
export const getPartnersByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify employee exists
    const employee = await User.findOne({ 
      _id: employeeId, 
      role: "employee" 
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        msg: "Employee not found"
      });
    }

    // Find all partners assigned to this employee
    const partners = await User.find({
      role: "partner",
      assignedEmployee: employeeId
    })
    .populate('assignedEmployee', 'name employeeCode department')
    .populate('assignedManager', 'name employeeCode department')
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

    res.status(200).json({
      success: true,
      count: partners.length,
      employee: {
        id: employee._id,
        name: employee.name,
        employeeCode: employee.employeeCode
      },
      partners
    });

  } catch (err) {
    console.error("Get partners by employee error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ============================================
// ✅ NEW: Get Partners by Manager
// ============================================
export const getPartnersByManager = async (req, res) => {
  try {
    const { managerId } = req.params;

    // Verify manager exists
    const manager = await User.findOne({ 
      _id: managerId, 
      role: "employee" 
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        msg: "Manager not found"
      });
    }

    // Find all partners assigned to this manager
    const partners = await User.find({
      role: "partner",
      assignedManager: managerId
    })
    .populate('assignedEmployee', 'name employeeCode department')
    .populate('assignedManager', 'name employeeCode department')
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

    res.status(200).json({
      success: true,
      count: partners.length,
      manager: {
        id: manager._id,
        name: manager.name,
        employeeCode: manager.employeeCode
      },
      partners
    });

  } catch (err) {
    console.error("Get partners by manager error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, {
      _id: 1,
      name: 1,
      mobile: 1,
      userEmail: 1,
      signupDate: 1,
      lastLoginDate: 1,
      lastLoginTime: 1,
      loginCount: 1,
      accountStatus: 1,
      location: 1,
      role: 1
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Safety check
    if (!id) {
      return res.status(400).json({
        success: false,
        msg: "User ID required"
      });
    }

    // Prevent admin deleting himself (optional but recommended)
    if (req.user._id.toString() === id) {
      return res.status(403).json({
        success: false,
        msg: "Admin cannot delete own account"
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      msg: "User deleted successfully",
      deletedUser: {
        id: deletedUser._id,
        name: deletedUser.name,
        role: deletedUser.role
      }
    });

  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};

// ============================================
// ✅ FORGET PASSWORD FLOW (USING OTP MODEL)
// ============================================

/**
 * STEP 1: Send OTP
 * Uses separate OTP collection
 */
export const sendForgetPasswordOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        msg: "Mobile number is required"
      });
    }

    const normalizedMobile = mobile.trim();

    // Check if user exists
    const user = await User.findOne({ mobile: normalizedMobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found with this mobile number"
      });
    }

    // Generate OTP
    const otpResponse = await WhatsAppService.sendOTP(normalizedMobile);

    if (!otpResponse.success) {
      return res.status(500).json({
        success: false,
        msg: "Failed to send OTP"
      });
    }

    // Delete any existing OTPs for this mobile (cleanup)
    await OTP.deleteMany({ 
      mobile: normalizedMobile, 
      purpose: "forget-password" 
    });

    // Create new OTP record
    const otpRecord = await OTP.create({
      mobile: normalizedMobile,
      otp: otpResponse.data.otp,
      purpose: "forget-password",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      isUsed: false,
      attempts: 0
    });

    console.log("✅ OTP Created in Database:");
    console.log("   Mobile:", normalizedMobile);
    console.log("   OTP:", otpRecord.otp);
    console.log("   Expires:", otpRecord.expiresAt);

    return res.status(200).json({
      success: true,
      msg: "OTP sent successfully",
      data: {
        mobile: normalizedMobile,
        expiresIn: OTP_EXPIRY_MINUTES * 60,
            otp: otpRecord.otp   // 🔥 NOW OTP ALWAYS SENT

      }
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message
    });
  }
};

/**
 * STEP 2: Verify OTP
 * Checks OTP from separate collection
 */
export const verifyForgetPasswordOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        msg: "Mobile number and OTP are required"
      });
    }

    const normalizedMobile = mobile.trim();
    const normalizedOTP = otp.trim();

    // Check if user exists
    const user = await User.findOne({ mobile: normalizedMobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      mobile: normalizedMobile,
      purpose: "forget-password",
      isUsed: false
    }).sort({ createdAt: -1 }); // Get latest OTP

    console.log("🔍 DEBUG - Verifying OTP:");
    console.log("   Mobile:", normalizedMobile);
    console.log("   Stored OTP:", otpRecord?.otp);
    console.log("   Received OTP:", normalizedOTP);
    console.log("   Expiry:", otpRecord?.expiresAt);
    console.log("   Current Time:", new Date());

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        msg: "No OTP found. Please request a new OTP"
      });
    }

    // Check if OTP expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id }); // Cleanup
      return res.status(400).json({
        success: false,
        msg: "OTP has expired. Please request a new OTP"
      });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id }); // Cleanup
      return res.status(400).json({
        success: false,
        msg: "Too many failed attempts. Please request a new OTP"
      });
    }

    // Verify OTP
    if (otpRecord.otp !== normalizedOTP) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        msg: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining`
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Generate verification token
    const verificationToken = jwt.sign(
      { 
        mobile: normalizedMobile, 
        purpose: 'password-reset',
        otpId: otpRecord._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    console.log("✅ OTP Verified Successfully");

    return res.status(200).json({
      success: true,
      msg: "OTP verified successfully",
      data: {
        verificationToken,
        mobile: normalizedMobile
      }
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message
    });
  }
};

/**
 * STEP 3: Reset Password
 * Updates user password after token verification
 */
export const resetPassword = async (req, res) => {
  try {
    const { mobile, verificationToken, newPassword } = req.body;

    if (!mobile || !verificationToken || !newPassword) {
      return res.status(400).json({
        success: false,
        msg: "Mobile, verification token and new password are required"
      });
    }

    const normalizedMobile = mobile.trim();

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
      
      if (decoded.purpose !== 'password-reset' || decoded.mobile !== normalizedMobile) {
        return res.status(400).json({
          success: false,
          msg: "Invalid verification token"
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        msg: "Invalid or expired verification token"
      });
    }

    // Find user
    const user = await User.findOne({ mobile: normalizedMobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // Verify OTP was actually used
    const otpRecord = await OTP.findById(decoded.otpId);
    if (!otpRecord || !otpRecord.isUsed) {
      return res.status(400).json({
        success: false,
        msg: "Invalid verification. Please verify OTP again"
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        msg: "Password must be at least 6 characters long"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    console.log("✅ Password Reset Successfully for:", normalizedMobile);

    return res.status(200).json({
      success: true,
      msg: "Password reset successfully. You can now login with your new password"
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message
    });
  }
};



// Add this function to your auth.controller.js file

/**
 * Get User Profile by ID
 * Works for all roles: user, employee, partner, admin
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized - Invalid token"
      });
    }

    const loggedInId = req.user._id.toString();

    // User can only access their own profile (unless admin)
    if (userId !== loggedInId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        msg: "Access denied: You can only view your own profile"
      });
    }

    // Fetch user data without password
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // Base user data for all roles
    const userData = {
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      accountStatus: user.accountStatus,
      signupDate: user.signupDate,
      lastLoginDate: user.lastLoginDate,
      lastLoginTime: user.lastLoginTime,
      loginCount: user.loginCount || 0
    };

    // Add role-specific data
    if (user.role === "employee") {
      userData.department = user.department;
      userData.designation = user.designation;
      userData.employeeCode = user.employeeCode;
      userData.reportingTo = user.reportingTo;
      userData.allowedPermissions = user.allowedPermissions;
    }

    if (user.role === "partner") {
      userData.companyName = user.companyName;
      userData.businessType = user.businessType;
      userData.commissionType = user.commissionType;
      userData.commissionValue = user.commissionValue;
      userData.gstNumber = user.gstNumber;
      userData.address = user.address;
    }

    // Remove null/undefined values
    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== null && value !== undefined)
    );

    return res.status(200).json({
      success: true,
      msg: "User profile fetched successfully",
      data: cleanUserData
    });

  } catch (err) {
    console.error("Get user profile error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
};


// ============================================
// ✅ NEW: Update User by Admin (Edit any role + optional password change)
// ============================================
export const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      mobile,
      accountStatus,
      newPassword,
      // employee fields
      department,
      designation,
      employeeCode,
      // partner fields
      companyName,
      businessType,
      commissionType,
      commissionValue,
      gstNumber,
      address
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // Mobile change ke liye duplicate check
    if (mobile && mobile !== user.mobile) {
      const existing = await User.findOne({ mobile, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, msg: "Mobile number already in use by another account" });
      }
      user.mobile = mobile;
    }

    if (name !== undefined) user.name = name;
    if (accountStatus !== undefined) user.accountStatus = accountStatus;

    // Role-specific fields — sirf usi role ke user pe apply honge
    if (user.role === "employee") {
      if (department !== undefined) user.department = department;
      if (designation !== undefined) user.designation = designation;
      if (employeeCode !== undefined) user.employeeCode = employeeCode;
    }

    if (user.role === "partner") {
      if (companyName !== undefined) user.companyName = companyName;
      if (businessType !== undefined) user.businessType = businessType;
      if (commissionType !== undefined) user.commissionType = commissionType;
      if (commissionValue !== undefined) user.commissionValue = commissionValue;
      if (gstNumber !== undefined) user.gstNumber = gstNumber;
      if (address !== undefined) user.address = address;
    }

    // Password change (optional)
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, msg: "Password must be at least 6 characters long" });
      }
      user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    await user.save();

    const updatedUser = await User.findById(id).select("-password").lean();

    return res.status(200).json({
      success: true,
      msg: "User updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};










// other add for employee id


