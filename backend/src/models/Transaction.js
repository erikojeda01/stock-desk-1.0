'use strict';

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    portfolio: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true, maxlength: 12, index: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true, min: 0.000001 },
    price: { type: Number, required: true, min: 0 },
    fee: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
    executedAt: { type: Date, default: Date.now },
    note: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

transactionSchema.virtual('total').get(function total() {
  const sign = this.type === 'BUY' ? 1 : -1;
  return sign * (this.quantity * this.price) + (this.fee || 0);
});

transactionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Transaction', transactionSchema);
