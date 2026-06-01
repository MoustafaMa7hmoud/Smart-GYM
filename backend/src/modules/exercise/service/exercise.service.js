const Exercise           = require('../model/exercise.model');
const Trainer            = require('../../trainer/model/trainer.model');
const ApiFeatures        = require('../../../utils/apiFeatures');
const cloudinaryService  = require('../../../integrations/cloudinary.service');
const { CLOUDINARY_FOLDERS, ROLES } = require('../../../utils/constants');
const ApiError           = require('../../../utils/ApiError');
const logger             = require('../../../utils/logger');

const createExercise = async (data, files) => {
  if (files?.video?.[0]) {
    data.video        = files.video[0].path;
    data.videoPublicId = files.video[0].filename;
  }
  if (files?.image?.[0]) {
    data.image        = files.image[0].path;
    data.imagePublicId = files.image[0].filename;
  }
  const exercise = await Exercise.create(data);
  logger.info(`Exercise created: ${exercise.name} (${exercise._id})`);
  return exercise;
};

// Verify that user owns the exercise or is an admin
const verifyExerciseOwnership = async (exerciseId, userId, userRole) => {
  const exercise = await Exercise.findById(exerciseId);
  if (!exercise) throw new ApiError(404, 'Exercise not found.');

  // Admins can update any exercise
  if (userRole === ROLES.ADMIN) return exercise;

  // For trainers, verify they own the exercise
  if (userRole === ROLES.TRAINER) {
    const trainer = await Trainer.findOne({ user: userId });
    if (!trainer) throw new ApiError(403, 'Trainer profile not found.');
    
    // Check if exercise belongs to this trainer
    if (String(exercise.trainerId) !== String(trainer._id)) {
      throw new ApiError(403, 'You can only update exercises you created.');
    }
  }

  return exercise;
};

const getAllExercises = async (queryString) => {
  // Build initial query - always filter by isActive: true
  let baseQuery = Exercise.find({ isActive: true });
  
  // If trainerId is provided in query, also filter by trainerId
  if (queryString.trainerId) {
    baseQuery = Exercise.find({ isActive: true, trainerId: queryString.trainerId });
  }
  
  const features = new ApiFeatures(
    baseQuery.populate('machine', 'name targetMuscles'),
    queryString
  )
    .filter()
    .search(['name', 'description', 'muscle'])
    .sort()
    .limitFields()
    .paginate();

  const [exercises, total] = await Promise.all([
    features.query,
    features.count(),
  ]);

  return { total, ...features.meta, exercises };
};

const getExerciseById = async (id) => {
  const exercise = await Exercise.findById(id).populate('machine');
  if (!exercise || !exercise.isActive) throw new ApiError(404, 'Exercise not found.');
  return exercise;
};

const updateExercise = async (id, data, files) => {
  const exercise = await Exercise.findById(id);
  if (!exercise) throw new ApiError(404, 'Exercise not found.');

  if (files?.video?.[0]) {
    await cloudinaryService.deleteAsset(exercise.videoPublicId, 'video');
    data.video        = files.video[0].path;
    data.videoPublicId = files.video[0].filename;
  }
  if (files?.image?.[0]) {
    await cloudinaryService.deleteAsset(exercise.imagePublicId, 'image');
    data.image        = files.image[0].path;
    data.imagePublicId = files.image[0].filename;
  }

  const updated = await Exercise.findByIdAndUpdate(id, data, {
    new: true, runValidators: true,
  }).populate('machine');

  logger.info(`Exercise updated: ${updated.name} (${id})`);
  return updated;
};

const deleteExercise = async (id) => {
  const exercise = await Exercise.findById(id);
  if (!exercise) throw new ApiError(404, 'Exercise not found.');

  await Promise.all([
    cloudinaryService.deleteAsset(exercise.videoPublicId, 'video'),
    cloudinaryService.deleteAsset(exercise.imagePublicId, 'image'),
  ]);

  await exercise.deleteOne();
  logger.info(`Exercise deleted: ${exercise.name} (${id})`);
};

module.exports = {
  createExercise,
  verifyExerciseOwnership,
  getAllExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
};
