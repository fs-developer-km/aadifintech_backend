import User from "../models/user.model.js";
import bcrypt from "bcrypt";              
import jwt from "jsonwebtoken";

// SALT rounds for bcrypt
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "12", 10);

// Generate JWT token
const genToken = (user) => {
  return jwt.sign(
    { id: user._id, mobile: user.mobile, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ----------------- SIGNUP -----------------
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
        signupDate: user.signupDate,
        accountStatus: user.accountStatus
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};



// ----------------- LOGIN -----------------

// ----------------- LOGIN -----------------
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password)
      return res.status(400).json({ success: false, msg: "Mobile and password required" });

    const user = await User.findOne({ mobile });
    if (!user)
      return res.status(400).json({ success: false, msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ success: false, msg: "Invalid credentials" });

    // ✅ Update login details
    const now = new Date();
    const options = { timeZone: "Asia/Kolkata" }; // for IST time
    user.lastLoginDate = now;
    user.lastLoginTime = now.toLocaleTimeString("en-IN", options);
    user.loginCount = (user.loginCount || 0) + 1;

    await user.save();

    const token = genToken(user);

    res.status(200).json({
      success: true,
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        signupDate: user.signupDate,
        lastLoginDate: user.lastLoginDate,
        lastLoginTime: user.lastLoginTime,
        loginCount: user.loginCount,
        accountStatus: user.accountStatus,
        role:user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};




// get all user login


// ⚡ Get all users (admin only ideally)
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

