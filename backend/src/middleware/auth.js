'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

/**
 * Sentinel hash for constant-time login path.
 *
 * Generated once at process startup — always a valid bcrypt hash so that
 * bcrypt.compare() runs a full work-factor comparison even when the email
 * doesn't exist. This prevents timing-based account enumeration: an attacker
 * cannot distinguish "email not found" from "wrong password" via response time.
 *
 * Synchronous hashSync is intentional and acceptable here: it runs exactly
 * once per process startup (same cost as one user registration) and the result
 * is cached for the lifetime of the process.
 */
const PASSWORD_SENTINEL_HASH = bcrypt.hashSync('_timing_sentinel_peptidedosage_', config.bcrypt.rounds);

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error:   'Authentication required. Provide a Bearer token.',
      });
    }

    const token = authHeader.slice(7);

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Token has expired. Please refresh or log in again.'
        : 'Invalid token.';
      return res.status(401).json({ success: false, error: message });
    }

    // Fetch only the fields needed for auth checks — avoids pulling full profile on every request.
    const user = await User.findByPk(payload.userId, {
      attributes: ['id', 'role', 'isActive', 'isVerified', 'firstName', 'lastName', 'email', 'avatarUrl'],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Account not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication — attaches req.user if a valid token is present,
 * but does not block the request if no token is provided.
 * Use for public endpoints that have optional personalisation.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  try {
    const token   = authHeader.slice(7);
    const payload = jwt.verify(token, config.jwt.secret);
    const user    = await User.findByPk(payload.userId, {
      attributes: ['id', 'role', 'isActive', 'isVerified', 'firstName', 'lastName', 'email', 'avatarUrl'],
    });
    if (user && user.isActive) req.user = user;
  } catch (_) {
    // Silently ignore invalid tokens for optional-auth routes
  }
  next();
}

/**
 * Require admin role. Must be used after authenticate().
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required.' });
  }
  next();
}

/**
 * Generate a signed JWT access token for a user.
 * Short-lived — use alongside a refresh token.
 *
 * @param {object} user  User model instance
 * @returns {string}  Signed JWT
 */
function signToken(user) {
  return generateAccessToken(user);
}

/**
 * Generate a signed JWT refresh token for a user.
 * Long-lived — stored securely by the client; exchanged for new access tokens.
 * Uses a separate secret so rotating access secrets doesn't invalidate refresh tokens.
 *
 * @param {object} user  User model instance
 * @returns {string}  Signed refresh JWT
 */
function signRefreshToken(user) {
  return generateRefreshToken(user);
}

/**
 * Serialize a user model instance to a safe public shape.
 * Use this everywhere a user object is returned in a response —
 * never spread the raw model instance.
 *
 * @param {object} user  User model instance
 * @returns {object}
 */
function safeUser(user) {
  return {
    id:         user.id,
    email:      user.email,
    firstName:  user.firstName,
    lastName:   user.lastName  ?? null,
    role:       user.role,
    isVerified: user.isVerified,
    avatarUrl:  user.avatarUrl ?? null,
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  signToken,
  signRefreshToken,
  safeUser,
  PASSWORD_SENTINEL_HASH,
};
