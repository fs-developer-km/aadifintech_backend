// src/controllers/attendance.controller.js
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/user.model.js';

// ==================== EMPLOYEE SIDE APIs ====================

// 1. CHECK-IN (with location and fraud prevention)
export const checkIn = async (req, res) => {
  try {
    const { latitude, longitude, address, deviceInfo } = req.body;
    const employeeId = req.user.id; // from auth middleware

    // Get employee details
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get today's date (start and end of day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today',
        attendance: existingAttendance
      });
    }

    // Calculate if late
    const checkInTime = new Date();
    const officeStartTime = new Date();
    officeStartTime.setHours(9, 30, 0, 0); // 9:30 AM
    const isLate = checkInTime > officeStartTime;
    const lateByMinutes = isLate ? Math.round((checkInTime - officeStartTime) / 60000) : 0;

    // Create attendance record
    const attendance = new Attendance({
      employeeId,
      employeeName: employee.name,
      employeeCode: employee.employeeCode || 'N/A',
      date: todayStart,
      checkInTime,
      checkInLocation: {
        latitude,
        longitude,
        address: address || 'Unknown'
      },
      isLate,
      lateByMinutes,
      ipAddress: req.ip,
      deviceInfo: deviceInfo || req.headers['user-agent']
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Check-in successful',
      attendance
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 2. CHECK-OUT
export const checkOut = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const employeeId = req.user.id;

    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find today's attendance
    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No check-in found for today. Please check-in first.'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today'
      });
    }

    // Calculate if early out
    const checkOutTime = new Date();
    const officeEndTime = new Date();
    officeEndTime.setHours(18, 0, 0, 0); // 6:00 PM
    const isEarlyOut = checkOutTime < officeEndTime;
    const earlyOutByMinutes = isEarlyOut ? Math.round((officeEndTime - checkOutTime) / 60000) : 0;

    // Update attendance
    attendance.checkOutTime = checkOutTime;
    attendance.checkOutLocation = {
      latitude,
      longitude,
      address: address || 'Unknown'
    };
    attendance.isEarlyOut = isEarlyOut;
    attendance.earlyOutByMinutes = earlyOutByMinutes;

    // Calculate work duration
    const duration = (checkOutTime - attendance.checkInTime) / (1000 * 60);
    attendance.workDuration = Math.round(duration);

    // Determine status based on work hours
    if (attendance.workDuration < 240) { // Less than 4 hours
      attendance.status = 'Half-Day';
    } else {
      attendance.status = 'Present';
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Check-out successful',
      attendance
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 3. GET TODAY'S ATTENDANCE
export const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    res.status(200).json({
      success: true,
      attendance: attendance || null,
      hasCheckedIn: !!attendance,
      hasCheckedOut: attendance ? !!attendance.checkOutTime : false
    });

  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 4. GET MY ATTENDANCE HISTORY
export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { page = 1, limit = 30, startDate, endDate } = req.query;

    const query = { employeeId };

    // Date filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      attendance,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 5. GET MONTHLY SUMMARY
export const getMonthlySummary = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const attendance = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate statistics
    const totalPresent = attendance.filter(a => a.status === 'Present').length;
    const totalHalfDay = attendance.filter(a => a.status === 'Half-Day').length;
    const totalLate = attendance.filter(a => a.isLate).length;
    const totalEarlyOut = attendance.filter(a => a.isEarlyOut).length;

    const totalWorkMinutes = attendance.reduce((sum, a) => sum + a.workDuration, 0);
    const averageWorkHours = attendance.length > 0 ? (totalWorkMinutes / attendance.length / 60).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      summary: {
        month: currentMonth,
        year: currentYear,
        totalPresent,
        totalHalfDay,
        totalLate,
        totalEarlyOut,
        totalWorkingDays: attendance.length,
        averageWorkHours
      },
      attendance
    });

  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 6. REQUEST LEAVE
export const requestLeave = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leaveType, fromDate, toDate, reason } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Calculate number of days
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const numberOfDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = new LeaveRequest({
      employeeId,
      employeeName: employee.name,
      employeeCode: employee.employeeCode || 'N/A',
      leaveType,
      fromDate: from,
      toDate: to,
      numberOfDays,
      reason
    });

    await leaveRequest.save();

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      leaveRequest
    });

  } catch (error) {
    console.error('Request leave error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 7. GET MY LEAVE REQUESTS
export const getMyLeaveRequests = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const leaveRequests = await LeaveRequest.find({ employeeId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leaveRequests
    });

  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==================== ADMIN SIDE APIs ====================

// 8. GET ALL EMPLOYEES ATTENDANCE (TODAY)
export const getAllTodayAttendance = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd }
    }).populate('employeeId', 'name mobile employeeCode');

    // Get all employees
    const allEmployees = await User.find({ role: 'employee' });

    // Find who hasn't checked in
    const checkedInIds = attendance.map(a => a.employeeId._id.toString());
    const absentEmployees = allEmployees.filter(emp => 
      !checkedInIds.includes(emp._id.toString())
    );

    res.status(200).json({
      success: true,
      present: attendance,
      absent: absentEmployees,
      stats: {
        totalEmployees: allEmployees.length,
        present: attendance.length,
        absent: absentEmployees.length
      }
    });

  } catch (error) {
    console.error('Get all today attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 9. GET EMPLOYEE ATTENDANCE BY ID
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;

    const query = { employeeId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('employeeId', 'name mobile employeeCode');

    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      attendance,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 10. GET ATTENDANCE BY DATE RANGE
export const getAttendanceByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const attendance = await Attendance.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('employeeId', 'name mobile employeeCode');

    res.status(200).json({
      success: true,
      attendance
    });

  } catch (error) {
    console.error('Get attendance by date range error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 11. GET MONTHLY REPORT
// 11. GET MONTHLY REPORT — Har employee ka Present/Absent/HalfDay/Leave/Late breakdown
export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const workingDays = new Date(currentYear, currentMonth, 0).getDate(); // month ke total days

    // ✅ Saare employees lo (agar employeeId diya hai to sirf usko)
    const employeeQuery = { role: 'employee' };
    if (employeeId) employeeQuery._id = employeeId;
    const allEmployees = await User.find(employeeQuery).select('name mobile employeeCode');

    // Month ke saare attendance records
    const attendanceQuery = { date: { $gte: startDate, $lte: endDate } };
    if (employeeId) attendanceQuery.employeeId = employeeId;
    const attendance = await Attendance.find(attendanceQuery);

    // Month ke saare approved leaves (overlap check)
    const leaveQuery = {
      status: 'Approved',
      fromDate: { $lte: endDate },
      toDate: { $gte: startDate }
    };
    if (employeeId) leaveQuery.employeeId = employeeId;
    const leaves = await LeaveRequest.find(leaveQuery);

    // ✅ Har employee ke liye full report banao — chahe uska record ho ya na ho
    const report = allEmployees.map(emp => {
      const empIdStr = emp._id.toString();
      const empAttendance = attendance.filter(a => a.employeeId.toString() === empIdStr);

      const totalPresent = empAttendance.filter(a => a.status === 'Present').length;
      const totalHalfDay = empAttendance.filter(a => a.status === 'Half-Day').length;
      const totalLate = empAttendance.filter(a => a.isLate).length;
      const totalEarlyOut = empAttendance.filter(a => a.isEarlyOut).length;
      const totalWorkHours = empAttendance.reduce((sum, a) => sum + (a.workDuration || 0), 0) / 60;

      const empLeaves = leaves.filter(l => l.employeeId.toString() === empIdStr);
      const totalLeave = empLeaves.reduce((sum, l) => sum + (l.numberOfDays || 0), 0);

      // ✅ Absent = Working Days - (Present + Half-Day + Leave), 0 se kam nahi ho sakta
      const markedDays = totalPresent + totalHalfDay + totalLeave;
      const totalAbsent = Math.max(workingDays - markedDays, 0);

      return {
        employee: emp,
        totalPresent,
        totalHalfDay,
        totalLate,
        totalEarlyOut,
        totalLeave,
        totalAbsent,
        totalWorkHours: Number(totalWorkHours.toFixed(1)),
        workingDays
      };
    });

    res.status(200).json({
      success: true,
      month: currentMonth,
      year: currentYear,
      workingDays,
      totalEmployees: allEmployees.length,
      report
    });

  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 12. APPROVE/REJECT LEAVE
export const manageLeaveRequest = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Approved or Rejected'
      });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leaveRequest.status = status;
    leaveRequest.approvedBy = adminId;
    leaveRequest.approvedDate = new Date();
    if (status === 'Rejected' && rejectionReason) {
      leaveRequest.rejectionReason = rejectionReason;
    }

    await leaveRequest.save();

    res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      leaveRequest
    });

  } catch (error) {
    console.error('Manage leave request error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 13. GET ALL LEAVE REQUESTS
export const getAllLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    const leaveRequests = await LeaveRequest.find(query)
      .populate('employeeId', 'name mobile employeeCode')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leaveRequests
    });

  } catch (error) {
    console.error('Get all leave requests error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 14. MANUAL ATTENDANCE ENTRY
export const manualAttendanceEntry = async (req, res) => {
  try {
    const {
      employeeId,
      date,
      checkInTime,
      checkOutTime,
      status,
      remarks
    } = req.body;
    const adminId = req.user.id;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existing = await Attendance.findOne({
      employeeId,
      date: attendanceDate
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already exists for this date'
      });
    }

    const checkIn = new Date(checkInTime);
    const checkOut = checkOutTime ? new Date(checkOutTime) : null;
    const duration = checkOut ? (checkOut - checkIn) / (1000 * 60) : 0;

    const attendance = new Attendance({
      employeeId,
      employeeName: employee.name,
      employeeCode: employee.employeeCode || 'N/A',
      date: attendanceDate,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      workDuration: Math.round(duration),
      status: status || 'Present',
      remarks: remarks || 'Manual entry by admin',
      isManualEntry: true,
      approvedBy: adminId,
      checkInLocation: {
        latitude: 0,
        longitude: 0,
        address: 'Manual Entry'
      }
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Manual attendance entry created successfully',
      attendance
    });

  } catch (error) {
    console.error('Manual attendance entry error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 15. GET ATTENDANCE STATISTICS
export const getAttendanceStatistics = async (req, res) => {
  try {
    const { month, year } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const totalEmployees = await User.countDocuments({ role: 'employee' });

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    });

    const totalPresent = attendance.filter(a => a.status === 'Present').length;
    const totalHalfDay = attendance.filter(a => a.status === 'Half-Day').length;
    const totalLate = attendance.filter(a => a.isLate).length;
    const totalEarlyOut = attendance.filter(a => a.isEarlyOut).length;

    const workingDays = new Date(currentYear, currentMonth, 0).getDate();
    const expectedAttendance = totalEmployees * workingDays;

    res.status(200).json({
      success: true,
      statistics: {
        month: currentMonth,
        year: currentYear,
        totalEmployees,
        workingDays,
        totalPresent,
        totalHalfDay,
        totalLate,
        totalEarlyOut,
        expectedAttendance,
        actualAttendance: attendance.length,
        attendancePercentage: ((attendance.length / expectedAttendance) * 100).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Get attendance statistics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};