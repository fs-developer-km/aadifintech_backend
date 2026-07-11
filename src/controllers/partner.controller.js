import Partner from '../models/partner.model.js';
import OTP from '../models/otp.model.js';
import whatsappService from '../services/whatsapp.service.js';

// ✅ Generate 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// ==========================================
// SEND OTP (Step 1)
// ==========================================
export const sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    // Validation
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    // Mobile format check
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Must be 10 digits starting with 6-9'
      });
    }

    // Check if already registered and verified
    const existingPartner = await Partner.findOne({ mobile });
    if (existingPartner && existingPartner.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered and verified'
      });
    }

    // ✅ Rate limiting - 1 minute cooldown
    const recentOTP = await OTP.findOne({
      mobile,
      createdAt: { $gte: Date.now() - 60000 }
    });

    if (recentOTP) {
      const waitTime = Math.ceil((60000 - (Date.now() - recentOTP.createdAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitTime} seconds before requesting new OTP`
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Save to DB
    await OTP.create({
      mobile,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Send via WhatsApp
    await whatsappService.sendOTP(mobile, otp);

    console.log(`✅ OTP sent to ${mobile}: ${otp}`); // Development ke liye

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your WhatsApp',
      data: {
        mobile,
        expiresIn: 300, // seconds

         // ⚠️ ONLY FOR DEVELOPMENT
        otp: otp
      }
    });

  } catch (error) {
    console.error('❌ Send OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.'
    });
  }
};




// ==========================================
// VERIFY OTP & CREATE PARTNER (Step 2)
// ==========================================
export const verifyOTPAndRegister = async (req, res) => {
  try {
    const { name, mobile, otp } = req.body;

    // Validation
    if (!name || !mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile and OTP are required'
      });
    }

    // Name validation
    if (name.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 3 characters'
      });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      mobile,
      otp,
      expiresAt: { $gt: Date.now() },
      isUsed: false
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteMany({ mobile });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request new OTP'
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Check if partner exists
    let partner = await Partner.findOne({ mobile });

    if (partner) {
      // Update existing
      partner.name = name;
      partner.isVerified = true;
      partner.verifiedAt = new Date();
      await partner.save();
    } else {
      // Create new
      partner = await Partner.create({
        name,
        mobile,
        isVerified: true,
        verifiedAt: new Date()
      });
    }

    // Delete all OTPs for this mobile
    await OTP.deleteMany({ mobile });

    console.log(`✅ Partner registered: ${name} - ${mobile}`);

    return res.status(201).json({
      success: true,
      message: 'Partner registered successfully',
      data: {
        id: partner._id,
        name: partner.name,
        mobile: partner.mobile,
        isVerified: partner.isVerified,
        registeredAt: partner.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP Error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Verification failed'
    });
  }
};


// ==========================================
// DIRECT REGISTER (No OTP) — from website "Become a Partner" form
// ==========================================
export const registerPartnerDirect = async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      profession,
      city,
      state,
      experienceYears,
      companyName
    } = req.body;

    // Validation
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 3 characters'
      });
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobile || !mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Must be 10 digits starting with 6-9'
      });
    }

    const data = {
      name: name.trim(),
      mobile,
      email: email || undefined,
      profession: profession || undefined,
      city: city || undefined,
      state: state || undefined,
      experienceYears: experienceYears || undefined,
      companyName: companyName || undefined
    };

    let partner = await Partner.findOne({ mobile });

    if (partner) {
      // Same mobile dubara aaya toh existing record hi update kardo
      Object.assign(partner, data);
      await partner.save();
    } else {
      partner = await Partner.create(data);
    }

    console.log(`✅ Partner lead registered (no OTP): ${data.name} - ${mobile}`);

    return res.status(201).json({
      success: true,
      message: 'Partner lead submitted successfully',
      data: partner
    });

  } catch (error) {
    console.error('❌ Register Partner Direct Error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit lead'
    });
  }
};




// ==========================================
// RESEND OTP
// ==========================================
export const resendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    // Delete old OTPs
    await OTP.deleteMany({ mobile });

    // Generate new OTP
    const otp = generateOTP();

    // Save to DB
    await OTP.create({
      mobile,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Send via WhatsApp
    await whatsappService.sendOTP(mobile, otp);

    console.log(`✅ OTP resent to ${mobile}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        mobile,
        expiresIn: 300
      }
    });

  } catch (error) {
    console.error('❌ Resend OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};



// ==========================================
// GET ALL PARTNERS (Admin) - ✅ WITH DATE & TIME
// ==========================================
// export const getAllPartners = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 20, 
//       verified,
//       search,
//       sortBy = 'createdAt',
//       order = 'desc'
//     } = req.query;

//     // ✅ Build query
//     const query = {};
    
//     if (verified !== undefined) {
//       query.isVerified = verified === 'true';
//     }

//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { mobile: { $regex: search, $options: 'i' } }
//       ];
//     }

//     // ✅ Execute query with pagination
//     const partners = await Partner.find(query)
//       .select('name mobile isVerified verifiedAt createdAt updatedAt')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
//       .lean(); // ✅ For faster response

//     const total = await Partner.countDocuments(query);

//     // ✅ Format dates for better readability
//     const formattedPartners = partners.map(partner => ({
//       id: partner._id,
//       name: partner.name,
//       mobile: partner.mobile,
//       isVerified: partner.isVerified,
//       verifiedAt: partner.verifiedAt,
//       registeredDate: partner.createdAt, // ✅ Registration date
//       registeredTime: partner.createdAt, // ✅ Registration time
//       lastUpdated: partner.updatedAt,
//       // ✅ Formatted dates
//       registeredOn: new Date(partner.createdAt).toLocaleString('en-IN', {
//         dateStyle: 'medium',
//         timeStyle: 'short',
//         timeZone: 'Asia/Kolkata'
//       })
//     }));

//     return res.status(200).json({
//       success: true,
//       data: formattedPartners,
//       pagination: {
//         total,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         pages: Math.ceil(total / limit)
//       }
//     });

//   } catch (error) {
//     console.error('❌ Get Partners Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch partners'
//     });
//   }
// };



// ==========================================
// GET PARTNER BY ID
// ==========================================
// export const getPartnerById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const partner = await Partner.findById(id)
//       .select('name mobile isVerified verifiedAt createdAt updatedAt')
//       .lean();

//     if (!partner) {
//       return res.status(404).json({
//         success: false,
//         message: 'Partner not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         id: partner._id,
//         name: partner.name,
//         mobile: partner.mobile,
//         isVerified: partner.isVerified,
//         verifiedAt: partner.verifiedAt,
//         registeredAt: partner.createdAt,
//         lastUpdated: partner.updatedAt,
//         registeredOn: new Date(partner.createdAt).toLocaleString('en-IN', {
//           dateStyle: 'full',
//           timeStyle: 'medium',
//           timeZone: 'Asia/Kolkata'
//         })
//       }
//     });

//   } catch (error) {
//     console.error('❌ Get Partner Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch partner details'
//     });
//   }
// };


// ==========================================
// DELETE PARTNER (Admin)
// ==========================================
export const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findByIdAndDelete(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    console.log(`🗑️ Partner deleted: ${partner.name} - ${partner.mobile}`);

    return res.status(200).json({
      success: true,
      message: 'Partner deleted successfully',
      data: {
        id: partner._id,
        name: partner.name,
        mobile: partner.mobile
      }
    });

  } catch (error) {
    console.error('❌ Delete Partner Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete partner'
    });
  }
};


// ==========================================
// GET STATS (Admin Dashboard)
// ==========================================
export const getPartnerStats = async (req, res) => {
  try {
    const [total, verified, unverified, today] = await Promise.all([
      Partner.countDocuments(),
      Partner.countDocuments({ isVerified: true }),
      Partner.countDocuments({ isVerified: false }),
      Partner.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        verified,
        unverified,
        registeredToday: today
      }
    });

  } catch (error) {
    console.error('❌ Get Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};





// ---------------- CREATE PARTNER (Public Form) ----------------
// export const createPartner = async (req, res) => {
//   try {
//     // ✅ REQUEST LOG
//     console.log("📥 Incoming Request Body:", JSON.stringify(req.body, null, 2));

//     // ✅ DATA OBJECT
//     const data = {
//       fullName: req.body.fullName || "N/A",
//       email: req.body.email || "N/A",
//       phone: req.body.phone || "N/A",
//       profession: req.body.profession || "N/A",
//       city: req.body.city || "N/A",
//       state: req.body.state || "N/A",
//       loanTypes: req.body.loanTypes || [],
//       experienceYears: req.body.experienceYears || 0,
//       companyName: req.body.companyName || "N/A",
//       gstNumber: req.body.gstNumber || "N/A"
//     };

//     console.log("💾 Data Prepared for Save:", JSON.stringify(data, null, 2));

//     // ✅ DATABASE SAVE
//     const savedPartner = await Partner.create(data);

//     console.log("✅ Document Saved to DB:", JSON.stringify(savedPartner, null, 2));

//     // ✅ RESPONSE - PURE SAVED DOCUMENT RETURN KARO
//     return res.status(201).json({
//       success: true,
//       message: "Partner registration submitted successfully",
//       data: savedPartner.toObject()  // ✅ YE IMPORTANT HAI
//     });

//   } catch (error) {
//     console.error("❌ ERROR in createPartner:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


// // ---------------- GET ALL PARTNERS (Admin) ----------------
export const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// // ---------------- UPDATE STATUS (Admin) ----------------
export const updatePartnerStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    const updated = await Partner.findByIdAndUpdate(
      req.params.id,
      { status, adminRemarks },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Partner status updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// // ---------------- DELETE PARTNER (Admin) ----------------
// export const deletePartner = async (req, res) => {
//   try {
//     const partnerId = req.params.id;

//     const deleted = await Partner.findByIdAndDelete(partnerId);

//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "Partner not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Partner deleted successfully",
//       data: deleted,
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



// ---------------- GET PARTNER BY ID (Dashboard/Profile) ----------------
export const getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    res.status(200).json({
      success: true,
      data: partner,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
