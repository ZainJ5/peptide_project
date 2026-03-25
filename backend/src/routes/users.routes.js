'use strict';

const express = require('express');
const { body } = require('express-validator');

const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const config = require('../config');
const {
  getMe,
  updateMe,
  updatePassword,
  deactivateMe,
} = require('../controllers/users.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', getMe);

router.patch('/me', [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim(),
  body('avatarUrl')
    .optional()
    .isURL({ protocols: ['https'], require_tld: true })
    .withMessage('Avatar URL must be a valid HTTPS URL')
    .custom((url) => {
      const { hostname } = new URL(url);
      if (config.avatarAllowedDomains.length > 0 && !config.avatarAllowedDomains.includes(hostname)) {
        throw new Error(`Avatar URL domain not allowed. Allowed: ${config.avatarAllowedDomains.join(', ')}`);
      }
      return true;
    }),
  validate,
], updateMe);

router.patch('/me/password', [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  validate,
], updatePassword);

router.delete('/me', deactivateMe);

module.exports = router;
