const Joi = require('joi');

const specEnum = [
  'weightLoss', 'bodyBuilding', 'cardio', 'yoga', 'crossfit', 'pilates',
  'nutrition', 'rehabilitation', 'kickboxing', 'stretching',
];

const createTrainerSchema = Joi.object({
  bio:             Joi.string().min(50).max(1000),
  specializations: Joi.array().items(Joi.string().valid(...specEnum)).min(1).max(10),
  certifications:  Joi.array().items(Joi.string().trim()).max(10),
  experience:      Joi.number().min(0).max(50),
  sessionPrice:    Joi.number().min(0).max(10000),
  currency:        Joi.string().valid('EGP', 'USD'),
  isAvailable:     Joi.boolean(),
  isApproved:      Joi.boolean(),
});

const updateTrainerSchema = Joi.object({
  bio:             Joi.string().min(50).max(1000),
  specializations: Joi.array().items(Joi.string().valid(...specEnum)).min(1).max(10),
  certifications:  Joi.array().items(Joi.string().trim()).max(10),
  experience:      Joi.number().min(0).max(50),
  sessionPrice:    Joi.number().min(0).max(10000),
  currency:        Joi.string().valid('EGP', 'USD'),
  isAvailable:     Joi.boolean(),
  isApproved:      Joi.boolean(),
}).min(1);

module.exports = { createTrainerSchema, updateTrainerSchema };
