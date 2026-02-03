/**
 * Zentra Global Error Handling Middleware
 * 
 * Ensures NO raw errors ever leak to the client.
 * All errors are normalized to ApiError/ApiResponse format.
 */

import { ApiError } from "../utils/ApiError.js";
import { logger } from "../config/logger.config.js";

// Error type identifiers
const ERROR_TYPES = {
  VALIDATION: "ValidationError",
  CAST: "CastError",
  DUPLICATE_KEY: 11000,
  JWT_INVALID: "JsonWebTokenError",
  JWT_EXPIRED: "TokenExpiredError",
  JWT_NOT_BEFORE: "NotBeforeError",
  MULTER: "MulterError",
  SYNTAX: "SyntaxError",
  MONGO_SERVER: "MongoServerError",
  MONGO_NETWORK: "MongoNetworkError"
};

/**
 * Normalize any error into a consistent ApiError format
 */
const normalizeError = (err) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  // ═══════════════════════════════════════════════════════
  // MONGOOSE / MONGODB ERRORS
  // ═══════════════════════════════════════════════════════

  // Mongoose validation errors
  if (err.name === ERROR_TYPES.VALIDATION) {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }

  // Mongoose CastError (invalid ObjectId, wrong type)
  if (err.name === ERROR_TYPES.CAST) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    errors = [{ field: err.path, message: `Invalid format for ${err.path}`, value: err.value }];
  }

  // MongoDB duplicate key error
  if (err.code === ERROR_TYPES.DUPLICATE_KEY) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    const value = err.keyValue?.[field];
    message = `Duplicate value: ${field} already exists`;
    errors = [{ field, message: `${field} '${value}' already exists`, value }];
  }

  // MongoDB server errors
  if (err.name === ERROR_TYPES.MONGO_SERVER) {
    statusCode = 500;
    message = "Database operation failed";
    // Don't expose internal MongoDB errors
  }

  // MongoDB network errors
  if (err.name === ERROR_TYPES.MONGO_NETWORK) {
    statusCode = 503;
    message = "Database connection error";
  }

  // ═══════════════════════════════════════════════════════
  // JWT / AUTHENTICATION ERRORS
  // ═══════════════════════════════════════════════════════

  if (err.name === ERROR_TYPES.JWT_INVALID) {
    statusCode = 401;
    message = "Invalid authentication token";
    errors = [{ field: "token", message: "Token is malformed or invalid" }];
  }

  if (err.name === ERROR_TYPES.JWT_EXPIRED) {
    statusCode = 401;
    message = "Authentication token has expired";
    errors = [{ field: "token", message: "Please login again" }];
  }

  if (err.name === ERROR_TYPES.JWT_NOT_BEFORE) {
    statusCode = 401;
    message = "Token not yet valid";
    errors = [{ field: "token", message: "Token is not yet active" }];
  }

  // ═══════════════════════════════════════════════════════
  // FILE UPLOAD / MULTER ERRORS
  // ═══════════════════════════════════════════════════════

  if (err.name === ERROR_TYPES.MULTER || err.code?.startsWith?.("LIMIT_")) {
    statusCode = 400;
    const multerMessages = {
      LIMIT_FILE_SIZE: "File too large",
      LIMIT_FILE_COUNT: "Too many files",
      LIMIT_FIELD_KEY: "Field name too long",
      LIMIT_FIELD_VALUE: "Field value too long",
      LIMIT_FIELD_COUNT: "Too many fields",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field",
      LIMIT_PART_COUNT: "Too many parts"
    };
    message = multerMessages[err.code] || "File upload error";
    errors = [{ field: err.field || "file", message }];
  }

  // ═══════════════════════════════════════════════════════
  // REQUEST PARSING ERRORS
  // ═══════════════════════════════════════════════════════

  if (err.name === ERROR_TYPES.SYNTAX && err.body !== undefined) {
    statusCode = 400;
    message = "Invalid JSON in request body";
    errors = [{ field: "body", message: "Request body contains invalid JSON" }];
  }

  // ═══════════════════════════════════════════════════════
  // GENERIC / UNKNOWN ERRORS
  // ═══════════════════════════════════════════════════════

  // For truly unknown errors, sanitize the message
  if (!(err instanceof ApiError) && statusCode === 500) {
    // Log the full error for debugging with Winston
    logger.error("Unhandled error", {
      path: err._requestPath || "unknown",
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    
    // Never expose internal error messages in production
    message = "An unexpected error occurred";
    errors = [];
  }

  return { statusCode, message, errors };
};

/**
 * Build the error response object
 */
const buildErrorResponse = (statusCode, message, errors, err, isDev) => {
  const response = {
    statusCode,
    message,
    success: false,
    data: null
  };

  // Include error details in development mode only
  if (isDev) {
    response.errors = errors.length > 0 ? errors : undefined;
    response.stack = err.stack?.split("\n").slice(0, 10); // Limit stack trace
    response._debug = {
      name: err.name,
      code: err.code,
      originalMessage: err.message
    };
  } else if (errors.length > 0) {
    // In production, only include sanitized errors array
    response.errors = errors;
  }

  return response;
};

/**
 * Global Error Handler Middleware
 * 
 * This MUST be the last middleware in the chain.
 * It catches all errors and returns a consistent response format.
 */
const errorMiddleware = (err, req, res, next) => {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Attach request path for logging
  err._requestPath = `${req.method} ${req.originalUrl}`;

  // Normalize the error
  const { statusCode, message, errors } = normalizeError(err);

  // Check environment
  const isDev = process.env.NODE_ENV !== "production";

  // Build response
  const response = buildErrorResponse(statusCode, message, errors, err, isDev);

  // Log error with Winston
  const logLevel = statusCode >= 500 ? "error" : "warn";
  logger[logLevel](`[${statusCode}] ${err._requestPath}: ${message}`, {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    requestId: req.id,
    userId: req.user?._id,
    errors: errors.length > 0 ? errors : undefined,
    stack: statusCode >= 500 ? err.stack : undefined
  });

  // Send response
  return res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 * Use this before the error middleware for undefined routes
 */
const notFoundHandler = (req, res) => {
  const response = {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    success: false,
    data: null
  };
  return res.status(404).json(response);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { 
  errorMiddleware, 
  notFoundHandler, 
  catchAsync,
  normalizeError 
};
