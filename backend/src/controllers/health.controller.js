'use strict';

const { sequelize, Peptide } = require('../models');
const logger = require('../utils/logger');

async function getHealth(req, res) {
  const start = Date.now();
  try {
    await sequelize.authenticate();
    return res.json({
      success: true,
      status: 'ok',
      db: 'ok',
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Health check DB ping failed', { requestId: req.requestId, message: err.message });
    return res.status(503).json({
      success: false,
      status: 'degraded',
      db: 'error',
      timestamp: new Date().toISOString(),
    });
  }
}

async function getReadiness(req, res) {
  const start = Date.now();
  try {
    await sequelize.authenticate();

    const peptideCount = await Peptide.count({ where: { isActive: true } });

    if (peptideCount === 0) {
      return res.status(503).json({
        success: false,
        status: 'not_ready',
        reason: 'No peptide data found. Run: npm run seed',
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      status: 'ready',
      db: 'ok',
      peptideCount,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Readiness check failed', { requestId: req.requestId, message: err.message });
    return res.status(503).json({
      success: false,
      status: 'not_ready',
      db: 'error',
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  getHealth,
  getReadiness,
};
