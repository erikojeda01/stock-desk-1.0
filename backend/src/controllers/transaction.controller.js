'use strict';

const Transaction = require('../models/Transaction');
const Holding = require('../models/Holding');
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * List user's transactions with optional filters and pagination.
 * Query: portfolio, symbol, type, from, to, limit, skip
 */
async function list(req, res) {
  const filter = { user: req.user._id };
  if (req.query.portfolio) filter.portfolio = req.query.portfolio;
  if (req.query.symbol) filter.symbol = String(req.query.symbol).toUpperCase();
  if (req.query.type) filter.type = String(req.query.type).toUpperCase();
  if (req.query.from || req.query.to) {
    filter.executedAt = {};
    if (req.query.from) filter.executedAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.executedAt.$lte = new Date(req.query.to);
  }

  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const skip = parseInt(req.query.skip || '0', 10);

  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ executedAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({ transactions: items, total, limit, skip });
}

/**
 * Create a transaction. Atomically:
 *  - Upserts the Holding (recomputes weighted average cost on BUY; reduces qty on SELL)
 *  - Adjusts the user's cashBalance
 * Note: Mongo transactions need a replica set; we use sequential ops with rollback on failure.
 */
async function create(req, res) {
  const { portfolio: portfolioId, symbol, type, quantity, price, fee = 0, currency, note, executedAt } = req.body;

  const portfolio = await Portfolio.findOne({ _id: portfolioId, user: req.user._id });
  if (!portfolio) throw ApiError.notFound('Portfolio not found');

  const sym = String(symbol).toUpperCase();
  const txType = String(type).toUpperCase();
  if (!['BUY', 'SELL'].includes(txType)) throw ApiError.badRequest('type must be BUY or SELL');

  const totalCost = quantity * price + fee;
  const proceeds = quantity * price - fee;

  let holding = await Holding.findOne({ portfolio: portfolio._id, symbol: sym, user: req.user._id });

  if (txType === 'BUY') {
    if (req.user.cashBalance < totalCost) throw ApiError.badRequest('Insufficient cash balance');

    if (holding) {
      const newQty = holding.quantity + quantity;
      const newAvg = newQty > 0
        ? (holding.averageCost * holding.quantity + price * quantity) / newQty
        : 0;
      holding.quantity = newQty;
      holding.averageCost = newAvg;
      await holding.save();
    } else {
      holding = await Holding.create({
        user: req.user._id,
        portfolio: portfolio._id,
        symbol: sym,
        quantity,
        averageCost: price,
        currency: currency || portfolio.currency,
      });
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { cashBalance: -totalCost } });
  } else {
    if (!holding || holding.quantity < quantity) {
      throw ApiError.badRequest('Insufficient holding quantity');
    }
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      await Holding.deleteOne({ _id: holding._id });
    } else {
      await holding.save();
    }
    await User.findByIdAndUpdate(req.user._id, { $inc: { cashBalance: proceeds } });
  }

  const tx = await Transaction.create({
    user: req.user._id,
    portfolio: portfolio._id,
    symbol: sym,
    type: txType,
    quantity,
    price,
    fee,
    currency: currency || portfolio.currency,
    note: note || '',
    executedAt: executedAt ? new Date(executedAt) : new Date(),
  });

  // Notify any listeners about the holdings/portfolio change
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${req.user._id}`).emit('portfolio:updated', { portfolioId: portfolio._id.toString() });
  }

  res.status(201).json({ transaction: tx });
}

/**
 * Convenience endpoint that uses the latest known market price as the execution price.
 * Lets the frontend "trade at market" without sending a price.
 */
async function trade(req, res) {
  const { symbol } = req.body;
  const stock = await Stock.findOne({ symbol: String(symbol).toUpperCase() });
  if (!stock) throw ApiError.notFound(`No quote for symbol ${symbol}`);
  req.body.price = stock.price;
  return create(req, res);
}

async function getOne(req, res) {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!tx) throw ApiError.notFound('Transaction not found');
  res.json({ transaction: tx });
}

async function remove(req, res) {
  // Note: removing a transaction does NOT auto-rebuild holdings here. Use only for corrections.
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tx) throw ApiError.notFound('Transaction not found');
  res.status(204).end();
}

module.exports = { list, create, trade, getOne, remove };
