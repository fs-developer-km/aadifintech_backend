// // src/middlewares/auth.middleware.js
// import jwt from "jsonwebtoken";

// export const protect = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith("Bearer ")) {
//       return res.status(401).json({ success: false, msg: "Unauthorized - Token missing" });
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     return res.status(401).json({ success: false, msg: "Invalid or expired token" });
//   }
// };

// export const verifyAdmin = (req, res, next) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({
//         success: false,
//         msg: "Access denied. Admin only."
//       });
//     }
//     next();
//   } catch (err) {
//     res.status(500).json({ success: false, msg: "Authentication error" });
//   }
// };


// // ✅ Role-based access (only admin)
// export const isAdmin = (req, res, next) => {
//   try {
//     if (req.user?.role !== "admin") {
//       return res.status(403).json({ success: false, msg: "Access denied: Admins only" });
//     }
//     next();
//   } catch (err) {
//     return res.status(500).json({ success: false, msg: "Server error in role check" });
//   }
// };




// afte verify token add code  if any issue then uncomment uper code and comment below code

// src/middlewares/auth.middleware.js
// import jwt from "jsonwebtoken";

// // =============================================
// // ✅ PROTECT Middleware - Verify JWT Token
// // =============================================
// export const protect = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader?.startsWith("Bearer ")) {
//       return res.status(401).json({
//         success: false,
//         msg: "Unauthorized - Token missing"
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // ⭐ FIX: id ko _id me map kar diya
//     req.user = {
//       _id: decoded.id,
//       role: decoded.role,
//       mobile: decoded.mobile
//     };

//     next();

//   } catch (err) {
//     return res.status(401).json({
//       success: false,
//       msg: "Invalid or expired token"
//     });
//   }
// };

// // =============================================
// // 🔥 verifyAdmin Middleware - Only Admin Access
// // =============================================
// export const verifyAdmin = (req, res, next) => {
//   try {
//     if (!req.user || req.user.role !== "admin") {
//       return res.status(403).json({
//         success: false,
//         msg: "Access denied. Admin only."
//       });
//     }

//     next();

//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       msg: "Authentication error"
//     });
//   }
// };

 

// yha tak sab working hai




// next beginn for cloud 

// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

// =============================================
// ✅ PROTECT Middleware - Verify JWT Token
// =============================================
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized - Token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ⭐ Store user info in req.user
    req.user = {
      id: decoded.id,        // for attendance APIs
      _id: decoded.id,       // for existing code compatibility
      role: decoded.role,
      mobile: decoded.mobile,
      name: decoded.name     // useful for attendance records
    };

    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      msg: "Invalid or expired token"
    });
  }
};

// =============================================
// 🔥 verifyAdmin Middleware - Only Admin Access
// =============================================
export const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Admin only."
      });
    }

    next();

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Authentication error"
    });
  }
};

// =============================================
// 👨‍💼 verifyEmployee Middleware - Only Employee Access
// =============================================
export const verifyEmployee = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Employee only."
      });
    }

    next();

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Authentication error"
    });
  }
};

// =============================================
// 🔓 authorizeRoles - Multiple Role Authorization
// =============================================
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        msg: "Not authorized - No user found"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: `Access denied. Role '${req.user.role}' is not authorized.`
      });
    }

    next();
  };
};

// =============================================
// 🔐 verifyPartner Middleware - Only Partner Access
// =============================================
export const verifyPartner = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "partner") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Partner only."
      });
    }

    next();

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Authentication error"
    });
  }
};

// =============================================
// 🛡️ Optional Auth - Allow both authenticated and guest
// =============================================
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        id: decoded.id,
        _id: decoded.id,
        role: decoded.role,
        mobile: decoded.mobile,
        name: decoded.name
      };
    }

    next();

  } catch (err) {
    // If token is invalid, just continue without user
    next();
  }
};

