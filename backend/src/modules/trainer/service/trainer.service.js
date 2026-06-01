const Trainer     = require('../model/trainer.model');
const User        = require('../../user/model/user.model');
const ApiFeatures = require('../../../utils/apiFeatures');
const { ROLES }   = require('../../../utils/constants');
const ApiError    = require('../../../utils/ApiError');
const logger      = require('../../../utils/logger');

// Fields to populate for the linked User document
const USER_FIELDS = 'fullName email avatar phone role';

const createTrainerProfile = async (userId, data) => {
  const existing = await Trainer.findOne({ user: userId });
  if (existing) throw new ApiError(409, 'Trainer profile already exists for this user.');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  if (user.role !== ROLES.TRAINER) {
    user.role = ROLES.TRAINER;
    await user.save();
  }

  const trainer = await Trainer.create({ user: userId, ...data });
  logger.info(`Trainer profile created for user: ${userId}`);
  return trainer.populate('user', USER_FIELDS);
};

const getAllTrainers = async (queryString) => {
  const features = new ApiFeatures(
    Trainer.find()
      .populate('user',          USER_FIELDS)
      .populate('assignedUsers', 'fullName email role'),
    queryString
  )
    .filter()
    .sort()
    .paginate();

  const [trainers, total] = await Promise.all([
    features.query,
    features.count(),
  ]);

  return { total, ...features.meta, trainers };
};

const getTrainerById = async (id) => {
  const trainer = await Trainer.findById(id)
    .populate('user',          USER_FIELDS)
    .populate('assignedUsers', 'fullName email role avatar');
  if (!trainer) throw new ApiError(404, 'Trainer not found.');
  return trainer;
};

const updateTrainer = async (id, data) => {
  const trainer = await Trainer.findByIdAndUpdate(id, data, {
    new: true, runValidators: true,
  }).populate('user', USER_FIELDS);
  if (!trainer) throw new ApiError(404, 'Trainer not found.');
  logger.info(`Trainer updated: ${id}`);
  return trainer;
};

const approveTrainer = async (id) => {
  const trainer = await Trainer.findByIdAndUpdate(
    id,
    { isApproved: true },
    { new: true, runValidators: true }
  ).populate('user', USER_FIELDS);
  if (!trainer) throw new ApiError(404, 'Trainer not found.');
  logger.info(`Trainer approved: ${id}`);
  return trainer;
};

const assignUserToTrainer = async (trainerId, userId) => {
  const [trainer, user] = await Promise.all([
    Trainer.findById(trainerId),
    User.findById(userId),
  ]);
  if (!trainer) throw new ApiError(404, 'Trainer not found.');
  if (!user)    throw new ApiError(404, 'User not found.');

  // Unassign from previous trainer first
  if (user.assignedTrainer && String(user.assignedTrainer) !== trainerId) {
    await Trainer.findByIdAndUpdate(user.assignedTrainer, {
      $pull: { assignedUsers: userId },
    });
  }

  trainer.assignedUsers.addToSet(userId);
  trainer.totalClients = trainer.assignedUsers.length;
  await trainer.save();

  user.assignedTrainer = trainerId;
  await user.save();

  logger.info(`User ${userId} assigned to trainer ${trainerId}`);
  return trainer.populate('assignedUsers', 'fullName email role');
};

const unassignUserFromTrainer = async (trainerId, userId) => {
  const trainer = await Trainer.findByIdAndUpdate(
    trainerId,
    { $pull: { assignedUsers: userId } },
    { new: true }
  );
  if (!trainer) throw new ApiError(404, 'Trainer not found.');

  // Update totalClients count
  trainer.totalClients = trainer.assignedUsers.length;
  await trainer.save();

  await User.findByIdAndUpdate(userId, { assignedTrainer: null });
  logger.info(`User ${userId} unassigned from trainer ${trainerId}`);
  return trainer;
};

const deleteTrainer = async (id) => {
  const trainer = await Trainer.findByIdAndDelete(id);
  if (!trainer) throw new ApiError(404, 'Trainer not found.');
  await User.updateMany({ assignedTrainer: id }, { assignedTrainer: null });
  logger.warn(`Trainer deleted: ${id}`);
};

module.exports = {
  createTrainerProfile,
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  approveTrainer,
  assignUserToTrainer,
  unassignUserFromTrainer,
  deleteTrainer,
};
