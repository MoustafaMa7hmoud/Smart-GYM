const ApiError = require('../utils/ApiError');
const { ERROR_CODES } = require('../utils/constants');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  validate — Joi schema validation middleware factory.
 *
 *  Can validate req.body (default), req.query, or req.params by passing
 *  a `source` option.
 *
 *  Usage:
 *    validate(schema)                         → validates req.body
 *    validate(schema, { source: 'query' })    → validates req.query
 *    validate(schema, { source: 'params' })   → validates req.params
 *    validate(schema, { stripUnknown: false }) → keep unknown keys
 * ─────────────────────────────────────────────────────────────────────────────
 */
const validate = (schema, options = {}) => {
  const { source = 'body', stripUnknown = true } = options;

  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly:   false,
      stripUnknown,
      convert:      true,    // coerce types (e.g. string → number for query params)
    });

    if (error) {
      const details = error.details.map((d) => ({
        field:   d.path.join('.'),
        message: d.message.replace(/['"]/g, ''), // strip surrounding quotes
      }));
      const message = details.map((d) => d.message).join('; ');
      return next(
        new ApiError(400, message, ERROR_CODES.VALIDATION_ERROR, { errors: details })
      );
    }

    // Replace the source with the sanitised + coerced Joi output
    req[source] = value;
    next();
  };
};

module.exports = validate;
