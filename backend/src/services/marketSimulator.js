'use strict';

const Stock = require('../models/Stock');
const env = require('../config/env');
const logger = require('../utils/logger');

let interval = null;
let priceHistory = {}; // in-memory rolling history per symbol

/**
 * Geometric-brownian-ish random walk:
 *   newPrice = price * (1 + drift + volatility * randn)
 * Bounded so prices stay reasonable.
 */
function tickPrice(prev) {
  const drift = 0.0001;
  const volatility = 0.005;
  const randn = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; // approx normal
  let next = prev * (1 + drift + volatility * randn);
  if (next < 0.01) next = 0.01;
  return Number(next.toFixed(4));
}

function pushHistory(symbol, price) {
  if (!priceHistory[symbol]) priceHistory[symbol] = [];
  priceHistory[symbol].push({ t: Date.now(), p: price });
  if (priceHistory[symbol].length > 500) priceHistory[symbol].shift();
}

function getHistory(symbol) {
  return priceHistory[symbol.toUpperCase()] || [];
}

async function tick(io) {
  const stocks = await Stock.find({});
  if (!stocks.length) return;

  const updates = [];
  const ticks = [];
  for (const s of stocks) {
    const prev = s.price || s.previousClose || 100;
    const next = tickPrice(prev);
    s.price = next;
    s.dayHigh = Math.max(s.dayHigh || next, next);
    s.dayLow = s.dayLow ? Math.min(s.dayLow, next) : next;
    s.lastUpdatedAt = new Date();
    pushHistory(s.symbol, next);

    updates.push(s.save());
    ticks.push({
      symbol: s.symbol,
      price: next,
      change: Number((next - s.previousClose).toFixed(4)),
      changePercent: s.previousClose
        ? Number((((next - s.previousClose) / s.previousClose) * 100).toFixed(4))
        : 0,
      t: Date.now(),
    });
  }

  await Promise.all(updates);

  if (io) {
    io.emit('market:tick', ticks);
    for (const t of ticks) io.to(`symbol:${t.symbol}`).emit(`quote:${t.symbol}`, t);
  }
}

function startMarketSimulator(io) {
  if (interval) return;
  logger.info(`Market simulator starting (interval ${env.market.tickIntervalMs}ms)`);
  interval = setInterval(() => {
    tick(io).catch((err) => logger.error('Market tick failed', err));
  }, env.market.tickIntervalMs);
  if (interval.unref) interval.unref();
}

function stopMarketSimulator() {
  if (interval) {
    clearInterval(interval);
    interval = null;
    logger.info('Market simulator stopped');
  }
}

module.exports = { startMarketSimulator, stopMarketSimulator, getHistory, tick };
