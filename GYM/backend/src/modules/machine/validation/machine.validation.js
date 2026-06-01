const Joi = require('joi');

const CATEGORIES = ['cardio', 'strength', 'freeWeights', 'functional', 'stretching', 'recovery'];
const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'calves', 'fullBody'];

const muscleGroupsField = Joi.alternatives().try(
  Joi.array().items(Joi.string().valid(...MUSCLE_GROUPS)).min(1),
  Joi.string().trim().custom((val, helpers) => {
    const parsed = val.split(',').map((s) => {
      const x = s.trim().toLowerCase();
      return x === 'fullbody' ? 'fullBody' : x;
    }).filter((s) => MUSCLE_GROUPS.includes(s));
    if (!parsed.length) return helpers.error('any.invalid');
    return parsed;
  })
).required();

const createMachineSchema = Joi.object({
  name:          Joi.string().min(3).max(100).trim().required(),
  category:      Joi.string().valid(...CATEGORIES).required(),
  muscleGroups:  muscleGroupsField,
  brand:         Joi.string().max(50).allow('').optional(),
  status:        Joi.string().valid('active', 'maintenance', 'outOfService', 'retired').optional(),
  notes:         Joi.string().max(500).allow('').optional(),
  instructions:  Joi.string().max(2000).allow('').optional(),
  location:      Joi.object({
    floor: Joi.number().min(0).optional(),
    zone:  Joi.string().valid('A', 'B', 'C', 'D', 'E').optional(),
  }).optional(),
  // legacy aliases accepted from older clients
  targetMuscles: Joi.array().items(Joi.string().valid(...MUSCLE_GROUPS)).optional(),
  description:   Joi.string().max(500).allow('').optional(),
});

const updateMachineSchema = createMachineSchema
  .fork(['name', 'category', 'muscleGroups'], (s) => s.optional())
  .min(1);

module.exports = { createMachineSchema, updateMachineSchema };
