'use strict';

const Stock = require('../models/Stock');
const ApiError = require('../utils/ApiError');
const { getHistory } = require('../services/marketSimulator');

async function search(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) {
    const results = await Stock.find({}).limit(20).sort({ symbol: 1 });
    return res.json({ results });
  }
  const regex = new RegExp(q, 'i');
  const results = await Stock.find({
    $or: [{ symbol: regex }, { name: regex }],
  }).limit(20);
  res.json({ results });
}

async function listAll(req, res) {
  const stocks = await Stock.find({}).sort({ symbol: 1 });
  res.json({ stocks });
}

async function getQuote(req, res) {
  const symbol = String(req.params.symbol).toUpperCase();
  const stock = await Stock.findOne({ symbol });
  if (!stock) throw ApiError.notFound(`No quote for ${symbol}`);
  res.json({ stock });
}

async function getQuotes(req, res) {
  const symbolsParam = req.query.symbols || '';
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (!symbols.length) return res.json({ stocks: [] });
  const stocks = await Stock.find({ symbol: { $in: symbols } });
  res.json({ stocks });
}

async function history(req, res) {
  const symbol = String(req.params.symbol).toUpperCase();
  const stock = await Stock.findOne({ symbol });
  if (!stock) throw ApiError.notFound(`No quote for ${symbol}`);
  const points = getHistory(symbol);
  res.json({ symbol, points });
}

module.exports = { search, listAll, getQuote, getQuotes, history };
