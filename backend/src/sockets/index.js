'use strict';

const { Server } = require('socket.io');
const env = require('../config/env');
const logger = require('../utils/logger');
const { verifyAccessToken } = require('../services/tokenService');
const User = require('../models/User');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    },
  });

  // Auth middleware: client connects with auth: { token: '<access token>' }
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) return next(); // allow anonymous connections for public market ticks
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (user) {
        socket.user = user;
        socket.join(`user:${user._id.toString()}`);
      }
      return next();
    } catch (err) {
      logger.warn('Socket auth failed:', err.message);
      return next(); // still allow as anonymous
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}${socket.user ? ` (user ${socket.user.email})` : ' (anon)'}`);

    socket.on('subscribe', (symbols) => {
      const list = Array.isArray(symbols) ? symbols : [symbols];
      for (const s of list) {
        if (typeof s === 'string' && s.length <= 12) {
          socket.join(`symbol:${s.toUpperCase()}`);
        }
      }
      socket.emit('subscribed', { symbols: list });
    });

    socket.on('unsubscribe', (symbols) => {
      const list = Array.isArray(symbols) ? symbols : [symbols];
      for (const s of list) {
        if (typeof s === 'string') socket.leave(`symbol:${s.toUpperCase()}`);
      }
      socket.emit('unsubscribed', { symbols: list });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = initSocket;
