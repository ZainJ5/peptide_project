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
  requestAccountDeletion,
  confirmAccountDeletion,
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

// ── Permanent account deletion (email-verified, 2 steps) ──
// Step 1: email a 6-digit confirmation code to the logged-in user.
router.post('/me/deletion/request', requestAccountDeletion);
// Step 2: confirm with the code → account is permanently deleted.
router.post('/me/deletion/confirm', [
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('A 6-digit code is required'),
  validate,
], confirmAccountDeletion);

module.exports = router;
