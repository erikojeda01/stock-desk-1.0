'use strict';

const Trade = require('../models/Trade');
const ApiError = require('../utils/ApiError');

async function list(req, res) {
  const filter = { user: req.user._id };
  if (req.query.symbol) filter.symbol = String(req.query.symbol).toUpperCase();
  if (req.query.from) filter.date = { ...(filter.date || {}), $gte: req.query.from };
  if (req.query.to) filter.date = { ...(filter.date || {}), $lte: req.query.to };
  const trades = await Trade.find(filter).sort({ date: -1, createdAt: -1 });
  res.json({ trades });
}

async function create(req, res) {
  const trade = await Trade.create({ ...req.body, user: req.user._id });
  res.status(201).json({ trade });
}

async function getOne(req, res) {
  const trade = await Trade.findOne({ _id: req.params.id, user: req.user._id });
  if (!trade) throw ApiError.notFound('Trade not found');
  res.json({ trade });
}

async function update(req, res) {
  const allowed = ['symbol', 'type', 'date', 'shares', 'entry', 'exit', 'sl', 'tp', 'notes'];
  const patch = {};
  for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];

  // recompute metrics by saving (so the pre-save hook runs)
  const trade = await Trade.findOne({ _id: req.params.id, user: req.user._id });
  if (!trade) throw ApiError.notFound('Trade not found');
  Object.assign(trade, patch);
  await trade.save();
  res.json({ trade });
}

async function remove(req, res) {
  const trade = await Trade.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!trade) throw ApiError.notFound('Trade not found');
  res.status(204).end();
}

async function bulkImport(req, res) {
  const items = Array.isArray(req.body) ? req.body : req.body.trades;
  if (!Array.isArray(items)) throw ApiError.badRequest('Send an array of trades');
  const docs = await Promise.all(
    items.map(async (t) => {
      const trade = new Trade({ ...t, user: req.user._id });
      await trade.save(); // triggers pre-save metrics
      return trade;
    })
  );
  res.status(201).json({ trades: docs, count: docs.length });
}

module.exports = { list, create, getOne, update, remove, bulkImport };
