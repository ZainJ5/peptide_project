'use strict';

/**
 * Create the admin panel account, or reset its password if it already exists.
 *
 *   npm run admin:create -- --username=mypeptidedosages --password='S0me-Strong-Pass'
 *
 * Falls back to ADMIN_USERNAME / ADMIN_PASSWORD from .env. When no password is
 * given at all, a strong one is generated and printed once.
 *
 * Resetting also clears any lockout and signs out every existing admin session.
 */

require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const config = require('../config');
const { sequelize, Admin } = require('../models');
const { passwordProblems } = require('../utils/adminValidators');

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function generatePassword(length = 24) {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '@%+=_-.'];
  const all = sets.join('');
  const chars = sets.map((set) => set[crypto.randomInt(set.length)]);
  while (chars.length < length) chars.push(all[crypto.randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

async function run() {
  const username = (arg('username') || process.env.ADMIN_USERNAME || 'mypeptidedosages').trim();
  let password = arg('password') || process.env.ADMIN_PASSWORD;
  const generated = !password;
  if (generated) password = generatePassword();

  if (!/^[A-Za-z0-9._-]{3,100}$/.test(username)) {
    throw new Error('Username must be 3–100 characters: letters, numbers, dot, underscore or hyphen.');
  }
  const problems = passwordProblems(password);
  if (problems.length) throw new Error(`Password must contain ${problems.join(', ')}.`);

  const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);
  const existing = await Admin.findOne({ where: { username } });

  if (existing) {
    await existing.update({
      passwordHash,
      passwordChangedAt: new Date(),
      tokenVersion: existing.tokenVersion + 1,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
    });
    console.log(`Admin "${username}" already existed — password reset, lockout cleared, sessions revoked.`);
  } else {
    await Admin.create({ username, passwordHash, displayName: 'Administrator', passwordChangedAt: new Date() });
    console.log(`Admin "${username}" created.`);
  }

  if (generated) {
    console.log('\nGenerated password (shown once — store it in a password manager):\n');
    console.log(`  ${password}\n`);
  }
}

run()
  .catch((err) => {
    console.error(`Failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
