const Joi = require('joi');

const createSubscriptionSchema = Joi.object({
  plan:           Joi.string().valid('basic', 'standard', 'premium').required()
                    .messages({ 'any.required': 'Please select a subscription plan' }),
  durationMonths: Joi.number().integer().valid(1, 3, 6, 12).default(1)
                    .messages({ 'any.only': 'Duration must be 1, 3, 6, or 12 months' }),
});

module.exports = { createSubscriptionSchema };
