'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const details = {};
  for (const e of errors.array()) {
    details[e.path || e.param] = e.msg;
  }
  return next(ApiError.unprocessable('Validation failed', details));
}

module.exports = validate;
