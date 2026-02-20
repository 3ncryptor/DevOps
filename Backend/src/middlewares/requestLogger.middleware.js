/**
 * Request Logger Middleware
 * Logs all incoming HTTP requests with timing and response status
 */

import { v4 as uuidv4 } from 'uuid';
import { logger, logHTTP } from '../config/logger.config.js';

/**
 * Generate unique request ID
 */
const generateRequestId = (req) => {
    return req.headers['x-request-id'] || uuidv4();
};

/**
 * Request logging middleware
 * Attaches request ID and logs request/response
 */
export const requestLogger = (req, res, next) => {
    // Attach unique request ID
    req.id = generateRequestId(req);
    res.setHeader('X-Request-ID', req.id);

    // Record start time
    const startTime = process.hrtime.bigint();

    // Log incoming request
    logHTTP.request(req);

    // Capture response finish
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;

        logHTTP.response(req, res, durationMs.toFixed(2));
    });

    next();
};

/**
 * Skip logging for certain paths (health checks, static files)
 */
export const requestLoggerWithSkip = (
    skipPaths = ['/health', '/favicon.ico']
) => {
    return (req, res, next) => {
        if (skipPaths.some((path) => req.originalUrl.startsWith(path))) {
            return next();
        }
        return requestLogger(req, res, next);
    };
};

/**
 * Error request logger - logs failed requests with more detail
 */
export const errorRequestLogger = (err, req, res, next) => {
    logger.error('Request error', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        error: err.message,
        stack: err.stack,
        userId: req.user?._id,
        body: process.env.NODE_ENV !== 'production' ? req.body : undefined,
    });

    next(err);
};

export default requestLogger;
