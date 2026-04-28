'use strict';

/* eslint-disable no-console */
require('dotenv').config();

const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Portfolio = require('../src/models/Portfolio');
const Holding = require('../src/models/Holding');
const Watchlist = require('../src/models/Watchlist');
const Transaction = require('../src/models/Transaction');
const Stock = require('../src/models/Stock');

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', exchange: 'NASDAQ', price: 195.32, previousClose: 193.10 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', exchange: 'NASDAQ', price: 421.50, previousClose: 419.80 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', exchange: 'NASDAQ', price: 174.22, previousClose: 172.10 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', exchange: 'NASDAQ', price: 187.40, previousClose: 184.92 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer Discretionary', exchange: 'NASDAQ', price: 248.76, previousClose: 251.30 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', exchange: 'NASDAQ', price: 916.20, previousClose: 905.40 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Communication Services', exchange: 'NASDAQ', price: 502.10, previousClose: 498.00 },
  { symbol: 'NFLX', name: 'Netflix, Inc.', sector: 'Communication Services', exchange: 'NASDAQ', price: 615.45, previousClose: 612.20 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', exchange: 'NYSE', price: 199.30, previousClose: 197.80 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', exchange: 'NYSE', price: 275.10, previousClose: 273.40 },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Staples', exchange: 'NYSE', price: 63.85, previousClose: 63.10 },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services', exchange: 'NYSE', price: 102.40, previousClose: 101.85 },
];

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Portfolio.deleteMany({}),
    Holding.deleteMany({}),
    Watchlist.deleteMany({}),
    Transaction.deleteMany({}),
    Stock.deleteMany({}),
  ]);

  console.log('Seeding stocks...');
  await Stock.insertMany(
    STOCKS.map((s) => ({
      ...s,
      open: s.previousClose,
      dayHigh: Math.max(s.price, s.previousClose),
      dayLow: Math.min(s.price, s.previousClose),
      lastUpdatedAt: new Date(),
    }))
  );

  console.log('Seeding demo user...');
  const demoUser = await User.create({
    name: 'Demo Trader',
    email: 'demo@stockdesk.io',
    password: 'demo1234',
    cashBalance: 50000,
  });

  console.log('Seeding portfolio + holdings + watchlist...');
  const portfolio = await Portfolio.create({
    user: demoUser._id,
    name: 'Growth Portfolio',
    description: 'Long-only tech-heavy demo portfolio',
    isDefault: true,
  });

  await Holding.insertMany([
    { user: demoUser._id, portfolio: portfolio._id, symbol: 'AAPL', quantity: 10, averageCost: 180 },
    { user: demoUser._id, portfolio: portfolio._id, symbol: 'NVDA', quantity: 4, averageCost: 750 },
    { user: demoUser._id, portfolio: portfolio._id, symbol: 'MSFT', quantity: 6, averageCost: 400 },
  ]);

  await Watchlist.create({
    user: demoUser._id,
    name: 'Tech Watch',
    symbols: ['TSLA', 'AMZN', 'GOOGL', 'META'],
  });

  await Transaction.insertMany([
    { user: demoUser._id, portfolio: portfolio._id, symbol: 'AAPL', type: 'BUY', quantity: 10, price: 180 },
    { user: demoUser._id, portfolio: portfolio._id, symbol: 'NVDA', type: 'BUY', quantity: 4, price: 750 },
    { user: demoUser._id, portfolio: portfolio._id, symbol: 'MSFT', type: 'BUY', quantity: 6, price: 400 },
  ]);

  console.log('\nSeed complete.');
  console.log('  Demo login: demo@stockdesk.io / demo1234');
  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
