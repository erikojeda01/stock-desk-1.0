'use strict';

const Watchlist = require('../models/Watchlist');
const Stock = require('../models/Stock');
const ApiError = require('../utils/ApiError');

async function list(req, res) {
  const watchlists = await Watchlist.find({ user: req.user._id }).sort({ createdAt: 1 });
  res.json({ watchlists });
}

async function create(req, res) {
  const { name, symbols = [] } = req.body;
  const watchlist = await Watchlist.create({
    user: req.user._id,
    name,
    symbols: symbols.map((s) => String(s).toUpperCase()),
  });
  res.status(201).json({ watchlist });
}

async function getOne(req, res) {
  const watchlist = await Watchlist.findOne({ _id: req.params.id, user: req.user._id });
  if (!watchlist) throw ApiError.notFound('Watchlist not found');

  const stocks = await Stock.find({ symbol: { $in: watchlist.symbols } });
  res.json({ watchlist, stocks });
}

async function update(req, res) {
  const allowed = ['name', 'symbols'];
  const patch = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      patch[k] = k === 'symbols' ? req.body[k].map((s) => String(s).toUpperCase()) : req.body[k];
    }
  }
  const watchlist = await Watchlist.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    patch,
    { new: true, runValidators: true }
  );
  if (!watchlist) throw ApiError.notFound('Watchlist not found');
  res.json({ watchlist });
}

async function remove(req, res) {
  const watchlist = await Watchlist.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!watchlist) throw ApiError.notFound('Watchlist not found');
  res.status(204).end();
}

async function addSymbol(req, res) {
  const symbol = String(req.body.symbol).toUpperCase();
  const watchlist = await Watchlist.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $addToSet: { symbols: symbol } },
    { new: true }
  );
  if (!watchlist) throw ApiError.notFound('Watchlist not found');
  res.json({ watchlist });
}

async function removeSymbol(req, res) {
  const symbol = String(req.params.symbol).toUpperCase();
  const watchlist = await Watchlist.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $pull: { symbols: symbol } },
    { new: true }
  );
  if (!watchlist) throw ApiError.notFound('Watchlist not found');
  res.json({ watchlist });
}

module.exports = { list, create, getOne, update, remove, addSymbol, removeSymbol };
