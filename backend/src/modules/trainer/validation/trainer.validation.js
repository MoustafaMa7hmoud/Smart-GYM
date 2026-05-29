const Joi = require('joi');

const createTrainerSchema = Joi.object({
  bio:             Joi.string().max(500).allow(''),
  specializations: Joi.array().items(Joi.string().trim()).max(10),
  certifications:  Joi.array().items(Joi.string().trim()).max(10),
  experience:      Joi.number().min(0).max(50),
  isAvailable:     Joi.boolean(),
});

const updateTrainerSchema = createTrainerSchema;

module.exports = { createTrainerSchema, updateTrainerSchema };
