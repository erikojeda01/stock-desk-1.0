'use strict';

const User = require('../models/User');
const ApiError = require('../utils/ApiError');

async function getMe(req, res) {
  res.json({ user: req.user });
}

async function updateMe(req, res) {
  const allowed = ['name', 'avatarUrl', 'baseCurrency'];
  const patch = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  }
  const user = await User.findByIdAndUpdate(req.user._id, patch, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  res.json({ user });
}

async function deleteMe(req, res) {
  await User.findByIdAndDelete(req.user._id);
  res.status(204).end();
}

module.exports = { getMe, updateMe, deleteMe };
