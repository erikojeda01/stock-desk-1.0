'use strict';

const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 500 },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

portfolioSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
