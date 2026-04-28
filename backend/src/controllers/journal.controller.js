'use strict';

const JournalEntry = require('../models/JournalEntry');
const ApiError = require('../utils/ApiError');

async function list(req, res) {
  const entries = await JournalEntry.find({ user: req.user._id }).sort({ date: -1 });
  res.json({ journalEntries: entries });
}

async function create(req, res) {
  const { date, mood, reflection } = req.body;
  // upsert: one per (user, date)
  const entry = await JournalEntry.findOneAndUpdate(
    { user: req.user._id, date },
    { user: req.user._id, date, mood, reflection },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ journalEntry: entry });
}

async function getByDate(req, res) {
  const entry = await JournalEntry.findOne({ user: req.user._id, date: req.params.date });
  if (!entry) throw ApiError.notFound('Journal entry not found');
  res.json({ journalEntry: entry });
}

async function update(req, res) {
  const allowed = ['date', 'mood', 'reflection'];
  const patch = {};
  for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];
  const entry = await JournalEntry.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    patch,
    { new: true, runValidators: true }
  );
  if (!entry) throw ApiError.notFound('Journal entry not found');
  res.json({ journalEntry: entry });
}

async function remove(req, res) {
  const entry = await JournalEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!entry) throw ApiError.notFound('Journal entry not found');
  res.status(204).end();
}

module.exports = { list, create, getByDate, update, remove };
