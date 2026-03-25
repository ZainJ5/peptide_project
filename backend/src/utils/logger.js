'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('../config');

const { combine, timestamp, printf, colorize, errors } = format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return stack
      ? `${timestamp} [${level}]: ${message}${metaStr}\n${stack}`
      : `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level:  config.isDev ? 'debug' : 'info',
  format: config.isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
    ...(config.isProd
      ? [
          new transports.File({ filename: 'logs/error.log',    level: 'error' }),
          new transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

module.exports = logger;
