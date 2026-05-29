const Joi = require('joi');

const createExerciseSchema = Joi.object({
  name:        Joi.string().min(2).max(100).trim().required(),
  muscle:      Joi.string().trim().required(),
  machine:     Joi.string().hex().length(24).allow(null, '').optional(),
  description: Joi.string().max(2000).allow('').optional(),
  tips:        Joi.array().items(Joi.string().trim()).max(20).optional(),
  mistakes:    Joi.array().items(Joi.string().trim()).max(20).optional(),
  level:       Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  category:    Joi.string().valid('strength', 'cardio', 'flexibility', 'balance').optional(),
});

const updateExerciseSchema = createExerciseSchema.fork(
  ['name', 'muscle', 'level'],
  (s) => s.optional()
).min(1);

module.exports = { createExerciseSchema, updateExerciseSchema };
