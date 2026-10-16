'use strict';

const bcrypt = require('bcryptjs');

const config = require('../../config');
const { Admin } = require('../../models');
const logger = require('../../utils/logger');
const { createError } = require('../../middleware/errorHandler');
const {
  signAdminToken,
  tokenExpiresAt,
  safeAdmin,
  ADMIN_SENTINEL_HASH,
} = require('../../middleware/adminAuth');

function issueSession(admin) {
  const token = signAdminToken(admin);
  return { token, expiresAt: tokenExpiresAt(token), admin: safeAdmin(admin) };
}

function minutesUntil(date) {
  return Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / 60_000));
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const admin = await Admin.scope('withPassword').findOne({ where: { username } });

    if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
      throw createError(
        `Too many failed attempts. This account is locked for ${minutesUntil(admin.lockedUntil)} more minute(s).`,
        423
      );
    }

    // Always run a full bcrypt compare so timing doesn't reveal valid usernames.
    const passwordMatch = await bcrypt.compare(password, admin?.passwordHash ?? ADMIN_SENTINEL_HASH);

    if (!admin || !admin.isActive || !passwordMatch) {
      if (admin) {
        const attempts = admin.failedLoginAttempts + 1;
        const lock = attempts >= config.admin.maxFailedLogins;
        await admin.update({
          failedLoginAttempts: lock ? 0 : attempts,
          lockedUntil: lock ? new Date(Date.now() + config.admin.lockoutMinutes * 60_000) : null,
        });
        logger.warn('Admin login failed', { username, ip: req.ip, attempts, locked: lock });
        if (lock) {
          throw createError(
            `Too many failed attempts. This account is locked for ${config.admin.lockoutMinutes} minutes.`,
            423
          );
        }
      }
      throw createError('Invalid username or password.', 401);
    }

    await admin.update({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: (req.ip || '').slice(0, 64) || null,
    });

    logger.info('Admin signed in', { adminId: admin.id, ip: req.ip });
    return res.json({ success: true, ...issueSession(admin) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  return res.json({ success: true, admin: safeAdmin(req.admin) });
}

/** Revokes every token issued to this admin (all devices). */
async function logout(req, res, next) {
  try {
    await req.admin.increment('tokenVersion');
    return res.json({ success: true, message: 'Signed out.' });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.scope('withPassword').findByPk(req.admin.id);

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) throw createError('Current password is incorrect.', 400);
    if (currentPassword === newPassword) {
      throw createError('New password must be different from the current password.', 400);
    }

    await admin.update({
      passwordHash: await bcrypt.hash(newPassword, config.bcrypt.rounds),
      passwordChangedAt: new Date(),
      tokenVersion: admin.tokenVersion + 1,
    });

    logger.info('Admin password changed', { adminId: admin.id });
    // Other sessions are now revoked; hand this one a fresh token.
    return res.json({ success: true, message: 'Password updated.', ...issueSession(admin) });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me, logout, changePassword };
