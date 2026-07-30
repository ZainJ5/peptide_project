'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { User } = require('../models');
const { safeUser } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const config = require('../config');
const emailService = require('../services/emailService');

/** Generate a 6-digit numeric code */
function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function getMe(req, res) {
  return res.json({ success: true, data: safeUser(req.user) });
}

async function updateMe(req, res, next) {
  try {
    const { firstName, lastName, avatarUrl } = req.body;

    await req.user.update({
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    });

    return res.json({ success: true, data: safeUser(req.user) });
  } catch (err) {
    next(err);
  }
}

async function updatePassword(req, res, next) {
  try {
    const user = await User.scope('withPassword').findByPk(req.user.id);

    const match = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
    if (!match) throw createError('Current password is incorrect.', 400);

    const passwordHash = await bcrypt.hash(req.body.newPassword, config.bcrypt.rounds);
    await user.update({ passwordHash });

    return res.json({ success: true, message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
}

async function deactivateMe(req, res, next) {
  try {
    await req.user.update({ isActive: false });
    return res.json({ success: true, message: 'Account deactivated.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Step 1 of permanent account deletion — email a 6-digit confirmation code.
 * Requires authentication; the code is sent to the account's verified email,
 * so deletion can only be completed by someone with access to that inbox.
 */
async function requestAccountDeletion(req, res, next) {
  try {
    const user = await User.scope('withTokens').findByPk(req.user.id);
    if (!user) throw createError('Account not found.', 404);

    const code = generateCode();
    await user.update({
      deletionToken: code,
      deletionTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await emailService.sendAccountDeletionEmail(user.email, code);

    return res.json({
      success: true,
      message: 'A confirmation code has been sent to your email.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Step 2 of permanent account deletion — verify the emailed code, then delete.
 * Cascades: schedules, schedule items and calendar events are removed;
 * upvotes are removed; community posts are anonymized (user_id set to null).
 */
async function confirmAccountDeletion(req, res, next) {
  try {
    const { code } = req.body;

    const user = await User.scope('withTokens').findByPk(req.user.id);
    if (!user || !user.deletionToken || user.deletionToken !== String(code)) {
      throw createError('Invalid confirmation code.', 400);
    }

    if (!user.deletionTokenExpires || user.deletionTokenExpires < new Date()) {
      throw createError('Confirmation code has expired. Please request a new one.', 400);
    }

    await user.destroy(); // permanent

    return res.json({
      success: true,
      message: 'Your account has been permanently deleted.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  updatePassword,
  deactivateMe,
  requestAccountDeletion,
  confirmAccountDeletion,
};
