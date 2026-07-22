/**
 * @file errorHandler.js
 * @description Global error handling middleware for Express application.
 */

/**
 * Global catch-all error handling middleware.
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err.stack || err.message);

  const statusCode = err.statusCode || res.statusCode || 500;
  const finalStatus = statusCode >= 400 ? statusCode : 500;

  return res.status(finalStatus).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack || err.toString() : 'An unexpected error occurred',
  });
};

module.exports = errorHandler;
