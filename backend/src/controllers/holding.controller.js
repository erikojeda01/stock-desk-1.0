'use strict';

const Holding = require('../models/Holding');
const Portfolio = require('../models/Portfolio');
const ApiError = require('../utils/ApiError');

async function list(req, res) {
  const filter = { user: req.user._id };
  if (req.query.portfolio) filter.portfolio = req.query.portfolio;
  const holdings = await Holding.find(filter).sort({ symbol: 1 });
  res.json({ holdings });
}

async function getOne(req, res) {
  const holding = await Holding.findOne({ _id: req.params.id, user: req.user._id });
  if (!holding) throw ApiError.notFound('Holding not found');
  res.json({ holding });
}

async function create(req, res) {
  const { portfolio, symbol, quantity, averageCost, currency } = req.body;
  const port = await Portfolio.findOne({ _id: portfolio, user: req.user._id });
  if (!port) throw ApiError.notFound('Portfolio not found');

  const holding = await Holding.create({
    user: req.user._id,
    portfolio,
    symbol: symbol.toUpperCase(),
    quantity,
    averageCost,
    currency: currency || port.currency,
  });
  res.status(201).json({ holding });
}

async function update(req, res) {
  const allowed = ['quantity', 'averageCost', 'currency'];
  const patch = {};
  for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];
  const holding = await Holding.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    patch,
    { new: true, runValidators: true }
  );
  if (!holding) throw ApiError.notFound('Holding not found');
  res.json({ holding });
}

async function remove(req, res) {
  const holding = await Holding.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!holding) throw ApiError.notFound('Holding not found');
  res.status(204).end();
}

module.exports = { list, getOne, create, update, remove };
