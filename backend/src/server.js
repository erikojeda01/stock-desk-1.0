'use strict';

const http = require('http');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB } = require('./config/db');
const createApp = require('./app');
const initSocket = require('./sockets');
const { startMarketSimulator, stopMarketSimulator } = require('./services/marketSimulator');

async function bootstrap() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const io = initSocket(server);
  app.set('io', io);

  startMarketSimulator(io);

  server.listen(env.port, () => {
    logger.info(`Stock Desk API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down...`);
    stopMarketSimulator();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => logger.error('UnhandledRejection', reason));
  process.on('uncaughtException', (err) => {
    logger.error('UncaughtException', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});
