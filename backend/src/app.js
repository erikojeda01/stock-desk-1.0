'use strict';

require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const holdingRoutes = require('./routes/holding.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const transactionRoutes = require('./routes/transaction.routes');
const stockRoutes = require('./routes/stock.routes');
const tradeRoutes = require('./routes/trade.routes');
const journalRoutes = require('./routes/journal.routes');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.use('/api', rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: env.nodeEnv, time: new Date().toISOString() });
  });

  // API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/portfolios', portfolioRoutes);
  app.use('/api/holdings', holdingRoutes);
  app.use('/api/watchlists', watchlistRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/stocks', stockRoutes);
  app.use('/api/trades', tradeRoutes);
  app.use('/api/journal', journalRoutes);

  // 404 + error
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
