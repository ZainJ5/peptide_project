'use strict';

const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const validate = require('../middleware/validate');
const config = require('../config');
const { sendNewsletterSubscriptionEmail } = require('../services/emailService');
const { createError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many subscription attempts. Please try again later.' },
});

router.post('/subscribe', newsletterLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  validate,
], async (req, res, next) => {
  try {
    if (!config.email.adminTo) {
      throw createError('Admin email is not configured.', 500);
    }

    const { email } = req.body;

    await sendNewsletterSubscriptionEmail(email);

    return res.status(201).json({
      success: true,
      message: 'Subscribed successfully! We will keep you updated.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
