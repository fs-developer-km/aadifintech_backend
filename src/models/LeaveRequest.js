// src/models/LeaveRequest.js
import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
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
  leaveType: {
    type: String,
    enum: ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Emergency Leave', 'Unpaid Leave', 'Work From Home'],
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  numberOfDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  attachments: [{
    filename: String,
    url: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
leaveRequestSchema.index({ employeeId: 1, status: 1 });
leaveRequestSchema.index({ fromDate: 1, toDate: 1 });

export default mongoose.model('LeaveRequest', leaveRequestSchema);