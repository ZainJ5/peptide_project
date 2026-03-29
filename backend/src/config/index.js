'use strict';

require('dotenv').config();

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
    from: optional('EMAIL_FROM', 'PeptideDosage <no-reply@mypeptidedosages.com>'),
    adminTo: optional('ADMIN_EMAIL', 'info@mypeptidedosages.com'),
  },

  clientUrl: isProd ? required('CLIENT_URL') : optional('CLIENT_URL', ''),

  // Public base URL for constructing absolute asset URLs (images, etc.)
  baseUrl: optional('BASE_URL', 'http://139.59.34.214'),

  // Allowed domains for avatar URLs (prevents SSRF / stored XSS)
  avatarAllowedDomains: (optional('AVATAR_ALLOWED_DOMAINS', 'cdn.peptidedosage.com') || '')
    .split(',').map((d) => d.trim()).filter(Boolean),

  seed: {
    masterFile: optional('SEED_MASTER_FILE', '../peptide dosage master.xlsx'),
    tablesFile: optional('SEED_TABLES_FILE', '../peptidedosages_with_dosing_tables.xlsx'),
  },
};

module.exports = config;
