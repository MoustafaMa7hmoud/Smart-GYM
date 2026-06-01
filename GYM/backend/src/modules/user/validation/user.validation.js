const Joi = require('joi');
const { GOALS, LEVELS } = require('../../../utils/constants');

const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(3).max(60).trim(),
  phone:    Joi.string()
              .trim()
              .pattern(/^(\+20|0)(10|11|12|15)[0-9]{8}$/)
              .allow('', null)
              .messages({ 'string.pattern.base': 'Please enter a valid Egyptian phone number' }),
  goal:     Joi.string().valid(...Object.values(GOALS)).allow(null),
  level:    Joi.string().valid(...Object.values(LEVELS)).allow(null),
}).min(1).messages({ 'object.min': 'Please provide at least one field to update' });

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
                     .messages({ 'any.required': 'Current password is required' }),
  newPassword:     Joi.string().min(8).max(72).required()
                     .invalid(Joi.ref('currentPassword'))
                     .messages({
                       'string.min':   'New password must be at least 8 characters',
                       'any.invalid':  'New password must be different from current password',
                     }),
});

module.exports = { updateProfileSchema, changePasswordSchema };
