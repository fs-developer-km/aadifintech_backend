import { body, param, query, validationResult } from "express-validator";

// Error handler for validation
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      msg: "Validation failed",
      errors: errors.array()
    });
  }
  next();
};

// Partner Lead Creation Validation
export const validatePartnerLead = [
  body("customerName")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Customer name must be between 2-100 characters"),
  
  body("customerMobile")
    .trim()
    .notEmpty()
    .withMessage("Customer mobile is required")
    .matches(/^\+?\d{10,15}$/)
    .withMessage("Invalid mobile number format"),
  
  body("customerEmail")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  
  body("loanType")
    .notEmpty()
    .withMessage("Loan type is required")
    .isIn(["Personal Loan", "Home Loan", "Business Loan", "Car Loan", "Education Loan", "Gold Loan", "Other"])
    .withMessage("Invalid loan type"),
  
  body("loanAmount")
    .notEmpty()
    .withMessage("Loan amount is required")
    .isNumeric()
    .withMessage("Loan amount must be a number")
    .custom((value) => value > 0)
    .withMessage("Loan amount must be greater than 0"),
  
  body("monthlyIncome")
    .optional()
    .isNumeric()
    .withMessage("Monthly income must be a number")
    .custom((value) => value >= 0)
    .withMessage("Monthly income cannot be negative"),
  
  body("employmentType")
    .optional()
    .isIn(["Salaried", "Self-Employed", "Business", "Professional", "Other"])
    .withMessage("Invalid employment type"),
  
  handleValidationErrors
];

// Lead Status Update Validation
export const validateLeadStatusUpdate = [
  param("id")
    .isMongoId()
    .withMessage("Invalid lead ID"),
  
  body("status")
    .optional()
    .isIn(["pending", "in-progress", "documents-pending", "approved", "disbursed", "rejected", "cancelled"])
    .withMessage("Invalid status"),
  
  body("subStatus")
    .optional()
    .isIn(["fresh", "follow-up", "callback", "meeting-scheduled", "documentation", "verification", "bank-processing", "final-approval"])
    .withMessage("Invalid sub-status"),
  
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority"),
  
  body("nextFollowUpDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for next follow-up"),
  
  body("sanctionedAmount")
    .optional()
    .isNumeric()
    .withMessage("Sanctioned amount must be a number")
    .custom((value) => value >= 0)
    .withMessage("Sanctioned amount cannot be negative"),
  
  body("interestRate")
    .optional()
    .isNumeric()
    .withMessage("Interest rate must be a number")
    .custom((value) => value >= 0 && value <= 100)
    .withMessage("Interest rate must be between 0-100"),
  
  body("tenure")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Tenure must be a positive integer"),
  
  handleValidationErrors
];

// Remark Validation
export const validateRemark = [
  param("id")
    .isMongoId()
    .withMessage("Invalid lead ID"),
  
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Remark message is required")
    .isLength({ min: 5, max: 1000 })
    .withMessage("Remark must be between 5-1000 characters"),
  
  handleValidationErrors
];

// Partner Creation Validation (Admin)
export const validatePartnerCreation = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID"),
  
  body("businessName")
    .trim()
    .notEmpty()
    .withMessage("Business name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Business name must be between 2-200 characters"),
  
  body("assignedEmployee")
    .notEmpty()
    .withMessage("Assigned employee is required")
    .isMongoId()
    .withMessage("Invalid employee ID"),
  
  body("assignedManager")
    .notEmpty()
    .withMessage("Assigned manager is required")
    .isMongoId()
    .withMessage("Invalid manager ID"),
  
  handleValidationErrors
];

// Query Validation for Pagination
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1-100"),
  
  query("status")
    .optional()
    .isIn(["pending", "in-progress", "documents-pending", "approved", "disbursed", "rejected", "cancelled"])
    .withMessage("Invalid status filter"),
  
  query("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority filter"),
  
  handleValidationErrors
];