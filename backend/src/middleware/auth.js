'use strict';

const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../services/tokenService');
const User = require('../models/User');

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing or invalid Authorization header');
    }
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('User no longer exists');
    req.user = user;
    req.token = token;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Access token expired'));
    if (err.name === 'JsonWebTokenError') return next(ApiError.unauthorized('Invalid access token'));
    return next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    return next();
  };
}

module.exports = { authRequired, requireRole };
