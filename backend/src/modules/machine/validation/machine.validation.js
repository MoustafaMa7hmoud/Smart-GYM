const Joi = require('joi');

const createMachineSchema = Joi.object({
  name:          Joi.string().min(2).max(100).trim().required(),
  description:   Joi.string().max(1000).allow('').optional(),
  targetMuscles: Joi.array().items(Joi.string().trim()).max(10).optional(),
});

const updateMachineSchema = createMachineSchema
  .fork(['name'], (s) => s.optional())
  .min(1);

module.exports = { createMachineSchema, updateMachineSchema };
