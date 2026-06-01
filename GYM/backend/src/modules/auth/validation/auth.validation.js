const Joi = require('joi');

const registerSchema = Joi.object({
  fullName: Joi.string()
    .min(3)
    .max(60)
    .trim()
    .pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/)
    .required()
    .messages({
      'string.min':          'Full name must be at least 3 characters',
      'string.max':          'Full name cannot exceed 60 characters',
      'string.pattern.base': 'Full name can only contain letters and spaces',
      'any.required':        'Full name is required',
    }),

  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^(\+20|0)(10|11|12|15)[0-9]{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid Egyptian phone number (e.g. 01012345678)',
      'any.required':        'Phone number is required',
    }),

  password: Joi.string()
    .min(8)
    .max(72)
    .required()
    .messages({
      'string.min':   'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),

  gender: Joi.string()
    .valid('male', 'female')
    .required()
    .messages({
      'any.only':     'Gender must be male or female',
      'any.required': 'Gender is required',
    }),

  dateOfBirth: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.base':    'Please provide a valid date of birth',
      'date.format':  'Date of birth must be in ISO format (YYYY-MM-DD)',
      'date.max':     'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required',
    }),

  role: Joi.string()
    .valid('user', 'trainer')
    .default('user'),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };