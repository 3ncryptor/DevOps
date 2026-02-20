/**
 * Winston Logger Configuration
 *
 * Provides structured logging with:
 * - Console output (colorized for development)
 * - Daily rotating file logs
 * - Separate error log file
 * - Request ID tracking
 * - Performance timing
 */

import dotenv from 'dotenv';
dotenv.config();

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL =
    process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');

// Custom log format
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(
        ({ level, message, timestamp, stack, ...metadata }) => {
            let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

            // Add metadata if present
            if (Object.keys(metadata).length > 0) {
                log += ` ${JSON.stringify(metadata)}`;
            }

            // Add stack trace for errors
            if (stack) {
                log += `\n${stack}`;
            }

            return log;
        }
    )
);

// JSON format for production (easier to parse)
const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let log = `${timestamp} ${level}: ${message}`;

        // Add relevant metadata (exclude verbose fields)
        const { stack, ...rest } = metadata;
        if (Object.keys(rest).length > 0 && Object.keys(rest).length < 5) {
            log += ` ${JSON.stringify(rest)}`;
        }

        if (stack) {
            log += `\n${stack}`;
        }

        return log;
    })
);

// Transport configurations
const transports = [];

// Console transport (always enabled)
transports.push(
    new winston.transports.Console({
        format: NODE_ENV === 'production' ? jsonFormat : consoleFormat,
        level: LOG_LEVEL,
    })
);

// File transports (only in production or if explicitly enabled)
if (NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
    // Combined log (all levels)
    transports.push(
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'combined.log'),
            format: jsonFormat,
            level: LOG_LEVEL,
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        })
    );

    // Error log (error level only)
    transports.push(
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            format: jsonFormat,
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        })
    );

    // HTTP request log
    transports.push(
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'http.log'),
            format: jsonFormat,
            level: 'http',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        })
    );
}

// Create the logger
const logger = winston.createLogger({
    level: LOG_LEVEL,
    levels: winston.config.npm.levels,
    format: customFormat,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
});

// Add custom levels for specific use cases
const LOG_CATEGORIES = {
    AUTH: 'auth',
    DB: 'database',
    HTTP: 'http',
    PAYMENT: 'payment',
    ORDER: 'order',
    AUDIT: 'audit',
    JOB: 'job',
    SYSTEM: 'system',
};

/**
 * Create a child logger with category context
 */
const createCategoryLogger = (category) => {
    return logger.child({ category });
};

/**
 * Log with request context
 */
const logWithRequest = (req, level, message, metadata = {}) => {
    const requestContext = {
        requestId: req.id || req.headers['x-request-id'],
        method: req.method,
        path: req.originalUrl,
        userId: req.user?._id,
        userRole: req.user?.role,
        ip: req.ip || req.connection?.remoteAddress,
        ...metadata,
    };

    logger.log(level, message, requestContext);
};

/**
 * Performance timer for measuring operation duration
 */
const startTimer = (operationName) => {
    const start = process.hrtime.bigint();

    return {
        end: (metadata = {}) => {
            const end = process.hrtime.bigint();
            const durationMs = Number(end - start) / 1_000_000;

            logger.debug(`${operationName} completed`, {
                operation: operationName,
                durationMs: durationMs.toFixed(2),
                ...metadata,
            });

            return durationMs;
        },
    };
};

/**
 * Log database operations
 */
const logDB = {
    query: (operation, collection, duration, metadata = {}) => {
        logger.debug(`DB ${operation}`, {
            category: LOG_CATEGORIES.DB,
            collection,
            durationMs: duration,
            ...metadata,
        });
    },
    error: (operation, collection, error) => {
        logger.error(`DB ${operation} failed`, {
            category: LOG_CATEGORIES.DB,
            collection,
            error: error.message,
            stack: error.stack,
        });
    },
};

/**
 * Log HTTP requests
 */
const logHTTP = {
    request: (req) => {
        logger.http('Incoming request', {
            category: LOG_CATEGORIES.HTTP,
            method: req.method,
            path: req.originalUrl,
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    },
    response: (req, res, duration) => {
        const level = res.statusCode >= 400 ? 'warn' : 'http';
        logger[level]('Request completed', {
            category: LOG_CATEGORIES.HTTP,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration,
            userId: req.user?._id,
        });
    },
};

/**
 * Log authentication events
 */
const logAuth = {
    success: (userId, action, ip) => {
        logger.info(`Auth ${action} successful`, {
            category: LOG_CATEGORIES.AUTH,
            userId,
            action,
            ip,
        });
    },
    failure: (action, reason, ip, email = null) => {
        logger.warn(`Auth ${action} failed`, {
            category: LOG_CATEGORIES.AUTH,
            action,
            reason,
            ip,
            email,
        });
    },
};

/**
 * Log payment events
 */
const logPayment = {
    initiated: (paymentId, orderId, amount, userId) => {
        logger.info('Payment initiated', {
            category: LOG_CATEGORIES.PAYMENT,
            paymentId,
            orderId,
            amount,
            userId,
        });
    },
    success: (paymentId, orderId, transactionId) => {
        logger.info('Payment successful', {
            category: LOG_CATEGORIES.PAYMENT,
            paymentId,
            orderId,
            transactionId,
        });
    },
    failure: (paymentId, orderId, reason) => {
        logger.error('Payment failed', {
            category: LOG_CATEGORIES.PAYMENT,
            paymentId,
            orderId,
            reason,
        });
    },
};

/**
 * Log order events
 */
const logOrder = {
    created: (orderId, userId, storeId, total) => {
        logger.info('Order created', {
            category: LOG_CATEGORIES.ORDER,
            orderId,
            userId,
            storeId,
            total,
        });
    },
    statusChanged: (orderId, fromStatus, toStatus, actorId) => {
        logger.info('Order status changed', {
            category: LOG_CATEGORIES.ORDER,
            orderId,
            fromStatus,
            toStatus,
            actorId,
        });
    },
};

/**
 * Log background job events
 */
const logJob = {
    started: (jobName) => {
        logger.info(`Job ${jobName} started`, {
            category: LOG_CATEGORIES.JOB,
            jobName,
        });
    },
    completed: (jobName, duration, result = {}) => {
        logger.info(`Job ${jobName} completed`, {
            category: LOG_CATEGORIES.JOB,
            jobName,
            durationMs: duration,
            ...result,
        });
    },
    failed: (jobName, error) => {
        logger.error(`Job ${jobName} failed`, {
            category: LOG_CATEGORIES.JOB,
            jobName,
            error: error.message,
            stack: error.stack,
        });
    },
};

/**
 * Log system events
 */
const logSystem = {
    startup: (port, env) => {
        logger.info('Server starting', {
            category: LOG_CATEGORIES.SYSTEM,
            port,
            environment: env,
            nodeVersion: process.version,
            pid: process.pid,
        });
    },
    ready: (port) => {
        logger.info('Server ready', {
            category: LOG_CATEGORIES.SYSTEM,
            port,
            uptime: process.uptime(),
        });
    },
    shutdown: (signal) => {
        logger.warn('Server shutting down', {
            category: LOG_CATEGORIES.SYSTEM,
            signal,
            uptime: process.uptime(),
        });
    },
    dbConnected: (host, dbName) => {
        logger.info('Database connected', {
            category: LOG_CATEGORIES.SYSTEM,
            host,
            database: dbName,
        });
    },
    dbDisconnected: () => {
        logger.warn('Database disconnected', {
            category: LOG_CATEGORIES.SYSTEM,
        });
    },
};

export {
    logger as default,
    logger,
    LOG_CATEGORIES,
    createCategoryLogger,
    logWithRequest,
    startTimer,
    logDB,
    logHTTP,
    logAuth,
    logPayment,
    logOrder,
    logJob,
    logSystem,
};
