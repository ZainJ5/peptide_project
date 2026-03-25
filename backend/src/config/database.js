'use strict';

const { Sequelize } = require('sequelize');
const config = require('./index');
const logger = require('../utils/logger');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host:    config.db.host,
  port:    config.db.port,
  dialect: 'postgres',
  logging: config.isDev ? (msg) => logger.debug(msg) : false,
  pool: {
    max:     10,
    min:     2,       // keep warm connections alive
    acquire: 30_000,  // ms to wait acquiring a connection before throwing
    idle:    10_000,  // ms a connection can be idle before being released
  },
  dialectOptions: config.db.dialectOptions,
});

/**
 * Connect to the database with exponential-backoff retry.
 *
 * On first deploy or transient cloud DB cold-start the connection can fail
 * for a few seconds. Retrying with backoff prevents the process from crashing
 * immediately and forces an operator restart.
 *
 * @param {number} [maxRetries=5]     Total attempts before giving up
 * @param {number} [initialDelay=2000] First retry delay in ms (doubles each time, cap 30 s)
 * @returns {Promise<void>}
 */
async function connectDatabase(maxRetries = 5, initialDelay = 2_000) {
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      logger.info('Database connected', {
        host: config.db.host,
        port: config.db.port,
        name: config.db.name,
      });
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        logger.error('Database connection failed after maximum retries', {
          attempts: maxRetries,
          message:  err.message,
        });
        throw err;
      }

      logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed — retrying in ${delay}ms`, {
        message: err.message,
      });

      await sleep(delay);
      delay = Math.min(delay * 2, 30_000); // exponential backoff, cap at 30 s
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { sequelize, connectDatabase };
