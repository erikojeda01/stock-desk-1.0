'use strict';

const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    status = 422;
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
    );
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value';
    details = err.keyValue;
  }

  // Bad ObjectId cast
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    status = 400;
    message = `Invalid id: ${err.value}`;
  }

  if (status >= 500) {
    logger.error(err);
  } else {
    logger.warn(`${status} ${req.method} ${req.originalUrl} — ${message}`);
  }

  res.status(status).json({
    error: { message, ...(details ? { details } : {}) },
  });
}

module.exports = { notFoundHandler, errorHandler };
