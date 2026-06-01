const Attendance    = require('../model/attendance.model');
const { Subscription } = require('../../subscription/model/subscription.model');
const ApiFeatures   = require('../../../utils/apiFeatures');
const ApiError      = require('../../../utils/ApiError');
const { SUBSCRIPTION_STATUSES } = require('../../../utils/constants');
const logger        = require('../../../utils/logger');

const checkIn = async (userId, notes) => {
  const activeSubscription = await Subscription.findOne({
    user: userId,
    status: SUBSCRIPTION_STATUSES.ACTIVE,
  }).sort('-createdAt');

  if (!activeSubscription) {
    throw new ApiError(400, 'Active subscription is required before checking in.');
  }

  const openSession = await Attendance.findOne({ user: userId, checkOut: null });
  if (openSession) {
    throw new ApiError(400, 'You already have an open check-in session. Please check out first.');
  }

  const log = await Attendance.create({
    user: userId,
    subscription: activeSubscription._id,
    checkIn: new Date(),
    notes: notes || '',
  });

  logger.info(`Check-in: user ${userId} at ${log.checkIn}`);
  return log;
};

const checkOut = async (userId, notes) => {
  const session = await Attendance.findOne({ user: userId, checkOut: null }).sort('-checkIn');
  if (!session) throw new ApiError(400, 'No active check-in session found.');

  session.checkOut = new Date();
  if (notes) session.notes = notes;
  await session.save();

  logger.info(`Check-out: user ${userId}, duration: ${session.duration} min`);
  return session;
};

const getMyAttendance = async (userId, queryString) => {
  const features = new ApiFeatures(
    Attendance.find({ user: userId }),
    queryString
  ).filter().sort().paginate();

  const [items] = await Promise.all([features.query, features.count()]);
  return { items, meta: features.meta };
};

const getAttendanceStats = async (userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [stats] = await Attendance.aggregate([
    { $match: { user: userId, checkIn: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        totalMinutes: { $sum: { $ifNull: ['$duration', 0] } },
        avgDuration: { $avg: { $ifNull: ['$duration', 0] } },
      },
    },
  ]);

  return stats || { totalVisits: 0, totalMinutes: 0, avgDuration: 0 };
};

const getAllAttendance = async (queryString) => {
  const features = new ApiFeatures(
    Attendance.find().populate('user', 'fullName email'),
    queryString
  ).filter().sort().paginate();

  const [items, total] = await Promise.all([features.query, features.count()]);
  return { items, total, meta: features.meta };
};

module.exports = { checkIn, checkOut, getMyAttendance, getAttendanceStats, getAllAttendance };
