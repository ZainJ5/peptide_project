'use strict';

const logger = require('../utils/logger');
const config = require('../config');

/**
 * Global Error Handler Middleware
 *
 * Catches all errors passed via next(err) and returns
 * a consistent JSON error response.
 *
 * In development: includes the full stack trace.
 * In production:  only exposes the message for operational errors.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Sequelize validation / unique constraint errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors.map((e) => e.message);
    return res.status(400).json({ success: false, error: 'Validation error', details });
  }

  // Sequelize foreign key errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ success: false, error: 'Referenced record does not exist.' });
  }

  // Known operational errors (created via createError)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }

  // Unexpected errors — log with requestId for traceability
  logger.error('Unhandled error', {
    requestId: req.requestId,
    method:    req.method,
    path:      req.path,
    message:   err.message,
    stack:     err.stack,
  });

  return res.status(500).json({
    success: false,
    error:   'Internal server error.',
    ...(config.isDev && { stack: err.stack }),
  });
}

/**
 * 404 handler — register after all routes.
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error:   `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Create a typed operational error with an HTTP status code.
 *
 * @param {string} message
 * @param {number} [statusCode=500]
 * @returns {Error}
 */
function createError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { errorHandler, notFound, createError };
