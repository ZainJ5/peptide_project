'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id, tokenType: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
