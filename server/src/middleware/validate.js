/**
 * @file validate.js
 * @description Express middleware to validate request bodies against Zod schemas.
 */

/**
 * Middleware factory for validating req.body using Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod validation schema
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${formattedErrors}`,
        error: error.errors,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid request body',
      error: error.message,
    });
  }
};

module.exports = validate;
