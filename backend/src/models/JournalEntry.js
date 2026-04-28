'use strict';

const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },                      // YYYY-MM-DD
    mood: { type: String, enum: ['Bullish', 'Bearish', 'Neutral'], default: 'Neutral' },
    reflection: { type: String, required: true, maxlength: 10000 },
  },
  { timestamps: true }
);

// One journal entry per user per date
journalSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('JournalEntry', journalSchema);
