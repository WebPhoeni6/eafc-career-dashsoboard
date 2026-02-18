const { ZodError } = require('zod');
const { error: errorResponse } = require('../utils/response');
const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code, err.details);
  }

  if (err instanceof ZodError) {
    return errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', err.flatten());
  }

  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File is too large (max 5MB)', 400, 'BAD_REQUEST');
    }
    return errorResponse(res, err.message || 'Invalid upload', 400, 'BAD_REQUEST');
  }

  if (err && err.code === 'P2002') {
    return errorResponse(res, 'A unique field already exists', 409, 'CONFLICT', err.meta);
  }

  if (err && err.code === 'P2025') {
    return errorResponse(res, 'Record not found', 404, 'NOT_FOUND');
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  return errorResponse(res, 'Internal server error', 500, 'INTERNAL_ERROR');
}

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
};
