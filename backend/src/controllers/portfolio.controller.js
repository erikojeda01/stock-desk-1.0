'use strict';

const Portfolio = require('../models/Portfolio');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');
const Stock = require('../models/Stock');
const ApiError = require('../utils/ApiError');

async function list(req, res) {
  const portfolios = await Portfolio.find({ user: req.user._id }).sort({ createdAt: 1 });
  res.json({ portfolios });
}

async function create(req, res) {
  const { name, description, currency, isDefault } = req.body;
  const portfolio = await Portfolio.create({
    user: req.user._id,
    name,
    description,
    currency,
    isDefault: !!isDefault,
  });
  if (isDefault) {
    await Portfolio.updateMany(
      { user: req.user._id, _id: { $ne: portfolio._id } },
      { $set: { isDefault: false } }
    );
  }
  res.status(201).json({ portfolio });
}

async function getOne(req, res) {
  const portfolio = await Portfolio.findOne({ _id: req.params.id, user: req.user._id });
  if (!portfolio) throw ApiError.notFound('Portfolio not found');
  res.json({ portfolio });
}

async function update(req, res) {
  const allowed = ['name', 'description', 'currency', 'isDefault'];
  const patch = {};
  for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];

  const portfolio = await Portfolio.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    patch,
    { new: true, runValidators: true }
  );
  if (!portfolio) throw ApiError.notFound('Portfolio not found');

  if (patch.isDefault) {
    await Portfolio.updateMany(
      { user: req.user._id, _id: { $ne: portfolio._id } },
      { $set: { isDefault: false } }
    );
  }
  res.json({ portfolio });
}

async function remove(req, res) {
  const portfolio = await Portfolio.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!portfolio) throw ApiError.notFound('Portfolio not found');
  await Holding.deleteMany({ portfolio: portfolio._id });
  await Transaction.deleteMany({ portfolio: portfolio._id });
  res.status(204).end();
}

/**
 * Returns full portfolio summary: holdings enriched with current prices,
 * total market value, total cost basis, total P&L, and per-holding P&L.
 */
async function summary(req, res) {
  const portfolio = await Portfolio.findOne({ _id: req.params.id, user: req.user._id });
  if (!portfolio) throw ApiError.notFound('Portfolio not found');

  const holdings = await Holding.find({ portfolio: portfolio._id });
  const symbols = [...new Set(holdings.map((h) => h.symbol))];
  const stocks = await Stock.find({ symbol: { $in: symbols } });
  const priceBySymbol = Object.fromEntries(stocks.map((s) => [s.symbol, s.price]));

  let totalMarketValue = 0;
  let totalCostBasis = 0;

  const enriched = holdings.map((h) => {
    const price = priceBySymbol[h.symbol] || 0;
    const marketValue = price * h.quantity;
    const costBasis = h.averageCost * h.quantity;
    const unrealizedPnL = marketValue - costBasis;
    const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
    totalMarketValue += marketValue;
    totalCostBasis += costBasis;
    return {
      ...h.toObject(),
      currentPrice: price,
      marketValue: Number(marketValue.toFixed(2)),
      costBasis: Number(costBasis.toFixed(2)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
      unrealizedPnLPercent: Number(unrealizedPnLPercent.toFixed(2)),
    };
  });

  const totalPnL = totalMarketValue - totalCostBasis;
  const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  res.json({
    portfolio,
    holdings: enriched,
    totals: {
      marketValue: Number(totalMarketValue.toFixed(2)),
      costBasis: Number(totalCostBasis.toFixed(2)),
      unrealizedPnL: Number(totalPnL.toFixed(2)),
      unrealizedPnLPercent: Number(totalPnLPercent.toFixed(2)),
    },
  });
}

module.exports = { list, create, getOne, update, remove, summary };
