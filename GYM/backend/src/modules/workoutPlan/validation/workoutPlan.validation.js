const Joi = require('joi');

const generatePlanSchema = Joi.object({
  goal:  Joi.string().valid('weight_loss', 'muscle_gain', 'fitness').required(),
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

module.exports = { generatePlanSchema, updatePlanSchema };
