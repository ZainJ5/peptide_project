'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { User, PendingUser } = require('../models');
const { signToken, signRefreshToken, safeUser, PASSWORD_SENTINEL_HASH } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const config = require('../config');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/** Generate a 6-digit numeric code */
function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if active user already exists
    const existingUser = await User.scope('withPassword').findOne({ where: { email } });
    if (existingUser) throw createError('An account with this email already exists.', 409);

    const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);
    const verificationCode = generateCode();

    // Upsert into PendingUser to handle multiple attempts
    let pendingUser = await PendingUser.findOne({ where: { email } });
    if (pendingUser) {
      await pendingUser.update({
        passwordHash,
        firstName,
        lastName: lastName || null,
        verificationToken: verificationCode,
        verificationTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
      });
    } else {
      pendingUser = await PendingUser.create({
        email,
        passwordHash,
        firstName,
        lastName: lastName || null,
        verificationToken: verificationCode,
        verificationTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
      });
    }

    // Await email delivery so failures bubble up to the client
    await emailService.sendVerificationEmail(email, verificationCode);

    return res.status(201).json({
      success: true,
      message: 'Account created. Please check your email for a verification code.',
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { email } });
    
    // If not in User, check if they are still pending verification
    if (!user) {
      const pendingUser = await PendingUser.findOne({ where: { email } });
      if (pendingUser) {
        throw createError('Please verify your email address to complete registration before logging in.', 401);
      }
    }

    const hashToCompare = user?.passwordHash ?? PASSWORD_SENTINEL_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !user.isActive || !passwordMatch) {
      throw createError('Invalid email or password.', 401);
    }

    return res.json({
      success: true,
      token: signToken(user),
      refreshToken: signRefreshToken(user),
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Refresh token has expired. Please log in again.'
        : 'Invalid refresh token.';
      throw createError(message, 401);
    }

    if (payload.tokenType !== 'refresh') {
      throw createError('Invalid token type.', 401);
    }

    const user = await User.findByPk(payload.userId, {
      attributes: ['id', 'role', 'isActive', 'isVerified', 'firstName', 'lastName', 'email', 'avatarUrl'],
    });

    if (!user || !user.isActive) {
      throw createError('Account not found or deactivated.', 401);
    }

    return res.json({
      success: true,
      token: signToken(user),
      refreshToken: signRefreshToken(user),
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;

    // Check if already verified (in User table)
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      return res.json({ success: true, message: 'Email already verified.' });
    }

    const pendingUser = await PendingUser.findOne({ where: { email } });

    if (!pendingUser || pendingUser.verificationToken !== code) {
      throw createError('Invalid verification code.', 400);
    }

    if (pendingUser.verificationTokenExpires && pendingUser.verificationTokenExpires < new Date()) {
      throw createError('Verification code has expired. Please request a new one.', 400);
    }

    // Move to User table
    const user = await User.create({
      email: pendingUser.email,
      passwordHash: pendingUser.passwordHash,
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      isVerified: true,
      isActive: true,
      role: 'user',
    });

    // Delete pending record
    await pendingUser.destroy();

    return res.json({
      success: true,
      message: 'Email verified successfully.',
      token: signToken(user),
      refreshToken: signRefreshToken(user),
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

async function resendVerificationCode(req, res, next) {
  try {
    const { email } = req.body;

    // If active user, already verified
    const user = await User.findOne({ where: { email } });
    if (user) {
      return res.json({ success: true, message: 'If that email needs verification, a new code has been sent.' });
    }

    const pendingUser = await PendingUser.findOne({ where: { email } });
    if (!pendingUser) {
      return res.json({ success: true, message: 'If that email needs verification, a new code has been sent.' });
    }

    const verificationCode = generateCode();
    await pendingUser.update({
      verificationToken: verificationCode,
      verificationTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await emailService.sendVerificationEmail(email, verificationCode);

    return res.json({ success: true, message: 'If that email needs verification, a new code has been sent.' });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const user = await User.scope('withTokens').findOne({ where: { email: req.body.email } });

    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset code has been sent.' });
    }

    const resetCode = generateCode();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.update({ resetToken: resetCode, resetTokenExpires: resetExpires });

    await emailService.sendPasswordResetEmail(user.email, resetCode);

    return res.json({ success: true, message: 'If that email exists, a reset code has been sent.' });
  } catch (err) {
    next(err);
  }
}

async function verifyResetCode(req, res, next) {
  try {
    const { email, code } = req.body;

    const user = await User.scope('withTokens').findOne({ where: { email } });

    if (!user || !user.resetToken || user.resetToken !== code) {
      throw createError('Invalid reset code.', 400);
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw createError('Reset code has expired. Please request a new one.', 400);
    }

    return res.json({ success: true, message: 'Code verified. You may now set a new password.' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, code, password } = req.body;

    const user = await User.scope('withTokens').findOne({ where: { email } });

    if (!user || !user.resetToken || user.resetToken !== code) {
      throw createError('Invalid reset code.', 400);
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw createError('Reset code has expired. Please request a new one.', 400);
    }

    const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);
    await user.update({ passwordHash, resetToken: null, resetTokenExpires: null });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  verifyEmail,
  resendVerificationCode,
};
