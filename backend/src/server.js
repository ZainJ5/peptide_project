'use strict';

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { connectDatabase, sequelize } = require('./config/database');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const requestTimeout = require('./middleware/requestTimeout');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

if (config.isProd) app.set('trust proxy', 1);

app.use(requestId);

app.use(cors({
  origin: config.isDev ? '*' : config.clientUrl,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-Id'],
}));

app.use(compression());
app.use(requestTimeout(30_000));

morgan.token('request-id', (req) => req.requestId);
app.use(morgan(config.isDev ? ':method :url :status :response-time ms - :request-id' : 'combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
}));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

let server;

async function start() {
  try {
    await connectDatabase();

    server = app.listen(config.port, () => {
      logger.info(`API running on port ${config.port} (${config.env})`);
    });

    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;
  } catch (error) {
    logger.error('Failed to start server', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

const SHUTDOWN_TIMEOUT_MS = 10_000;

function shutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown.`);

  if (!server) {
    process.exit(0);
  }

  server.close(async () => {
    try {
      await sequelize.close();
    } catch (error) {
      logger.error('Error closing database pool', { message: error.message });
    }

    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception. Shutting down.', {
    message: error?.message,
    stack: error?.stack,
  });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection. Shutting down.', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  shutdown('unhandledRejection');
});

start();

module.exports = app;
