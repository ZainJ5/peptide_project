'use strict';

/**
 * Shared rules for admin panel input. Kept in one place so route validators,
 * the create-admin script and the controllers agree.
 */

const PASSWORD_MIN_LENGTH = 12;

/**
 * Returns a list of unmet requirements (empty = strong enough).
 * @param {string} password
 * @returns {string[]}
 */
function passwordProblems(password) {
  const value = typeof password === 'string' ? password : '';
  const problems = [];
  if (value.length < PASSWORD_MIN_LENGTH) problems.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
  if (value.length > 128) problems.push('at most 128 characters');
  if (!/[a-z]/.test(value)) problems.push('a lowercase letter');
  if (!/[A-Z]/.test(value)) problems.push('an uppercase letter');
  if (!/[0-9]/.test(value)) problems.push('a number');
  if (!/[^A-Za-z0-9]/.test(value)) problems.push('a symbol');
  return problems;
}

function assertStrongPassword(password) {
  const problems = passwordProblems(password);
  if (problems.length) throw new Error(`Password must contain ${problems.join(', ')}.`);
  return true;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "BPC-157" + "10MG" -> "bpc-157-10mg" (same rule as the slug migration). */
function slugify(...parts) {
  return parts
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 280);
}

/**
 * Image fields accept a site-relative path ("/images/singles/x.webp") or an
 * absolute https URL. Anything else (javascript:, data:, http:) is rejected.
 */
function isSafeImagePath(value) {
  if (typeof value !== 'string') return false;
  if (/^\/(?!\/)[A-Za-z0-9._~!$&'()*+,;=:@%\/-]*$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalise a string-array field: trims, drops empties and duplicates.
 * @param {unknown} value
 * @param {{ lowercase?: boolean }} [opts]
 */
function cleanStringArray(value, { lowercase = false } = {}) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    let text = item.replace(/\s+/g, ' ').trim();
    if (lowercase) text = text.toLowerCase();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  passwordProblems,
  assertStrongPassword,
  SLUG_RE,
  slugify,
  isSafeImagePath,
  cleanStringArray,
};
