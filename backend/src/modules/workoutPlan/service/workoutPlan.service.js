const WorkoutPlan   = require('../model/workoutPlan.model');
const Exercise      = require('../../exercise/model/exercise.model');
const ApiFeatures   = require('../../../utils/apiFeatures');
const ApiError      = require('../../../utils/ApiError');
const logger        = require('../../../utils/logger');

// ── Plan blueprints: goal → training parameters ───────────────────────────
const BLUEPRINT = {
  'weightLoss':      { sets: 3, reps: '15', restSeconds: 45  },
  'muscleGain':      { sets: 4, reps: '8',  restSeconds: 90  },
  'endurance':       { sets: 3, reps: '12', restSeconds: 60  },
  'flexibility':     { sets: 2, reps: '12', restSeconds: 60  },
  'generalFitness':  { sets: 3, reps: '12', restSeconds: 60  },
  'rehabilitation':  { sets: 2, reps: '10', restSeconds: 90  },
  'sportPerformance': { sets: 4, reps: '6-8', restSeconds: 90 },
};

const DAYS_BY_LEVEL = {
  'beginner':     ['monday', 'wednesday', 'friday'],
  'intermediate': ['monday', 'tuesday', 'thursday', 'friday'],
  'advanced':     ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
};

const MUSCLE_SPLIT = {
  'beginner': [
    ['chest', 'triceps'],
    ['back', 'biceps'],
    ['legs', 'shoulders'],
  ],
  'intermediate': [
    ['chest', 'triceps'],
    ['back', 'biceps'],
    ['legs'],
    ['shoulders', 'core'],
  ],
  'advanced': [
    ['chest'],
    ['back'],
    ['legs'],
    ['shoulders', 'traps'],
    ['arms'],
    ['core', 'cardio'],
  ],
};

const DURATION_WEEKS = {
  'beginner':     4,
  'intermediate': 8,
  'advanced':     12,
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
        dayNumber: idx + 1,
        dayName: day,
        muscleGroups: muscles,
        isRestDay: false,
        exercises: exercises.map((ex, order) => ({
          exercise:    ex._id,
          order:       order + 1,
          sets:        blueprint.sets,
          reps:        blueprint.reps,
          restSeconds: blueprint.restSeconds,
        })),
      };
    })
  );

  const goalText = goal.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `${goalText} — ${level.charAt(0).toUpperCase() + level.slice(1)}`;

  const plan = await WorkoutPlan.create({
    user:          userId,
    title,
    goal,
    level,
    durationWeeks: DURATION_WEEKS[level],
    daysPerWeek:   days.length,
    days:          workoutDays,
    createdBy:     userId,
    status:        'active',
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
