// src/models/Attendance.js
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeCode: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  checkInTime: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  checkInLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String }
  },
  checkOutLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  workDuration: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Half-Day', 'Absent', 'Leave', 'Holiday', 'Week-Off'],
    default: 'Present'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateByMinutes: {
    type: Number,
    default: 0
  },
  isEarlyOut: {
    type: Boolean,
    default: false
  },
  earlyOutByMinutes: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: {
    type: String
  },
  deviceInfo: {
    type: String
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  manualEntryReason: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate check-ins on same day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Index for faster queries
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ employeeId: 1, createdAt: -1 });

// Calculate work duration before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkOutTime && this.checkInTime) {
    const duration = (this.checkOutTime - this.checkInTime) / (1000 * 60); // minutes
    this.workDuration = Math.round(duration);
  }
  next();
});

export default mongoose.model('Attendance', attendanceSchema);