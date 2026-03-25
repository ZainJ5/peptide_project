'use strict';

const bcrypt = require('bcryptjs');

const { User } = require('../models');
const { safeUser } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const config = require('../config');

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

module.exports = {
  getMe,
  updateMe,
  updatePassword,
  deactivateMe,
};
