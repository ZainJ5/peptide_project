'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Request ID Middleware
 *
 * Attaches a unique requestId to every incoming request.
 * Forwards X-Request-Id from an upstream proxy if present
 * (useful behind API gateways / load balancers).
 * Reflects the ID back in the response header for client-side correlation.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requestId(req, res, next) {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

module.exports = requestId;
