'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const config    = require('../config');
const { Admin } = require('../models');

const TOKEN_TYPE = 'admin';

/**
 * Valid bcrypt hash compared against when the username doesn't exist, so the
 * response time doesn't reveal whether an admin username is valid.
 */
const ADMIN_SENTINEL_HASH = bcrypt.hashSync('_admin_timing_sentinel_', config.bcrypt.rounds);

function signAdminToken(admin) {
  return jwt.sign(
    { adminId: admin.id, ver: admin.tokenVersion, typ: TOKEN_TYPE },
    config.admin.jwtSecret,
    { expiresIn: config.admin.jwtExpiresIn }
  );
}

/** Decode the expiry (ms epoch) of a freshly signed token for the client. */
function tokenExpiresAt(token) {
  const { exp } = jwt.decode(token) || {};
  return exp ? exp * 1000 : null;
}

function safeAdmin(admin) {
  return {
    id:                admin.id,
    username:          admin.username,
    displayName:       admin.displayName ?? null,
    lastLoginAt:       admin.lastLoginAt ?? null,
    passwordChangedAt: admin.passwordChangedAt ?? null,
  };
}

/**
 * Require a valid admin bearer token. Rejects site-user tokens (different
 * secret + typ claim) and tokens revoked by logout / password change
 * (tokenVersion mismatch).
 */
async function authenticateAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Admin authentication required.' });
    }

    let payload;
    try {
      payload = jwt.verify(header.slice(7), config.admin.jwtSecret);
    } catch (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Your admin session has expired. Please sign in again.'
        : 'Invalid admin token.';
      return res.status(401).json({ success: false, error: message });
    }

    if (payload.typ !== TOKEN_TYPE || !payload.adminId) {
      return res.status(401).json({ success: false, error: 'Invalid admin token.' });
    }

    const admin = await Admin.findByPk(payload.adminId);
    if (!admin || !admin.isActive || admin.tokenVersion !== payload.ver) {
      return res.status(401).json({ success: false, error: 'Admin session is no longer valid. Please sign in again.' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticateAdmin,
  signAdminToken,
  tokenExpiresAt,
  safeAdmin,
  ADMIN_SENTINEL_HASH,
};
