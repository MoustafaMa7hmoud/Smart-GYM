const attendanceService = require('../service/attendance.service');
const catchAsync        = require('../../../utils/catchAsync');
const ApiResponse       = require('../../../utils/ApiResponse');
const { HTTP }          = require('../../../utils/constants');

const checkIn = catchAsync(async (req, res) => {
  const log = await attendanceService.checkIn(req.user._id);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, log, 'Checked in successfully.'));
});

const checkOut = catchAsync(async (req, res) => {
  const log = await attendanceService.checkOut(req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, log, 'Checked out successfully.'));
});

const getMyAttendance = catchAsync(async (req, res) => {
  const result = await attendanceService.getMyAttendance(req.user._id, req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result.items, 'Attendance list retrieved.', result.meta));
});

const getAttendanceStats = catchAsync(async (req, res) => {
  const stats = await attendanceService.getAttendanceStats(req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, stats));
});

const getAllAttendance = catchAsync(async (req, res) => {
  const result = await attendanceService.getAllAttendance(req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result));
});

module.exports = { checkIn, checkOut, getMyAttendance, getAttendanceStats, getAllAttendance };
