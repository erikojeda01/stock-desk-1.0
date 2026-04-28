'use strict';

const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true, maxlength: 12, index: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    date: { type: String, required: true },        // ISO date string YYYY-MM-DD
    shares: { type: Number, required: true, min: 0 },
    entry: { type: Number, required: true, min: 0 },
    exit: { type: Number, required: true, min: 0 },
    sl: { type: Number, default: null },
    tp: { type: Number, default: null },
    pnl: { type: Number, default: 0 },             // computed
    rr: { type: Number, default: null },           // computed
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

tradeSchema.pre('save', function computeMetrics(next) {
  const entry = Number(this.entry);
  const exit = Number(this.exit);
  const shares = Number(this.shares);

  this.pnl = this.type === 'buy'
    ? Number(((exit - entry) * shares).toFixed(2))
    : Number(((entry - exit) * shares).toFixed(2));

  if (this.sl != null && Number(this.sl) > 0) {
    const sl = Number(this.sl);
    let risk;
    let reward;
    if (this.type === 'buy') {
      risk = entry - sl;
      reward = exit - entry;
    } else {
      risk = sl - entry;
      reward = entry - exit;
    }
    this.rr = risk > 0 ? Number((reward / risk).toFixed(2)) : null;
  } else {
    this.rr = null;
  }

  next();
});

module.exports = mongoose.model('Trade', tradeSchema);
