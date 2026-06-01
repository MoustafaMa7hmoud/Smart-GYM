const WorkoutPlan   = require('../model/workoutPlan.model');
const Exercise      = require('../../exercise/model/exercise.model');
const ApiFeatures   = require('../../../utils/apiFeatures');
const { GOALS, LEVELS, PLAN_CREATED_BY } = require('../../../utils/constants');
const ApiError      = require('../../../utils/ApiError');
const logger        = require('../../../utils/logger');

// ── Plan blueprints: goal → training parameters ───────────────────────────
const BLUEPRINT = {
  [GOALS.WEIGHT_LOSS]:  { sets: 3, reps: 15, restSeconds: 45  },
  [GOALS.MUSCLE_GAIN]:  { sets: 4, reps: 8,  restSeconds: 90  },
  [GOALS.FITNESS]:      { sets: 3, reps: 12, restSeconds: 60  },
};

const DAYS_BY_LEVEL = {
  [LEVELS.BEGINNER]:     ['Monday', 'Wednesday', 'Friday'],
  [LEVELS.INTERMEDIATE]: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
  [LEVELS.ADVANCED]:     ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const MUSCLE_SPLIT = {
  [LEVELS.BEGINNER]: [
    ['chest', 'triceps'],
    ['back', 'biceps'],
    ['legs', 'shoulders'],
  ],
  [LEVELS.INTERMEDIATE]: [
    ['chest', 'triceps'],
    ['back', 'biceps'],
    ['legs'],
    ['shoulders', 'core'],
  ],
  [LEVELS.ADVANCED]: [
    ['chest'],
    ['back'],
    ['legs'],
    ['shoulders', 'traps'],
    ['arms'],
    ['core', 'cardio'],
  ],
};

const DURATION_WEEKS = {
  [LEVELS.BEGINNER]:     4,
  [LEVELS.INTERMEDIATE]: 8,
  [LEVELS.ADVANCED]:     12,
};

/**
 * Auto-generate a structured workout plan for a user.
 */
const generatePlan = async (userId, { goal, level }) => {
  const blueprint = BLUEPRINT[goal];
  const days      = DAYS_BY_LEVEL[level];
  const splits    = MUSCLE_SPLIT[level];

  if (!blueprint) throw new ApiError(400, `Invalid goal: ${goal}`);
  if (!days)      throw new ApiError(400, `Invalid level: ${level}`);

  const workoutDays = await Promise.all(
    days.map(async (day, idx) => {
      const muscles = splits[idx % splits.length];
      const focus   = muscles.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ');

      const exercises = await Exercise.find({
        muscle:   { $in: muscles.map((m) => new RegExp(`^${m}$`, 'i')) },
        level,
        isActive: true,
      })
        .limit(4)
        .select('_id name muscle');

      return {
        day,
        focus,
        exercises: exercises.map((ex) => ({
          exercise:    ex._id,
          sets:        blueprint.sets,
          reps:        blueprint.reps,
          restSeconds: blueprint.restSeconds,
        })),
      };
    })
  );

  const title = `${goal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} — ${level}`;

  const plan = await WorkoutPlan.create({
    user:          userId,
    title,
    goal,
    level,
    durationWeeks: DURATION_WEEKS[level],
    days:          workoutDays,
    createdBy:     PLAN_CREATED_BY.AUTO,
  });

  logger.info(`Workout plan auto-generated for user ${userId}: "${title}"`);

  return plan.populate({
    path:   'days.exercises.exercise',
    select: 'name muscle level video image',
  });
};

const getUserPlans = async (userId, queryString) => {
  const features = new ApiFeatures(
    WorkoutPlan.find({ user: userId, status: 'active' }),
    queryString
  )
    .filter()
    .sort()
    .paginate();

  const [plans] = await Promise.all([
    features.query.populate('days.exercises.exercise', 'name muscle level'),
    features.count(),
  ]);

  return { items: plans, meta: features.meta };
};

const getPlanById = async (id, userId) => {
  const plan = await WorkoutPlan.findOne({ _id: id, user: userId })
    .populate('days.exercises.exercise');
  if (!plan) throw new ApiError(404, 'Workout plan not found.');
  return plan;
};

const updatePlan = async (id, userId, data) => {
  const plan = await WorkoutPlan.findOneAndUpdate(
    { _id: id, user: userId },
    data,
    { new: true, runValidators: true }
  ).populate('days.exercises.exercise', 'name muscle level');
  if (!plan) throw new ApiError(404, 'Workout plan not found.');
  logger.info(`Workout plan updated: ${id}`);
  return plan;
};

const deletePlan = async (id, userId) => {
  const plan = await WorkoutPlan.findOneAndDelete({ _id: id, user: userId });
  if (!plan) throw new ApiError(404, 'Workout plan not found.');
  logger.info(`Workout plan deleted: ${id}`);
};

module.exports = { generatePlan, getUserPlans, getPlanById, updatePlan, deletePlan };
