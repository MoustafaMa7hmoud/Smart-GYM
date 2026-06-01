const Joi = require('joi');

const workoutSetSchema = Joi.object({
  setNumber: Joi.number().integer().min(1).required(),
  reps:      Joi.number().integer().min(1).max(200).required(),
  weight:    Joi.number().min(0).max(1000).default(0),
  notes:     Joi.string().max(200).allow('').optional(),
});

const createWorkoutSchema = Joi.object({
  exercise: Joi.string().hex().length(24).required()
    .messages({ 'any.required': 'Exercise ID is required' }),
  workoutDate: Joi.date().iso().max('now').default(() => new Date()),
  sets: Joi.array().items(workoutSetSchema).min(1).required()
    .messages({
      'any.required': 'sets is required',
      'array.min': 'At least one set is required',
    }),
  notes: Joi.string().max(500).allow('').optional(),
});

const createBodySchema = Joi.object({
  measurementDate: Joi.date().iso().max('now').default(() => new Date()),
  weight: Joi.number().min(20).max(300).optional(),
  bodyFat: Joi.number().min(2).max(60).optional(),
  chest: Joi.number().min(0).optional(),
  waist: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).allow('').optional(),
}).or('weight', 'bodyFat', 'chest', 'waist')
  .messages({ 'object.missing': 'At least one measurement field is required' });

module.exports = { createWorkoutSchema, createBodySchema };

