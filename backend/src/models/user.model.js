'use strict';

const { User } = require('./index');

async function create(data) {
  return User.create(data);
}

async function findByEmail(email, options = {}) {
  const scope = options.withSensitive ? 'withPassword' : null;
  return scope
    ? User.scope(scope).findOne({ where: { email } })
    : User.findOne({ where: { email } });
}

async function findById(id, options = {}) {
  const scope = options.withSensitive ? 'withPassword' : null;
  return scope ? User.scope(scope).findByPk(id) : User.findByPk(id);
}

module.exports = {
  create,
  findByEmail,
  findById,
};
