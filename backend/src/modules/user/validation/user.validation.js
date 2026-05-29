const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name:  Joi.string().min(2).max(50).trim(),
  phone: Joi.string().trim().allow('', null),
  goal:  Joi.string().valid('weight_loss', 'muscle_gain', 'fitness').allow(null),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').allow(null),
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
