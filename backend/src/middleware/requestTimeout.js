'use strict';

/**
 * Request Timeout Middleware
 *
 * Sets a per-request deadline. If the handler does not send a response
 * within the window the socket is closed and a 503 is returned — preventing
 * runaway requests from holding connections open indefinitely.
 *
 * PDF generation and schedule generation can legitimately be slow; call
 * extendTimeout() inside those handlers to raise the ceiling for that one
 * request without affecting every other endpoint.
 *
 * @param {number} [ms=30000]  Default timeout in milliseconds
 * @returns {import('express').RequestHandler}
 *
 * @example
 * // In app.js — apply globally
 * app.use(requestTimeout(30_000));
 *
 * // In a slow route handler — extend for this request only
 * router.post('/generate', async (req, res, next) => {
 *   req.extendTimeout(120_000);  // give schedule generation 2 min
 *   ...
 * });
 */
function requestTimeout(ms = 30_000) {
  return function timeoutMiddleware(req, res, next) {
    let timer = setTimeout(onTimeout, ms);

    // Allow individual handlers to raise the ceiling for a specific request
    req.extendTimeout = function extendTimeout(newMs) {
      clearTimeout(timer);
      timer = setTimeout(onTimeout, newMs);
    };

    // Clear the timer once the response is finished — covers both normal and
    // error paths so we never fire the callback on an already-closed socket.
    res.on('finish', () => clearTimeout(timer));
    res.on('close',  () => clearTimeout(timer));

    function onTimeout() {
      if (res.headersSent) return;
      res.status(503).json({
        success: false,
        error:   'Request timed out. Please try again.',
      });
    }

    next();
  };
}

module.exports = requestTimeout;
