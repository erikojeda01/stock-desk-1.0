'use strict';

const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    portfolio: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true, maxlength: 12, index: true },
    quantity: { type: Number, required: true, min: 0 },
    averageCost: { type: Number, required: true, min: 0 }, // average cost basis per share
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
  },
  { timestamps: true }
);

holdingSchema.index({ portfolio: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Holding', holdingSchema);
