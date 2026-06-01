const Trainer     = require('../model/trainer.model');
const User        = require('../../user/model/user.model');
const ApiFeatures = require('../../../utils/apiFeatures');
const { ROLES }   = require('../../../utils/constants');
const ApiError    = require('../../../utils/ApiError');
const logger      = require('../../../utils/logger');

const SPEC_VALUES = [
  'weightLoss', 'bodyBuilding', 'cardio', 'yoga', 'crossfit', 'pilates',
  'nutrition', 'rehabilitation', 'kickboxing', 'stretching',
];

const DEFAULT_BIO =
  'Certified fitness professional dedicated to safe, effective training and helping every client reach their goals.';

const normalizeTrainerPayload = (data = {}) => {
  const rawSpecs = Array.isArray(data.specializations) ? data.specializations : [];
  const specializations = rawSpecs.filter((s) => SPEC_VALUES.includes(s));
  const bio = typeof data.bio === 'string' && data.bio.trim().length >= 50
    ? data.bio.trim()
    : DEFAULT_BIO;

  const payload = {
    bio,
    experience: data.experience ?? 0,
    sessionPrice: data.sessionPrice ?? 200,
    specializations: specializations.length ? specializations : ['bodyBuilding'],
    isAvailable: data.isAvailable !== false,
  };

  if (data.isApproved === true) payload.isApproved = true;
  if (data.sessionPrice != null) payload.sessionPrice = data.sessionPrice;
  if (data.experience != null) payload.experience = data.experience;

  return payload;
};

const createTrainerProfile = async (userId, data) => {
  const existing = await Trainer.findOne({ user: userId });
  if (existing) throw new ApiError(409, 'Trainer profile already exists for this user.');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  if (user.role !== ROLES.TRAINER) {
    user.role = ROLES.TRAINER;
    await user.save();
  }

  const trainer = await Trainer.create({ user: userId, ...normalizeTrainerPayload(data) });
  logger.info(`Trainer profile created for user: ${userId}`);
  return trainer.populate('user', 'fullName email profileImage');
};

const getAllTrainers = async (queryString) => {
  const features = new ApiFeatures(
    Trainer.find().populate('user', 'fullName email profileImage phone'),
    queryString
  )
    .filter()
    .sort()
    .paginate();

  const [trainers, total] = await Promise.all([
    features.query.exec(),
    features.count(),
  ]);

  return { total, ...features.meta, trainers };
};

const getTrainerById = async (id) => {
  const trainer = await Trainer.findById(id)
    .populate('user', 'fullName email profileImage phone')
    .populate('assignedUsers', 'fullName email profileImage');
  if (!trainer) throw new ApiError(404, 'Trainer not found.');
  return trainer;
};

const updateTrainer = async (id, data) => {
  const trainer = await Trainer.findByIdAndUpdate(id, data, {
    new: true, runValidators: true,
  }).populate('user', 'fullName email profileImage');
  if (!trainer) throw new ApiError(404, 'Trainer not found.');
  logger.info(`Trainer updated: ${id}`);
  return trainer;
};

const assignUserToTrainer = async (trainerId, userId) => {
  const [trainer, user] = await Promise.all([
    Trainer.findById(trainerId),
    User.findById(userId),
  ]);
  if (!trainer) throw new ApiError(404, 'Trainer not found.');
  if (!user)    throw new ApiError(404, 'User not found.');

  // Unassign from previous trainer
  if (user.assignedTrainer && String(user.assignedTrainer) !== trainerId) {
    await Trainer.findByIdAndUpdate(user.assignedTrainer, {
      $pull: { assignedUsers: userId },
    });
  }

  trainer.assignedUsers.addToSet(userId);
  await trainer.save();

  user.assignedTrainer = trainerId;
  await user.save();

  logger.info(`User ${userId} assigned to trainer ${trainerId}`);
  return trainer.populate('assignedUsers', 'fullName email');
};

const unassignUserFromTrainer = async (trainerId, userId) => {
  const trainer = await Trainer.findByIdAndUpdate(
    trainerId,
    { $pull: { assignedUsers: userId } },
    { new: true }
  );
  if (!trainer) throw new ApiError(404, 'Trainer not found.');

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
  assignUserToTrainer,
  unassignUserFromTrainer,
  deleteTrainer,
};
