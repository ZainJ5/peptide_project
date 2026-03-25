'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const config = require('../config');
const validate = require('../middleware/validate');
const {
  register,
  login,
  refresh,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  verifyEmail,
  resendVerificationCode,
} = require('../controllers/auth.controller');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Please try again in 15 minutes.' },
});

router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().optional(),
  validate,
], register);

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate,
], login);

router.post('/refresh', authLimiter, [
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
  validate,
], refresh);

router.post('/verify-email', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).withMessage('6-digit code required'),
  validate,
], verifyEmail);

router.post('/resend-verification', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  validate,
], resendVerificationCode);

router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  validate,
], forgotPassword);

router.post('/verify-reset-code', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).withMessage('6-digit code required'),
  validate,
], verifyResetCode);

router.post('/reset-password', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).withMessage('6-digit code required'),
  body('password').isLength({ min: 8 }),
  validate,
], resetPassword);

module.exports = router;
