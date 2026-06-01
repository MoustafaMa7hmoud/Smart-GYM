const { BodyMeasurement, WorkoutLog } = require('../model/progress.model');
const ApiFeatures = require('../../../utils/apiFeatures');
const ApiError    = require('../../../utils/ApiError');
const logger      = require('../../../utils/logger');

const createWorkoutLog = async (userId, data) => {
  const log = await WorkoutLog.create({ user: userId, ...data });
  logger.info(`Workout log created: user ${userId}, date ${data.workoutDate}`);
  return log;
};

const createBodyMeasurement = async (userId, data) => {
  const measurement = await BodyMeasurement.create({
    user: userId,
    recordedBy: userId,
    ...data,
  });
  logger.info(`Body measurement created: user ${userId}, date ${data.measurementDate}`);
  return measurement;
};

const getWorkoutProgress = async (userId, queryString) => {
  const features = new ApiFeatures(
    WorkoutLog.find({ user: userId }).populate('exercise', 'name muscle level'),
    queryString
  ).filter().sort().paginate();

  const [items] = await Promise.all([features.query, features.count()]);
  return { items, meta: features.meta };
};

const getBodyMeasurements = async (userId, queryString) => {
  const features = new ApiFeatures(
    BodyMeasurement.find({ user: userId }),
    queryString
  ).filter().sort().paginate();

  const [items] = await Promise.all([features.query, features.count()]);
  return { items, meta: features.meta };
};

const getProgressStats = async (userId, exerciseId) => {
  const match = { user: userId };
  if (exerciseId) match.exercise = exerciseId;

  const exerciseStats = await WorkoutLog.aggregate([
    { $match: match },
    {
      $group: {
        _id:           '$exercise',
        totalSessions: { $sum: 1 },
        totalSets:     { $sum: { $size: '$sets' } },
        avgSets:       { $avg: { $size: '$sets' } },
        lastSession:   { $max: '$workoutDate' },
        firstSession:  { $min: '$workoutDate' },
      },
    },
    {
      $lookup: {
        from: 'exercises', localField: '_id',
        foreignField: '_id', as: 'exercise',
      },
    },
    { $unwind: { path: '$exercise', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        totalSessions: 1,
        totalSets: 1,
        avgSets: 1,
        lastSession: 1,
        firstSession: 1,
        'exercise.name': 1,
        'exercise.muscle': 1,
        'exercise.level': 1,
      },
    },
    { $sort: { totalSessions: -1 } },
  ]);

  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const weeklyProgress = await WorkoutLog.aggregate([
    { $match: { ...match, workoutDate: { $gte: eightWeeksAgo } } },
    {
      $group: {
        _id: { year: { $year: '$workoutDate' }, week: { $isoWeek: '$workoutDate' } },
        sessions: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);

  const [summary] = await WorkoutLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        uniqueExercises: { $addToSet: '$exercise' },
      },
    },
    {
      $project: {
        _id: 0,
        totalSessions: 1,
        uniqueExercisesCount: { $size: '$uniqueExercises' },
      },
    },
  ]);

  return {
    summary: summary || { totalSessions: 0, uniqueExercisesCount: 0 },
    exerciseStats,
    weeklyProgress,
  };
};

const deleteWorkoutLog = async (id, userId) => {
  const log = await WorkoutLog.findOneAndDelete({ _id: id, user: userId });
  if (!log) throw new ApiError(404, 'Workout log not found.');
  logger.info(`Workout log deleted: ${id} by user ${userId}`);
};

module.exports = {
  createWorkoutLog,
  createBodyMeasurement,
  getWorkoutProgress,
  getBodyMeasurements,
  getProgressStats,
  deleteWorkoutLog,
};

