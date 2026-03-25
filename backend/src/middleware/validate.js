'use strict';

const { validationResult } = require('express-validator');

/**
 * Validation middleware factory.
 *
 * Place this after an array of express-validator check() rules.
 * If any rule fails it returns 422 with the full list of field errors.
 *
 * Usage:
 *   router.post('/endpoint', [
 *     body('email').isEmail(),
 *     body('password').isLength({ min: 8 }),
 *     validate,
 *   ], handler);
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error:   'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
