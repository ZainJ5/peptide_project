'use strict';

require('dotenv').config();

const crypto = require('crypto');

function required(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key, defaultValue = undefined) {
  return process.env[key] ?? defaultValue;
}

const env    = optional('NODE_ENV', 'development');
const isDev  = env === 'development';
const isProd = env === 'production';

const config = {
  env,
  isDev,
  isProd,
  port: parseInt(optional('PORT', '4000'), 10),

  db: {
    host:     optional('DB_HOST', 'localhost'),
    port:     parseInt(optional('DB_PORT', '5432'), 10),
    name:     optional('DB_NAME', 'peptidedosage'),
    user:     optional('DB_USER', 'postgres'),
    password: isProd ? required('DB_PASSWORD') : optional('DB_PASSWORD', ''),
    dialectOptions: {
      ssl: isProd ? { require: true, rejectUnauthorized: false } : false,
    },
  },

  jwt: {
    secret:           required('JWT_SECRET'),
    refreshSecret:    required('JWT_REFRESH_SECRET'),
    expiresIn:        optional('JWT_EXPIRES_IN',         '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  // Admin panel auth. Uses its own signing secret so a site-user token can
  // never be accepted as an admin token. ADMIN_JWT_SECRET is recommended; when
  // unset, a distinct key is derived from JWT_SECRET.
  admin: {
    jwtSecret: optional('ADMIN_JWT_SECRET')
      || crypto.createHmac('sha256', required('JWT_SECRET')).update('mypeptidedosages-admin-panel').digest('hex'),
    jwtExpiresIn:     optional('ADMIN_JWT_EXPIRES_IN', '8h'),
    maxFailedLogins:  parseInt(optional('ADMIN_MAX_FAILED_LOGINS', '5'), 10),
    lockoutMinutes:   parseInt(optional('ADMIN_LOCKOUT_MINUTES', '15'), 10),
    loginRateLimit:   parseInt(optional('ADMIN_LOGIN_RATE_LIMIT', '10'), 10),
  },

  bcrypt: {
    rounds: 12,
  },

  rateLimit: {
    max:      parseInt(optional('RATE_LIMIT_MAX',       '200'), 10),
    authMax:  parseInt(optional('AUTH_RATE_LIMIT_MAX',   '15'), 10),
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  email: {
    resendApiKey: optional('RESEND_API_KEY'),
    from: optional('EMAIL_FROM', 'MyPeptideDosages <no-reply@mypeptidedosages.com>'),
    adminTo: optional('ADMIN_EMAIL', 'info@mypeptidedosages.com'),
  },

  clientUrl: isProd ? required('CLIENT_URL') : optional('CLIENT_URL', ''),

  // Public base URL for constructing absolute asset URLs (images, etc.)
  baseUrl: optional('BASE_URL', 'http://139.59.34.214'),

  // Canonical public site origin (non-www) used to build absolute media URLs
  // (video files, thumbnails) returned by the API for the website and app.
  publicSiteUrl: (optional('PUBLIC_SITE_URL', 'https://mypeptidedosages.com') || '').replace(/\/$/, ''),

  // Allowed domains for avatar URLs (prevents SSRF / stored XSS)
  avatarAllowedDomains: (optional('AVATAR_ALLOWED_DOMAINS', 'cdn.mypeptidedosages.com') || '')
    .split(',').map((d) => d.trim()).filter(Boolean),

  seed: {
    masterFile: optional('SEED_MASTER_FILE', '../peptide dosage master.xlsx'),
    tablesFile: optional('SEED_TABLES_FILE', '../peptidedosages_with_dosing_tables.xlsx'),
  },
};

module.exports = config;
