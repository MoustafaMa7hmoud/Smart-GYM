const Joi = require('joi');

// ── Goal normalization mapping ─────────────────────────────────────────────
const GOAL_ALIASES = {
  'weight_loss': 'weightLoss',
  'weightloss': 'weightLoss',
  'lose_weight': 'weightLoss',
  'loseweight': 'weightLoss',
  'muscle_gain': 'muscleGain',
  'musclegain': 'muscleGain',
  'build_muscle': 'muscleGain',
  'buildmuscle': 'muscleGain',
  'muscle_building': 'muscleGain',
  'general_fitness': 'generalFitness',
  'generalfitness': 'generalFitness',
  'sport_performance': 'sportPerformance',
  'sportperformance': 'sportPerformance',
  'athletic': 'sportPerformance',
  'rehab': 'rehabilitation',
  'recovery': 'rehabilitation',
};

const normalizeGoal = (value) => {
  if (!value) return value;
  const key = value.toLowerCase().replace(/[-_\s]/g, '_');
  return GOAL_ALIASES[key] || value;
};

const validGoals = ['weightLoss', 'muscleGain', 'endurance', 'flexibility', 'generalFitness', 'rehabilitation', 'sportPerformance'];
const allGoalVariations = [
  ...validGoals,
  'weight_loss', 'weightloss', 'lose_weight', 'loseweight', 'weight loss',
  'muscle_gain', 'musclegain', 'build_muscle', 'buildmuscle', 'muscle building', 'muscle gain',
  'general_fitness', 'generalfitness', 'general fitness',
  'sport_performance', 'sportperformance', 'sport performance', 'athletic',
  'rehab', 'recovery',
  'endurance',
  'flexibility',
];

const generatePlanSchema = Joi.object({
  goal: Joi.string()
    .valid(...allGoalVariations)
    .required()
    .messages({
      'any.only': 'goal must be one of [weightLoss, muscleGain, endurance, flexibility, generalFitness, rehabilitation, sportPerformance]',
    }),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
});

const exerciseInDaySchema = Joi.object({
  exercise:    Joi.string().hex().length(24).required(),
  sets:        Joi.number().min(1).max(20),
  reps:        Joi.number().min(1).max(100),
  restSeconds: Joi.number().min(0).max(600),
  notes:       Joi.string().allow(''),
});

const workoutDaySchema = Joi.object({
  day:       Joi.string().required(),
  focus:     Joi.string().allow(''),
  exercises: Joi.array().items(exerciseInDaySchema),
});

const updatePlanSchema = Joi.object({
  title:         Joi.string().min(3).max(100),
  durationWeeks: Joi.number().min(1).max(52),
  days:          Joi.array().items(workoutDaySchema),
  isActive:      Joi.boolean(),
});

module.exports = { generatePlanSchema, updatePlanSchema, normalizeGoal };
