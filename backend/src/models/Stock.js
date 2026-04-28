'use strict';

const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 12 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    exchange: { type: String, default: 'NASDAQ' },
    sector: { type: String, default: '' },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
    price: { type: Number, default: 0 },
    previousClose: { type: Number, default: 0 },
    open: { type: Number, default: 0 },
    dayHigh: { type: Number, default: 0 },
    dayLow: { type: Number, default: 0 },
    marketCap: { type: Number, default: 0 },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

stockSchema.virtual('change').get(function change() {
  return Number((this.price - this.previousClose).toFixed(4));
});
stockSchema.virtual('changePercent').get(function changePercent() {
  if (!this.previousClose) return 0;
  return Number((((this.price - this.previousClose) / this.previousClose) * 100).toFixed(4));
});

stockSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Stock', stockSchema);
